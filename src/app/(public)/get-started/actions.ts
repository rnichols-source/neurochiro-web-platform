'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { assertSelfServeRole } from '@/lib/auth/roles'
import { APPLICATION_COUNTRIES } from '@/lib/applications/countries'
import {
  EXISTING_LISTING_MESSAGE,
  signupDuplicateDecision,
  type ListingDoctor,
} from '@/lib/applications/existing-listing'
import { isApplicationFlowEnabled } from '@/lib/applications/flag'
import { toApplicationE164 } from '@/lib/applications/phone'
import { currencyForCountry } from '@/lib/applications/prices'
import { ACCOUNT_CONTINUE_PATH } from '@/lib/applications/resume-path'
import { doctorSignupStatus } from '@/lib/applications/signup'
import { defaultSignupCountry } from '@/lib/applications/signup-country'
import { ensureDraftApplication, saveDraftStep } from '@/lib/applications/store'
import { rememberApplicantReferral } from '@/lib/member-referrals/db'

const COUNTRY_CODES = new Set<string>(APPLICATION_COUNTRIES.map((item) => item.code))

/** ilike treats % and _ as wildcards. Escape them so the lookup is one exact email. */
function exactEmailPattern(email: string): string {
  return email.replace(/[\\%_]/g, (char) => `\\${char}`)
}

function listingFromRow(row: Record<string, unknown>, email: string): ListingDoctor {
  return {
    id: String(row.id || ''),
    email: typeof row.email === 'string' && row.email ? row.email : email,
    userId: row.user_id ? String(row.user_id) : null,
    isApproved: row.is_approved === true,
    verificationStatus: typeof row.verification_status === 'string' ? row.verification_status : null,
    paidAt: typeof row.paid_at === 'string' ? row.paid_at : null,
    membershipTier: typeof row.membership_tier === 'string' ? row.membership_tier : null,
    stripeSubscriptionId: typeof row.stripe_subscription_id === 'string' ? row.stripe_subscription_id : null,
  }
}

export async function createFreeAccount(data: {
  name: string;
  email: string;
  password: string;
  role: 'doctor' | 'student' | 'patient';
  phone?: string;
  country?: string;
  smsConsent?: boolean;
  referralCode?: string;
}) {
  try {
    assertSelfServeRole(data.role);
    const supabase = createAdminClient();
    const email = data.email.trim().toLowerCase()
    const flow = isApplicationFlowEnabled() && data.role === 'doctor'
    let country = (data.country || defaultSignupCountry({ phone: data.phone, email })).trim().toUpperCase()
    if (country === 'UK') country = 'GB'
    let mobile = ''

    if (flow) {
      if (!email.includes('@') || /\s/.test(email)) {
        return { error: 'Enter a normal email address.' }
      }
      if (!COUNTRY_CODES.has(country)) return { error: 'Choose a country.' }
      if (/[a-z@]/i.test(data.phone || '')) return { error: 'Enter a mobile number, not an email.' }
      const parsed = toApplicationE164(data.phone || '', country)
      if (!parsed) {
        return {
          error: country === 'OTHER'
            ? 'Enter a mobile number with + and the country code.'
            : 'Enter a mobile number for the country you selected.',
        }
      }
      mobile = parsed
      if (data.password.trim().length < 6) return { error: 'Password must be at least 6 characters.' }

      const doctorSelect = () => (supabase.from('doctors') as any).select('id, email, user_id, is_approved, verification_status, paid_at, membership_tier, stripe_subscription_id')
      const [byEmail, profileResult] = await Promise.all([
        doctorSelect().ilike('email', exactEmailPattern(email)),
        supabase.from('profiles').select('id').ilike('email', exactEmailPattern(email)).maybeSingle(),
      ])
      if (byEmail.error || profileResult.error) return { error: 'Something went wrong. Please try again.' }
      const doctors = ((byEmail.data || []) as Record<string, unknown>[]).map((row) => listingFromRow(row, email))
      const profileId = profileResult.data?.id ? String(profileResult.data.id) : ''
      if (profileId) {
        const linked = await doctorSelect().eq('user_id', profileId).maybeSingle()
        const linkedRow = linked.data as Record<string, unknown> | null
        if (linkedRow?.id && !doctors.some((doctor) => doctor.id === String(linkedRow.id))) {
          doctors.push(listingFromRow({ ...linkedRow, email }, email))
        }
      }
      const decision = signupDuplicateDecision(email, doctors)
      if (decision.action === 'link') {
        const doctor = doctors.find((item) => item.id === decision.doctorId)
        let userId = profileId
        if (!userId) {
          const created = await supabase.auth.admin.createUser({
            email,
            password: data.password,
            email_confirm: true,
            user_metadata: { full_name: data.name, role: data.role, phone: mobile },
          })
          if (created.error || !created.data.user) {
            return { existingListing: true, error: EXISTING_LISTING_MESSAGE }
          }
          userId = created.data.user.id
          await (supabase as any).from('profiles').upsert({
            id: userId,
            email,
            full_name: data.name,
            role: data.role,
            tier: 'pro',
          })
        }
        if (doctor && !doctor.userId) {
          await supabase.from('doctors').update({ user_id: userId }).eq('id', doctor.id).is('user_id', null)
        }
        return { existingListing: true, error: EXISTING_LISTING_MESSAGE }
      }
    }

    // Create auth user
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.name, role: data.role, phone: mobile || data.phone || '' },
    });

    if (authErr) {
      if (authErr.message.includes('already')) return { error: 'An account with this email already exists. Try logging in.' };
      return { error: authErr.message };
    }

    if (!authUser?.user) return { error: 'Failed to create account' };

    const userId = authUser.user.id;

    // Create profile
    await (supabase as any).from('profiles').upsert({
      id: userId,
      email,
      full_name: data.name,
      role: data.role,
      tier: 'free',
    });

    // If doctor, create doctor record
    if (data.role === 'doctor') {
      const nameParts = data.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
      const signupStatus = doctorSignupStatus();
      const doctorCountry = flow ? country : 'US'

      const { data: doctorRow } = await supabase.from('doctors').insert({
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        slug,
        email,
        clinic_name: '',
        city: '',
        state: '',
        country: doctorCountry,
        address: '',
        bio: '',
        phone: mobile || data.phone || '',
        specialties: [],
        verification_status: flow ? 'hidden' : signupStatus,
        membership_tier: 'free',
        region_code: doctorCountry === 'OTHER' ? 'US' : doctorCountry,
        is_approved: false,
        onboarding_call_status: 'not_booked',
      } as any).select('id').maybeSingle();

      if (flow && doctorRow?.id) {
        await ensureDraftApplication({
          doctorId: doctorRow.id,
          userId,
          email,
          referralCode: (data.referralCode || '').slice(0, 80),
        });
        await saveDraftStep({
          doctorId: doctorRow.id,
          userId,
          stepReached: 1,
          referralCode: (data.referralCode || '').slice(0, 80),
          fields: {
            country: doctorCountry,
            currency: currencyForCountry(doctorCountry),
          },
          contact: {
            mobileE164: mobile,
            smsConsent: data.smsConsent === true,
          },
        })
        if (data.referralCode) {
          await rememberApplicantReferral({
            applicantDoctorId: doctorRow.id,
            requestedSlug: data.referralCode,
          });
        }
      }
    }

    // If student, create student record
    if (data.role === 'student') {
      await (supabase as any).from('students').upsert({
        id: userId,
        user_id: userId,
        full_name: data.name,
        region_code: 'US',
        onboarding_call_status: 'not_booked',
      });
    }

    // Discord notification
    try {
      const discordUrl = process.env.DISCORD_WEBHOOK_URL;
      if (discordUrl) {
        await fetch(discordUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `🔔 **NEW SIGNUP**\n\n**${data.name}** signed up as a **${data.role}**\nEmail: ${email}\nPhone: ${mobile || data.phone || 'Not provided'}${flow ? '\n\nDoctor application started. Review at https://neurochiro.co/admin/applications' : '\n\nThey need to book their onboarding call before activation.'}`,
          }),
        }).catch(() => {});
      }
    } catch {}

    return { success: true, userId, nextPath: flow ? ACCOUNT_CONTINUE_PATH : null };
  } catch (err: any) {
    console.error('Free signup error:', err);
    return { error: 'Something went wrong. Please try again.' };
  }
}
