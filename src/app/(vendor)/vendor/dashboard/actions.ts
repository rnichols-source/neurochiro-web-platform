'use server'

import { createServerSupabase } from '@/lib/supabase-server'

export async function getVendorDashboardData() {
  const supabase = createServerSupabase()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  try {
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    const { data: vendor } = await (supabase as any)
      .from('vendors')
      .select('*')
      .eq('id', user.id)
      .single()

    return {
      profile: {
        name: (vendor as any)?.name || (profile as any)?.full_name || user.email?.split('@')[0],
        role: (profile as any)?.role,
        website_url: (vendor as any)?.website_url || "",
        short_description: (vendor as any)?.short_description || "",
        categories: (vendor as any)?.categories || []
      },
      stats: {
        views: (vendor as any)?.profile_views || 0,
        clicks: (vendor as any)?.website_clicks || 0,
        engagement: (vendor as any)?.discount_clicks || 0
      },
      offer: {
        title: (vendor as any)?.discount_description?.split(' - ')[0] || "NeuroChiro Partner Discount",
        description: (vendor as any)?.discount_description?.split(' - ').slice(1).join(' - ') || "",
        discountType: "Percentage",
        discountValue: "15%",
        redemptionInstructions: "Enter code at checkout",
        couponCode: (vendor as any)?.discount_code || "",
        expirationDate: "2026-12-31", // In a real app, store this in DB
        active: (vendor as any)?.is_active || false
      }
    }
  } catch (e) {
    console.error("Vendor Dashboard Error:", e)
    return null
  }
}
