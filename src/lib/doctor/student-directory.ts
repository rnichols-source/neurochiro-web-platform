import 'server-only'
import { createAdminClient } from '@/lib/supabase-admin'
import {
  mapListedStudent,
  type ListedStudent,
  type StudentProfileRow,
  type StudentVerificationRow,
} from '@/lib/doctor/students'

const PROFILE_FIELDS = 'id, full_name, chiropractic_school, school_name, graduation_year, areas_of_interest, practice_city, practice_state, current_year_in_school, created_at'

function realStudents(admin: ReturnType<typeof createAdminClient>) {
  return (admin as any)
    .from('profiles')
    .select(PROFILE_FIELDS)
    .eq('role', 'student')
    .or('is_test.eq.false,is_test.is.null')
}

export async function listStudentDirectory(includeTest = false): Promise<ListedStudent[]> {
  const admin = createAdminClient()
  const profiles = await (includeTest
    ? (admin as any).from('profiles').select(PROFILE_FIELDS).eq('role', 'student')
    : realStudents(admin)
  ).order('created_at', { ascending: false }).limit(80)
  if (profiles.error) {
    console.error('[students] profile query failed', profiles.error.message)
    return []
  }
  const rows = (profiles.data || []) as StudentProfileRow[]
  const ids = rows.map((row) => row.id).filter(Boolean)
  const verification = new Map<string, StudentVerificationRow>()
  if (ids.length) {
    const students = await (admin as any)
      .from('students')
      .select('id, school_name, graduation_year, school_verified')
      .in('id', ids)
    if (students.error) {
      console.error('[students] verification query failed', students.error.message)
    } else {
      for (const row of (students.data || []) as StudentVerificationRow[]) {
        if (row?.id) verification.set(row.id, row)
      }
    }
  }
  return rows.map((row) => mapListedStudent(row, verification.get(row.id)))
}

export async function countStudentsNear(city: string | null | undefined): Promise<number | null> {
  const safe = (city || '').trim().replace(/[%_\\]/g, '')
  if (!safe) return null
  const admin = createAdminClient()
  const counted = await (admin as any)
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'student')
    .or('is_test.eq.false,is_test.is.null')
    .ilike('practice_city', safe)
  if (counted.error) {
    console.error('[students] nearby count failed', counted.error.message)
    return null
  }
  return typeof counted.count === 'number' ? counted.count : null
}
