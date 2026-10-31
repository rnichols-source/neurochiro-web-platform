'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { getMembership } from '@/lib/portal/membership-load'

const STUDENT_FIELDS = 'id, user_id, full_name, school, graduation_year, interests, skills, is_looking_for_mentorship, location_city, latitude, longitude, created_at'

export async function searchStudents(query?: string) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const membership = await getMembership(user.id)
  if (membership.tier === 'free') return []

  const base = () => supabase.from('students').select(STUDENT_FIELDS).order('created_at', { ascending: false }).limit(50)
  if (!query?.trim()) {
    const { data, error } = await base()
    if (error) return []
    return (data || []).map((row) => ({ ...row, name: row.full_name || 'Student' }))
  }

  const safe = query.trim().replace(/[%_,()]/g, '').slice(0, 80)
  if (!safe) return []
  const [byName, bySchool, byCity] = await Promise.all([
    base().ilike('full_name', `%${safe}%`),
    base().ilike('school', `%${safe}%`),
    base().ilike('location_city', `%${safe}%`),
  ])
  const merged = new Map<string, { full_name?: string | null }>()
  for (const result of [byName, bySchool, byCity]) {
    for (const row of result.data || []) merged.set(row.id, row)
  }
  return [...merged.values()].map((row) => ({ ...row, name: row.full_name || 'Student' }))
}
