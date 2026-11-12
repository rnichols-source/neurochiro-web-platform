'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { assertSelfServeRole } from '@/lib/auth/roles'
import { isApplicationFlowEnabled } from '@/lib/applications/flag'
import { ACCOUNT_CONTINUE_PATH } from '@/lib/applications/resume-path'
import { doctorSignupStatus } from '@/lib/applications/signup'
import { ensureDraftApplication } from '@/lib/applications/store'
import { rememberApplicantReferral } from '@/lib/member-referrals/db'

export async function createFreeAccount(data: {
  name: string;
  email: string;
  password: string;
  role: 'doctor' | 'student' | 'patient';
  phone?: string;
  referralCode?: string;
}) {
  try {
    assertSelfServeRole(data.role);
    const supabase = createAdminClient();

    // Create auth user
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.name, role: data.role, phone: data.phone || '' },
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
      email: data.email,
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
      const flow = isApplicationFlowEnabled();

      const { data: doctorRow } = await supabase.from('doctors').insert({
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        slug,
        email: data.email,
        clinic_name: '',
        city: '',
        state: '',
        country: 'US',
        address: '',
        bio: '',
        phone: data.phone || '',
        specialties: [],
        verification_status: flow ? 'hidden' : doctorSignupStatus(),
        membership_tier: 'free',
        region_code: 'US',
        is_approved: false,
        onboarding_call_status: 'not_booked',
      } as any).select('id').maybeSingle();

      if (flow && doctorRow?.id) {
        await ensureDraftApplication({
          doctorId: doctorRow.id,
          userId,
          email: data.email,
          referralCode: (data.referralCode || '').slice(0, 80),
        });
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
            content: `🔔 **NEW SIGNUP**\n\n**${data.name}** signed up as a **${data.role}**\nEmail: ${data.email}\nPhone: ${data.phone || 'Not provided'}${isApplicationFlowEnabled() && data.role === 'doctor' ? '\n\nDoctor application started. Review at https://neurochiro.co/admin/applications' : '\n\nThey need to book their onboarding call before activation.'}`,
          }),
        }).catch(() => {});
      }
    } catch {}

    return { success: true, userId, nextPath: isApplicationFlowEnabled() && data.role === 'doctor' ? ACCOUNT_CONTINUE_PATH : null };
  } catch (err: any) {
    console.error('Free signup error:', err);
    return { error: 'Something went wrong. Please try again.' };
  }
}
