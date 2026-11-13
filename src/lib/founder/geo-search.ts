import 'server-only'

import { resolveSearchPoint, type ResolvedPoint } from '@/lib/admin/nearby'
import { matchCountry } from '@/lib/geo/country-alias'
import { matchRegion } from '@/lib/geo/region-alias'
import { createAdminClient } from '@/lib/supabase-admin'
import { ambiguousPlaceChoices, type PlaceHit } from '@/lib/founder/place-choices'

export type GrowthPoint = ResolvedPoint & {
  choices: { label: string; query: string }[]
}

const EMPTY_CHOICES: GrowthPoint['choices'] = []

/**
 * Growth map search. US first (city, ZIP, address), then a named country
 * ("Toronto, Canada"), then one worldwide lookup so a non-US city still lands.
 * A bare name that matches a small US place and a major world city comes back
 * as a pick list instead of a silent choice.
 */
export async function resolveGrowthPoint(query: string, options?: { autoPick?: boolean }): Promise<GrowthPoint> {
  const raw = query.trim().slice(0, 160)
  if (!raw) return { resolved: null, unavailable: false, message: 'Type a city, ZIP, or address.', choices: EMPTY_CHOICES }
  const admin = createAdminClient()

  const parts = raw.split(',').map((part) => part.trim()).filter(Boolean)
  const last = parts.length > 1 ? parts[parts.length - 1] : ''
  // "Greenville, SC" and "Los Angeles, CA" are US states, not Seychelles or Canada.
  const usState = last ? matchRegion(last, 'US')?.country === 'US' : false
  const named = last && !usState ? matchCountry(last) : null
  if (named && named.iso2 !== 'US') {
    const place = parts.slice(0, -1).join(', ')
    const abroad = await resolveSearchPoint(admin, place, named.iso2).catch(() => null)
    if (abroad?.resolved) {
      return { ...abroad, resolved: { ...abroad.resolved, country: named.iso2, label: labelFor(abroad.resolved.label, place, named.name) }, choices: EMPTY_CHOICES }
    }
    const world = await worldLookup(raw)
    if (world) return { resolved: world, unavailable: false, message: '', choices: EMPTY_CHOICES }
    return { ...(abroad || { resolved: null, unavailable: false, message: "Couldn't find that place" }), choices: EMPTY_CHOICES }
  }

  if (bareCity(raw)) {
    let hits = await worldCandidates(raw)
    const majorAbroad = hits.some((hit) => hit.country !== 'US' && hit.importance >= 0.5)
    if (majorAbroad && !hits.some((hit) => hit.country === 'US')) {
      const usHit = await resolveSearchPoint(admin, raw, 'US').catch(() => null)
      if (usHit?.resolved) {
        hits = [...hits, {
          label: usHit.resolved.label || `${raw}, United States`,
          query: usHit.resolved.label || `${raw}, United States`,
          country: 'US',
          importance: 0.4,
        }]
      }
    }
    const choices = ambiguousPlaceChoices(hits)
    if (choices) {
      const [best, second] = choices
      const gap = best.importance - (second?.importance || 0)
      if (options?.autoPick && best.lat != null && best.lng != null && (!second || gap >= 0.08 || second.importance < 0.5)) {
        return {
          resolved: { lat: best.lat, lng: best.lng, city: best.city || raw, state: best.state || '', country: best.country, label: best.label },
          unavailable: false,
          message: '',
          choices: EMPTY_CHOICES,
        }
      }
      return {
        resolved: null,
        unavailable: false,
        message: 'More than one place matches. Pick one.',
        choices: choices.map((hit) => ({ label: hit.label, query: hit.query })),
      }
    }
  }

  const us = await resolveSearchPoint(admin, raw, 'US')
  if (us.resolved) return { ...us, choices: EMPTY_CHOICES }
  const world = await worldLookup(raw)
  if (world) return { resolved: world, unavailable: false, message: '', choices: EMPTY_CHOICES }
  return { ...us, choices: EMPTY_CHOICES }
}

/** One worldwide lookup. Picks the main city unless two countries are genuinely tied. */
export async function resolveFastPlace(query: string): Promise<GrowthPoint> {
  const raw = query.trim().slice(0, 160)
  if (!raw) return { resolved: null, unavailable: false, message: '', choices: EMPTY_CHOICES }
  const hits = await worldCandidates(raw)
  const ranked = hits
    .filter((hit) => hit.lat != null && hit.lng != null)
    .sort((a, b) => b.importance - a.importance || a.label.localeCompare(b.label))
  const best = ranked[0]
  if (!best || best.lat == null || best.lng == null) {
    return { resolved: null, unavailable: false, message: "Couldn't find that place", choices: EMPTY_CHOICES }
  }
  const second = ranked.find((hit) => hit.country !== best.country)
  const gap = best.importance - (second?.importance || 0)
  if (second && second.importance >= 0.55 && gap < 0.08) {
    return {
      resolved: null,
      unavailable: false,
      message: 'More than one place matches. Pick one.',
      choices: [best, second].map((hit) => ({ label: hit.label, query: hit.query })),
    }
  }
  return {
    resolved: {
      lat: best.lat,
      lng: best.lng,
      city: best.city || raw,
      state: best.state || '',
      country: best.country,
      label: best.label,
    },
    unavailable: false,
    message: '',
    choices: EMPTY_CHOICES,
  }
}

function bareCity(raw: string): boolean {
  if (raw.includes(',')) return false
  if (/\d/.test(raw)) return false
  const tokens = raw.split(/\s+/).filter(Boolean)
  if (tokens.length === 0 || tokens.length > 3) return false
  if (tokens.length === 1 && tokens[0].length <= 3 && matchRegion(tokens[0], 'US')?.country === 'US') return false
  return true
}

function labelFor(label: string, place: string, country: string): string {
  const base = label || place
  return base.toLowerCase().includes(country.toLowerCase()) ? base : `${base}, ${country}`
}

type WorldHit = { lat: number; lng: number; city: string; state: string; country: string; label: string }
type NominatimHit = {
  lat?: string
  lon?: string
  display_name?: string
  importance?: number
  address?: Record<string, string>
}

async function nominatim(query: string, limit: number): Promise<NominatimHit[]> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=${limit}&addressdetails=1`,
    {
      headers: { 'User-Agent': 'NeuroChiro/1.0 (https://www.neurochiro.co)' },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 86_400 },
    },
  )
  if (!response.ok) return []
  const data = await response.json() as NominatimHit[]
  return Array.isArray(data) ? data : []
}

function toWorldHit(hit: NominatimHit, query: string): WorldHit | null {
  const lat = Number(hit.lat)
  const lng = Number(hit.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  const address = hit.address || {}
  const city = address.city || address.town || address.village || address.municipality || address.county || ''
  const state = address.state || address.region || ''
  const country = (address.country_code || '').toUpperCase()
  const label = [city, state, address.country].filter(Boolean).join(', ') || (hit.display_name || query).split(',').slice(0, 3).join(',')
  return { lat, lng, city, state, country, label }
}

async function worldLookup(query: string): Promise<WorldHit | null> {
  try {
    const [hit] = await nominatim(query, 1)
    return hit ? toWorldHit(hit, query) : null
  } catch {
    return null
  }
}

async function worldCandidates(query: string): Promise<PlaceHit[]> {
  try {
    const rows = await nominatim(query, 5)
    return rows.flatMap((hit) => {
      const place = toWorldHit(hit, query)
      if (!place) return []
      const countryName = hit.address?.country || place.country
      const refined = place.country && place.country !== 'US'
        ? `${query}, ${countryName}`
        : [place.city || query, place.state].filter(Boolean).join(', ')
      return [{
        label: place.label,
        query: refined,
        country: place.country || 'US',
        importance: typeof hit.importance === 'number' ? hit.importance : 0,
        lat: place.lat,
        lng: place.lng,
        city: place.city,
        state: place.state,
      }]
    })
  } catch {
    return []
  }
}
