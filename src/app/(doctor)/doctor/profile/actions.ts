'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function getDoctorProfile() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, email, role, subscription_status')
    .eq('id', user.id)
    .single()

  const { data: doctor, error: doctorError } = await supabase
    .from('doctors')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (profileError || doctorError) {
    console.error("Error fetching doctor profile:", profileError || doctorError)
    return null
  }

  return { ...profile, ...doctor }
}

export async function updateDoctorProfile(formData: FormData) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const fullName = formData.get('full_name') as string
  const clinicName = formData.get('clinic_name') as string
  const city = formData.get('city') as string
  const website = formData.get('website') as string
  const specialties = formData.get('specialties')?.toString().split(',').map((s: string) => s.trim()) || []

  // 1. Update Profile (Name)
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', user.id)

  if (profileError) throw profileError

  // 2. Update Doctor table
  const { error: doctorError } = await supabase
    .from('doctors')
    .update({
      clinic_name: clinicName,
      location_city: city,
      website: website,
      specialties: specialties
    })
    .eq('user_id', user.id)

  if (doctorError) throw doctorError

  // 3. Trigger geocoding if city changed
  // (Automation handles this via the queue as seen in Automations.ts)
  await supabase.from('automation_queue').insert({
    event_type: 'geocode_profile',
    payload: { userId: user.id, city }
  })

  revalidatePath('/doctor/profile')
  revalidatePath('/doctor/dashboard')
  return { success: true }
}

export async function uploadAvatar(formData: FormData) {
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const file = formData.get('file') as File
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Math.random()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
        .from('clinic-photos')
        .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
        .from('clinic-photos')
        .getPublicUrl(filePath)

    const { error: updateError } = await supabase
        .from('doctors')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id)

    if (updateError) throw updateError

    revalidatePath('/doctor/profile')
    return { publicUrl }
}
