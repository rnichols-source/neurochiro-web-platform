import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { parseLocationQuery, zipFromText } from '@/lib/admin/location-query'
import { matchCountry } from '@/lib/geo/country-alias'
import { boundingBox, haversineDistance } from '@/lib/geo'
import { isMissingColumn } from '@/lib/leads/schema'
import { resolveLocation } from '@/lib/resolve-city'

export type GeoPoint = {
  lat: number
  lng: number
  city: string
  state: string
  country: string
  label: string
}

export type ResolvedPoint = {
  resolved: GeoPoint | null
  unavailable: boolean
  message: string
}

export type NearbyHit = {
  miles: number
  row: Record<string, unknown>
}

type Row = Record<string, unknown>
type QueryResult = { data: Row[] | null; error: { code?: string; message?: string } | null }

interface Query {
  gte(column: string, value: number): Query
  lte(column: string, value: number): Query
  in(column: string, values: string[]): Query
  eq(column: string, value: string): Query
  ilike(column: string, value: string): Query
  limit(count: number): Promise<QueryResult>
}

interface LooseAdmin {
  from(table: string): { select(columns: string): Query }
}

/** Generated types omit zip_codes and some live doctor columns, so these reads use a narrow builder. */
function loose(admin: SupabaseClient<Database>): LooseAdmin {
  return admin as unknown as LooseAdmin
}

const WITH_ZIP = 'id, user_id, first_name, last_name, email, clinic_name, city, state, country, verification_status, slug, created_at, address, latitude, longitude, membership_tier, is_founding_member, neuros_tier, onboarding_call_status, is_approved, is_test, zip_code'
const NO_ZIP = WITH_ZIP.replace(', zip_code', '')

/**
 * One geocode for a submitted admin query.
 * Postal codes in zip_codes resolve there. Nominatim runs only through resolveLocation,
 * which keeps its cache and circuit breaker. This does not log demand.
 */
export async function resolveSearchPoint(admin: SupabaseClient<Database>, query: string, countryHint = 'US'): Promise<ResolvedPoint> {
  const parsed = parseLocationQuery(query, { country: countryHint })
  const country = parsed.postal?.country || countryHint || 'US'
  if (parsed.postal && parsed.postal.country !== 'US') {
    const hit = await lookupPostal(admin, parsed.postal.code, parsed.postal.country)
    if (hit) return { resolved: hit, unavailable: false, message: '' }
  }
  try {
    const resolution = await resolveLocation(query, country)
    if (resolution.serviceUnavailable && !resolution.resolved) {
      return { resolved: null, unavailable: true, message: 'Place lookup unavailable, showing text matches' }
    }
    if (!resolution.resolved) return { resolved: null, unavailable: false, message: "Couldn't find that place" }
    const city = resolution.resolved.city || ''
    const state = resolution.resolved.state || ''
    return {
      resolved: {
        lat: resolution.resolved.lat,
        lng: resolution.resolved.lng,
        city,
        state,
        country,
        label: [city, state].filter(Boolean).join(', ') || query.trim(),
      },
      unavailable: false,
      message: '',
    }
  } catch (err) {
    console.error('admin place resolve', err instanceof Error ? err.name : 'error')
    return { resolved: null, unavailable: true, message: 'Place lookup unavailable, showing text matches' }
  }
}

async function lookupPostal(admin: SupabaseClient<Database>, code: string, country: string): Promise<GeoPoint | null> {
  const { data, error } = await loose(admin).from('zip_codes').select('city, state, lat, lng, country').eq('country', country).ilike('zip', `${code}%`).limit(1)
  if (error || !data?.length) return null
  const row = data[0]
  const lat = Number(row.lat)
  const lng = Number(row.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  const city = typeof row.city === 'string' ? row.city : ''
  const state = typeof row.state === 'string' ? row.state : ''
  const rowCountry = typeof row.country === 'string' && row.country ? row.country : country
  return { lat, lng, city, state, country: rowCountry, label: [city, state].filter(Boolean).join(', ') }
}

export async function findDoctorsNear(admin: SupabaseClient<Database>, origin: GeoPoint, radiusMi: number): Promise<NearbyHit[]> {
  const [minLng, minLat, maxLng, maxLat] = boundingBox(origin.lat, origin.lng, radiusMi)
  let selected = await loose(admin).from('doctors').select(WITH_ZIP).gte('latitude', minLat).lte('latitude', maxLat).gte('longitude', minLng).lte('longitude', maxLng).limit(1000)
  if (selected.error && isMissingColumn(selected.error)) {
    selected = await loose(admin).from('doctors').select(NO_ZIP).gte('latitude', minLat).lte('latitude', maxLat).gte('longitude', minLng).lte('longitude', maxLng).limit(1000)
  }
  if (selected.error) {
    console.error('admin nearby doctors', selected.error.code || 'error')
    throw new Error('member search failed')
  }
  const hits: NearbyHit[] = []
  for (const row of selected.data || []) {
    if (row.is_test === true) continue
    const lat = Number(row.latitude)
    const lng = Number(row.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) continue
    if (!countryAllowed(row.country, origin.country)) continue
    const miles = haversineDistance(origin.lat, origin.lng, lat, lng)
    if (miles > radiusMi) continue
    if (!row.zip_code) row.zip_code = zipFromText(typeof row.address === 'string' ? row.address : null)
    hits.push({ miles: Math.round(miles * 10) / 10, row })
  }
  hits.sort((a, b) => a.miles - b.miles || String(a.row.id || '').localeCompare(String(b.row.id || '')))
  return hits
}

function countryAllowed(value: unknown, country: string): boolean {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (country === 'US') {
    if (!raw) return true
    const matched = matchCountry(raw)
    return matched?.iso2 === 'US' || raw.toUpperCase() === 'US'
  }
  if (!raw) return false
  return matchCountry(raw)?.iso2 === country || raw.toUpperCase() === country
}

export async function bboxForValues(admin: SupabaseClient<Database>, column: 'state' | 'country', values: string[]): Promise<{ west: number; south: number; east: number; north: number } | null> {
  if (!values.length) return null
  const points: { lat: number; lng: number }[] = []
  const doctors = await loose(admin).from('doctors').select('latitude, longitude').in(column, values).limit(1000)
  if (!doctors.error) pushPoints(points, doctors.data || [])
  if (column === 'state') {
    const zips = await loose(admin).from('zip_codes').select('lat, lng').in('state', values).limit(300)
    if (!zips.error) pushPoints(points, zips.data || [])
  }
  if (!points.length) return null
  let west = Infinity
  let south = Infinity
  let east = -Infinity
  let north = -Infinity
  for (const point of points) {
    west = Math.min(west, point.lng)
    south = Math.min(south, point.lat)
    east = Math.max(east, point.lng)
    north = Math.max(north, point.lat)
  }
  if (!Number.isFinite(west) || west === east || south === north) {
    west -= 0.2
    east += 0.2
    south -= 0.2
    north += 0.2
  }
  return { west, south, east, north }
}

function pushPoints(points: { lat: number; lng: number }[], rows: Record<string, unknown>[]) {
  for (const row of rows) {
    const lat = Number(row.latitude ?? row.lat)
    const lng = Number(row.longitude ?? row.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) continue
    points.push({ lat, lng })
  }
}
