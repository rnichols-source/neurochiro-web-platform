'use server'

import { createServerSupabase } from '@/lib/supabase-server'

export async function getPatientDashboardData() {
  const supabase = createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, created_at')
      .eq('id', user.id)
      .single()

    // Check how many daily logs the user has submitted
    const { count: logCount } = await supabase
      .from('daily_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const hasTrackingData = (logCount || 0) > 0

    return {
      profile: {
        name: profile?.full_name?.split(' ')[0] || user.email?.split('@')[0],
        memberSince: profile?.created_at || user.created_at,
      },
      hasTrackingData,
      logCount: logCount || 0,
      // These become real once the user starts tracking
      regulationScore: hasTrackingData ? null : null,
      trend: hasTrackingData ? null : null,
      nextAdjustment: null,
      insights: hasTrackingData
        ? { title: "Keep tracking to see your trends.", description: "The more you log, the better your insights become." }
        : { title: "Welcome to NeuroChiro.", description: "Start by finding a nervous system specialist in the directory, and use the Track page to log how you feel after each visit." }
    }
  } catch (e) {
    console.error("Patient Dashboard Error:", e)
    return null
  }
}
