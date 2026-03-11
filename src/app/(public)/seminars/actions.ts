'use server'

import { createServerSupabase } from '@/lib/supabase-server'

export interface SeminarFilterOptions {
  country?: string;
  city?: string;
  instructor?: string;
  eventType?: string;
  showPast?: boolean;
}

export async function getSeminars(options: SeminarFilterOptions = {}) {
  const supabase = createServerSupabase()
  
  let query = supabase
    .from('seminars')
    .select(`
      *,
      registrations:seminar_registrations(count)
    `)
    .eq('is_approved', true)

  if (options.country && options.country !== 'All') {
    query = query.eq('country', options.country)
  }
  
  if (options.city && options.city !== 'All') {
    query = query.eq('city', options.city)
  }

  if (options.instructor && options.instructor !== 'All') {
    query = query.ilike('instructor_name', `%${options.instructor}%`)
  }

  if (options.eventType && options.eventType !== 'All') {
    query = query.eq('event_type', options.eventType)
  }

  if (options.showPast) {
    query = query.eq('is_past', true)
  } else {
    query = query.eq('is_past', false)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching seminars:", error)
    return []
  }

  return data
}

export async function getSeminarById(id: string) {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
        .from('seminars')
        .select('*')
        .eq('id', id)
        .single()
    
    if (error) {
        console.error("Error fetching seminar:", error)
        return null
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
