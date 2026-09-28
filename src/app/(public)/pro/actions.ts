'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { getDoctorCounts, getSubscriberCounts, getDemandMentionCount } from '@/lib/platform-stats'
import { haversineDistance } from '@/lib/geo'
import { rateLimit, getIP } from '@/lib/rate-limit'
import { headers } from 'next/headers'

// ── Types ──

export interface ProPageStats {
  activeDoctors: number
  statesCovered: number
  confirmedSubscribers: number
  totalMentions: number
  totalDemandSignals: number
}

export interface MapDoctor {
  lat: number
  lng: number
}

export interface MapDemandCity {
  lat: number
  lng: number
  count: number
  city: string
  state: string
}

export interface DemandNearbyResult {
  cityLabel: string
  hasDemand: boolean
  mentionsNearby: number | null
  subscribersNearby: number | null
  doctorsNearby: number
  ambiguous?: { city: string; state: string }[]
  error?: string
}

// ── Stats ──

export async function getProPageStats(): Promise<ProPageStats> {
  const [doctors, subs, mentions] = await Promise.all([
    getDoctorCounts(),
    getSubscriberCounts(),
    getDemandMentionCount(),
  ])

  return {
    activeDoctors: doctors.active,
    statesCovered: doctors.statesCovered,
    confirmedSubscribers: subs.confirmed,
    totalMentions: mentions,
    totalDemandSignals: subs.confirmed + mentions,
  }
}

// ── Map Data ──

export async function getDemandMapData(): Promise<{ doctors: MapDoctor[]; demandCities: MapDemandCity[] }> {
  const supabase = createAdminClient()

  // Doctor locations (verified, US, valid coords — no PII)
  const { data: docs } = await supabase
    .from('doctors')
    .select('latitude, longitude')
    .eq('verification_status', 'verified')
    .or('country.is.null,country.eq.US')
    .not('latitude', 'eq', 0)
    .not('longitude', 'eq', 0)

  const doctors: MapDoctor[] = (docs || [])
    .filter(d => d.latitude != null && d.longitude != null)
    .map(d => ({ lat: d.latitude!, lng: d.longitude! }))

  // Demand: mentions aggregated by city (US only for map)
  const { data: mentions } = await (supabase as any)
    .from('demand_mentions')
    .select('city, state, lat, lng')
    .or('country.eq.US,country.is.null')

  const cityMap = new Map<string, MapDemandCity>()
  for (const m of (mentions || [])) {
    const key = `${m.city}|${m.state}`
    const existing = cityMap.get(key)
    if (existing) {
      existing.count++
    } else {
      cityMap.set(key, { city: m.city, state: m.state, lat: Number(m.lat), lng: Number(m.lng), count: 1 })
    }
  }

  // Demand: US subscribers by ZIP, joined to zip_codes for coords
  const { data: subscribers } = await (supabase as any)
    .from('subscribers')
    .select('zip')
    .eq('status', 'confirmed')
    .not('zip', 'is', null)
    .or('country.eq.US,country.is.null')

  const zipCounts = new Map<string, number>()
  for (const s of (subscribers || [])) {
    const z = (s.zip || '').trim().slice(0, 5)
    if (/^\d{5}$/.test(z)) zipCounts.set(z, (zipCounts.get(z) || 0) + 1)
  }

  if (zipCounts.size > 0) {
    const { data: zipCoords } = await (supabase as any)
      .from('zip_codes')
      .select('zip, city, state, lat, lng')
      .eq('country', 'US')
      .in('zip', Array.from(zipCounts.keys()))

    for (const z of (zipCoords || [])) {
      const key = `${z.city}|${z.state}`
      const count = zipCounts.get(z.zip) || 0
      const existing = cityMap.get(key)
      if (existing) {
        existing.count += count
      } else {
        cityMap.set(key, { city: z.city, state: z.state, lat: Number(z.lat), lng: Number(z.lng), count })
      }
    }
  }

  // No suppression on map data — all cities shown regardless of count
  const demandCities = Array.from(cityMap.values())

  return { doctors, demandCities }
}

// ── Demand Lookup ──

const lookupLimiter = rateLimit('pro_demand_lookup', { maxRequests: 30, windowMs: 60_000 })

export async function checkDemandNearby(query: string): Promise<DemandNearbyResult> {
  // Rate limit by IP
  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || hdrs.get('x-real-ip') || 'unknown'
  const { allowed } = lookupLimiter.check(ip)
  if (!allowed) {
    return { cityLabel: '', hasDemand: false, mentionsNearby: null, subscribersNearby: null, doctorsNearby: 0, error: 'Too many lookups. Try again in a minute.' }
  }

  const supabase = createAdminClient()

  // Resolve query using the shared resolver
  const { resolveLocation } = await import('@/lib/resolve-city')
  const resolution = await resolveLocation(query)

  if (resolution.ambiguous) {
    return {
      cityLabel: '',
      hasDemand: false,
      mentionsNearby: null,
      subscribersNearby: null,
      doctorsNearby: 0,
      ambiguous: resolution.ambiguous.map(v => ({ city: v.city, state: v.state })),
    }
  }

  if (!resolution.resolved) {
    return { cityLabel: '', hasDemand: false, mentionsNearby: null, subscribersNearby: null, doctorsNearby: 0, error: resolution.label || `Couldn't find "${query}".` }
  }

  const lat = resolution.resolved.lat
  const lng = resolution.resolved.lng
  const cityLabel = `${resolution.resolved.city}, ${resolution.resolved.state}`

  // Count mentions within 50mi (US only)
  const { data: allMentions } = await (supabase as any)
    .from('demand_mentions')
    .select('lat, lng')
    .or('country.eq.US,country.is.null')

  let mentionsNearby = 0
  for (const m of (allMentions || [])) {
    if (haversineDistance(lat, lng, Number(m.lat), Number(m.lng)) <= 50) mentionsNearby++
  }

  // Count US subscribers within 50mi
  const { data: allSubs } = await (supabase as any)
    .from('subscribers')
    .select('zip')
    .eq('status', 'confirmed')
    .not('zip', 'is', null)
    .or('country.eq.US,country.is.null')

  const subZips = new Set<string>()
  for (const s of (allSubs || [])) {
    const z = (s.zip || '').trim().slice(0, 5)
    if (/^\d{5}$/.test(z)) subZips.add(z)
  }

  let subscribersNearby = 0
  if (subZips.size > 0) {
    const { data: zipCoords } = await (supabase as any)
      .from('zip_codes')
      .select('zip, lat, lng')
      .eq('country', 'US')
      .in('zip', Array.from(subZips))

    const zipToCoord = new Map<string, { lat: number; lng: number }>()
    for (const z of (zipCoords || [])) {
      zipToCoord.set(z.zip, { lat: Number(z.lat), lng: Number(z.lng) })
    }

    for (const s of (allSubs || [])) {
      const z = (s.zip || '').trim().slice(0, 5)
      const coord = zipToCoord.get(z)
      if (coord && haversineDistance(lat, lng, coord.lat, coord.lng) <= 50) subscribersNearby++
    }
  }

  // Count doctors within 50mi
  const { data: allDocs } = await supabase
    .from('doctors')
    .select('latitude, longitude')
    .eq('verification_status', 'verified')
    .or('country.is.null,country.eq.US')
    .not('latitude', 'eq', 0)
    .not('longitude', 'eq', 0)

  let doctorsNearby = 0
  for (const d of (allDocs || [])) {
    if (d.latitude && d.longitude && haversineDistance(lat, lng, d.latitude, d.longitude) <= 50) doctorsNearby++
  }

  // Suppression: if total demand < 3, don't show exact counts
  const totalDemand = mentionsNearby + subscribersNearby
  if (totalDemand < 3) {
    return {
      cityLabel,
      hasDemand: totalDemand > 0,
      mentionsNearby: null,
      subscribersNearby: null,
      doctorsNearby,
    }
  }

  return {
    cityLabel,
    hasDemand: true,
    mentionsNearby,
    subscribersNearby,
    doctorsNearby,
  }
}
