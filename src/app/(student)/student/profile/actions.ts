'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function getStudentProfile() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, email, role, tier')
    .eq('id', user.id)
    .single()

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('id', user.id) // Assuming id is the PK referencing auth.users similar to doctors before the fix, let's just use id for now
    .single()

  if (profileError) {
    console.error("Error fetching student profile:", profileError)
    return null
  }

  return { ...(profile as any), ...(student as any) }
}

export async function updateStudentProfile(formData: FormData) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const fullName = formData.get('full_name') as string
  const school = formData.get('school') as string
  const gradYear = formData.get('gradYear') as string
  const locationCity = formData.get('location_city') as string | null
  const interests = formData.get('interests')?.toString().split(',').map(s => s.trim()).filter(Boolean) || []
  const skills = formData.get('skills')?.toString().split(',').map(s => s.trim()).filter(Boolean) || []
  const isLookingForMentorship = formData.get('is_looking_for_mentorship') === 'true'

  // 1. Update Profile (Name)
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', user.id)

  if (profileError) throw profileError

  // 2. Update Student table
  const { error: studentError } = await supabase
    .from('students')
    .update({
      school: school,
      graduation_year: gradYear ? parseInt(gradYear, 10) : null,
      location_city: locationCity || null,
      interests: interests,
      skills: skills,
      is_looking_for_mentorship: isLookingForMentorship
    })
    .eq('id', user.id)

  if (studentError) {
      console.error("Student error:", studentError);
      throw studentError;
  }

  revalidatePath('/student/profile')
  revalidatePath('/student/dashboard')
  return { success: true }
}
