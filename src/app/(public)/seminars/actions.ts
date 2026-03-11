'use server'

import { createServerSupabase } from '@/lib/supabase-server'

export async function getSeminars(regionCode?: string) {
  const supabase = createServerSupabase()
  
  let query = supabase
    .from('seminars')
    .select(`
      *,
      host:profiles!host_id(full_name),
      registrations:seminar_registrations(count)
    `)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })

  if (regionCode) {
    // Assuming location text might contain region or we add a region_code column
    // For now we'll just filter in memory or assume all are global if no column
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching seminars:", error)
    return []
  }

  return data
}

export async function registerForSeminar(seminarId: string) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: "You must be logged in to register." }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  const { error } = await supabase
    .from('seminar_registrations')
    .insert({
      seminar_id: seminarId,
      user_id: user.id,
      user_role: profile?.role || 'patient',
      status: 'registered'
    })

  if (error) {
    if (error.code === '23505') return { error: "You are already registered for this seminar." }
    console.error("Seminar registration error:", error)
    return { error: "Failed to register." }
  }

  return { success: true }
}
