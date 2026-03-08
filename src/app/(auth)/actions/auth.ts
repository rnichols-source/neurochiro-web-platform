'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Automations } from '@/lib/automations'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = createServerSupabase()

  // 🛡️ Safe Mode Redirect Logic (Bypass for UX Audit)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log("[SAFE MODE] Processing Quick Login for:", email);
    
    if (email.includes('admin')) return redirect("/admin/dashboard");
    if (email.includes('vendor')) return redirect("/vendor/dashboard");
    if (email.includes('patient')) return redirect("/portal/dashboard");
    if (email.includes('student_paid')) return redirect("/student/dashboard");
    if (email.includes('student')) return redirect("/student/dashboard");
    if (email.includes('doctor')) return redirect("/doctor/dashboard");
    
    return redirect("/doctor/dashboard"); // Default fallback
  }

  // 🚀 Production Logic
  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return redirect(`/login?error=auth_failed`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  const role = profile?.role || 'public'

  if (role === "admin") return redirect("/admin/dashboard")
  if (role.startsWith("doctor")) return redirect("/doctor/dashboard")
  if (role.startsWith("student")) return redirect("/student/dashboard")
  if (role === "patient") return redirect("/portal/dashboard")
  if (role === "vendor") return redirect("/vendor/dashboard")
  
  return redirect("/")
}

export async function signInWithProvider(provider: 'google' | 'apple') {
  const supabase = createServerSupabase()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/callback`,
    },
  })

  if (error) {
    return redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  if (data.url) {
    return redirect(data.url)
  }
}

export async function register(formData: FormData, role: string, tier: string, billingCycle: string = 'monthly') {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  const supabase = createServerSupabase()

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (role === "doctor") return redirect("/doctor/dashboard")
    if (role === "student") return redirect("/student/dashboard")
    return redirect("/")
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

  if (error) {
    return redirect(`/register?error=${encodeURIComponent(error.message)}`)
  }

  // Trigger Welcome Automation
  if (data?.user) {
    Automations.onSignup(data.user.id, email, name);
  }
  
  if (role === "doctor") return redirect("/doctor/dashboard")
  if (role === "student") return redirect("/student/dashboard")
  if (role === "patient") return redirect("/portal/dashboard")
  
  return redirect("/")
}
