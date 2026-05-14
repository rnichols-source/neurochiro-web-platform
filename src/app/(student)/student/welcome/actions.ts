'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function saveStudentOnboarding(formData: FormData) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const school = formData.get('school') as string
  const gradYear = formData.get('gradYear') as string
  const city = formData.get('city') as string
  const interests = formData.get('interests')?.toString().split(',').map(s => s.trim()).filter(Boolean) || []

  // Get full name from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const fullName = (profile as any)?.full_name || ''

  // Upsert student record
  const { error } = await supabase
    .from('students')
    .upsert({
      id: user.id,
      user_id: user.id,
      full_name: fullName,
      school: school || null,
      graduation_year: gradYear ? parseInt(gradYear, 10) : null,
      location_city: city || null,
      region_code: city || 'unknown',
      interests,
      is_looking_for_mentorship: true,
    }, { onConflict: 'id' })

  if (error) {
    console.error('Student onboarding upsert error:', error)
    return { error: error.message }
  }

  revalidatePath('/student/dashboard')
  return { success: true }
}
