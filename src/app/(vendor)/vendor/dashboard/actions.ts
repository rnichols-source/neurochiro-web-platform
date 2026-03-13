'use server'

import { createServerSupabase } from '@/lib/supabase-server'

export async function getVendorDashboardData() {
  const supabase = createServerSupabase()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    const { data: vendor } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', user.id)
      .single()

    return {
      profile: {
        name: vendor?.name || profile?.full_name || user.email?.split('@')[0],
        role: profile?.role
      },
      stats: {
        views: vendor?.profile_views || 0,
        clicks: vendor?.website_clicks || 0,
        engagement: vendor?.discount_clicks || 0
      },
      offer: {
        title: vendor?.discount_description?.split(' - ')[0] || "NeuroChiro Partner Discount",
        description: vendor?.discount_description?.split(' - ').slice(1).join(' - ') || "",
        couponCode: vendor?.discount_code || "",
        expirationDate: "2026-12-31", // In a real app, store this in DB
        active: vendor?.is_active || false
      }
    }
  } catch (e) {
    console.error("Vendor Dashboard Error:", e)
    return null
  }
}
