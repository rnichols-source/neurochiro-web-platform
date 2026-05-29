'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Automations } from '@/lib/automations'
import { cookies } from 'next/headers'
import { isFounderEmail } from '@/lib/founder'

export async function login(formData: FormData, redirectUrl?: string | null) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = createServerSupabase()

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return redirect(`/login?error=email_not_confirmed`)
    }
    return redirect(`/login?error=auth_failed`)
  }

  if (!data?.user) {
    return redirect(`/login?error=auth_failed`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, tier, stripe_customer_id')
    .eq('id', data.user.id)
    .single()

  let role = (profile as any)?.role || 'doctor'

  // 🛡️ ROLE AUTO-CORRECT: if user has a doctors record, they're a doctor
  if (role === 'patient' || !role) {
    const { data: doctorRecord } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', data.user.id)
      .maybeSingle()
    if (doctorRecord) {
      role = 'doctor'
      await supabase.from('profiles').update({ role: 'doctor' } as any).eq('id', data.user.id)
    }
  }

  // 🛡️ FOUNDER OVERRIDE
  if (isFounderEmail(email)) {
    role = 'founder';
  }

  // Check if first-time user (name not set)
  if (!(profile as any)?.full_name && ['doctor', 'student'].includes(role)) {
    return redirect(`/onboarding?role=${role}`);
  }

  // Free tier — students can access portal without payment
  // Features gated inside via UpgradeGate components

  // Honor redirect param only after subscription is verified
  if (redirectUrl) return redirect(redirectUrl);

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

  // Clear any existing demo role cookie for admin logins
  const cookieStore = await cookies();
  if (['admin', 'founder', 'super_admin', 'regional_admin'].includes(role)) {
    cookieStore.delete('nc_demo_role');
  }

  return redirect(destination)
}

export async function signInWithProvider(provider: 'google') {
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
export async function createAccountAction(formData: FormData, role: string, tier: string, billingCycle: string) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const licenseNumber = formData.get('licenseNumber') as string || ''
  const licenseState = formData.get('licenseState') as string || ''
  const region = formData.get('region') as string || ''
  const chiropracticApproach = formData.get('chiropracticApproach') as string || ''
  const supabase = createServerSupabase()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        role: role,
        tier: tier,
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

    // Day 0 welcome email for doctors — nudge to complete profile
    if (role === 'doctor' && email) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY || '');
        const firstName = name?.split(' ')[0] || 'Doctor';
        await resend.emails.send({
          from: 'NeuroChiro <support@neurochirodirectory.com>',
          to: [email],
          subject: `Welcome to NeuroChiro — let's get your profile live`,
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
              <div style="background:#1a2744;padding:28px;text-align:center;">
                <h1 style="color:white;font-size:22px;margin:0;">NeuroChiro</h1>
                <p style="color:#e97325;font-size:14px;font-weight:bold;margin:8px 0 0;">Welcome to the Network</p>
              </div>
              <div style="padding:28px;background:white;">
                <p style="font-size:15px;color:#333;line-height:1.6;">Hey Dr. ${firstName},</p>
                <p style="font-size:15px;color:#333;line-height:1.6;">Welcome to NeuroChiro — the global directory for nervous system chiropractors. Your listing is live, but it needs a few things before patients can find you.</p>
                <div style="background:#fff7ed;border-left:4px solid #e97325;border-radius:8px;padding:16px;margin:20px 0;">
                  <p style="margin:0 0 8px;font-weight:bold;color:#1a2744;font-size:14px;">To complete your profile:</p>
                  <ul style="margin:0;padding:0 0 0 16px;color:#666;font-size:14px;line-height:1.8;">
                    <li>Add your city and state</li>
                    <li>Upload a profile photo</li>
                    <li>Write a short bio</li>
                    <li>Add your clinic name</li>
                    <li>Select your specialties</li>
                  </ul>
                </div>
                <p style="font-size:15px;color:#333;line-height:1.6;">Takes about 5 minutes. The more complete your profile, the higher you rank when patients search.</p>
                <div style="text-align:center;margin:24px 0;">
                  <a href="https://neurochiro.co/doctor/profile" style="display:inline-block;background:#e97325;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;">Complete My Profile</a>
                </div>
                <p style="color:#999;font-size:13px;">Questions? Just reply to this email.</p>
                <p style="margin-top:20px;color:#333;"><strong>Dr. Raymond Nichols</strong><br>Founder, NeuroChiro</p>
              </div>
              <div style="background:#f0f0f0;padding:14px;text-align:center;font-size:12px;color:#999;">
                NeuroChiro Network &middot; neurochiro.co
              </div>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error('Welcome email failed:', emailErr);
      }
    }

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
            content: `🆕 **NEW ${roleLabel} SIGNUP — PENDING APPROVAL**\n\n**Name:** ${name}\n**Email:** ${email}${phone ? `\n**Phone:** ${phone}` : ''}${licenseNumber ? `\n**License:** ${licenseNumber} (${licenseState})` : ''}${approachLine}\n\n⏳ Approve at: https://neurochiro.co/admin/moderation`,
          }),
        }).catch(() => {});
      }
    } catch {}

    return {
      success: true,
      user: data.user,
      sessionActive: !!data.session
    };
  }

  return { error: "Failed to create account" };
}

/**
 * Saves profile information after account creation but before payment.
 */
export async function updateProfileAction(userId: string, profileData: any) {
  const supabase = createServerSupabase();

  const { role, tier, clinicName, companyName, gradYear, school, city, website } = profileData;

  // 1. Update main profile (ULTRA-STRICT: only verified core columns)
  // Note: We avoid updating city, tier, or website here as they belong in role-specific tables
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ 
      role: role 
    })
    .eq('id', userId);

  if (profileError) {
    console.error("Profiles update error:", profileError);
    if ((profileError as any).code === '23505') {
      return { error: 'This email is already registered. Please log in or use a different address.' };
    }
    return { error: profileError.message };
  }

  // 2. Role specific updates
  if (role === 'doctor') {
    try {
      // First, try the standard user_id link
      const { error: doctorError } = await supabase
        .from('doctors')
        .update({
          clinic_name: clinicName,
          city: city,
          website_url: website,
          membership_tier: tier
        })
        .eq('user_id', userId);        
      if (doctorError) {
        if ((doctorError as any).code === '23505') {
          return { error: 'This email is already registered. Please log in or use a different address.' };
        }
        // If user_id column is missing, fallback to updating by ID
        console.warn("Retrying update by ID...");
        const { error: fallbackError } = await supabase
          .from('doctors')
          .update({ 
            clinic_name: clinicName, 
            city: city, 
            website_url: website, 
            membership_tier: tier 
          })
          .eq('id', userId);
          
        if (fallbackError) {
          if ((fallbackError as any).code === '23505') {
            return { error: 'This email is already registered. Please log in or use a different address.' };
          }
          throw fallbackError;
        }
      }
    } catch (err: any) {
      console.error("Failed to update doctor profile:", err);
      if (err.code === '23505' || (err.message && err.message.includes('23505'))) {
        return { error: 'This email is already registered. Please log in or use a different address.' };
      }
      return { error: err.message || "Database connection error" };
    }
  } else if (role === 'student') {
    // Upsert student-specific data (creates row if trigger didn't fire)
    const { error: studentError } = await supabase
      .from('students')
      .upsert({
        id: userId,
        school: school,
        graduation_year: gradYear ? parseInt(gradYear, 10) : null,
        location_city: city
      }, { onConflict: 'id' });
      
    if (studentError) {
      console.error("Failed to update student profile:", studentError);
      if ((studentError as any).code === '23505') {
        return { error: 'This email is already registered. Please log in or use a different address.' };
      }
      return { error: studentError.message };
    }
  }

  return { success: true };
}

/**
 * Claims an unclaimed doctor profile by linking it to the authenticated user.
 * Called after registration when a claim_id is present.
 */
export async function claimDoctorProfileAction(userId: string, claimId: string) {
  // Use admin client to bypass RLS for claiming
  const { createAdminClient } = await import('@/lib/supabase-admin');
  const supabase = createAdminClient();

  // Auto-confirm the user's email so they get a session immediately
  // Without this, email verification would block them from accessing their dashboard
  await (supabase.auth.admin as any).updateUserById(userId, { email_confirm: true });

  // Verify the doctor record exists and is unclaimed
  const { data: doctor, error: fetchError } = await supabase
    .from('doctors')
    .select('id, user_id, first_name, last_name')
    .eq('id', claimId)
    .single();

  if (fetchError || !doctor) {
    return { error: 'Doctor profile not found.' };
  }

  if (doctor.user_id) {
    return { error: 'This profile has already been claimed.' };
  }

  // Link the doctor record to the new user (pending approval)
  const { error: updateError } = await supabase
    .from('doctors')
    .update({ user_id: userId, is_approved: false } as any)
    .eq('id', claimId);

  if (updateError) {
    console.error("Failed to claim doctor profile:", updateError);
    // Retry without RLS constraints
    const { error: retryError } = await supabase
      .from('doctors')
      .update({ user_id: userId, is_approved: false } as any)
      .eq('id', claimId);
    if (retryError) {
      console.error("Retry also failed:", retryError);
      return { error: 'Failed to claim profile. Please contact support.' };
    }
  }

  // Update the user's profile role to doctor and set their name
  const doctorName = `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim();
  await supabase
    .from('profiles')
    .update({
      role: 'doctor',
      full_name: doctorName || undefined,
    })
    .eq('id', userId);

  // Send welcome notification
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Profile Claimed — 7-Day Pro Trial Active!',
      body: 'Welcome to NeuroChiro! Your contact info is visible to patients for the next 7 days. Add your photo and bio from your dashboard. After the trial, upgrade to Pro ($49/mo) to keep everything unlocked.',
      type: 'system',
      link: '/doctor/profile',
      priority: 'important',
    });
  } catch {}

  return { success: true, doctorName };
}
