'use server'

import { createServerSupabase } from '@/lib/supabase-server'

export async function getVendors(category?: string) {
  const supabase = createServerSupabase()

  let query = (supabase as any)
    .from('vendors')
    .select('*')
    .eq('is_active', true)
    .order('tier', { ascending: false })
    .order('name', { ascending: true })

  if (category) {
    query = query.contains('categories', [category])
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching vendors:", error)
    return []
  }

  return data
}

export async function trackVendorClick(vendorId: string, clickType: 'website' | 'discount' | 'profile' | 'demo') {
  const supabase = createServerSupabase()

  // Update analytics count
  const column = clickType === 'profile' ? 'profile_views' : `${clickType}_clicks`

  const { error } = await (supabase as any).rpc('increment_vendor_stats', {
    vendor_id: vendorId,
    stat_column: column
  })

  if (error) {
    console.error("Error tracking vendor click:", error)
  }

  return { success: !error }
}
