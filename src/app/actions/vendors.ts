'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { Automations } from '@/lib/automations'

export async function submitVendorApplication(formData: any) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error("Unauthorized")

  try {
    // 1. Update Profile Role
    const { error: profileError } = await (supabase as any)
      .from('profiles')
      .update({ role: 'vendor' })
      .eq('id', user.id)

    if (profileError) throw profileError

    // 2. Fetch existing vendor to avoid overwriting slug or active status
    const { data: existingVendor } = await (supabase as any)
      .from('vendors')
      .select('slug, is_active, tier')
      .eq('id', user.id)
      .single()

    const isNew = !existingVendor;
    const slug = existingVendor?.slug || formData.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);
    const isActive = existingVendor ? existingVendor.is_active : false;
    const tier = existingVendor ? existingVendor.tier : 'basic';
    
    const { error: vendorError } = await (supabase as any)
      .from('vendors')
      .upsert({
        id: user.id,
        name: formData.companyName,
        website_url: formData.website,
        categories: [formData.category],
        short_description: formData.techSpecs.substring(0, 160),
        full_description: formData.techSpecs + "\n\nPhilosophy: " + formData.philosophy,
        slug: slug,
        is_active: isActive, 
        tier: tier
      })

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
    const { error } = await (supabase as any)
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

export async function updateVendorOffer(offerData: any) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  try {
    // Update the offer fields in the vendors table
    const { error } = await (supabase as any)
      .from('vendors')
      .update({
        discount_code: offerData.couponCode,
        discount_description: offerData.title + " - " + offerData.description
      })
      .eq('id', user.id)

    if (error) throw error

    revalidatePath('/vendor/dashboard')
    revalidatePath('/marketplace')
    return { success: true }
  } catch (err) {
    console.error("Failed to update offer:", err)
    return { error: "Failed to update offer" }
  }
}
