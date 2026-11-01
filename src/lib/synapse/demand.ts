import 'server-only'
import { createAdminClient } from '@/lib/supabase-admin'
import { ANONYMITY_FLOOR, formatDollars, marketplaceCountry, type SynapseCountry } from './config.ts'
import { asLooseDb, asRows, type LooseDb } from './loose-db.ts'
import { suppressSmallBuckets } from './anonymity.ts'

export type DemandLabel = { key: string; label: string }

export type VendorDemand = {
  leadsByPlace: DemandLabel[]
  rfpsByCategory: DemandLabel[]
  reveals: DemandLabel
  redemptionsByMonth: DemandLabel[]
  membersInCountry: DemandLabel
}

const COUNTRY_VALUES: Record<SynapseCountry, string[]> = {
  US: ['US', 'USA', 'United States'],
  AU: ['AU', 'Australia', 'NZ', 'New Zealand'],
  GB: ['GB', 'UK', 'United Kingdom'],
  CA: ['CA', 'Canada'],
  AE: ['AE', 'UAE', 'United Arab Emirates'],
}

function labelCount(key: string, count: number): DemandLabel {
  return { key, label: count < ANONYMITY_FLOOR ? `<${ANONYMITY_FLOOR}` : String(count) }
}

async function rowsOf(db: LooseDb, table: string, columns: string, sinceIso: string | null): Promise<Record<string, unknown>[]> {
  const all: Record<string, unknown>[] = []
  for (let offset = 0; offset < 5000; offset += 1000) {
    let query = db.from(table).select(columns).order('created_at', { ascending: true }).range(offset, offset + 999)
    if (sinceIso) query = query.gte('created_at', sinceIso)
    const { data, error } = await query
    if (error || !data) break
    const page = asRows<Record<string, unknown>>(data)
    all.push(...page)
    if (page.length < 1000) break
  }
  return all
}

/** Aggregates only. Buckets under 10 are "<10". No patient, doctor, or row ids. */
export async function vendorDemand(vendorId: string, vendorCountry: SynapseCountry): Promise<VendorDemand> {
  const db = asLooseDb(createAdminClient())
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const leads = await rowsOf(db, 'contact_requests', 'doctor_id, created_at', since)
  const doctorIds = [...new Set(leads.map((row) => String(row.doctor_id || '')).filter(Boolean))]
  const placeByDoctor = new Map<string, string>()
  for (let i = 0; i < doctorIds.length; i += 200) {
    const slice = doctorIds.slice(i, i + 200)
    const { data, error } = await db.from('doctors').select('id, state, country').in('id', slice)
    if (error) continue
    for (const doctor of asRows<{ id: string; state: string | null; country: string | null }>(data)) {
      const country = marketplaceCountry(doctor.country)
      const state = (doctor.state || 'Unknown').trim() || 'Unknown'
      placeByDoctor.set(doctor.id, `${country} · ${state}`)
    }
  }
  const places = new Map<string, number>()
  for (const lead of leads) {
    const place = placeByDoctor.get(String(lead.doctor_id || ''))
    if (!place) continue
    places.set(place, (places.get(place) || 0) + 1)
  }

  const rfps = await rowsOf(db, 'vendor_rfps', 'category_key, category, created_at', null)
  const byCategory = new Map<string, number>()
  for (const row of rfps) {
    const key = String(row.category_key || row.category || 'unspecified')
    byCategory.set(key, (byCategory.get(key) || 0) + 1)
  }

  const reveals = await db.from('vendor_usage').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId)
  const revealCount = reveals.error ? null : reveals.count || 0

  const perks = await db.from('vendor_perks').select('id').eq('vendor_id', vendorId)
  const perkIds = asRows<{ id: string }>(perks.data).map((row) => row.id)
  const byMonth = new Map<string, { count: number; cents: number }>()
  if (perkIds.length) {
    const redemptions = await db.from('perk_redemptions').select('created_at, amount_saved_cents').in('perk_id', perkIds)
    for (const row of asRows<{ created_at: string; amount_saved_cents: number }>(redemptions.data)) {
      const month = (row.created_at || '').slice(0, 7) || 'unknown'
      const current = byMonth.get(month) || { count: 0, cents: 0 }
      current.count += 1
      current.cents += Math.max(0, Math.floor(row.amount_saved_cents || 0))
      byMonth.set(month, current)
    }
  }

  const members = await db
    .from('doctors')
    .select('id', { count: 'exact', head: true })
    .in('subscription_status', ['active', 'trialing'])
    .in('country', COUNTRY_VALUES[vendorCountry])
  const memberCount = members.error ? null : members.count || 0

  return {
    leadsByPlace: suppressSmallBuckets([...places.entries()].map(([key, count]) => ({ key, count }))).map((row) => ({ key: row.key, label: row.label })),
    rfpsByCategory: suppressSmallBuckets([...byCategory.entries()].map(([key, count]) => ({ key, count }))).map((row) => ({ key: row.key, label: row.label })),
    reveals: revealCount == null ? { key: 'reveals', label: 'unavailable' } : labelCount('reveals', revealCount),
    redemptionsByMonth: [...byMonth.entries()].map(([key, value]) => ({
      key,
      label: value.count < ANONYMITY_FLOOR ? `<${ANONYMITY_FLOOR}` : `${value.count} · ${formatDollars(value.cents)}`,
    })),
    membersInCountry: memberCount == null ? { key: vendorCountry, label: 'unavailable' } : labelCount(vendorCountry, memberCount),
  }
}
