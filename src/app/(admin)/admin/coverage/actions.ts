'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { checkAdminAuth } from '@/lib/admin-auth'
import { haversineDistance } from '@/lib/geo'
import { revalidatePath } from 'next/cache'

// ── Types ──

export interface CoverageDoctor {
  id: string
  first_name: string | null
  last_name: string | null
  clinic_name: string | null
  slug: string | null
  city: string | null
  state: string | null
  latitude: number | null
  longitude: number | null
  verification_status: string
  membership_tier: string | null
  created_at: string | null
  country: string | null
  address: string | null
  /** 'verified' | 'pending' | 'invisible' */
  pin_status: 'verified' | 'pending' | 'invisible'
  /** true if doctor has no country set — needs admin attention */
  missing_country?: boolean
  is_test?: boolean
}

export interface DemandZip {
  zip: string
  city: string
  state: string
  lat: number
  lng: number
  confirmed: number
  pending: number
  /** true if no doctor within 50 miles */
  gap: boolean
}

export interface MentionCity {
  city: string
  state: string
  lat: number
  lng: number
  count: number
  country: string
  /** true if no doctor within 50 miles */
  gap: boolean
}

export interface MarketCluster {
  name: string
  cities: string[]
  waitlist: number
  mentions: number
  total: number
  leads: string[]
  hasDoctor: boolean
}

export interface CoverageStats {
  verified: number
  pending: number
  invisible: number
  internationalCount: number
  statesWithDoctor: string[]
  statesWithout: string[]
  confirmedSubscribers: number
  pendingSubscribers: number
  totalMentions: number
  recruitMarkets: MarketCluster[]
  coveredMarkets: MarketCluster[]
  invisibleCount: number
}

export interface LookupResult {
  id: string
  first_name: string | null
  last_name: string | null
  clinic_name: string | null
  slug: string | null
  city: string | null
  state: string | null
  verification_status: string
  membership_tier: string | null
  distance_miles: number
  instagram_handle: string | null
  has_photo: boolean
  has_booking: boolean
  has_hours: boolean
  intro_count: number
}

// ── All US states ──

const ALL_US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
  'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT',
  'VT','VA','WA','WV','WI','WY'
]

// ── Data fetchers ──

export async function getCoverageDoctors(): Promise<CoverageDoctor[]> {
  await checkAdminAuth()
  const supabase = createAdminClient()

  const { data, error } = await (supabase as any)
    .from('doctors')
    .select('id, first_name, last_name, clinic_name, slug, city, state, latitude, longitude, verification_status, membership_tier, created_at, country, address, is_test')
    .in('verification_status', ['verified', 'pending'])
    .eq('is_test', false)
    .order('last_name')

  if (error || !data) return []

  return data.map((d: any) => {
    const lat = d.latitude
    const lng = d.longitude
    const isInvisible = lat == null || lng == null || (lat === 0 && lng === 0)
    const missingCountry = d.country == null || d.country === ''

    // Normalize country to ISO code — but flag the null so admin can fix it
    const normalizedCountry = (!d.country || d.country === 'United States' || d.country === 'USA') ? 'US' : d.country

    return {
      ...d,
      country: normalizedCountry,
      missing_country: missingCountry,
      pin_status: isInvisible ? 'invisible' as const
        : d.verification_status === 'verified' ? 'verified' as const
        : 'pending' as const,
    } as CoverageDoctor
  })
}

export async function getDemandData(): Promise<DemandZip[]> {
  await checkAdminAuth()
  const supabase = createAdminClient()

  // Get US subscribers with ZIPs (confirmed + pending)
  const { data: subscribers } = await (supabase as any)
    .from('subscribers')
    .select('zip, status')
    .in('status', ['confirmed', 'pending'])
    .not('zip', 'is', null)
    .or('country.eq.US,country.is.null')

  if (!subscribers || subscribers.length === 0) return []

  // Count by ZIP, split by status
  const confirmedCounts = new Map<string, number>()
  const pendingCounts = new Map<string, number>()
  for (const s of subscribers) {
    const z = (s.zip || '').trim().slice(0, 5)
    if (z.length === 5 && /^\d{5}$/.test(z)) {
      if (s.status === 'confirmed') confirmedCounts.set(z, (confirmedCounts.get(z) || 0) + 1)
      else pendingCounts.set(z, (pendingCounts.get(z) || 0) + 1)
    }
  }

  // All unique ZIPs
  const allZips = new Set([...confirmedCounts.keys(), ...pendingCounts.keys()])
  if (allZips.size === 0) return []

  // Look up coordinates for each ZIP (filter by US country)
  const zipList = Array.from(allZips)
  const { data: zipCoords } = await (supabase as any)
    .from('zip_codes')
    .select('zip, city, state, lat, lng')
    .eq('country', 'US')
    .in('zip', zipList)

  if (!zipCoords) return []

  // Get all US doctors with valid coords for gap detection
  const { data: doctors } = await supabase
    .from('doctors')
    .select('latitude, longitude')
    .in('verification_status', ['verified', 'pending'])
    .or('country.is.null,country.eq.US')
    .not('latitude', 'eq', 0)
    .not('longitude', 'eq', 0)

  const validDoctors = (doctors || []).filter(d =>
    d.latitude != null && d.longitude != null && d.latitude !== 0 && d.longitude !== 0
  )

  return zipCoords.map((z: any) => {
    const confirmed = confirmedCounts.get(z.zip) || 0
    const pending = pendingCounts.get(z.zip) || 0
    const lat = Number(z.lat)
    const lng = Number(z.lng)

    const hasNearbyDoctor = validDoctors.some(d =>
      haversineDistance(lat, lng, d.latitude!, d.longitude!) <= 50
    )

    return {
      zip: z.zip,
      city: z.city || '',
      state: z.state || '',
      lat,
      lng,
      confirmed,
      pending,
      gap: !hasNearbyDoctor,
    }
  })
}

export async function getCoverageStats(): Promise<CoverageStats> {
  await checkAdminAuth()
  const supabase = createAdminClient()

  // Doctor counts
  const { data: allDocs } = await supabase
    .from('doctors')
    .select('verification_status, state, country, latitude, longitude, address')
    .in('verification_status', ['verified', 'pending'])

  const docs = allDocs || []
  const usDocs = docs.filter(d => !d.country || d.country === 'US')
  const intlDocs = docs.filter(d => d.country && d.country !== 'US')

  const verified = usDocs.filter(d => d.verification_status === 'verified' && d.latitude && d.longitude && d.latitude !== 0 && d.longitude !== 0).length
  const pending = usDocs.filter(d => d.verification_status === 'pending').length
  const invisible = usDocs.filter(d => d.latitude == null || d.longitude == null || (d.latitude === 0 && d.longitude === 0)).length

  // States covered
  const coveredStates = new Set<string>()
  for (const d of usDocs) {
    if (d.state && d.latitude && d.longitude && d.latitude !== 0) {
      coveredStates.add(d.state.toUpperCase())
    }
  }
  const statesWithDoctor = ALL_US_STATES.filter(s => coveredStates.has(s))
  const statesWithout = ALL_US_STATES.filter(s => !coveredStates.has(s))

  // Subscriber counts
  const { data: subs } = await (supabase as any)
    .from('subscribers')
    .select('zip, status')

  const confirmedSubs = (subs || []).filter((s: any) => s.status === 'confirmed')
  const pendingSubs = (subs || []).filter((s: any) => s.status === 'pending')

  // Mentions count
  const mentionsData = await getMentionsData()
  const totalMentions = mentionsData.reduce((sum, m) => sum + m.count, 0)

  // Build ALL demand points (subscribers + mentions) with coords and gap status
  const demandData = await getDemandData()

  type DemandPoint = { city: string; state: string; lat: number; lng: number; waitlist: number; mentions: number; hasDoctor: boolean }
  const demandPoints = new Map<string, DemandPoint>()

  for (const d of demandData) {
    const key = `${d.city}|${d.state}`
    const existing = demandPoints.get(key) || { city: d.city, state: d.state, lat: d.lat, lng: d.lng, waitlist: 0, mentions: 0, hasDoctor: !d.gap }
    existing.waitlist += d.confirmed + d.pending
    demandPoints.set(key, existing)
  }

  for (const m of mentionsData) {
    const key = `${m.city}|${m.state}`
    const existing = demandPoints.get(key) || { city: m.city, state: m.state, lat: m.lat, lng: m.lng, waitlist: 0, mentions: 0, hasDoctor: !m.gap }
    existing.mentions += m.count
    demandPoints.set(key, existing)
  }

  // Fetch leads
  const { data: leadsData } = await (supabase as any).from('market_leads').select('city, state, note')
  const leadsByCityState = new Map<string, string[]>()
  for (const l of (leadsData || [])) {
    const key = `${l.city}|${l.state}`
    const arr = leadsByCityState.get(key) || []
    arr.push(l.note)
    leadsByCityState.set(key, arr)
  }

  // Cluster cities within 50mi of each other
  const points = Array.from(demandPoints.values())
    .filter(p => (p.waitlist + p.mentions) >= 1)
    .sort((a, b) => (b.waitlist + b.mentions) - (a.waitlist + a.mentions))

  const clusters: { center: DemandPoint; members: DemandPoint[] }[] = []
  const assigned = new Set<string>()

  for (const p of points) {
    const key = `${p.city}|${p.state}`
    if (assigned.has(key)) continue

    // Start new cluster
    const cluster = { center: p, members: [p] }
    assigned.add(key)

    // Pull in nearby unassigned points
    for (const q of points) {
      const qKey = `${q.city}|${q.state}`
      if (assigned.has(qKey)) continue
      if (haversineDistance(p.lat, p.lng, q.lat, q.lng) <= 50) {
        cluster.members.push(q)
        assigned.add(qKey)
      }
    }
    clusters.push(cluster)
  }

  // Convert clusters to MarketCluster
  function buildMarket(cluster: { center: DemandPoint; members: DemandPoint[] }): MarketCluster {
    const waitlist = cluster.members.reduce((s, m) => s + m.waitlist, 0)
    const mentions = cluster.members.reduce((s, m) => s + m.mentions, 0)
    const cities = cluster.members.map(m => `${m.city}, ${m.state}`)
    const hasDoctor = cluster.members.some(m => m.hasDoctor)

    // Collect leads for all cities in cluster
    const leads: string[] = []
    for (const m of cluster.members) {
      const cityLeads = leadsByCityState.get(`${m.city}|${m.state}`)
      if (cityLeads) leads.push(...cityLeads)
    }

    // Name: if single city, use "City, ST". If multi, use largest city name + "area"
    const name = cluster.members.length === 1
      ? `${cluster.center.city}, ${cluster.center.state}`
      : `${cluster.center.city} area`

    return { name, cities, waitlist, mentions, total: waitlist + mentions, leads, hasDoctor }
  }

  const allMarkets = clusters.map(buildMarket).sort((a, b) => b.total - a.total)
  const recruitMarkets = allMarkets.filter(m => !m.hasDoctor).slice(0, 15)
  const coveredMarkets = allMarkets.filter(m => m.hasDoctor).slice(0, 15)

  return {
    verified,
    pending,
    invisible,
    internationalCount: intlDocs.length,
    statesWithDoctor,
    statesWithout,
    confirmedSubscribers: confirmedSubs.length,
    pendingSubscribers: pendingSubs.length,
    totalMentions,
    recruitMarkets,
    coveredMarkets,
    invisibleCount: invisible,
  }
}

export async function lookupNearby(query: string, country: string = 'US'): Promise<{
  doctors: LookupResult[];
  label: string;
  ambiguous?: { city: string; state: string }[];
  detectedCountry?: string;
  confidence?: 'exact' | 'dominant' | 'ambiguous' | 'approximate';
  rejectedCandidates?: { city: string; state: string }[];
  couldNotResolve?: boolean;
  resolvedCity?: string;
  resolvedState?: string;
  resolvedLat?: number;
  resolvedLng?: number;
}> {
  await checkAdminAuth()
  const supabase = createAdminClient()

  // Auto-detect country from postal format
  const { detectPostalCode } = await import('@/lib/detect-postal')
  const postalDetection = detectPostalCode(query.trim(), country)
  const resolveCountry = postalDetection?.country || country

  // Resolve query using the shared resolver, scoped to the correct country
  const { resolveLocation } = await import('@/lib/resolve-city')
  const resolution = await resolveLocation(query, resolveCountry)

  const countryOverride = postalDetection && postalDetection.country !== country
    ? postalDetection.country : undefined

  if (resolution.ambiguous) {
    return {
      doctors: [],
      label: resolution.label,
      ambiguous: resolution.ambiguous.map(v => ({ city: v.city, state: v.state })),
      detectedCountry: countryOverride,
      confidence: 'ambiguous',
    }
  }

  // Dominant match — resolved with note
  if (resolution.confidence === 'dominant' && resolution.rejectedCandidates) {
    // Fall through to normal doctor lookup, but pass confidence
  }

  if (!resolution.resolved) {
    // Could not geocode — if we have a state, show all doctors in that state as fallback
    if (resolution.couldNotGeocode && resolution.parsedState) {
      const { data: stateDocs } = await (supabase as any)
        .from('doctors')
        .select('id, first_name, last_name, clinic_name, slug, city, state, latitude, longitude, verification_status, membership_tier, instagram_url, photo_url, booking_url, hours')
        .in('verification_status', ['verified', 'pending'])
        .eq('is_test', false)
        .eq('state', resolution.parsedState)

      if (stateDocs && stateDocs.length > 0) {
        const results: LookupResult[] = stateDocs
          .filter((d: any) => d.latitude && d.longitude && d.latitude !== 0)
          .map((d: any) => {
            let instagram_handle: string | null = null
            if (d.instagram_url) {
              const match = d.instagram_url.match(/instagram\.com\/([^/?]+)/)
              if (match) instagram_handle = '@' + match[1].replace(/\/$/, '')
            }
            return {
              id: d.id, first_name: d.first_name, last_name: d.last_name, clinic_name: d.clinic_name,
              slug: d.slug, city: d.city, state: d.state, verification_status: d.verification_status,
              membership_tier: d.membership_tier, distance_miles: 0, instagram_handle,
              has_photo: !!d.photo_url, has_booking: !!d.booking_url, has_hours: !!d.hours, intro_count: 0,
            }
          })

        return {
          doctors: results,
          label: `Couldn't geocode "${query}". Showing all doctors in ${resolution.parsedState}:`,
        }
      }
    }
    return { doctors: [], label: resolution.label || `Could not resolve "${query}"`, couldNotResolve: true }
  }

  const lat = resolution.resolved.lat
  const lng = resolution.resolved.lng
  const label = resolution.label

  // Fetch doctors for the resolved country (exclude test accounts)
  let docQuery = (supabase as any)
    .from('doctors')
    .select('id, first_name, last_name, clinic_name, slug, city, state, latitude, longitude, verification_status, membership_tier, instagram_url, photo_url, booking_url, hours')
    .in('verification_status', ['verified', 'pending'])
    .eq('is_test', false)
  if (resolveCountry === 'US') {
    docQuery = docQuery.or('country.is.null,country.eq.US')
  } else {
    docQuery = docQuery.eq('country', resolveCountry)
  }
  const { data: doctors } = await docQuery

  if (!doctors) return { doctors: [], label }

  // Fetch intro counts — only deliberate "Sent" clicks, not every copy action
  const doctorIds = doctors.filter((d: any) => d.latitude && d.longitude && d.latitude !== 0).map((d: any) => d.id)
  const { data: introData } = await (supabase as any)
    .from('reply_logs')
    .select('doctor_id')
    .eq('template_id', 'sent_to_patient')
    .in('doctor_id', doctorIds.length > 0 ? doctorIds : ['__none__'])

  const introCounts = new Map<string, number>()
  for (const r of (introData || [])) {
    introCounts.set(r.doctor_id, (introCounts.get(r.doctor_id) || 0) + 1)
  }

  // Calculate distances, filter to 100mi
  const results: LookupResult[] = []
  for (const d of doctors) {
    if (!d.latitude || !d.longitude || d.latitude === 0) continue
    const dist = haversineDistance(lat, lng, d.latitude, d.longitude)
    if (dist <= 100) {
      // Extract @handle from instagram URL
      let instagram_handle: string | null = null
      if (d.instagram_url) {
        const match = d.instagram_url.match(/instagram\.com\/([^/?]+)/)
        if (match) instagram_handle = '@' + match[1].replace(/\/$/, '')
      }

      results.push({
        id: d.id,
        first_name: d.first_name,
        last_name: d.last_name,
        clinic_name: d.clinic_name,
        slug: d.slug,
        city: d.city,
        state: d.state,
        verification_status: d.verification_status,
        membership_tier: d.membership_tier,
        distance_miles: Math.round(dist * 10) / 10,
        instagram_handle,
        has_photo: !!d.photo_url,
        has_booking: !!d.booking_url,
        has_hours: !!d.hours,
        intro_count: introCounts.get(d.id) || 0,
      })
    }
  }

  results.sort((a, b) => a.distance_miles - b.distance_miles)
  return {
    doctors: results,
    label,
    confidence: resolution.confidence || 'exact',
    rejectedCandidates: resolution.rejectedCandidates?.map(v => ({ city: v.city, state: v.state })),
    resolvedCity: resolution.resolved?.city,
    resolvedState: resolution.resolved?.state,
    resolvedLat: resolution.resolved?.lat,
    resolvedLng: resolution.resolved?.lng,
  }
}

// ── Auto-log demand from coverage search ──

export async function autoLogDemand(data: {
  city: string; state: string; lat: number; lng: number; country: string;
  nearestDoctorId?: string; nearestDoctorName?: string; nearestDistanceMi?: number;
  doctorCount: number;
}): Promise<{ logged: boolean; id?: string; reason?: string }> {
  const user = await checkAdminAuth()
  const supabase = createAdminClient()

  // Load config
  const { data: configRow } = await (supabase as any).from('platform_settings').select('value').eq('key', 'coverage_auto_log').single()
  const config = configRow?.value || { enabled: true, distance_threshold_miles: 20, dedupe_minutes: 10 }
  if (!config.enabled) return { logged: false, reason: 'Auto-log disabled' }

  const threshold = config.distance_threshold_miles || 20
  const dedupeMinutes = config.dedupe_minutes || 10

  // Determine if this qualifies
  const noDoctor = data.doctorCount === 0
  const tooFar = data.nearestDistanceMi !== undefined && data.nearestDistanceMi > threshold
  if (!noDoctor && !tooFar) return { logged: false, reason: `Nearest doctor within ${threshold}mi` }

  // Dedupe: check for same city+state from ANY source within 24 hours
  // This prevents double counting when someone comments a city and then I search it
  const cutoff24h = new Date(Date.now() - 24 * 60 * 60000).toISOString()
  const { data: dupes } = await (supabase as any)
    .from('demand_mentions')
    .select('id, source')
    .ilike('city', data.city)
    .eq('state', data.state)
    .gte('created_at', cutoff24h)
    .limit(1)
  if (dupes && dupes.length > 0) {
    return { logged: false, reason: `${data.city}, ${data.state} already logged within 24h (source: ${dupes[0].source})` }
  }

  const status = noDoctor ? 'uncovered' : 'underserved'

  const { data: inserted, error } = await (supabase as any)
    .from('demand_mentions')
    .insert({
      city: data.city,
      state: data.state,
      lat: data.lat,
      lng: data.lng,
      country: data.country || 'US',
      source: 'coverage_search',
      mentioned_on: new Date().toISOString().slice(0, 10),
      status,
      operator: user.id,
      nearest_doctor_id: data.nearestDoctorId || null,
      nearest_distance_mi: data.nearestDistanceMi != null ? Math.round(data.nearestDistanceMi * 10) / 10 : null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[AUTO-LOG] Insert error:', error)
    return { logged: false, reason: error.message }
  }

  revalidatePath('/admin/coverage')
  return { logged: true, id: inserted.id, reason: status === 'uncovered'
    ? `${data.city}, ${data.state}: no doctor found`
    : `${data.city}, ${data.state}: nearest doctor ${Math.round(data.nearestDistanceMi!)}mi away`
  }
}

export async function undoAutoLogDemand(id: string): Promise<{ success: boolean }> {
  const user = await checkAdminAuth()
  const supabase = createAdminClient()

  // Only delete if it was created by coverage_search and by this operator
  const { error } = await (supabase as any)
    .from('demand_mentions')
    .delete()
    .eq('id', id)
    .eq('source', 'coverage_search')
    .eq('operator', user.id)

  if (error) return { success: false }
  revalidatePath('/admin/coverage')
  return { success: true }
}

// ── Mentions ──

export async function getMentionsData(): Promise<MentionCity[]> {
  await checkAdminAuth()
  const supabase = createAdminClient()

  const { data: mentions } = await (supabase as any)
    .from('demand_mentions')
    .select('city, state, lat, lng, country')

  if (!mentions || mentions.length === 0) return []

  // Aggregate by city+state
  const cityMap = new Map<string, { city: string; state: string; lat: number; lng: number; count: number; country: string }>()
  for (const m of mentions) {
    const key = `${m.city}|${m.state}`
    const existing = cityMap.get(key)
    if (existing) {
      existing.count++
    } else {
      cityMap.set(key, { city: m.city, state: m.state, lat: Number(m.lat), lng: Number(m.lng), count: 1, country: m.country || 'US' })
    }
  }

  // Gap detection
  const { data: doctors } = await supabase
    .from('doctors')
    .select('latitude, longitude')
    .in('verification_status', ['verified', 'pending'])
    .or('country.is.null,country.eq.US')
    .not('latitude', 'eq', 0)
    .not('longitude', 'eq', 0)

  const validDoctors = (doctors || []).filter(d =>
    d.latitude != null && d.longitude != null && d.latitude !== 0 && d.longitude !== 0
  )

  return Array.from(cityMap.values()).map(m => ({
    ...m,
    gap: !validDoctors.some(d => haversineDistance(m.lat, m.lng, d.latitude!, d.longitude!) <= 50),
  }))
}

export interface DemandDot {
  lat: number
  lng: number
  city: string
  state: string
  country: string
  cityCount: number // how many requests in this city
}

/**
 * Returns individual demand dots with deterministic jitter for the scatter layer.
 * Each demand_mentions row becomes one dot, jittered within a configurable radius
 * of the city center using the row's UUID as a seed.
 */
export async function getDemandScatterData(): Promise<DemandDot[]> {
  await checkAdminAuth()
  const supabase = createAdminClient()

  // Get jitter config
  const { data: configRow } = await (supabase as any)
    .from('platform_settings').select('value').eq('key', 'demand_scatter').single()
  const jitterMiles = configRow?.value?.jitter_radius_miles || 4

  const { data: rows } = await (supabase as any)
    .from('demand_mentions')
    .select('id, city, state, lat, lng, country')

  if (!rows?.length) return []

  // Count per city for sizing
  const cityCountMap = new Map<string, number>()
  for (const r of rows) {
    const key = `${r.city}|${r.state}|${r.country || 'US'}`
    cityCountMap.set(key, (cityCountMap.get(key) || 0) + 1)
  }

  // Convert jitter miles to approximate degrees (1 degree lat ≈ 69 miles)
  const jitterDeg = jitterMiles / 69

  return rows.map((r: any) => {
    const key = `${r.city}|${r.state}|${r.country || 'US'}`
    const cityCount = cityCountMap.get(key) || 1

    // Deterministic jitter from UUID
    // Use the first 8 hex chars of the UUID as two seeds
    const id = r.id as string
    const seed1 = parseInt(id.substring(0, 8), 16)
    const seed2 = parseInt(id.substring(9, 17).replace('-', ''), 16)

    // Map to [-1, 1] range deterministically
    const angle = (seed1 / 0xFFFFFFFF) * 2 * Math.PI
    const radius = Math.sqrt(seed2 / 0xFFFFFFFF) * jitterDeg // sqrt for uniform distribution within circle

    const jitteredLat = Number(r.lat) + radius * Math.cos(angle)
    const jitteredLng = Number(r.lng) + radius * Math.sin(angle) / Math.cos(Number(r.lat) * Math.PI / 180) // correct for longitude compression

    return {
      lat: Math.round(jitteredLat * 1000) / 1000,
      lng: Math.round(jitteredLng * 1000) / 1000,
      city: r.city || '',
      state: r.state || '',
      country: r.country || 'US',
      cityCount,
    }
  })
}

export interface ParsedMention {
  input: string
  city: string | null
  state: string | null
  lat: number | null
  lng: number | null
  matched: boolean
  country?: string
  commenter_handle?: string | null
}

export async function parseMentionsBatch(lines: string[], country: string = 'US'): Promise<ParsedMention[]> {
  await checkAdminAuth()
  const { resolveStateCode } = await import('@/lib/resolve-state')
  const { detectPostalCode } = await import('@/lib/detect-postal')
  const { resolveLocation } = await import('@/lib/resolve-city')
  const supabase = createAdminClient()

  // Country name → ISO code map for auto-detection from input like "Sydney, Australia"
  const COUNTRY_NAMES: Record<string, string> = {
    'australia': 'AU', 'aus': 'AU',
    'canada': 'CA', 'can': 'CA',
    'united kingdom': 'GB', 'uk': 'GB', 'england': 'GB', 'scotland': 'GB', 'wales': 'GB',
    'new zealand': 'NZ', 'nz': 'NZ',
    'united states': 'US', 'usa': 'US', 'us': 'US',
    'germany': 'DE', 'deutschland': 'DE',
    'ireland': 'IE', 'france': 'FR', 'italy': 'IT', 'spain': 'ES',
    'netherlands': 'NL', 'holland': 'NL', 'sweden': 'SE', 'norway': 'NO', 'denmark': 'DK',
    'south africa': 'ZA', 'nigeria': 'NG', 'singapore': 'SG', 'japan': 'JP',
    'india': 'IN', 'brazil': 'BR', 'mexico': 'MX',
    'switzerland': 'CH', 'trinidad': 'TT', 'trinidad and tobago': 'TT',
  }

  const results: ParsedMention[] = []

  for (const raw of lines) {
    let line = raw.trim()
    if (!line) continue

    // Extract optional @handle from start or end of line
    let commenterHandle: string | null = null
    const handleMatch = line.match(/^(@\w[\w.]*)\s+(.+)$/) || line.match(/^(.+)\s+(@\w[\w.]*)$/)
    if (handleMatch) {
      const [, part1, part2] = handleMatch
      if (part1.startsWith('@')) { commenterHandle = part1; line = part2.trim() }
      else if (part2.startsWith('@')) { commenterHandle = part2; line = part1.trim() }
    }

    // Step 0: Detect country name in input (e.g. "Sydney, Australia" → country=AU, city="Sydney")
    let effectiveCountry = country
    let effectiveLine = line
    if (line.includes(',')) {
      const lastPart = line.split(',').pop()!.trim().toLowerCase()
      const detected = COUNTRY_NAMES[lastPart]
      if (detected) {
        effectiveCountry = detected
        effectiveLine = line.split(',').slice(0, -1).join(',').trim()
      }
    }

    // Step 1: Check if the input is a postal/ZIP code
    const postal = detectPostalCode(effectiveLine, effectiveCountry)
    if (postal) {
      const res = await resolveLocation(postal.code, postal.country)
      if (res.resolved) {
        results.push({
          input: line,
          city: res.resolved.city,
          state: res.resolved.state,
          lat: res.resolved.lat,
          lng: res.resolved.lng,
          matched: true,
          country: postal.country,
          commenter_handle: commenterHandle,
        })
      } else {
        results.push({ input: line, city: null, state: null, lat: null, lng: null, matched: false, commenter_handle: commenterHandle })
      }
      continue
    }

    // Step 2: Try resolveLocation for any free-text input (handles "city, state", bare city, international)
    const res = await resolveLocation(effectiveLine, effectiveCountry)
    if (res.resolved) {
      results.push({
        input: line,
        city: res.resolved.city,
        state: res.resolved.state,
        lat: res.resolved.lat,
        lng: res.resolved.lng,
        matched: true,
        country: effectiveCountry,
        commenter_handle: commenterHandle,
      })
      continue
    }

    // Step 3: Legacy city/state parsing as fallback
    let city = ''
    let stateInput = ''

    if (effectiveLine.includes(',')) {
      const parts = effectiveLine.split(',').map(p => p.trim())
      city = parts[0]
      stateInput = parts.slice(1).join(' ').trim()
    } else {
      const tokens = effectiveLine.split(/\s+/)
      if (tokens.length >= 2) {
        const lastTwo = tokens.slice(-2).join(' ')
        const lastTwoCode = resolveStateCode(lastTwo)
        if (lastTwoCode && tokens.length > 2) {
          city = tokens.slice(0, -2).join(' ')
          stateInput = lastTwo
        } else {
          stateInput = tokens[tokens.length - 1]
          city = tokens.slice(0, -1).join(' ')
        }
      } else {
        city = line
      }
    }

    const stateCode = resolveStateCode(stateInput)
    if (!stateCode || !city) {
      results.push({ input: line, city: null, state: null, lat: null, lng: null, matched: false, commenter_handle: commenterHandle })
      continue
    }

    city = city.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())

    const { data } = await (supabase as any)
      .from('zip_codes')
      .select('city, state, lat, lng')
      .ilike('city', city)
      .eq('state', stateCode)
      .eq('country', effectiveCountry)
      .limit(1)

    if (data && data.length > 0) {
      results.push({
        input: line,
        city: data[0].city,
        state: data[0].state,
        lat: Number(data[0].lat),
        lng: Number(data[0].lng),
        matched: true,
        country: effectiveCountry,
        commenter_handle: commenterHandle,
      })
    } else {
      results.push({ input: line, city, state: stateCode, lat: null, lng: null, matched: false, commenter_handle: commenterHandle })
    }
  }

  return results
}

export async function saveMentionsBatch(
  mentions: { city: string; state: string; lat: number; lng: number; country?: string; commenter_handle?: string | null }[],
  postRef: string,
  mentionedOn: string,
  country: string = 'US',
): Promise<{ saved: number; error?: string }> {
  await checkAdminAuth()
  const supabase = createAdminClient()

  const rows = mentions.map(m => ({
    city: m.city,
    state: m.state,
    lat: m.lat,
    lng: m.lng,
    country: m.country || country,
    source: 'instagram_comment',
    post_ref: postRef || null,
    mentioned_on: mentionedOn || null,
    commenter_handle: m.commenter_handle || null,
  }))

  const { error } = await (supabase as any).from('demand_mentions').insert(rows)
  if (error) {
    console.error('[MENTIONS] Insert error:', error)
    return { saved: 0, error: error.message }
  }

  revalidatePath('/admin/coverage')
  return { saved: rows.length }
}

// ── Market Leads ──

export async function addMarketLead(city: string, state: string, note: string): Promise<{ ok: boolean; error?: string }> {
  await checkAdminAuth()
  const supabase = createAdminClient()

  const { error } = await (supabase as any).from('market_leads').insert({ city, state, note })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function removeMarketLead(id: string): Promise<{ ok: boolean }> {
  await checkAdminAuth()
  const supabase = createAdminClient()

  await (supabase as any).from('market_leads').delete().eq('id', id)
  return { ok: true }
}

// ── Referrals ──

// recordReferral removed — consolidated into logReply with template_id='sent_to_patient'

// ── Reply Templates ──

export interface ReplyTemplate {
  id: string
  label: string
  body: string
  variables: string[]
}

export async function getReplyTemplates(): Promise<ReplyTemplate[]> {
  await checkAdminAuth()
  const supabase = createAdminClient()
  const { data } = await (supabase as any).from('reply_templates').select('id, label, body, variables').order('id')
  return data || []
}

export async function updateReplyTemplate(id: string, body: string): Promise<{ ok: boolean; error?: string }> {
  await checkAdminAuth()
  const supabase = createAdminClient()

  // Get allowed variables for this template
  const { data: existing } = await (supabase as any).from('reply_templates').select('variables').eq('id', id).single()
  if (!existing) return { ok: false, error: 'Template not found' }

  // Validate: check for variables used in body that aren't in the allowed list
  const usedVars = (body.match(/\{(\w+)\}/g) || []).map((v: string) => v.slice(1, -1))
  const allowed = new Set(existing.variables)
  const invalid = usedVars.filter((v: string) => !allowed.has(v))
  if (invalid.length > 0) {
    return { ok: false, error: `Unknown variables: {${invalid.join('}, {')}}. Available: {${existing.variables.join('}, {')}}` }
  }

  const { error } = await (supabase as any).from('reply_templates')
    .update({ body, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/**
 * Select the best variant for a template using LRU rotation.
 * Picks the active variant least recently used by this operator
 * within the last N copies (default 10).
 *
 * source: 'reply' queries reply_template_variants via reply_template_id FK and reply_logs.
 *         'outreach' queries via outreach_template_key FK and outreach_logs.
 */
export async function selectVariant(
  templateId: string,
  excludeKey?: string,
  source: 'reply' | 'outreach' = 'reply',
  availableVars?: Record<string, string>,
): Promise<{ variant_key: string; body: string } | null> {
  const user = await checkAdminAuth()
  const supabase = createAdminClient()

  // Get all active variants for this template, using the correct FK column
  const fkColumn = source === 'reply' ? 'reply_template_id' : 'outreach_template_key'
  const { data: variants } = await (supabase as any)
    .from('reply_template_variants')
    .select('variant_key, body, required_variables')
    .eq(fkColumn, templateId)
    .eq('variant_source', source)
    .eq('active', true)
    .order('variant_key')

  if (!variants?.length) return null

  // Filter: exclude the reshuffle key, then exclude variants whose required_variables cannot resolve
  let eligible = excludeKey
    ? variants.filter((v: any) => v.variant_key !== excludeKey)
    : [...variants]

  if (availableVars) {
    eligible = eligible.filter((v: any) => {
      const reqVars: string[] = v.required_variables || []
      return reqVars.every((rv: string) => {
        const val = availableVars[rv]
        return val !== undefined && val !== null && val !== '' && val !== '0'
      })
    })
  }

  if (!eligible.length) {
    // All variants blocked. Fall back to any variant with no required_variables.
    const fallbacks = variants.filter((v: any) => !v.required_variables?.length)
    return fallbacks[0] || variants[0]
  }

  // Get the last 10 copies by this operator from the correct log table
  let recentLogs: any[] = []
  if (source === 'reply') {
    const { data } = await (supabase as any)
      .from('reply_logs')
      .select('variant_key')
      .eq('template_id', templateId)
      .eq('operator', user.id)
      .not('variant_key', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10)
    recentLogs = data || []
  } else {
    const { data } = await (supabase as any)
      .from('outreach_logs')
      .select('variant_key')
      .eq('template_key', templateId)
      .eq('operator', user.id)
      .not('variant_key', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10)
    recentLogs = data || []
  }

  const recentKeys = (recentLogs || []).map((l: any) => l.variant_key)

  // Pick the variant that appears least recently (or not at all) in the recent window
  // Variants not in the window are preferred. Among those in the window, pick the one
  // that appeared earliest (least recently).
  const notRecent = eligible.filter((v: any) => !recentKeys.includes(v.variant_key))
  if (notRecent.length > 0) {
    // Among those not recently used, pick one (first alphabetically for determinism)
    return notRecent[0]
  }

  // All variants have been used recently. Pick the one whose most recent use is oldest.
  // recentKeys[0] is most recent. indexOf gives the first (most recent) position.
  // Higher indexOf = used longer ago. We want the highest indexOf.
  const oldest = eligible.sort((a: any, b: any) => {
    const aIdx = recentKeys.indexOf(a.variant_key)
    const bIdx = recentKeys.indexOf(b.variant_key)
    return bIdx - aIdx
  })
  return oldest[0]
}

export async function logReply(
  templateId: string,
  searchedCity: string,
  searchedState?: string,
  doctorId?: string,
  demandMentionId?: string,
  variantKey?: string,
): Promise<{ ok: boolean }> {
  const user = await checkAdminAuth()
  const supabase = createAdminClient()

  await (supabase as any).from('reply_logs').insert({
    template_id: templateId,
    searched_city: searchedCity,
    searched_state: searchedState || null,
    doctor_id: doctorId || null,
    operator: user.id,
    demand_mention_id: demandMentionId || null,
    variant_key: variantKey || null,
  })

  return { ok: true }
}

export async function getFarDistanceThreshold(): Promise<number> {
  await checkAdminAuth()
  const supabase = createAdminClient()
  const { data } = await (supabase as any)
    .from('platform_settings')
    .select('value')
    .eq('key', 'far_distance_threshold')
    .maybeSingle()
  return data?.value?.miles ?? 30
}

export async function updateFarDistanceThreshold(miles: number): Promise<void> {
  await checkAdminAuth()
  const supabase = createAdminClient()
  await (supabase as any)
    .from('platform_settings')
    .upsert({ key: 'far_distance_threshold', value: { miles }, updated_at: new Date().toISOString() })
}

export async function getSentDoctorIds(): Promise<string[]> {
  await checkAdminAuth()
  const supabase = createAdminClient()
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await (supabase as any)
    .from('reply_logs')
    .select('doctor_id')
    .eq('template_id', 'sent_to_patient')
    .gte('created_at', since)
    .not('doctor_id', 'is', null)
  return [...new Set((data || []).map((r: any) => r.doctor_id))] as string[]
}

// ── Doctor Outreach (coverage map doctor mode) ──

export interface OutreachScenario {
  key: string
  label: string
  commentKey: string | null
  dmKey: string | null
}

// Scenarios defined in CoverageMapClient.tsx (static data, not a server action)

export async function getOutreachLinks(): Promise<{ calendly_url: string; mastermind_url: string }> {
  await checkAdminAuth()
  const supabase = createAdminClient()
  const { data } = await (supabase as any).from('platform_settings').select('value').eq('key', 'doctor_outreach').single()
  const config = data?.value || {}
  return {
    calendly_url: config.calendly_url || '',
    mastermind_url: config.mastermind_url || '',
  }
}

export async function getDemandCountNearby(lat: number, lng: number, radiusMi: number = 50): Promise<number> {
  await checkAdminAuth()
  const supabase = createAdminClient()

  // Load demand source filter
  const { data: configRow } = await (supabase as any).from('platform_settings').select('value').eq('key', 'doctor_outreach').single()
  const demandSources: string[] = configRow?.value?.demand_sources || ['instagram', 'instagram_comment']

  // Bounding box pre-filter
  const latDeg = radiusMi / 69
  const lngDeg = radiusMi / (69 * Math.cos(lat * Math.PI / 180))

  const { data: mentions } = await (supabase as any)
    .from('demand_mentions')
    .select('lat, lng')
    .in('source', demandSources)
    .gte('lat', lat - latDeg).lte('lat', lat + latDeg)
    .gte('lng', lng - lngDeg).lte('lng', lng + lngDeg)

  let count = 0
  for (const m of (mentions || []) as any[]) {
    if (haversineDistance(lat, lng, Number(m.lat), Number(m.lng)) <= radiusMi) count++
  }
  return count
}

export async function logDoctorOutreachCopy(data: {
  templateKey: string
  channel: string
  intent: string
  scenarioKey: string
  renderedBody: string
  variantKey?: string
  city: string
  state: string
  country: string
  handle: string
  lat?: number
  lng?: number
  prospectType: 'doctor' | 'student'
  demandCount50?: number
}): Promise<{
  ok: boolean
  blocked?: boolean
  reason?: string
  memberName?: string
  memberTier?: string
  prospectId?: string
  existingProspect?: { status: string; lastContactAt: string | null; createdAt: string | null; operatorId: string | null }
}> {
  const user = await checkAdminAuth()
  const supabase = createAdminClient()
  const handleNormalized = data.handle.replace(/^@/, '').toLowerCase()

  // ── Duplicate guard: indexed lookup on instagram_handle_normalized ──
  const { data: memberMatches } = await (supabase as any)
    .from('doctors')
    .select('id, first_name, last_name, slug, membership_tier')
    .eq('instagram_handle_normalized', handleNormalized)
    .limit(1)

  const memberMatch = memberMatches?.[0] || null

  if (memberMatch) {
    const memberName = `Dr. ${memberMatch.first_name || ''} ${memberMatch.last_name || ''}`.trim()
    const tier = memberMatch.membership_tier || 'free'

    if (tier === 'pro') {
      return {
        ok: false,
        blocked: true,
        reason: 'existing_member',
        memberName,
        memberTier: 'pro',
      }
    }

    // Free/hidden tier: not blocked. Fall through to prospect creation with is_existing_member = true.
  }

  // ── Check if handle already exists as a prospect (exact match on normalized handle) ──
  const { data: existingProspect } = await (supabase as any)
    .from('outreach_prospects')
    .select('id, status, next_follow_up_at, created_at')
    .eq('instagram_handle', handleNormalized)
    .limit(1)

  let prospectId: string
  let statusBefore: string

  if (existingProspect && existingProspect.length > 0) {
    // Existing prospect: attach log to them
    prospectId = existingProspect[0].id
    statusBefore = existingProspect[0].status

    // Get last contact info
    const { data: lastLog } = await (supabase as any)
      .from('outreach_logs')
      .select('created_at, operator')
      .eq('prospect_id', prospectId)
      .order('created_at', { ascending: false })
      .limit(1)

    // Write outreach_logs with the real prospect_id
    await (supabase as any).from('outreach_logs').insert({
      prospect_id: prospectId,
      template_key: data.templateKey,
      channel: data.channel,
      intent: data.intent,
      rendered_body: data.renderedBody,
      operator: user.id,
      variant_key: data.variantKey || null,
      status_before: statusBefore,
      status_after: statusBefore,
      demand_snapshot: { city: data.city, state: data.state, demand_50mi: data.demandCount50 ?? null },
    })

    return {
      ok: true,
      prospectId,
      existingProspect: {
        status: statusBefore,
        lastContactAt: lastLog?.[0]?.created_at || null,
        createdAt: existingProspect[0].created_at || null,
        operatorId: lastLog?.[0]?.operator || null,
      },
      ...(memberMatch ? {
        memberName: `Dr. ${memberMatch.first_name || ''} ${memberMatch.last_name || ''}`.trim(),
        memberTier: memberMatch.membership_tier || 'free',
      } : {}),
    }
  }

  // ── New prospect: create record ──

  // Load follow-up config
  const { data: configRow } = await (supabase as any)
    .from('platform_settings').select('value').eq('key', 'doctor_outreach').single()
  const config = configRow?.value || {}
  const followUpDays = config.follow_up_days?.first || 5
  const followUpAt = new Date()
  followUpAt.setDate(followUpAt.getDate() + followUpDays)

  const { data: inserted, error: insertError } = await (supabase as any)
    .from('outreach_prospects')
    .insert({
      name: handleNormalized,
      instagram_handle: handleNormalized,
      city: data.city,
      state: data.state,
      country: data.country || 'US',
      latitude: data.lat ?? null,
      longitude: data.lng ?? null,
      source: data.channel === 'ig_dm' ? 'ig_dm' : 'ig_comment',
      source_detail: data.scenarioKey,
      status: 'contacted',
      prospect_type: data.prospectType,
      has_usable_location: data.lat != null && data.lng != null,
      is_existing_member: memberMatch != null,
      next_follow_up_at: followUpAt.toISOString(),
      contacted_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (insertError) {
    return { ok: false, reason: insertError.message }
  }

  prospectId = inserted.id

  // Write outreach_logs with the real prospect_id
  await (supabase as any).from('outreach_logs').insert({
    prospect_id: prospectId,
    template_key: data.templateKey,
    channel: data.channel,
    intent: data.intent,
    rendered_body: data.renderedBody,
    operator: user.id,
    variant_key: data.variantKey || null,
    status_before: 'new',
    status_after: 'contacted',
    demand_snapshot: { city: data.city, state: data.state, demand_50mi: data.demandCount50 ?? null },
  })

  revalidatePath('/admin/outreach')
  return {
    ok: true,
    prospectId,
    ...(memberMatch ? {
      memberName: `Dr. ${memberMatch.first_name || ''} ${memberMatch.last_name || ''}`.trim(),
      memberTier: memberMatch.membership_tier || 'free',
    } : {}),
  }
}
