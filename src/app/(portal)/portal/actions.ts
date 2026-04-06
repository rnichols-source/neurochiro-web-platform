'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function saveDailyLog(logData: {
  regulation_score: number;
  sleep_quality: number;
  stress_level: number;
  notes?: string;
}) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error("Unauthorized")

  const { data, error } = await supabase.from('daily_logs').insert({
    user_id: user.id,
    ...logData,
    date: new Date().toISOString().split('T')[0]
  }).select().single()

  if (error) throw error

  revalidatePath('/portal/dashboard')
  revalidatePath('/portal/track')
  return data
}

export async function getDailyLogs() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(30)

  if (error) throw error
  return data
}
