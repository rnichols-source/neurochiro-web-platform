'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { unstable_noStore as noStore } from 'next/cache'

export interface SeminarFilterOptions {
  country?: string;
  city?: string;
  instructor?: string;
  eventType?: string;
  showPast?: boolean;
}

export async function getSeminars(options: SeminarFilterOptions = {}) {
  noStore();
  const supabase = createServerSupabase()

  let query = (supabase as any)
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
    .order('id', { ascending: true })

  // Manual sorting to ensure Premium > Featured > Basic
  const sortedData = (data || []).sort((a: any, b: any) => {
    const tierMap: any = { 'premium': 3, 'featured': 2, 'basic': 1 };
    const tierA = tierMap[a.listing_tier] || 1;
    const tierB = tierMap[b.listing_tier] || 1;
    if (tierA !== tierB) return tierB - tierA;
    return a.id.localeCompare(b.id);
  });

  if (error) {
    console.error("Error fetching seminars:", error)
    return []
  }

  return sortedData;
}

export async function getSeminarsForMap(bounds?: [number, number, number, number]) {
  noStore();
  const supabase = createServerSupabase()
  
  let query = (supabase as any)
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
      .lte('latitude', bounds[3])
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching map seminars:", error)
    return []
  }

  return data || []
}

export async function incrementSeminarStats(id: string, column: 'page_views' | 'clicks') {
  const supabase = createServerSupabase()
  const { error } = await (supabase as any).rpc('increment_seminar_stats', {
    seminar_id: id,
    stat_column: column
  })
  
  if (error) {
    console.error(`Error incrementing ${column}:`, error)
  }
}

export async function getSeminarById(id: string) {
    noStore();
    const supabase = createServerSupabase()
    const { data, error } = await (supabase as any)
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

  const { data: profile } = await (supabase as any).from('profiles').select('role').eq('id', user.id).single()

  const { error } = await (supabase as any)
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
