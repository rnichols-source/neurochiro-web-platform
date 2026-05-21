'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'


export async function getDoctorProfile() {
  try {
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const [profileRes, doctorRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('full_name, email, role, tier, notification_preferences')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('doctors')
        .select('clinic_name, city, state, country, website_url, bio, specialties, video_url, seo_keywords, photo_url, phone, latitude, slug, verification_status, instagram_url, facebook_url, membership_tier, address, zip_code, google_place_id, highlights, conditions_treated, education, languages, hours, accepted_payment, faq, gallery_images, banner_url, booking_url, first_visit_info, parking_info, amenities, offers_telehealth, accepts_walkins, accepting_new_patients, years_in_practice, insurance_networks, team_members, certifications')
        .eq('user_id', user.id)
        .maybeSingle()
    ])

    if (profileRes.error) {
        console.error("Profile Fetch Error:", profileRes.error);
    }
    if (doctorRes.error) {
        console.error("Doctor Fetch Error:", doctorRes.error);
    }

    const profileData = profileRes.data;
    const doctorData = doctorRes.data;

    return {
      full_name: profileData?.full_name || "",
      email: profileData?.email || "",
      role: profileData?.role || "doctor",
      tier: profileData?.tier || "basic",
      notification_preferences: profileData?.notification_preferences || {},
      ...(doctorData as any || {}),
      profile_views: 0,
      patient_leads: 0
    }
  } catch (err) {
    console.error("Critical error in getDoctorProfile:", err)
    return { 
      full_name: "", 
      email: "", 
      role: "doctor", 
      tier: "free", 
      notification_preferences: {},
      profile_views: 0,
      patient_leads: 0
    }
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
    const specialties = formData.get('specialties')?.toString().split(',').map((s: string) => s.trim()).filter(Boolean) || []
    const videoUrl = formData.get('video_url') as string
    const seoKeywords = formData.get('seo_keywords') as string
    const phone = formData.get('phone') as string
    const instagramUrl = formData.get('instagram_url') as string
    const facebookUrl = formData.get('facebook_url') as string

    // Extended profile fields
    const address = formData.get('address') as string
    const zipCode = formData.get('zip_code') as string
    const googlePlaceId = formData.get('google_place_id') as string
    const hoursText = formData.get('hours') as string
    const highlightsRaw = formData.get('highlights') as string
    const highlights = highlightsRaw ? highlightsRaw.split('\n').map(s => s.trim()).filter(Boolean) : []
    const conditionsRaw = formData.get('conditions_treated') as string
    const conditionsTreated = conditionsRaw ? conditionsRaw.split(',').map(s => s.trim()).filter(Boolean) : []
    const educationRaw = formData.get('education') as string
    const education = educationRaw ? educationRaw.split('\n').map(s => s.trim()).filter(Boolean) : []
    const languagesRaw = formData.get('languages') as string
    const languages = languagesRaw ? languagesRaw.split(',').map(s => s.trim()).filter(Boolean) : []
    const acceptedPaymentRaw = formData.get('accepted_payment') as string
    const acceptedPayment = acceptedPaymentRaw ? acceptedPaymentRaw.split(',').map(s => s.trim()).filter(Boolean) : []
    const faqRaw = formData.get('faq') as string
    const faq = faqRaw ? JSON.parse(faqRaw) : []
    const galleryImagesRaw = formData.get('gallery_images') as string
    const galleryImages = galleryImagesRaw ? JSON.parse(galleryImagesRaw) : []

    // New ultimate profile fields
    const bookingUrl = formData.get('booking_url') as string
    const firstVisitInfo = formData.get('first_visit_info') as string
    const parkingInfo = formData.get('parking_info') as string
    const amenitiesRaw = formData.get('amenities') as string
    const amenities = amenitiesRaw ? amenitiesRaw.split(',').map(s => s.trim()).filter(Boolean) : []
    const offersTelehealth = formData.get('offers_telehealth') === 'true'
    const acceptsWalkins = formData.get('accepts_walkins') === 'true'
    const acceptingNewPatients = formData.get('accepting_new_patients') !== 'false'
    const yearsRaw = formData.get('years_in_practice') as string
    const yearsInPractice = yearsRaw ? parseInt(yearsRaw, 10) || null : null
    const insuranceRaw = formData.get('insurance_networks') as string
    const insuranceNetworks = insuranceRaw ? insuranceRaw.split(',').map(s => s.trim()).filter(Boolean) : []
    const teamMembersRaw = formData.get('team_members') as string
    const teamMembers = teamMembersRaw ? JSON.parse(teamMembersRaw) : []
    const certificationsRaw = formData.get('certifications') as string
    const certifications = certificationsRaw ? certificationsRaw.split('\n').map(s => s.trim()).filter(Boolean) : []

    // Use admin client for all updates to bypass RLS
    const { createAdminClient } = await import('@/lib/supabase-admin')
    const adminSupabase = createAdminClient()

    // 1. Update Profile (Name)
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id)

    if (profileError) {
      console.error("Profile update error:", profileError)
      return { error: `Failed to update name: ${profileError.message}` }
    }

    // 2. Update Doctor table

    const { error: doctorError } = await adminSupabase
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
        seo_keywords: seoKeywords,
        phone: phone || null,
        instagram_url: instagramUrl || null,
        facebook_url: facebookUrl || null,
        address: address || null,
        zip_code: zipCode || null,
        google_place_id: googlePlaceId || null,
        hours: hoursText || null,
        highlights: highlights.length ? highlights : null,
        conditions_treated: conditionsTreated.length ? conditionsTreated : null,
        education: education.length ? education : null,
        languages: languages.length ? languages : null,
        accepted_payment: acceptedPayment.length ? acceptedPayment : null,
        faq: faq.length ? faq : null,
        gallery_images: galleryImages.length ? galleryImages : null,
        booking_url: bookingUrl || null,
        first_visit_info: firstVisitInfo || null,
        parking_info: parkingInfo || null,
        amenities: amenities.length ? amenities : null,
        offers_telehealth: offersTelehealth,
        accepts_walkins: acceptsWalkins,
        accepting_new_patients: acceptingNewPatients,
        years_in_practice: yearsInPractice,
        insurance_networks: insuranceNetworks.length ? insuranceNetworks : null,
        team_members: teamMembers.length ? teamMembers : null,
        certifications: certifications.length ? certifications : null,
      } as any)
      .eq('user_id', user.id)

    if (doctorError) {
      console.error("Doctor update error:", doctorError)
      return { error: `Failed to update clinic info: ${doctorError.message}` }
    }

    // Refresh search index for high-performance GIN/RPC search
    try {
      const adminSupabase = (await import('@/lib/supabase-admin')).createAdminClient();
      await adminSupabase.rpc('refresh_search_index');
    } catch (refreshErr) {
      console.warn("Search Index Refresh (non-critical):", refreshErr)
    }

    // 3. Trigger geocoding if location changed
    try {
      await supabase.from('automation_queue').insert({
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

    const { error } = await supabase
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

    // Fetch doctor profile data for context
    const { data: doctor } = await supabase
      .from('doctors')
      .select('first_name, last_name, city, state, specialties')
      .eq('user_id', user.id)
      .single()

    const doctorName = doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : 'The doctor'
    const location = [doctor?.city, doctor?.state].filter(Boolean).join(', ')
    const specialties = doctor?.specialties?.join(', ') || 'nervous system chiropractic'

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return { error: "AI service is not configured. Please contact support." }
    }

    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Write a professional 150-200 word bio for a chiropractor's directory profile. Write in third person.

Doctor: ${doctorName}
Clinic: ${clinicName || 'their practice'}
Location: ${location || 'United States'}
Specialties: ${specialties}
${currentBio ? `Current bio to improve upon: ${currentBio}` : ''}

Requirements:
- Emphasize nervous system chiropractic and neurological focus
- Professional but warm and approachable tone
- Mention their location naturally
- Reference their specific specialties
- Include a call-to-action for patients to schedule a visit
- Do NOT use phrases like "cutting-edge" or "holistic"
- Do NOT start with "Dr. [Name] is a..."
- Start with something compelling about their approach or philosophy
- Keep it between 150-200 words

Return ONLY the bio text, no quotes or formatting.`
      }]
    })

    const bioText = message.content[0].type === 'text' ? message.content[0].text : ''

    return { success: true, bio: bioText.trim() }
  } catch (err: any) {
    if (err.message?.includes('membership')) {
      return { error: err.message }
    }
    console.error("AI Bio generation error:", err)
    return { error: "Failed to generate bio. Please try again." }
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

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return { error: "Only JPEG, PNG, and WebP images are allowed." }
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return { error: "Image must be under 5MB." }
        }

        // Use admin client for storage to bypass RLS policies
        const { createAdminClient } = await import('@/lib/supabase-admin')
        const adminSupabase = createAdminClient()

        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png'
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { data: uploadData, error: uploadError } = await adminSupabase.storage
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
            return { error: `Upload failed: ${uploadError.message}` }
        }

        const { data } = adminSupabase.storage
            .from('clinic-photos')
            .getPublicUrl(filePath)

        const publicUrl = data?.publicUrl || ""

        // Update doctor photo_url
        const { error: updateError } = await adminSupabase
            .from('doctors')
            .update({ photo_url: publicUrl })
            .eq('user_id', user.id)

        if (updateError) {
            console.error("[DATABASE_SYNC_ERROR]:", updateError)
            return { error: "Photo uploaded but failed to sync with your profile database." }
        }

        revalidatePath('/doctor/profile')
        return { success: true, publicUrl }
    } catch (err: any) {
        console.error("[CRITICAL_UPLOAD_EXCEPTION]:", err)
        return { error: `System Error: ${err.message || "An unexpected error occurred."}` }
    }
}

async function uploadImage(subfolder: string, formData: FormData) {
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Authentication required." }

    const file = formData.get('file')
    if (!file || !(file instanceof File)) return { error: "No valid image file." }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) return { error: "Only JPEG, PNG, and WebP allowed." }
    if (file.size > 5 * 1024 * 1024) return { error: "Image must be under 5MB." }

    const { createAdminClient } = await import('@/lib/supabase-admin')
    const adminSupabase = createAdminClient()

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png'
    const filePath = `${user.id}/${subfolder}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await adminSupabase.storage
        .from('clinic-photos')
        .upload(filePath, file, { cacheControl: '3600', upsert: true })

    if (uploadError) return { error: `Upload failed: ${uploadError.message}` }

    const { data } = adminSupabase.storage.from('clinic-photos').getPublicUrl(filePath)
    return { success: true, publicUrl: data?.publicUrl || '' }
}

export async function uploadGalleryImage(formData: FormData) {
    return uploadImage('gallery', formData)
}

export async function uploadBannerImage(formData: FormData) {
    const result = await uploadImage('banner', formData)
    if (!result.success || !result.publicUrl) return result

    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Authentication required." }

    const { createAdminClient } = await import('@/lib/supabase-admin')
    const adminSupabase = createAdminClient()
    await adminSupabase.from('doctors').update({ banner_url: result.publicUrl } as any).eq('user_id', user.id)

    revalidatePath('/doctor/profile')
    return result
}

export async function uploadTeamPhoto(formData: FormData) {
    return uploadImage('team', formData)
}
