'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { requireTier } from '@/lib/tier'

export async function searchStudents(query?: string) {
  await requireTier('growth') // Student search requires Growth or Pro tier

  const supabase = createServerSupabase()

  let dbQuery = supabase
    .from('students')
    .select('id, user_id, full_name, school, graduation_year, interests, skills, is_looking_for_mentorship, location_city, latitude, longitude, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (query && query.trim()) {
    const q = query.trim()
    dbQuery = dbQuery.or(`full_name.ilike.%${q}%,school.ilike.%${q}%,location_city.ilike.%${q}%`)
  }

  const { data, error } = await dbQuery

  if (error) {
    console.error("Error searching students:", error)
    return []
  }

  // Enrich with profile email for messaging
  if (data && data.length > 0) {
    const userIds = data.map(s => s.user_id).filter(Boolean) as string[]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds)

    const profileMap = new Map((profiles || []).map(p => [p.id, p]))

    return data.map(s => ({
      ...s,
      email: profileMap.get(s.user_id || '')?.email || null,
      name: s.full_name || profileMap.get(s.user_id || '')?.full_name || 'Student',
    }))
  }

  return data || []
}
