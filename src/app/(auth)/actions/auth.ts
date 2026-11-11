'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Automations } from '@/lib/automations'
import { cookies } from 'next/headers'
import { isFounderEmail } from '@/lib/founder'
import { assertSelfServeRole } from '@/lib/auth/roles'
import { canAutoCorrectToDoctor } from '@/lib/security/role-transition'
import { isApplicationFlowEnabled } from '@/lib/applications/flag'
import { ACCOUNT_CONTINUE_PATH } from '@/lib/applications/resume-path'
import { ensureDraftApplication } from '@/lib/applications/store'
import { safeReturnPath } from '@/lib/auth/safe-return-path'

/**
 * Strips leading titles (Dr., Dr, Doctor) and trailing credentials (DC, D.C.)
 * from a full name string, then splits into firstName / lastName.
 * Preserves legitimate multi-word names like "St. Louis" and "Blossom Jones".
 */
function cleanDoctorName(raw: string | null | undefined): { firstName: string; lastName: string; cleaned: string } {
  if (!raw || !raw.trim()) return { firstName: '', lastName: '', cleaned: '' }
  let s = raw.trim()
  // Strip leading title: "Dr.", "Dr", "Doctor" (case-insensitive, followed by space)
  s = s.replace(/^(?:Doctor|Dr\.?)\s+/i, '')
  // Strip trailing credentials: ", DC", " DC", " D.C.", " DC." (with optional leading comma)
  s = s.replace(/[,\s]+D\.?C\.?\s*$/i, '')
  s = s.trim()
  if (!s) return { firstName: raw.trim(), lastName: '', cleaned: raw.trim() }
  const parts = s.split(/\s+/)
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
    cleaned: s,
  }
}

function loginErrorRedirect(code: string, next: string | null) {
  const params = new URLSearchParams({ error: code })
  if (next) params.set('next', next)
  return redirect(`/login?${params.toString()}`)
}

export async function login(formData: FormData, redirectUrl?: string | null) {
  const next = safeReturnPath(redirectUrl)
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = createServerSupabase()

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return loginErrorRedirect('email_not_confirmed', next)
    }
    return loginErrorRedirect('auth_failed', next)
  }

  if (!data?.user) {
    return loginErrorRedirect('auth_failed', next)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, tier, stripe_customer_id')
    .eq('id', data.user.id)
    .single()

  const storedRole = ((profile as { role?: string | null } | null)?.role ?? '') as string
  let role = storedRole || 'doctor'

  // Patient or a blank role becomes doctor only when this user already has a doctors row.
  if (storedRole === 'patient' || storedRole === '') {
    const { createAdminClient } = await import('@/lib/supabase-admin')
    const admin = createAdminClient()
    const { data: doctorRecord } = await admin
      .from('doctors')
      .select('id')
      .eq('user_id', data.user.id)
      .maybeSingle()
    if (canAutoCorrectToDoctor(storedRole, !!doctorRecord)) {
      role = 'doctor'
      await admin.from('profiles').update({ role: 'doctor' }).eq('id', data.user.id)
    }
  }

  // 🛡️ FOUNDER OVERRIDE
  if (isFounderEmail(email)) {
    role = 'founder';
  }

  const cookieStore = await cookies();
  if (['admin', 'founder', 'super_admin', 'regional_admin'].includes(role)) {
    cookieStore.delete('nc_demo_role');
  }

  // Same-site return path only. An unfinished application comes back to its current step.
  if (next) return redirect(next);

  if (isApplicationFlowEnabled() && (role === 'doctor' || role.startsWith('doctor'))) {
    const { createAdminClient } = await import('@/lib/supabase-admin')
    const { loadApplicationGate } = await import('@/lib/applications/gate')
    const admin = createAdminClient()
    const { data: doctor } = await admin.from('doctors').select('id').eq('user_id', data.user.id).maybeSingle()
    if (doctor?.id) {
      const gate = await loadApplicationGate(doctor.id)
      if (gate === 'finish') return redirect('/doctor/apply')
    }
  }

  // Check if first-time user (name not set)
  if (!(profile as any)?.full_name && ['doctor', 'student'].includes(role)) {
    return redirect(`/onboarding?role=${role}`);
  }

  // Standardize the dashboard routes
  const dashboardMap: Record<string, string> = {
    'admin': '/admin/dashboard',
    'founder': '/admin/dashboard',
    'super_admin': '/admin/dashboard',
    'regional_admin': '/admin/dashboard',
    'doctor': '/doctor/dashboard',
    'student': '/student/dashboard',
    'patient': '/portal/dashboard',
  }

  // Route to the correct dashboard based on role
  let destination = '/doctor/dashboard'; // Default
  if (dashboardMap[role]) {
    destination = dashboardMap[role];
  } else if (role.startsWith('doctor')) {
    destination = '/doctor/dashboard';
  } else if (role.startsWith('student')) {
    destination = '/student/dashboard';
  } else {
    destination = '/';
  }

  return redirect(destination)
}

export async function signInWithProvider(provider: 'google', redirectUrl?: string | null) {
  const next = safeReturnPath(redirectUrl)
  const cookieStore = await cookies()
  if (next) {
    cookieStore.set({
      name: 'nc_return_path',
      value: next,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 10,
    })
  } else {
    cookieStore.delete('nc_return_path')
  }
  const supabase = createServerSupabase()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://neurochiro.co'
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${siteUrl}/api/auth/callback`,
    },
  })
  if (error) return redirect(`/login?error=${encodeURIComponent(error.message)}`)
  if (data.url) return redirect(data.url)
}

/**
 * Updated Register Action:
 * Creates the auth account but doesn't redirect yet.
 * Returns the user data so the client can continue to Profile Setup.
 */
export async function createAccountAction(formData: FormData, role: string, _tier: string, billingCycle: string) {
  assertSelfServeRole(role);
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const licenseNumber = formData.get('licenseNumber') as string || ''
  const licenseState = formData.get('licenseState') as string || ''
  const region = formData.get('region') as string || ''
  const chiropracticApproach = formData.get('chiropracticApproach') as string || ''
  const referralCode = (formData.get('ref') as string) || ''
  const flow = isApplicationFlowEnabled() && role === 'doctor'
  const supabase = createServerSupabase()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        role: role,
        billing_cycle: billingCycle,
        phone: phone,
        license_number: licenseNumber,
        license_state: licenseState,
        ...(region && { region_code: region }),
        ...(chiropracticApproach && { chiropractic_approach: chiropracticApproach }),
      }
    }
  })

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      return { error: 'This email is already registered. Please log in or use a different address.' };
    }
    return { error: error.message };
  }

  if (data?.user) {
    Automations.onSignup(data.user.id, email, name, role, phone);

    // Create doctors row with is_approved = false (approval gate)
    if (role === 'doctor') {
      const { createAdminClient } = await import('@/lib/supabase-admin');
      const adminDb = createAdminClient();
      const { firstName, lastName, cleaned: cleanedName } = cleanDoctorName(name);
      const slug = (cleanedName || 'doctor').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

      // Only create if no doctors row exists yet
      const { data: existingDoc } = await adminDb.from('doctors').select('id').eq('user_id', data.user.id).maybeSingle();
      if (!existingDoc) {
        const { data: doctorRow } = await adminDb.from('doctors').insert({
          user_id: data.user.id,
          first_name: firstName,
          last_name: lastName,
          slug,
          email,
          clinic_name: '',
          city: '',
          state: '',
          country: 'US',
          address: '',
          bio: '',
          specialties: [],
          verification_status: flow ? 'hidden' : 'pending',
          membership_tier: 'free',
          region_code: 'US',
          is_approved: false,
          onboarding_call_status: 'not_booked',
        } as any).select('id').maybeSingle();
        if (flow && doctorRow?.id) {
          await ensureDraftApplication({
            doctorId: doctorRow.id,
            userId: data.user.id,
            email,
            referralCode,
          });
        }
      }
    }

    // Day 0 welcome email REMOVED — automations.ts handles the welcome email
    // and queues the follow-up sequence. Having both caused double welcome emails.

    // Discord notification for new signups
    try {
      const discordUrl = process.env.DISCORD_WEBHOOK_URL;
      if (discordUrl) {
        const roleLabel = role === 'doctor' ? 'DOCTOR' : role === 'student' ? 'STUDENT' : 'PATIENT';
        const approachLabels: Record<string, string> = {
          nervous_system: '🧠 Nervous System Focused',
          structural: '🦴 Structural / Manual',
          upper_cervical: '🔝 Upper Cervical',
          functional_neuro: '⚡ Functional Neurology',
          wellness: '🌿 Wellness / Vitalistic',
          other: '❓ Other',
        };
        const approachLine = chiropracticApproach ? `\n**Approach:** ${approachLabels[chiropracticApproach] || chiropracticApproach}` : '';
        await fetch(discordUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `🆕 **NEW ${roleLabel} SIGNUP${flow ? ' — APPLICATION' : ' — PENDING APPROVAL'}**\n\n**Name:** ${cleanDoctorName(name).firstName || 'New doctor'}${approachLine}\n\n${flow ? 'Review at: https://neurochiro.co/admin/applications' : '⏳ Approve at: https://neurochiro.co/admin/moderation'}`,
          }),
        }).catch(() => {});
      }
    } catch {}

    return {
      success: true,
      user: data.user,
      sessionActive: !!data.session,
      nextPath: flow ? ACCOUNT_CONTINUE_PATH : null,
    };
  }

  return { error: "Failed to create account" };
}

/**
 * Claims an unclaimed doctor profile by linking it to the authenticated user.
 * Called after registration when a claim_id is present.
 */
export async function claimDoctorProfileAction(userId: string, claimId: string) {
  const sessionClient = createServerSupabase();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user || user.id !== userId) {
    return { error: 'Unauthorized' };
  }

  // Use admin client to bypass RLS for claiming
  const { createAdminClient } = await import('@/lib/supabase-admin');
  const admin = createAdminClient();

  // Auto-confirm the user's email so they get a session immediately
  // Without this, email verification would block them from accessing their dashboard
  await (admin.auth.admin as any).updateUserById(userId, { email_confirm: true });

  // Verify the doctor record exists and is unclaimed
  const { data: doctor, error: fetchError } = await admin
    .from('doctors')
    .select('id, user_id, first_name, last_name, verification_status')
    .eq('id', claimId)
    .single();

  if (fetchError || !doctor) {
    return { error: 'Doctor profile not found.' };
  }

  if (doctor.user_id) {
    return { error: 'This profile has already been claimed.' };
  }

  const flow = isApplicationFlowEnabled();
  const claimPatch: Record<string, unknown> = { user_id: userId, is_approved: false };
  if (flow && doctor.verification_status === 'pending') claimPatch.verification_status = 'hidden';

  const { error: updateError } = await admin
    .from('doctors')
    .update(claimPatch as any)
    .eq('id', claimId);

  if (updateError) {
    console.error("Failed to claim doctor profile:", updateError);
    const { error: retryError } = await admin
      .from('doctors')
      .update(claimPatch as any)
      .eq('id', claimId);
    if (retryError) {
      console.error("Retry also failed:", retryError);
      return { error: 'Failed to claim profile. Please contact support.' };
    }
  }

  if (flow) {
    await ensureDraftApplication({
      doctorId: claimId,
      userId,
      email: user.email || '',
    });
  }

  // Update the user's profile role to doctor and set their name
  const doctorName = `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim();
  await admin
    .from('profiles')
    .update({ role: 'doctor', full_name: doctorName || undefined })
    .eq('id', user.id);

  // Send welcome notification
  try {
    await admin.from('notifications').insert({
      user_id: userId,
      title: 'Profile Claimed — Welcome to NeuroChiro!',
      body: 'Welcome to NeuroChiro! Book your onboarding call with Dr. Ray to activate your account and get the most out of your membership ($99/mo).',
      type: 'system',
      link: '/doctor/profile',
      priority: 'important',
    });
  } catch {}

  return { success: true, doctorName };
}
