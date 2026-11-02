'use server'

import { checkAdminAuth } from '@/lib/admin-auth'
import { parseLocationQuery, type LocationOption } from '@/lib/admin/location-query'
import { bboxForValues, findDoctorsNear, resolveSearchPoint } from '@/lib/admin/nearby'
import { getCountryByIso2 } from '@/config/countries'
import { countryStoredValues, matchCountry } from '@/lib/geo/country-alias'
import { matchRegion, regionCodes, regionCountry, regionLabel } from '@/lib/geo/region-alias'
import { createAdminClient } from '@/lib/supabase-admin'

function radiusOf(value: number | null | undefined): number {
  if (value === 25 || value === 50 || value === 100 || value === 250) return value
  return 100
}

export type PlaceBBox = { west: number; south: number; east: number; north: number }

export type AdminPlace =
  | { kind: 'country'; iso2: string; label: string; flag: string; view: { center: [number, number]; zoom: number } | null; bbox: PlaceBBox | null }
  | { kind: 'state'; country: string; state: string; label: string; bbox: PlaceBBox | null }
  | { kind: 'place'; lat: number; lng: number; label: string; country: string; state: string; zoom: 10; radius: number; doctors: { id: string; name: string; city: string; state: string; miles: number }[] }
  | { kind: 'ambiguous'; options: LocationOption[] }
  | { kind: 'none'; message: string }

export async function resolveAdminPlace(
  q: string,
  countryHint?: string,
  radiusMi?: number | null,
  choice?: 'state' | 'country' | null,
  choiceCode?: string | null,
): Promise<AdminPlace> {
  await checkAdminAuth()
  const query = q.trim()
  if (!query) return { kind: 'none', message: '' }
  if (choice === 'country' && choiceCode) return countryPlace(choiceCode)
  if (choice === 'state' && choiceCode) return statePlace(choiceCode)
  const parsed = parseLocationQuery(query, { country: countryHint })
  const options = parsed.ambiguous[0]?.options || []
  const hasCountry = options.some((option) => option.kind === 'country')
  const hasState = options.some((option) => option.kind === 'state')
  if (hasCountry && hasState && !parsed.city && !parsed.postal) return { kind: 'ambiguous', options }
  if (parsed.postal?.prefix && parsed.ambiguous.length && !countryHint) return { kind: 'ambiguous', options }
  if (!parsed.postal && !parsed.city && parsed.text.length === 0 && parsed.countries[0] && parsed.states.length === 0) {
    return countryPlace(parsed.countries[0])
  }
  if (!parsed.postal && !parsed.city && parsed.text.length === 0 && parsed.states[0]) {
    return statePlace(parsed.states[0])
  }
  const admin = createAdminClient()
  const hint = parsed.postal?.country || countryHint || 'US'
  const point = await resolveSearchPoint(admin, query, hint)
  if (point.unavailable) return { kind: 'none', message: 'Place lookup unavailable' }
  if (!point.resolved) return { kind: 'none', message: "Couldn't find that place" }
  const radius = radiusOf(radiusMi)
  const hits = await findDoctorsNear(admin, point.resolved, radius)
  const country = matchCountry(point.resolved.country)?.iso2 || point.resolved.country
  const state = matchRegion(point.resolved.state, country)?.code || point.resolved.state
  return {
    kind: 'place',
    lat: point.resolved.lat,
    lng: point.resolved.lng,
    label: point.resolved.label,
    country,
    state,
    zoom: 10,
    radius,
    doctors: hits.slice(0, 50).map((hit) => ({
      id: String(hit.row.id || ''),
      name: `${hit.row.first_name || ''} ${hit.row.last_name || ''}`.trim() || 'Unnamed doctor',
      city: typeof hit.row.city === 'string' ? hit.row.city : '',
      state: typeof hit.row.state === 'string' ? hit.row.state : '',
      miles: hit.miles,
    })).filter((doctor) => doctor.id),
  }
}

async function countryPlace(code: string): Promise<AdminPlace> {
  const country = matchCountry(code)
  const iso2 = country?.iso2 || code.trim().toUpperCase()
  const known = getCountryByIso2(iso2)
  const admin = createAdminClient()
  const bbox = known?.mapView ? null : await bboxForValues(admin, 'country', countryStoredValues(iso2))
  return {
    kind: 'country',
    iso2,
    label: known?.name || country?.name || iso2,
    flag: known?.flag || country?.flag || '',
    view: known?.mapView || null,
    bbox,
  }
}

async function statePlace(code: string): Promise<AdminPlace> {
  const region = matchRegion(code)
  const state = region?.code || code.trim().toUpperCase()
  const country = regionCountry(state) || region?.country || 'US'
  const admin = createAdminClient()
  const bbox = await bboxForValues(admin, 'state', regionCodes(state, country))
  return {
    kind: 'state',
    country,
    state,
    label: regionLabel(state, country) || state,
    bbox,
  }
}
