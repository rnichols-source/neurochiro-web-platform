'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { listStudentDirectory } from '@/lib/doctor/student-directory'
import { getMembership } from '@/lib/portal/membership-load'

function asSearchRow(student: Awaited<ReturnType<typeof listStudentDirectory>>[number]) {
  return {
    id: student.id,
    user_id: student.userId,
    full_name: student.name,
    name: student.name,
    school: student.school,
    graduation_year: student.graduationYear,
    interests: student.interests,
    location_city: student.location,
    bio: '',
    is_looking_for_mentorship: student.bucket === 'mentoring',
  }
}

export async function searchStudents(query?: string) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const membership = await getMembership(user.id)
  if (membership.tier === 'free') return []

  const students = await listStudentDirectory()
  const safe = (query || '').trim().replace(/[%_,()]/g, '').slice(0, 80).toLowerCase()
  const matched = safe
    ? students.filter((student) => {
      const blob = [student.name, student.school, student.location, ...student.interests].join(' ').toLowerCase()
      return blob.includes(safe)
    })
    : students
  return matched.map(asSearchRow)
}
