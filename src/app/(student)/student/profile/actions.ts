'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase-server'
import { loadStudentProfile, saveStudentProfileFields } from '@/lib/students/save-student-profile'

export async function getStudentProfile() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { profile: null, error: 'Sign in to view your profile.' }

  const loaded = await loadStudentProfile(user.id)
  if (loaded.error || !loaded.data) return { profile: null, error: loaded.error || 'Could not load your profile.' }
  return { profile: loaded.data, error: null }
}

export async function updateStudentProfile(formData: FormData) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in to save your profile.' }

  const saved = await saveStudentProfileFields(user.id, {
    fullName: String(formData.get('full_name') || ''),
    school: String(formData.get('school') || ''),
    yearInSchool: String(formData.get('yearInSchool') || ''),
    graduationYear: String(formData.get('gradYear') || ''),
    city: String(formData.get('city') || ''),
    state: String(formData.get('state') || ''),
    techniques: formData.getAll('techniques').map((value) => String(value)),
  })
  if (!saved.ok) return { error: saved.error }

  revalidatePath('/student/profile')
  revalidatePath('/student/dashboard', 'layout')
  return { success: true as const }
}
