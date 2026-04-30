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

  if (redirectUrl) return redirect(redirectUrl);

  if (!data?.user) {
    return redirect(`/login?error=auth_failed`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', data.user.id)
    .single()

  let role = (profile as any)?.role || 'doctor'
  
  // 🛡️ FOUNDER OVERRIDE
  if (isFounderEmail(email)) {
    role = 'founder';
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

    // Discord notification for new signups
    try {
      const discordUrl = process.env.DISCORD_WEBHOOK_URL;
      if (discordUrl) {
        const roleLabel = role === 'doctor' ? 'DOCTOR' : role === 'student' ? 'STUDENT' : 'PATIENT';
        await fetch(discordUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `🆕 **NEW ${roleLabel} SIGNUP**\n\n**Name:** ${name}\n**Email:** ${email}${phone ? `\n**Phone:** ${phone}` : ''}${licenseNumber ? `\n**License:** ${licenseNumber} (${licenseState})` : ''}`,
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
    // Save student-specific data to the students table
    const { error: studentError } = await supabase
      .from('students')
      .update({ 
        school: school,
        graduation_year: gradYear ? parseInt(gradYear, 10) : null,
        location_city: city
      })
      .eq('id', userId); // students table uses id as PK
      
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

  // Verify the doctor record exists and is unclaimed
  const { data: doctor, error: fetchError } = await supabase
    .from('doctors')
    .select('id, user_id, first_name, last_name, full_name')
    .eq('id', claimId)
    .single();

  if (fetchError || !doctor) {
    return { error: 'Doctor profile not found.' };
  }

  if (doctor.user_id) {
    return { error: 'This profile has already been claimed.' };
  }

  // Link the doctor record to the new user
  const { error: updateError } = await supabase
    .from('doctors')
    .update({ user_id: userId })
    .eq('id', claimId);

  if (updateError) {
    console.error("Failed to claim doctor profile:", updateError);
    return { error: 'Failed to claim profile. Please contact support.' };
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

  return { success: true, doctorName };
}
