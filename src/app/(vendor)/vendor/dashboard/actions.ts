'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { asLooseDb, asRow } from '@/lib/synapse/loose-db'

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

    const loose = asLooseDb(supabase)
    const extended = await loose
      .from('vendors')
      .select('name, website_url, short_description, categories, slug, profile_views, website_clicks, discount_clicks')
      .eq('id', user.id)
      .maybeSingle()
    const vendor = extended.error
      ? (await supabase.from('vendors').select('name, website_url, short_description, categories, slug').eq('id', user.id).maybeSingle()).data
      : asRow<{
          name?: string | null
          website_url?: string | null
          short_description?: string | null
          categories?: string[] | null
          slug?: string | null
          profile_views?: number | null
          website_clicks?: number | null
          discount_clicks?: number | null
        }>(extended.data)

    const { count: doctorCount } = await supabase
      .from('doctors')
      .select('id', { count: 'exact', head: true })
      .eq('verification_status', 'verified')

    const row: {
      name?: string | null
      website_url?: string | null
      short_description?: string | null
      categories?: string[] | null
      slug?: string | null
      profile_views?: number | null
      website_clicks?: number | null
      discount_clicks?: number | null
    } | null = vendor

    return {
      profile: {
        name: row?.name || profile?.full_name || user.email?.split('@')[0] || 'Vendor',
        role: profile?.role || null,
        website_url: row?.website_url || "",
        short_description: row?.short_description || "",
        categories: row?.categories || [],
        slug: row?.slug || null,
      },
      stats: {
        views: row?.profile_views || 0,
        clicks: row?.website_clicks || 0,
        engagement: row?.discount_clicks || 0,
        networkDoctors: doctorCount || 0,
      },
    }
  } catch (e) {
    console.error("Vendor Dashboard Error:", e)
    return null
  }
}
