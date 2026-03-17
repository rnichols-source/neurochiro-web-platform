'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function getDoctorProfile() {
  try {
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const [profileRes, doctorRes] = await Promise.all([
      (supabase as any).from('profiles').select('full_name, email, role, tier').eq('id', user.id).single(),
      (supabase as any).from('doctors').select('*').eq('user_id', user.id).single()
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
    const state = formData.get('state') as string
    const country = formData.get('country') as string || 'United States'
    const website = formData.get('website') as string
    const bio = formData.get('bio') as string
    const specialties = formData.get('specialties')?.toString().split(',').map((s: string) => s.trim()) || []
    const videoUrl = formData.get('video_url') as string
    const seoKeywords = formData.get('seo_keywords') as string

    // 1. Update Profile (Name)
    const { error: profileError } = await (supabase as any)
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id)

    if (profileError) {
      console.error("Profile update error:", profileError)
      return { error: `Failed to update name: ${profileError.message}` }
    }

    // 2. Update Doctor table
    const { error: doctorError } = await (supabase as any)
      .from('doctors')
      .update({
        clinic_name: clinicName,
        city: city,
        state: state,
        country: country,
        website_url: website,
        bio: bio,
        specialties: specialties,
        video_url: videoUrl,
        seo_keywords: seoKeywords
      })
      .eq('user_id', user.id)

    if (doctorError) {
      console.error("Doctor update error:", doctorError)
      return { error: `Failed to update clinic info: ${doctorError.message}` }
    }

    // Refresh search index for high-performance GIN/RPC search
    try {
      const adminSupabase = (await import('@/lib/supabase-admin')).createAdminClient();
      await (adminSupabase as any).rpc('refresh_search_index');
    } catch (refreshErr) {
      console.warn("Search Index Refresh (non-critical):", refreshErr)
    }

    // 3. Trigger geocoding if location changed
    try {
      await (supabase as any).from('automation_queue').insert({
        event_type: 'geocode_profile',
        payload: { userId: user.id, city, state, country }
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
            return { error: "Authentication required. Please log in again." }
        }

        const file = formData.get('file')
        if (!file || !(file instanceof File)) {
            return { error: "No valid image file detected." }
        }

        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png'
        const fileName = `${Date.now()}.${fileExt}`
        // RLS expects folder to be the user ID
        const filePath = `${user.id}/${fileName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('clinic-photos')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
            })

        if (uploadError) {
            console.error("[STORAGE_ERROR]:", uploadError)
            if (uploadError.message.includes('bucket not found')) {
                return { error: "Storage setup incomplete: 'clinic-photos' bucket missing." }
            }
            if (uploadError.message.includes('row-level security')) {
                return { error: "Permission denied: Storage policies not configured." }
            }
            return { error: `Upload failed: ${uploadError.message}` }
        }

        const { data } = supabase.storage
            .from('clinic-photos')
            .getPublicUrl(filePath)

        const publicUrl = data?.publicUrl || ""

        // Update BOTH tables for consistency
        const [doctorRes, profileRes] = await Promise.all([
            (supabase as any).from('doctors').update({ photo_url: publicUrl }).eq('user_id', user.id),
            (supabase as any).from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
        ])

        if (doctorRes.error || profileRes.error) {
            console.error("[DATABASE_SYNC_ERROR]:", doctorRes.error || profileRes.error)
            return { error: "Photo uploaded but failed to sync with your profile database." }
        }

        revalidatePath('/doctor/profile')
        return { success: true, publicUrl }
    } catch (err: any) {
        console.error("[CRITICAL_UPLOAD_EXCEPTION]:", err)
        return { error: `System Error: ${err.message || "An unexpected error occurred."}` }
    }
}
