/**
 * Shared city/state resolver for all search and lookup paths.
 *
 * Handles: case insensitivity, comma or space separation, full state names,
 * abbreviations (St./Saint, Ft./Fort, Mt./Mount, N./North, S./South, E./East, W./West),
 * periods in state codes (O.H. → OH), extra whitespace, punctuation.
 *
 * Used by: admin coverage lookup, patient directory search, /pro demand lookup.
 * ONE resolver. Never duplicate this logic.
 */

import { createAdminClient } from '@/lib/supabase-admin'
import { resolveStateCode } from '@/lib/resolve-state'

export interface CityResolution {
  city: string
  state: string
  lat: number
  lng: number
}

export interface ResolveResult {
  resolved: CityResolution | null
  ambiguous: CityResolution[] | null
  label: string
}

/**
 * Resolve a city/state/ZIP input string to coordinates.
 *
 * Returns one of:
 * - resolved + label: single match found
 * - ambiguous + label: multiple states, caller should show options
 * - neither: could not resolve, label explains why
 */
export async function resolveLocation(
  input: string,
  country: string = 'US',
): Promise<ResolveResult> {
  const raw = input.trim()
  if (!raw) return { resolved: null, ambiguous: null, label: '' }

  const supabase = createAdminClient()

  // ── ZIP code detection ──
  const zipMatch = raw.replace(/\s+/g, '').match(/^(\d{5})(?:-\d{4})?$/)
  if (zipMatch) {
    const { data } = await (supabase as any)
      .from('zip_codes')
      .select('city, state, lat, lng')
      .eq('zip', zipMatch[1])
      .eq('country', country)
      .maybeSingle()

    if (data) {
      return {
        resolved: { city: data.city, state: data.state, lat: Number(data.lat), lng: Number(data.lng) },
        ambiguous: null,
        label: `Showing doctors near ${data.city}, ${data.state}`,
      }
    }
    return { resolved: null, ambiguous: null, label: `We couldn't find postal code ${zipMatch[1]}.` }
  }

  // ── Parse city and state ──
  const parsed = parseCityState(raw, country)

  if (parsed) {
    // We have city + state code — look up in zip_codes
    const match = await lookupCityInState(supabase, parsed.city, parsed.state, country)
    if (match) {
      return {
        resolved: match,
        ambiguous: null,
        label: `Showing doctors near ${match.city}, ${match.state}`,
      }
    }

    // City not found in that state
    return { resolved: null, ambiguous: null, label: `Couldn't find "${parsed.city}" in ${parsed.state}.` }
  }

  // ── Bare city name — check for ambiguity ──
  const bareCity = normalizeCityName(raw)
  if (bareCity.length < 2) return { resolved: null, ambiguous: null, label: `Couldn't resolve "${raw}".` }

  const { data: cityMatches } = await (supabase as any)
    .from('zip_codes')
    .select('city, state, lat, lng')
    .ilike('city', bareCity)
    .eq('country', country)

  if (!cityMatches || cityMatches.length === 0) {
    // Try abbreviation variants
    const variants = cityAbbreviationVariants(bareCity)
    for (const variant of variants) {
      const { data: vd } = await (supabase as any)
        .from('zip_codes')
        .select('city, state, lat, lng')
        .ilike('city', variant)
        .eq('country', country)

      if (vd && vd.length > 0) {
        return dedupeByState(vd, variant)
      }
    }

    return { resolved: null, ambiguous: null, label: `Couldn't find "${raw}".` }
  }

  return dedupeByState(cityMatches, bareCity)
}

// ── Internal helpers ──

function parseCityState(input: string, country: string): { city: string; state: string } | null {
  // Normalize: collapse whitespace, strip periods from state
  let cleaned = input.replace(/\s+/g, ' ').trim()

  // Try comma-separated: "Costa Mesa, CA" or "Costa Mesa , CA" or "costa mesa,ca"
  if (cleaned.includes(',')) {
    const parts = cleaned.split(',').map(p => p.trim()).filter(Boolean)
    if (parts.length >= 2) {
      const stateRaw = parts[parts.length - 1]
      const stateCode = resolveStateCode(stateRaw.replace(/\./g, ''), country)
      if (stateCode) {
        return { city: normalizeCityName(parts.slice(0, -1).join(', ')), state: stateCode }
      }
    }
  }

  // Try space-separated: "Columbus OH", "Salt Lake City Utah", "columbus oh"
  const tokens = cleaned.split(/\s+/)

  // Try last 2 tokens as state (e.g. "New York", "South Carolina")
  if (tokens.length >= 3) {
    const last2 = tokens.slice(-2).join(' ')
    const code = resolveStateCode(last2.replace(/\./g, ''), country)
    if (code) {
      return { city: normalizeCityName(tokens.slice(0, -2).join(' ')), state: code }
    }
  }

  // Try last 1 token as state
  if (tokens.length >= 2) {
    const last1 = tokens[tokens.length - 1]
    const code = resolveStateCode(last1.replace(/\./g, ''), country)
    if (code) {
      return { city: normalizeCityName(tokens.slice(0, -1).join(' ')), state: code }
    }
  }

  return null
}

function normalizeCityName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    // Title case each word
    .replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

function cityAbbreviationVariants(city: string): string[] {
  const variants: string[] = []
  const lower = city.toLowerCase()

  // St./St → Saint
  if (/^st\.?\s/i.test(city)) variants.push(city.replace(/^st\.?\s*/i, 'Saint '))
  if (lower.startsWith('saint ')) variants.push(city.replace(/^saint\s+/i, 'St. '))

  // Ft./Ft → Fort
  if (/^ft\.?\s/i.test(city)) variants.push(city.replace(/^ft\.?\s*/i, 'Fort '))
  if (lower.startsWith('fort ')) variants.push(city.replace(/^fort\s+/i, 'Ft. '))

  // Mt./Mt → Mount
  if (/^mt\.?\s/i.test(city)) variants.push(city.replace(/^mt\.?\s*/i, 'Mount '))
  if (lower.startsWith('mount ')) variants.push(city.replace(/^mount\s+/i, 'Mt. '))

  // N./N → North, S. → South, E. → East, W. → West
  const dirMap: [RegExp, string, string][] = [
    [/^n\.?\s/i, 'North ', 'north '],
    [/^s\.?\s/i, 'South ', 'south '],
    [/^e\.?\s/i, 'East ', 'east '],
    [/^w\.?\s/i, 'West ', 'west '],
  ]
  for (const [regex, full, lowerFull] of dirMap) {
    if (regex.test(city)) variants.push(city.replace(regex, full))
    if (lower.startsWith(lowerFull)) variants.push(city.replace(new RegExp(`^${lowerFull}`, 'i'), full.charAt(0) + '. '))
  }

  return variants.map(v => v.trim())
}

async function lookupCityInState(
  supabase: any,
  city: string,
  state: string,
  country: string,
): Promise<CityResolution | null> {
  // Exact match
  const { data } = await (supabase as any)
    .from('zip_codes')
    .select('city, state, lat, lng')
    .ilike('city', city)
    .eq('state', state)
    .eq('country', country)
    .limit(1)

  if (data && data.length > 0) {
    return { city: data[0].city, state: data[0].state, lat: Number(data[0].lat), lng: Number(data[0].lng) }
  }

  // Try abbreviation variants
  const variants = cityAbbreviationVariants(city)
  for (const variant of variants) {
    const { data: vd } = await (supabase as any)
      .from('zip_codes')
      .select('city, state, lat, lng')
      .ilike('city', variant)
      .eq('state', state)
      .eq('country', country)
      .limit(1)

    if (vd && vd.length > 0) {
      return { city: vd[0].city, state: vd[0].state, lat: Number(vd[0].lat), lng: Number(vd[0].lng) }
    }
  }

  return null
}

function dedupeByState(matches: any[], searchedCity: string): ResolveResult {
  const byState = new Map<string, CityResolution & { count: number }>()
  for (const z of matches) {
    if (!byState.has(z.state)) {
      byState.set(z.state, { city: z.city, state: z.state, lat: Number(z.lat), lng: Number(z.lng), count: 1 })
    } else {
      byState.get(z.state)!.count++
    }
  }

  if (byState.size === 1) {
    const match = Array.from(byState.values())[0]
    return {
      resolved: { city: match.city, state: match.state, lat: match.lat, lng: match.lng },
      ambiguous: null,
      label: `Showing doctors near ${match.city}, ${match.state}`,
    }
  }

  // Ambiguous — return all options sorted by ZIP count (largest city first)
  const sorted = Array.from(byState.values())
    .sort((a, b) => b.count - a.count)
    .map(v => ({ city: v.city, state: v.state, lat: v.lat, lng: v.lng }))

  return {
    resolved: null,
    ambiguous: sorted,
    label: `"${searchedCity}" exists in ${byState.size} states. Pick one:`,
  }
}
