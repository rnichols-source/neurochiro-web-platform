'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function getDoctorProfile() {
  try {
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const [profileRes, doctorRes] = await Promise.all([
      supabase.from('profiles').select('full_name, email, role, tier').eq('id', user.id).single(),
      supabase.from('doctors').select('*').eq('user_id', user.id).single()
    ])

    if (profileRes.error && profileRes.error.code !== 'PGRST116') {
      console.error("Error fetching profile:", profileRes.error)
    }

    if (doctorRes.error && doctorRes.error.code !== 'PGRST116') {
      console.error("Error fetching doctor record:", doctorRes.error)
    }

    return { 
      ...(profileRes.data || {}), 
      ...(doctorRes.data || {}) 
    }
  } catch (err) {
    console.error("Critical error in getDoctorProfile:", err)
    return null
  }
}

export async function updateDoctorProfile(formData: FormData) {
  try {
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthorized" }

    const fullName = formData.get('full_name') as string
    const clinicName = formData.get('clinic_name') as string
    const city = formData.get('city') as string
    const website = formData.get('website') as string
    const bio = formData.get('bio') as string
    const specialties = formData.get('specialties')?.toString().split(',').map((s: string) => s.trim()) || []

    // 1. Update Profile (Name)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id)

    if (profileError) {
      console.error("Profile update error:", profileError)
      return { error: `Failed to update name: ${profileError.message}` }
    }

    // 2. Update Doctor table
    const { error: doctorError } = await supabase
      .from('doctors')
      .update({
        clinic_name: clinicName,
        location_city: city,
        website_url: website,
        bio: bio,
        specialties: specialties
      })
      .eq('user_id', user.id)

    if (doctorError) {
      console.error("Doctor update error:", doctorError)
      return { error: `Failed to update clinic info: ${doctorError.message}` }
    }

    // 3. Trigger geocoding if city changed
    try {
      await supabase.from('automation_queue').insert({
        event_type: 'geocode_profile',
        payload: { userId: user.id, city }
      })
    } catch (e) {
      console.warn("Automation queue trigger failed (non-critical):", e)
    }

    revalidatePath('/doctor/profile')
    revalidatePath('/doctor/dashboard')
    return { success: true }
  } catch (err: any) {
    console.error("Critical error in updateDoctorProfile:", err)
    return { error: err.message || "An unexpected error occurred." }
  }
}

export async function uploadAvatar(formData: FormData) {
    try {
        const supabase = createServerSupabase()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
            return { error: "You must be logged in to upload photos." }
        }

        const file = formData.get('file')
        if (!file || !(file instanceof File)) {
            return { error: "No valid file was provided." }
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `avatars/${fileName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('clinic-photos')
            .upload(filePath, file)

        if (uploadError) {
            console.error("Storage upload error:", uploadError)
            return { error: `Upload failed: ${uploadError.message}` }
        }

        const { data } = supabase.storage
            .from('clinic-photos')
            .getPublicUrl(filePath)

        const publicUrl = data?.publicUrl || ""

        const { error: updateError } = await supabase
            .from('doctors')
            .update({ photo_url: publicUrl })
            .eq('user_id', user.id)

        if (updateError) {
            console.error("Database update error:", updateError)
            return { error: `Failed to update profile with photo: ${updateError.message}` }
        }

        revalidatePath('/doctor/profile')
        return { success: true, publicUrl }
    } catch (err: any) {
        console.error("Critical upload error:", err)
        return { error: err.message || "An unexpected error occurred during upload." }
    }
}
