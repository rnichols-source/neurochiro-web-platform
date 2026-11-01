'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { categoryLabel } from '@/lib/synapse/categories'
import { asLooseDb, asRows, type PostgrestError } from '@/lib/synapse/loose-db'
import { seatHoldsCategory } from '@/lib/synapse/seats'

const PUBLIC_FIELDS = 'id, slug, name, logo_url, tier, categories, short_description, full_description, website_url, is_partner, is_founding_vendor, is_active, country'

function missingTable(error: PostgrestError | null): boolean {
  if (!error) return false
  const code = error.code || ''
  if (code === '42P01' || code === 'PGRST205' || code === 'PGRST204') return true
  return /does not exist|schema cache/i.test(error.message || '')
}

type SeatListRow = { vendor_id: string; category_key: string; tier: string; status: string; reserved_until: string | null; country: string }

export async function getVendors(category?: string) {
  const admin = asLooseDb(createAdminClient())
  let query = admin.from('vendors').select(PUBLIC_FIELDS).eq('is_active', true).order('name', { ascending: true })
  if (category) query = query.contains('categories', [category])
  const { data, error } = await query
  if (error) return []
  return asRows<PublicVendor>(data)
}

export async function getMarketplaceHome() {
  const admin = asLooseDb(createAdminClient())
  const seatsResult = await admin
    .from('synapse_seats')
    .select('id, vendor_id, category_key, country, tier, status')
    .eq('status', 'active')
  if (missingTable(seatsResult.error) || !seatsResult.data) {
    return { activeSeats: 0, vendors: [] as PublicVendor[] }
  }
  const seats = asRows<SeatListRow>(seatsResult.data)
  if (!seats.length) return { activeSeats: 0, vendors: [] as PublicVendor[] }
  const ids = [...new Set(seats.map((seat) => seat.vendor_id))]
  const { data: vendors } = await admin.from('vendors').select(PUBLIC_FIELDS).in('id', ids).eq('is_active', true)
  const rows = asRows<PublicVendor>(vendors).map((vendor) => ({
    ...vendor,
    categories: (vendor.categories || []).map((key) => categoryLabel(key) || key),
    seatTier: seats.find((seat) => seat.vendor_id === vendor.id)?.tier || vendor.tier,
  }))
  return { activeSeats: seats.length, vendors: rows }
}

export type PublicVendor = {
  id: string
  slug: string | null
  name: string
  logo_url: string | null
  tier: string
  categories: string[] | null
  short_description: string | null
  full_description: string | null
  website_url: string | null
  is_partner: boolean | null
  is_founding_vendor: boolean | null
  is_active: boolean | null
  country: string | null
  seatTier?: string
}

export async function listHeldAnchors() {
  const admin = asLooseDb(createAdminClient())
  const result = await admin
    .from('synapse_seats')
    .select('category_key, country, tier, status, reserved_until, vendor_id')
    .eq('tier', 'anchor')
  if (missingTable(result.error)) return []
  const now = new Date()
  const held = asRows<SeatListRow>(result.data).filter((seat) =>
    seatHoldsCategory({ tier: seat.tier, status: seat.status, reservedUntil: seat.reserved_until }, now))
  return held.map((seat) => ({
    categoryKey: seat.category_key,
    country: seat.country,
  }))
}

export async function trackVendorClick(vendorId: string, clickType: 'website' | 'discount' | 'profile' | 'demo') {
  const admin = asLooseDb(createAdminClient())
  const column = clickType === 'profile' ? 'profile_views' : `${clickType}_clicks`
  const { error } = await admin.rpc('increment_vendor_stats', { vendor_id: vendorId, stat_column: column })
  return { success: !error }
}
