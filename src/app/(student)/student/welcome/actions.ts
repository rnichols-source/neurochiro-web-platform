'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase-server'
import { saveStudentProfileFields } from '@/lib/students/save-student-profile'

export async function saveStudentOnboarding(formData: FormData) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in to save your profile.' }

  const saved = await saveStudentProfileFields(user.id, {
    school: String(formData.get('school') || ''),
    yearInSchool: String(formData.get('yearInSchool') || ''),
    graduationYear: String(formData.get('gradYear') || ''),
    city: String(formData.get('city') || ''),
    state: String(formData.get('state') || ''),
    techniques: formData.getAll('techniques').map((value) => String(value)),
  })
  if (!saved.ok) return { error: saved.error }

  revalidatePath('/student/dashboard', 'layout')
  revalidatePath('/student/welcome')
  revalidatePath('/student/profile')
  return { success: true as const }
}
