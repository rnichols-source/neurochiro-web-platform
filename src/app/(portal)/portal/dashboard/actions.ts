'use server'

import { createServerSupabase } from '@/lib/supabase-server'

export async function getPatientDashboardData() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    // Get all logs ordered by date
    const { data: allLogs } = await supabase
      .from('daily_logs')
      .select('energy_level, pain_level, sleep_quality, log_date')
      .eq('user_id', user.id)
      .order('log_date', { ascending: false })
      .limit(60)

    const logs = allLogs || []
    const today = new Date().toISOString().split('T')[0]

    // Check if today is logged
    const todaysLog = logs.find(l => l.log_date === today) || null

    // Calculate streak (consecutive days from today backwards)
    let streak = 0
    const currentDate = new Date()
    for (let i = 0; i < 60; i++) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const hasLog = logs.some(l => l.log_date === dateStr)
      if (hasLog) {
        streak++
      } else if (i > 0) {
        // Allow today to not be logged yet (don't break streak if today is missing)
        break
      } else {
        // Today not logged — check if yesterday starts the streak
        continue
      }
      currentDate.setDate(currentDate.getDate() - 1)
    }

    // Last 7 days for mini trend dots
    const last7Days: { date: string; energy: number | null }[] = []
    const trendDate = new Date()
    for (let i = 0; i < 7; i++) {
      const dateStr = trendDate.toISOString().split('T')[0]
      const log = logs.find(l => l.log_date === dateStr)
      last7Days.push({
        date: dateStr,
        energy: log?.energy_level || null
      })
      trendDate.setDate(trendDate.getDate() - 1)
    }

    return {
      name: profile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'there',
      todaysLog,
      todayLogged: !!todaysLog,
      streak,
      totalLogs: logs.length,
      last7Days: last7Days.reverse(), // oldest first
    }
  } catch (e) {
    console.error("Patient dashboard error:", e)
    return null
  }
}
