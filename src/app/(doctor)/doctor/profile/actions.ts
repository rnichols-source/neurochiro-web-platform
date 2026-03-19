'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function getDoctorProfile() {
  try {
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const [profileRes, doctorRes] = await Promise.all([
      (supabase as any)
        .from('profiles')
        .select('full_name, email, role, tier, notification_preferences')
        .eq('id', user.id)
        .maybeSingle(),
      (supabase as any)
        .from('doctors')
        .select('clinic_name, city, state, country, website_url, bio, specialties, video_url, seo_keywords, photo_url, location_lat, slug, verification_status')
        .eq('user_id', user.id)
        .maybeSingle()
    ])

    if (profileRes.error) {
        console.error("Profile Fetch Error:", profileRes.error);
    }
    if (doctorRes.error) {
        console.error("Doctor Fetch Error:", doctorRes.error);
    }

    const profileData = profileRes.data || {};
    const doctorData = doctorRes.data || {};

    return { 
      ...profileData, 
      ...doctorData,
      notification_preferences: profileData.notification_preferences || {}
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

export async function updateNotificationPreferences(preferences: any) {
  try {
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthorized" }

    const { error } = await (supabase as any)
      .from('profiles')
      .update({ notification_preferences: preferences })
      .eq('id', user.id)

    if (error) throw error

    revalidatePath('/doctor/profile')
    return { success: true }
  } catch (err: any) {
    console.error("Error updating notifications:", err)
    return { error: err.message }
  }
}

export async function generateAIProfileBio(clinicName: string, currentBio: string) {
  try {
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthorized" }

    // In a real production app, you would call the Gemini API here.
    // For now, we simulate a high-converting "Patient Magnet" bio.
    
    const generatedBio = `At ${clinicName || 'our clinic'}, we specialize in nervous-system-first chiropractic care designed to restore clinical certainty and peak performance. Our approach goes beyond symptoms, utilizing objective scanning technology to map your neural integrity and architect a customized path to health. Join our community of patients who have unlocked a higher standard of living through precise, data-driven neurological adjustments. ${currentBio ? '\n\n' + currentBio : ''}`;

    return { success: true, bio: generatedBio }
  } catch (err: any) {
    console.error("AI Write error:", err)
    return { error: err.message }
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
