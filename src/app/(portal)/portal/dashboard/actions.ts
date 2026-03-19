'use server'

import { createServerSupabase } from '@/lib/supabase-server'

export async function getPatientDashboardData() {
  const supabase = createServerSupabase()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  try {
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    // In production, query daily_logs and adjustments tables
    return {
      profile: {
        name: (profile as any)?.full_name?.split(' ')[0] || user.email?.split('@')[0],
      },
      regulationScore: 84,
      trend: "+12%",
      nextAdjustment: {
        date: "Tuesday, March 10",
        time: "4:30 PM",
        doctor: "Dr. Nichols"
      },
      insights: {
        title: "Your nervous system is in a state of high adaptability today.",
        description: "Excellent work on your sleep consistency. Focus on light breathwork this afternoon to maintain this regulation score."
      }
    }
  } catch (e) {
    console.error("Patient Dashboard Error:", e)
    return null
  }
}
