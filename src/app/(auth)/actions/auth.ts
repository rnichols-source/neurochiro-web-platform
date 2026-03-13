'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Automations } from '@/lib/automations'
import { cookies } from 'next/headers'

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
    .select('role')
    .eq('id', data.user.id)
    .single()

  let role = profile?.role || 'doctor'
  
  // 🛡️ FOUNDER OVERRIDE
  if (email === 'drray@neurochirodirectory.com' || email === 'raymond@neurochiro.com') {
    role = 'founder';
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
    'vendor': '/vendor/dashboard'
  }

  // Handle tiered roles (doctor_pro, student_free, etc)
  let destination = '/doctor/dashboard'; // Default
  if (dashboardMap[role]) {
    destination = dashboardMap[role];
  } else if (role.startsWith('doctor')) {
    destination = '/doctor/dashboard';
  } else if (role.startsWith('student')) {
    destination = '/student/dashboard';
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
        phone: phone
      }
    }
  })

  if (error) return { error: error.message };

  if (data?.user) {
    Automations.onSignup(data.user.id, email, name, role, phone);
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
          
        if (fallbackError) throw fallbackError;
      }
    } catch (err: any) {
      console.error("Failed to update doctor profile:", err);
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
      return { error: studentError.message };
    }
  } else if (role === 'vendor') {
    // Save vendor-specific data to the vendors table
    // Ensure the vendor record exists first, or use an upsert/insert if needed
    // Usually ONBOARDING_TRIGGERS handles the initial insert, so we update here
    const { error: vendorError } = await supabase
      .from('vendors')
      .update({
        name: companyName,
        website_url: website,
        tier: tier
      })
      .eq('id', userId);

    if (vendorError) {
      console.error("Failed to update vendor profile:", vendorError);
      return { error: vendorError.message };
    }
  }

  return { success: true };
}
