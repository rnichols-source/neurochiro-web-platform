'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function submitVendorApplication(formData: any) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error("Unauthorized")

  try {
    // 1. Update Profile Role
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'vendor' })
      .eq('id', user.id)

    if (profileError) throw profileError

    // 2. Create/Update Vendor Record
    const slug = formData.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);
    
    const { error: vendorError } = await supabase
      .from('vendors')
      .upsert({
        id: user.id,
        name: formData.companyName,
        website_url: formData.website,
        categories: [formData.category],
        short_description: formData.techSpecs.substring(0, 160),
        full_description: formData.techSpecs + "\n\nPhilosophy: " + formData.philosophy,
        slug: slug,
        is_active: false, // Requires admin approval
        tier: 'basic'
      })

    if (vendorError) throw vendorError

    revalidatePath('/marketplace')
    return { success: true }
  } catch (err) {
    console.error("Vendor application error:", err)
    return { error: "Failed to submit application." }
  }
}
