'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import { Automations } from '@/lib/automations'
import { canTransitionToVendor } from '@/lib/security/role-transition'

export async function submitVendorApplication(formData: any) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error("Unauthorized")

  try {
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (!canTransitionToVendor((currentProfile as { role?: string } | null)?.role)) {
      return { error: 'This account cannot become a vendor.' }
    }

    const admin = createAdminClient()
    const { error: profileError } = await admin
      .from('profiles')
      .update({ role: 'vendor' })
      .eq('id', user.id)

    if (profileError) throw profileError

    // 2. Fetch existing vendor to avoid overwriting slug or active status
    const { data: existingVendor } = await supabase
      .from('vendors')
      .select('slug, is_active, tier')
      .eq('id', user.id)
      .single()

    const isNew = !existingVendor;
    const slug = existingVendor?.slug || formData.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);
    const profile = {
      name: formData.companyName,
      website_url: formData.website,
      categories: [formData.category],
      short_description: formData.techSpecs.substring(0, 160),
      full_description: formData.techSpecs + "\n\nPhilosophy: " + formData.philosophy,
      slug,
    }
    // A new application stays inactive. Listing status and tier are not
    // fields the applicant can set; the database trigger rejects those writes.
    const { error: vendorError } = isNew
      ? await supabase.from('vendors').insert({ ...profile, id: user.id, is_active: false, tier: 'basic' })
      : await supabase.from('vendors').update(profile).eq('id', user.id)

    if (vendorError) throw vendorError

    if (isNew) {
       await Automations.onVendorSignup(formData.companyName);
    }

    revalidatePath('/marketplace')
    return { success: true }
  } catch (err) {
    console.error("Vendor application error:", err)
    return { error: "Failed to submit application." }
  }
}

export async function updateVendorProfile(profileData: any) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  try {
    const { error } = await supabase
      .from('vendors')
      .update({
        name: profileData.companyName,
        website_url: profileData.website,
        short_description: profileData.shortDescription,
        categories: [profileData.category]
      })
      .eq('id', user.id)

    if (error) throw error

    revalidatePath('/vendor/dashboard')
    revalidatePath('/marketplace')
    return { success: true }
  } catch (err) {
    console.error("Failed to update profile:", err)
    return { error: "Failed to update profile" }
  }
}

export async function updateVendorOffer() {
  return { error: "Save member perks from the Synapse section of the vendor dashboard." }
}
