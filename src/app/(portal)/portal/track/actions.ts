'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function submitDailyLog(data: {
  energyLevel: number;
  painLevel: number;
  sleepQuality: number;
  notes?: string;
  localDate?: string;
}) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  // Use client's local date if provided, otherwise fall back to server date
  const today = data.localDate || new Date().toISOString().split('T')[0]

  // Check if already logged today
  const { data: existing } = await supabase
    .from('daily_logs')
    .select('id')
    .eq('user_id', user.id)
    .eq('log_date', today)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('daily_logs')
      .update({
        energy_level: data.energyLevel,
        pain_level: data.painLevel,
        sleep_quality: data.sleepQuality,
        notes: data.notes || null,
      })
      .eq('id', existing.id)

    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('daily_logs')
      .insert({
        user_id: user.id,
        energy_level: data.energyLevel,
        pain_level: data.painLevel,
        sleep_quality: data.sleepQuality,
        notes: data.notes || null,
        log_date: today,
      })

    if (error) return { error: error.message }
  }

  revalidatePath('/portal/track')
  return { success: true }
}

export async function getLast30DaysLogs() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data, error } = await supabase
    .from('daily_logs')
    .select('id, energy_level, pain_level, sleep_quality, notes, log_date, created_at')
    .eq('user_id', user.id)
    .gte('log_date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('log_date', { ascending: true })

  if (error) {
    console.error("Error fetching logs:", error)
    return []
  }

  return data || []
}

export async function getTodaysLog() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('log_date', today)
    .single()

  return data || null
}
