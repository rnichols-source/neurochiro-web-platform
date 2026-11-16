'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { resolveStateCode } from '@/lib/resolve-state'
import { knownTechniques, parseGraduationYear } from '@/lib/students/onboarding-fields'

interface SchoolStats {
  school: string
  count: number
  topInterests: string[]
}

interface YearStats {
  year: number
  count: number
}

interface CommunityData {
  totalStudents: number
  schools: SchoolStats[]
  years: YearStats[]
  nearbyCount: number
  studentRegion: string | null
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export async function getCommunityData(): Promise<CommunityData> {
  const empty = { totalStudents: 0, schools: [], years: [], nearbyCount: 0, studentRegion: null }
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return empty

  const admin = createAdminClient()
  const listed = await admin
    .from('profiles')
    .select('id, school_name, chiropractic_school, graduation_year, areas_of_interest, practice_state')
    .eq('role', 'student')
    .limit(200)
  if (listed.error || !listed.data) return empty

  const rows = listed.data as unknown as {
    id: string
    school_name: string | null
    chiropractic_school: string | null
    graduation_year: string | null
    areas_of_interest: string[] | null
    practice_state: string | null
  }[]

  const schoolMap = new Map<string, { count: number; interests: string[] }>()
  const yearMap = new Map<number, number>()
  for (const row of rows) {
    const school = text(row.chiropractic_school) || text(row.school_name)
    const interests = knownTechniques(row.areas_of_interest)
    if (school) {
      const existing = schoolMap.get(school) || { count: 0, interests: [] }
      existing.count += 1
      existing.interests.push(...interests)
      schoolMap.set(school, existing)
    }
    const year = parseGraduationYear(row.graduation_year)
    if (year) yearMap.set(year, (yearMap.get(year) || 0) + 1)
  }

  const schools = Array.from(schoolMap.entries())
    .map(([school, data]) => {
      const interestCount = new Map<string, number>()
      for (const interest of data.interests) interestCount.set(interest, (interestCount.get(interest) || 0) + 1)
      const topInterests = Array.from(interestCount.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name)
      return { school, count: data.count, topInterests }
    })
    .sort((a, b) => b.count - a.count)

  const years = Array.from(yearMap.entries()).map(([year, count]) => ({ year, count })).sort((a, b) => a.year - b.year)
  const mine = rows.find((row) => row.id === user.id)
  const studentRegion = resolveStateCode(text(mine?.practice_state))
  const nearbyCount = studentRegion
    ? rows.filter((row) => resolveStateCode(text(row.practice_state)) === studentRegion).length
    : 0

  return { totalStudents: rows.length, schools, years, nearbyCount, studentRegion }
}
