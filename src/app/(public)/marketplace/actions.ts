'use server'

import { createServerSupabase } from '@/lib/supabase-server'

export async function getVendors() {
  const supabase = createServerSupabase()
  
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('is_active', true)
    .order('tier', { ascending: false }) // featured_partner first
    .order('name', { ascending: true })

  if (error) {
    console.error("Error fetching vendors:", error)
    return []
  }

  return data
}

export async function trackVendorClick(vendorId: string, clickType: 'website' | 'discount' | 'profile') {
  const supabase = createServerSupabase()
  
  // Update analytics count
  const column = `${clickType}_clicks`
  const { error } = await supabase.rpc('increment_vendor_clicks', { 
    vendor_id: vendorId, 
    click_column: column 
  })

  if (error) {
    // If RPC doesn't exist, we can do a standard update
    // But RPC is better for atomic increments
    console.error("Error tracking vendor click:", error)
  }

  return { success: !error }
}
