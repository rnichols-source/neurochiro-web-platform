'use server'

import { createServerSupabase } from '@/lib/supabase-server'

interface SchoolStats {
  school: string;
  count: number;
  topInterests: string[];
}

interface YearStats {
  year: number;
  count: number;
}

interface CommunityData {
  totalStudents: number;
  schools: SchoolStats[];
  years: YearStats[];
  nearbyCount: number;
  studentRegion: string | null;
}

export async function getCommunityData(): Promise<CommunityData> {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  // Get all students for aggregation (server-side only — raw data never sent to client)
  const { data: students } = await supabase
    .from("students")
    .select("school, graduation_year, interests, region_code")

  if (!students) {
    return { totalStudents: 0, schools: [], years: [], nearbyCount: 0, studentRegion: null }
  }

  const totalStudents = students.length

  // Aggregate by school
  const schoolMap = new Map<string, { count: number; interests: string[] }>()
  for (const s of students) {
    const school = (s as any).school || "Unknown"
    if (school === "Unknown") continue
    const existing = schoolMap.get(school) || { count: 0, interests: [] }
    existing.count++
    if ((s as any).interests) {
      existing.interests.push(...(s as any).interests)
    }
    schoolMap.set(school, existing)
  }

  const schools: SchoolStats[] = Array.from(schoolMap.entries())
    .map(([school, data]) => {
      const interestCount = new Map<string, number>()
      for (const i of data.interests) {
        interestCount.set(i, (interestCount.get(i) || 0) + 1)
      }
      const topInterests = Array.from(interestCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name)
      return { school, count: data.count, topInterests }
    })
    .sort((a, b) => b.count - a.count)

  // Aggregate by graduation year
  const yearMap = new Map<number, number>()
  for (const s of students) {
    const year = (s as any).graduation_year
    if (!year) continue
    yearMap.set(year, (yearMap.get(year) || 0) + 1)
  }
  const years: YearStats[] = Array.from(yearMap.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year)

  // Get nearby count for current user
  let nearbyCount = 0
  let studentRegion: string | null = null
  if (user) {
    const { data: studentData } = await supabase
      .from("students")
      .select("region_code")
      .eq("id", user.id)
      .maybeSingle()
    if (studentData && (studentData as any).region_code) {
      const region = (studentData as any).region_code
      studentRegion = region
      nearbyCount = students.filter((s) => (s as any).region_code === region).length
    }
  }

  return { totalStudents, schools, years, nearbyCount, studentRegion }
}
