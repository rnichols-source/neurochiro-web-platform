'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Automations } from '@/lib/automations'
import { cookies } from 'next/headers'

export async function login(formData: FormData, redirectUrl?: string | null) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = createServerSupabase()

  // 🛡️ Perspective Bypass Logic
  if (email.endsWith('@neurochiro.com')) {
    let role = 'public';
    if (email.includes('admin')) role = 'admin';
    else if (email.includes('vendor')) role = 'vendor';
    else if (email.includes('patient')) role = 'patient';
    else if (email.includes('student_paid')) role = 'student_paid';
    else if (email.includes('student')) role = 'student_free';
    else if (email.includes('doctor_pro')) role = 'doctor_pro';
    else if (email.includes('doctor_growth')) role = 'doctor_growth';
    else if (email.includes('doctor')) role = 'doctor_member';

    const cookieStore = await cookies();
    cookieStore.set('nc_demo_role', role, { 
      path: '/', 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 2
    });

    if (redirectUrl) return redirect(redirectUrl);

    if (role === "admin") return redirect("/admin/dashboard");
    if (role === "vendor") return redirect("/vendor/dashboard");
    if (role === "patient") return redirect("/portal/dashboard");
    if (role.startsWith("student")) return redirect("/student/dashboard");
    if (role.startsWith("doctor")) return redirect("/doctor/dashboard");
    
    return redirect("/doctor/dashboard");
  }

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) return redirect(`/login?error=auth_failed`)

  if (redirectUrl) return redirect(redirectUrl);

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  const role = profile?.role || 'doctor' // Default to doctor if missing

  if (role === "admin") return redirect("/admin/dashboard")
  if (role === "doctor") return redirect("/doctor/dashboard")
  if (role === "student") return redirect("/student/dashboard")
  if (role === "patient") return redirect("/portal/dashboard")
  if (role === "vendor") return redirect("/vendor/dashboard")
  
  return redirect("/doctor/dashboard")
}

export async function signInWithProvider(provider: 'google') {
  const supabase = createServerSupabase()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/callback`,
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
  const supabase = createServerSupabase()

  // Handle local development without Supabase
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { success: true, user: { id: 'mock-id', email, name } };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        role: role,
        tier: tier,
        billing_cycle: billingCycle
      }
    }
  })

  if (error) return { error: error.message };

  if (data?.user) {
    Automations.onSignup(data.user.id, email, name);
    return { success: true, user: data.user };
  }

  return { error: "Failed to create account" };
}

/**
 * Saves profile information after account creation but before payment.
 */
export async function updateProfileAction(userId: string, profileData: any) {
  const supabase = createServerSupabase();
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { success: true };

  const { role, tier, clinicName, graduationYear, school, city, website, ...rest } = profileData;

  // 1. Update main profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ ...rest, role, subscription_tier: tier })
    .eq('id', userId);

  if (profileError) return { error: profileError.message };

  // 2. Role specific updates
  if (role === 'doctor') {
    const { error: doctorError } = await supabase
      .from('doctors')
      .update({ clinic_name: clinicName, location_city: city, website })
      .eq('id', userId);
      
    if (doctorError) {
      console.error("Failed to update doctor profile:", doctorError);
    } else if (city) {
      // Enqueue geocoding to automatically resolve lat/lng
      const supabaseAdmin = createServerSupabase(); // Admin privileges if possible, or just queue
      await supabaseAdmin.from('automation_queue').insert({
        event_type: 'geocode_profile',
        payload: { userId, city }
      });
    }
  } else if (role === 'student') {
    const { error: studentError } = await supabase
      .from('students')
      .update({ 
        school: school,
        graduation_year: graduationYear ? parseInt(graduationYear, 10) : null,
        location_city: city
      })
      .eq('id', userId);
      
    if (studentError) console.error("Failed to update student profile:", studentError);
  }

  return { success: true };
}
