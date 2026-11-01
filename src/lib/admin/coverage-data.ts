import 'server-only'

import { unstable_cache } from 'next/cache'
import type Stripe from 'stripe'
import { checkAdminAuth } from '@/lib/admin-auth'
import { looseFrom } from '@/lib/admin/loose-query'
import { normalizeCountry, normalizeState } from '@/lib/admin/geo-normalize'
import type {
  Billing,
  CoverageMapData,
  DemandPoint,
  GapSummary,
  MapDoctor,
  MentionPoint,
  MissingCountryDoctor,
} from '@/lib/admin/coverage-types'
import { isMissingColumn } from '@/lib/leads/schema'
import { deriveMembership, type MembershipStatus } from '@/lib/portal/membership'
import { boundingBox, haversineDistance } from '@/lib/geo'
import { stripe } from '@/lib/stripe'
import { createAdminClient, fetchAllRows } from '@/lib/supabase-admin'
import { getThresholds } from '@/lib/thresholds'

const CELL_DEGREES = 1
const GAP_CAP = 50

type Admin = ReturnType<typeof createAdminClient>
type Row = Record<string, unknown>

const DOCTOR_COLUMNS = [
  'id, user_id, first_name, last_name, clinic_name, city, state, country, latitude, longitude, verification_status, specialties, membership_tier, is_founding_member, neuros_tier, created_at, is_test',
  'id, user_id, first_name, last_name, clinic_name, city, state, country, latitude, longitude, verification_status, specialties, membership_tier, created_at, is_test',
  'id, user_id, first_name, last_name, clinic_name, city, state, country, latitude, longitude, verification_status, specialties, membership_tier, created_at',
]

function record(row: unknown): Row | null {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return null
  return row as Row
}

function text(row: Row, key: string): string {
  const value = row[key]
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

function numberValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  return null
}

function flag(value: unknown): boolean {
  return value === true || value === 'true' || value === 't' || value === 1
}

function isTestRow(row: Row): boolean {
  return flag(row.is_test)
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
}

function doctorName(first: string, last: string, practice: string): string {
  const name = `Dr. ${first} ${last}`.replace(/\s+/g, ' ').trim()
  if (name !== 'Dr.') return name
  return practice || 'Doctor'
}

function plotted(lat: number | null, lng: number | null): [number, number] | null {
  if (lat == null || lng == null || (lat === 0 && lng === 0) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  return [lat, lng]
}

async function hasColumns(admin: Admin, table: string, columns: string): Promise<boolean> {
  const probe = await looseFrom(admin, table).select(columns).limit(1)
  if (!probe.error) return true
  return !isMissingColumn(probe.error)
}

type LooseQuery = {
  in: (column: string, values: readonly string[]) => LooseQuery
  eq: (column: string, value: boolean) => LooseQuery
  not: (column: string, operator: string, value: null) => LooseQuery
}

async function readAll(
  admin: Admin,
  table: string,
  columns: string,
  apply: (query: LooseQuery) => unknown,
): Promise<unknown[]> {
  for (const order of ['id', 'created_at']) {
    const probe = await looseFrom(admin, table).select(columns).order(order, { ascending: true }).limit(1)
    if (probe.error && isMissingColumn(probe.error)) continue
    return fetchAllRows(admin, table, columns, apply, order, true)
  }
  return []
}

function customerId(customer: Stripe.Subscription['customer']): string | null {
  if (typeof customer === 'string') return customer
  if (customer && typeof customer === 'object' && 'id' in customer) {
    if ('deleted' in customer && customer.deleted) return null
    return customer.id
  }
  return null
}

async function listCustomerIds(status: Stripe.SubscriptionListParams['status']): Promise<Set<string>> {
  const ids = new Set<string>()
  for await (const sub of stripe.subscriptions.list({ status, limit: 100 })) {
    const id = customerId(sub.customer)
    if (id) ids.add(id)
  }
  return ids
}

function classifyBilling(input: {
  stripeOk: boolean
  verificationStatus: string
  source: string
  live: 'active' | 'trialing' | 'past_due' | null
}): Billing {
  if (!input.stripeOk) return 'unknown'
  if (input.live === 'active') return 'paying'
  if (input.source === 'founding' || input.source === 'comped') return 'founding-comped'
  if (input.live === 'trialing') return 'trialing'
  if (input.verificationStatus === 'pending') return 'pending'
  return 'free'
}

async function loadDoctors(admin: Admin): Promise<unknown[]> {
  for (const columns of DOCTOR_COLUMNS) {
    if (!(await hasColumns(admin, 'doctors', columns))) continue
    const filterTest = columns.includes('is_test')
    return readAll(admin, 'doctors', columns, (query) => {
      const filtered = query.in('verification_status', ['verified', 'pending'])
      return filterTest ? filtered.eq('is_test', false) : filtered
    })
  }
  return []
}

type ProfileBits = { tier: string | null; customer: string | null }

async function loadProfiles(admin: Admin, userIds: string[]): Promise<Map<string, ProfileBits> | null> {
  const profiles = new Map<string, ProfileBits>()
  try {
    for (let index = 0; index < userIds.length; index += 200) {
      const chunk = userIds.slice(index, index + 200)
      const { data, error } = await admin.from('profiles').select('id, tier, stripe_customer_id').in('id', chunk)
      if (error) return null
      for (const row of data || []) {
        profiles.set(row.id, { tier: row.tier || null, customer: row.stripe_customer_id })
      }
    }
    return profiles
  } catch {
    return null
  }
}

function postalKey(rawZip: string, country: string): string | null {
  const zip = rawZip.trim()
  if (country === 'US') {
    const key = zip.slice(0, 5)
    if (!/^\d{5}$/.test(key)) return null
    return key
  }
  const key = zip.split(' ')[0] || ''
  if (key.length < 2) return null
  return key
}

type ZipHit = { zip: string; city: string; state: string; lat: number; lng: number; country: string }

async function lookupZips(admin: Admin, keys: string[]): Promise<Map<string, ZipHit[]>> {
  const hits = new Map<string, ZipHit[]>()
  if (keys.length === 0) return hits
  const withCountry = await hasColumns(admin, 'zip_codes', 'zip, city, state, lat, lng, country')
  const columns = withCountry ? 'zip, city, state, lat, lng, country' : 'zip, city, state, lat, lng'
  for (let index = 0; index < keys.length; index += 500) {
    const batch = keys.slice(index, index + 500)
    const result = await looseFrom(admin, 'zip_codes').select(columns).in('zip', batch)
    if (result.error || !result.data) continue
    for (const item of result.data) {
      const row = record(item)
      if (!row) continue
      const zip = text(row, 'zip').trim()
      const coords = plotted(numberValue(row.lat), numberValue(row.lng))
      if (!zip || !coords) continue
      const country = withCountry ? normalizeCountry(text(row, 'country')) : 'US'
      const hit: ZipHit = {
        zip,
        city: text(row, 'city').trim(),
        state: normalizeState(text(row, 'state')),
        lat: coords[0],
        lng: coords[1],
        country,
      }
      const list = hits.get(zip)
      if (list) list.push(hit)
      else hits.set(zip, [hit])
    }
  }
  return hits
}

function matchZip(rows: ZipHit[] | undefined, country: string): ZipHit | null {
  if (!rows || rows.length === 0) return null
  const exact = rows.find((row) => row.country === country)
  if (exact) return exact
  const blank = rows.find((row) => row.country === '')
  if (!blank) return null
  return { ...blank, country }
}

type Pin = { lat: number; lng: number }

function cellKey(lat: number, lng: number): string {
  return `${Math.floor(lat / CELL_DEGREES)}:${Math.floor(lng / CELL_DEGREES)}`
}

function indexDoctors(doctors: MapDoctor[]): Map<string, Map<string, Pin[]>> {
  const byCountry = new Map<string, Map<string, Pin[]>>()
  for (const doctor of doctors) {
    const country = doctor.country || 'US'
    let grid = byCountry.get(country)
    if (!grid) {
      grid = new Map()
      byCountry.set(country, grid)
    }
    const key = cellKey(doctor.lat, doctor.lng)
    const bucket = grid.get(key)
    const pin = { lat: doctor.lat, lng: doctor.lng }
    if (bucket) bucket.push(pin)
    else grid.set(key, [pin])
  }
  return byCountry
}

function pinsInBox(grid: Map<string, Pin[]>, minLat: number, maxLat: number, minLng: number, maxLng: number): Pin[] {
  const found: Pin[] = []
  for (const [key, bucket] of grid) {
    const [latCell, lngCell] = key.split(':').map(Number)
    const cellMinLat = latCell * CELL_DEGREES
    const cellMinLng = lngCell * CELL_DEGREES
    if (cellMinLat + CELL_DEGREES < minLat || cellMinLat > maxLat || cellMinLng + CELL_DEGREES < minLng || cellMinLng > maxLng) {
      continue
    }
    for (const pin of bucket) {
      if (pin.lat < minLat || pin.lat > maxLat || pin.lng < minLng || pin.lng > maxLng) continue
      found.push(pin)
    }
  }
  return found
}

/** Nearest doctor in miles. Haversine runs only for pins inside the current bounding box. */
function nearestMiles(lat: number, lng: number, grid: Map<string, Pin[]> | undefined, gapRadius: number): number | null {
  if (!grid || grid.size === 0) return null
  let radius = gapRadius
  let best: number | null = null
  for (let step = 0; step < 8; step += 1) {
    const [minLng, minLat, maxLng, maxLat] = boundingBox(lat, lng, radius)
    for (const pin of pinsInBox(grid, minLat, maxLat, minLng, maxLng)) {
      const miles = haversineDistance(lat, lng, pin.lat, pin.lng)
      if (best == null || miles < best) best = miles
    }
    if (best != null && best <= radius) return Math.round(best * 10) / 10
    radius *= 2
  }
  return best == null ? null : Math.round(best * 10) / 10
}

function gapLabel(city: string, state: string, zip: string): string {
  if (city && state) return `${city}, ${state}`
  if (city) return city
  return zip
}

function rankGaps(points: DemandPoint[], doctors: MapDoctor[], gapRadius: number): GapSummary[] {
  const grids = indexDoctors(doctors)
  const grouped = new Map<string, GapSummary[]>()
  for (const point of points) {
    const country = point.country || 'US'
    const miles = nearestMiles(point.lat, point.lng, grids.get(country), gapRadius)
    if (miles != null && miles <= gapRadius) continue
    const gap: GapSummary = {
      id: `${country}|${point.zip}|${point.city}|${point.state}`,
      label: gapLabel(point.city, point.state, point.zip),
      city: point.city,
      zip: point.zip,
      state: point.state,
      country,
      lat: point.lat,
      lng: point.lng,
      demandCount: point.count,
      nearestMiles: miles,
    }
    const list = grouped.get(country)
    if (list) list.push(gap)
    else grouped.set(country, [gap])
  }
  const gaps: GapSummary[] = []
  for (const list of grouped.values()) {
    list.sort((a, b) => {
      if (b.demandCount !== a.demandCount) return b.demandCount - a.demandCount
      return (b.nearestMiles ?? Number.POSITIVE_INFINITY) - (a.nearestMiles ?? Number.POSITIVE_INFINITY)
    })
    gaps.push(...list.slice(0, GAP_CAP))
  }
  return gaps
}

async function buildCoverageMap(): Promise<CoverageMapData> {
  const admin = createAdminClient()
  let gapRadius = 50
  try {
    const thresholds = await getThresholds()
    if (typeof thresholds.gap_radius === 'number' && thresholds.gap_radius > 0) gapRadius = thresholds.gap_radius
  } catch {
    gapRadius = 50
  }

  const doctorRows = await loadDoctors(admin)
  const userIds: string[] = []
  for (const item of doctorRows) {
    const row = record(item)
    const userId = row ? text(row, 'user_id') : ''
    if (userId) userIds.push(userId)
  }
  const profiles = await loadProfiles(admin, [...new Set(userIds)])

  let stripeOk = profiles != null
  let activeIds = new Set<string>()
  let trialIds = new Set<string>()
  let pastDueIds = new Set<string>()
  let unpaidIds = new Set<string>()
  if (stripeOk) {
    try {
      ;[activeIds, trialIds, pastDueIds, unpaidIds] = await Promise.all([
        listCustomerIds('active'),
        listCustomerIds('trialing'),
        listCustomerIds('past_due'),
        listCustomerIds('unpaid'),
      ])
    } catch {
      stripeOk = false
    }
  }

  const seen = new Set<string>()
  const doctors: MapDoctor[] = []
  for (const item of doctorRows) {
    const row = record(item)
    if (!row || isTestRow(row)) continue
    const id = text(row, 'id')
    if (!id || seen.has(id)) continue
    const coords = plotted(numberValue(row.latitude), numberValue(row.longitude))
    if (!coords) continue
    const lat = coords[0]
    const lng = coords[1]
    const verification = text(row, 'verification_status')
    if (verification !== 'verified' && verification !== 'pending') continue
    const userId = text(row, 'user_id')
    const profile = userId && profiles ? profiles.get(userId) : undefined
    const customer = profile?.customer || null
    const live: 'active' | 'trialing' | 'past_due' | null = customer && activeIds.has(customer)
      ? 'active'
      : customer && trialIds.has(customer)
        ? 'trialing'
        : customer && (pastDueIds.has(customer) || unpaidIds.has(customer))
          ? 'past_due'
          : null
    const stripeStatus: MembershipStatus | null = live
    const membership = deriveMembership({
      membershipTier: text(row, 'membership_tier') || null,
      profileTier: profile?.tier || null,
      isFoundingMember: flag(row.is_founding_member),
      neurosTier: text(row, 'neuros_tier') || null,
      createdAt: text(row, 'created_at') || null,
      hasStripeCustomer: Boolean(customer),
      stripeStatus,
    })
    const country = normalizeCountry(text(row, 'country')) || 'US'
    seen.add(id)
    doctors.push({
      id,
      name: doctorName(text(row, 'first_name').trim(), text(row, 'last_name').trim(), text(row, 'clinic_name').trim()),
      practice: text(row, 'clinic_name').trim(),
      city: text(row, 'city').trim(),
      state: normalizeState(text(row, 'state')),
      country,
      lat,
      lng,
      verificationStatus: verification,
      specialties: strings(row.specialties),
      billing: classifyBilling({
        stripeOk,
        verificationStatus: verification,
        source: membership.source,
        live,
      }),
    })
  }

  const subscriberColumns = (await hasColumns(admin, 'subscribers', 'zip, status, country'))
    ? 'zip, status, country'
    : 'zip, status'
  const subscriberRows = await readAll(admin, 'subscribers', subscriberColumns, (query) =>
    query.in('status', ['confirmed', 'pending']).not('zip', 'is', null),
  )
  const confirmed = new Map<string, number>()
  const pending = new Map<string, number>()
  for (const item of subscriberRows) {
    const row = record(item)
    if (!row) continue
    const status = text(row, 'status')
    const country = normalizeCountry(text(row, 'country')) || 'US'
    const key = postalKey(text(row, 'zip'), country)
    if (!key) continue
    const bucket = `${country}|${key}`
    if (status === 'confirmed') confirmed.set(bucket, (confirmed.get(bucket) || 0) + 1)
    else if (status === 'pending') pending.set(bucket, (pending.get(bucket) || 0) + 1)
  }
  const zipKeys = [...new Set([...confirmed.keys(), ...pending.keys()].map((bucket) => bucket.split('|')[1] || ''))].filter(Boolean)
  const zipHits = await lookupZips(admin, zipKeys)
  const demand: DemandPoint[] = []
  for (const bucket of new Set([...confirmed.keys(), ...pending.keys()])) {
    const separator = bucket.indexOf('|')
    const country = separator === -1 ? 'US' : bucket.slice(0, separator)
    const zip = separator === -1 ? bucket : bucket.slice(separator + 1)
    const hit = matchZip(zipHits.get(zip), country)
    if (!hit) continue
    const confirmedCount = confirmed.get(bucket) || 0
    const pendingCount = pending.get(bucket) || 0
    const count = confirmedCount + pendingCount
    if (count < 1) continue
    demand.push({
      id: bucket,
      zip: hit.zip,
      city: hit.city,
      state: hit.state,
      country: hit.country,
      lat: hit.lat,
      lng: hit.lng,
      confirmed: confirmedCount,
      pending: pendingCount,
      count,
    })
  }

  const mentionColumns = (await hasColumns(admin, 'demand_mentions', 'city, state, lat, lng, country'))
    ? 'city, state, lat, lng, country'
    : 'city, state, lat, lng'
  const mentionRows = await readAll(admin, 'demand_mentions', mentionColumns, (query) => query)
  const mentionGroups = new Map<string, { city: string; state: string; country: string; lat: number; lng: number; count: number }>()
  for (const item of mentionRows) {
    const row = record(item)
    if (!row) continue
    const coords = plotted(numberValue(row.lat), numberValue(row.lng))
    if (!coords) continue
    const lat = coords[0]
    const lng = coords[1]
    const city = text(row, 'city').trim()
    const state = normalizeState(text(row, 'state'))
    const country = normalizeCountry(text(row, 'country')) || 'US'
    const key = `${country}|${state}|${city.toLowerCase()}`
    const existing = mentionGroups.get(key)
    if (existing) {
      existing.lat += lat
      existing.lng += lng
      existing.count += 1
    } else {
      mentionGroups.set(key, { city, state, country, lat, lng, count: 1 })
    }
  }
  const mentions: MentionPoint[] = [...mentionGroups.entries()].map(([id, group]) => ({
    id,
    city: group.city,
    state: group.state,
    country: group.country,
    lat: group.lat / group.count,
    lng: group.lng / group.count,
    count: group.count,
  }))

  return {
    doctors,
    demand,
    mentions,
    gaps: rankGaps(demand, doctors, gapRadius),
    gapRadius,
    stripeOk,
  }
}

const loadCoverageMap = unstable_cache(buildCoverageMap, ['coverage-map-v1'], {
  revalidate: 600,
  tags: ['admin-coverage'],
})

export async function getCoverageMapData(): Promise<CoverageMapData> {
  await checkAdminAuth()
  return loadCoverageMap()
}

export async function getMissingCountryDoctors(): Promise<MissingCountryDoctor[]> {
  await checkAdminAuth()
  const admin = createAdminClient()
  const rows = await loadDoctors(admin)
  const missing: MissingCountryDoctor[] = []
  const seen = new Set<string>()
  for (const item of rows) {
    const row = record(item)
    if (!row || isTestRow(row)) continue
    if (normalizeCountry(text(row, 'country')) !== '') continue
    const id = text(row, 'id')
    if (!id || seen.has(id)) continue
    const verification = text(row, 'verification_status')
    if (verification !== 'verified' && verification !== 'pending') continue
    seen.add(id)
    const practice = text(row, 'clinic_name').trim()
    missing.push({
      id,
      name: doctorName(text(row, 'first_name').trim(), text(row, 'last_name').trim(), practice),
      practice,
      city: text(row, 'city').trim(),
      state: normalizeState(text(row, 'state')),
      address: text(row, 'address').trim(),
    })
  }
  return missing
}
