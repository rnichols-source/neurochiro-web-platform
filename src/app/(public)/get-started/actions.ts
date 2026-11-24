'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { assertSelfServeRole } from '@/lib/auth/roles'
import { APPLICATION_COUNTRIES } from '@/lib/applications/countries'
import {
  signupDuplicateDecision,
  startListingClaim,
  type ListingDoctor,
} from '@/lib/applications/existing-listing'
import { listingPasswordUrl } from '@/lib/applications/magic-link'
import { sendApplicationEmail } from '@/lib/applications/notify'
import { escapeHtml } from '@/lib/students/html'
import { randomBytes } from 'crypto'
import { isApplicationFlowEnabled } from '@/lib/applications/flag'
import { toApplicationE164 } from '@/lib/applications/phone'
import { ACCOUNT_CONTINUE_PATH } from '@/lib/applications/resume-path'
import { defaultSignupCountry } from '@/lib/applications/signup-country'
import { ensureSignupDoctor } from '@/lib/applications/signup-doctor'

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
        const linked = await doctorSelect().eq('user_id', profileId).limit(50)
        const linkedRows = Array.isArray(linked.data) ? linked.data as Record<string, unknown>[] : []
        for (const linkedRow of linkedRows) {
          if (linkedRow?.id && !doctors.some((doctor) => doctor.id === String(linkedRow.id))) {
            doctors.push(listingFromRow({ ...linkedRow, email }, email))
          }
        }
      }
      const decision = signupDuplicateDecision(email, doctors)
      if (decision.action === 'link') {
        const doctor = doctors.find((item) => item.id === decision.doctorId)
        if (!doctor) return { error: 'Something went wrong. Please try again.' }
        const claim = await startListingClaim({
          submittedPassword: data.password,
          doctor,
          existingUserId: doctor.userId || profileId || null,
          ports: {
            async createUnconfirmedLogin({ email: loginEmail }) {
              const created = await supabase.auth.admin.createUser({
                email: loginEmail,
                password: randomBytes(32).toString('base64url'),
                email_confirm: false,
                app_metadata: { role: 'doctor', pending_listing_doctor_id: doctor.id },
              })
              if (created.data.user?.id) return { userId: created.data.user.id }
              if (created.error && /already/i.test(created.error.message)) return { alreadyExists: true }
              return { failed: true }
            },
            async rememberPendingClaim({ userId, doctorId }) {
              const current = await supabase.auth.admin.getUserById(userId)
              const meta = { ...(current.data.user?.app_metadata || {}), role: 'doctor', pending_listing_doctor_id: doctorId }
              const updated = await supabase.auth.admin.updateUserById(userId, { app_metadata: meta })
              return !updated.error
            },
            async sendPasswordLink({ email: loginEmail, doctorId, userId }) {
              const link = await supabase.auth.admin.generateLink({
                type: 'recovery',
                email: loginEmail,
                options: { redirectTo: 'https://neurochiro.co/auth/activate?next=%2Freset-password' },
              })
              const token = link.data?.properties?.hashed_token
              const resolvedId = userId || link.data?.user?.id || null
              if (!token || !link.data?.user) return { ok: false, userId: resolvedId }
              if (!doctor.userId && resolvedId) {
                const meta = { ...(link.data.user.app_metadata || {}), role: 'doctor', pending_listing_doctor_id: doctorId }
                const updated = await supabase.auth.admin.updateUserById(resolvedId, { app_metadata: meta })
                if (updated.error) return { ok: false, userId: resolvedId }
              }
              const href = listingPasswordUrl(token)
              const mailed = await sendApplicationEmail({
                to: loginEmail,
                subject: 'Set your NeuroChiro password',
                html: `<p>You already have a NeuroChiro listing.</p><p><a href="${escapeHtml(href)}">Set your password</a></p><p>This link only works for the email address on that listing.</p>`,
              })
              return { ok: mailed, userId: resolvedId }
            },
          },
        })
        if (!claim.ok) return { error: claim.message }
        return { existingListing: true, checkEmail: true, error: claim.message }
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

    if (data.role === 'doctor') {
      const doctorRow = await ensureSignupDoctor({
        userId,
        email,
        name: data.name,
        phone: mobile || data.phone || '',
        country: flow ? country : 'US',
        smsConsent: data.smsConsent === true,
        referralCode: data.referralCode,
      })
      if (!doctorRow?.id) {
        return { error: 'Your account was created, but the doctor profile did not save. Log in and we will finish setting it up.' }
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
