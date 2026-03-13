'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { cache } from 'react'

export interface SeminarFilterOptions {
  country?: string;
  city?: string;
  instructor?: string;
  eventType?: string;
  showPast?: boolean;
}

export const getSeminars = cache(async function getSeminars(options: SeminarFilterOptions = {}) {
  const supabase = createServerSupabase()
...
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

  const { data, error } = await query
    .order('listing_tier', { ascending: false }) // This is simplified, real SQL would need more complex ordering for Premium > Featured > Basic
    .order('created_at', { ascending: false })

  // Manual sorting to ensure Premium > Featured > Basic
  const sortedData = (data || []).sort((a: any, b: any) => {
    const tierMap: any = { 'premium': 3, 'featured': 2, 'basic': 1 };
    const tierA = tierMap[a.listing_tier] || 1;
    const tierB = tierMap[b.listing_tier] || 1;
    if (tierA !== tierB) return tierB - tierA;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (error) {
    console.error("Error fetching seminars:", error)
    return []
  }

  return sortedData;
}

export const getSeminarsForMap = cache(async function getSeminarsForMap(bounds?: [number, number, number, number]) {
  const supabase = createServerSupabase()
  
  let query = supabase
    .from('seminars')
    .select(`
      id,
      title,
      city,
      country,
      dates,
      instructor_name,
      latitude,
      longitude,
      listing_tier
    `)
    .eq('is_approved', true)
    .eq('is_past', false)

  if (bounds) {
    query = query
      .gte('longitude', bounds[0])
      .lte('longitude', bounds[2])
      .gte('latitude', bounds[1])
      .lte('longitude', bounds[3])
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching map seminars:", error)
    return []
  }

  return data || []
});

export async function incrementSeminarStats(id: string, column: 'page_views' | 'clicks') {
  const supabase = createServerSupabase()
  const { error } = await supabase.rpc('increment_seminar_stats', {
    seminar_id: id,
    stat_column: column
  })
  
  if (error) {
    console.error(`Error incrementing ${column}:`, error)
  }
}

export const getSeminarById = cache(async function getSeminarById(id: string) {
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
});

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
