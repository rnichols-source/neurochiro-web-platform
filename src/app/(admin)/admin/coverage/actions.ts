'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { checkAdminAuth } from '@/lib/admin-auth'
import { haversineDistance } from '@/lib/geo'

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

  const { data, error } = await supabase
    .from('doctors')
    .select('id, first_name, last_name, clinic_name, slug, city, state, latitude, longitude, verification_status, membership_tier, created_at, country, address')
    .in('verification_status', ['verified', 'pending'])
    .order('last_name')

  if (error || !data) return []

  return data.map(d => {
    const isInternational = d.country && d.country !== 'United States' && d.country !== 'US' && d.country !== 'USA'
    if (isInternational) return null // excluded from map, counted separately

    const lat = d.latitude
    const lng = d.longitude
    // Invisible = no usable coordinates (0,0 or null). Doctors with coords but no address
    // have potentially inaccurate city-center coords but are still findable in search.
    const isInvisible = lat == null || lng == null || (lat === 0 && lng === 0)

    return {
      ...d,
      pin_status: isInvisible ? 'invisible' as const
        : d.verification_status === 'verified' ? 'verified' as const
        : 'pending' as const,
    } as CoverageDoctor
  }).filter((d): d is CoverageDoctor => d !== null)
}

export async function getDemandData(): Promise<DemandZip[]> {
  await checkAdminAuth()
  const supabase = createAdminClient()

  // Get ALL subscribers with ZIPs (confirmed + pending)
  const { data: subscribers } = await (supabase as any)
    .from('subscribers')
    .select('zip, status')
    .in('status', ['confirmed', 'pending'])
    .not('zip', 'is', null)

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

export async function lookupNearby(query: string): Promise<{
  doctors: LookupResult[];
  label: string;
  ambiguous?: { city: string; state: string }[];
}> {
  await checkAdminAuth()
  const supabase = createAdminClient()

  // Resolve query to coordinates
  let lat: number | null = null
  let lng: number | null = null
  let label = ''

  // Try ZIP first
  const zipMatch = query.trim().match(/^(\d{5})/)
  if (zipMatch) {
    const { data } = await (supabase as any)
      .from('zip_codes')
      .select('city, state, lat, lng')
      .eq('zip', zipMatch[1])
      .maybeSingle()
    if (data) {
      lat = Number(data.lat)
      lng = Number(data.lng)
      label = `Showing doctors near ${data.city}, ${data.state}`
    }
  }

  // Try city name
  if (!lat) {
    // Try "City, ST" format
    const { resolveStateCode } = await import('@/lib/resolve-state')
    const parts = query.split(',').map(p => p.trim())
    if (parts.length >= 2) {
      const stateCode = resolveStateCode(parts[parts.length - 1])
      if (stateCode) {
        const city = parts.slice(0, -1).join(', ')
        const { data } = await (supabase as any)
          .from('zip_codes')
          .select('city, state, lat, lng')
          .ilike('city', city)
          .eq('state', stateCode)
          .limit(1)
        if (data && data.length > 0) {
          lat = Number(data[0].lat)
          lng = Number(data[0].lng)
          label = `Showing doctors near ${data[0].city}, ${data[0].state}`
        }
      }
    }

    // Try bare city name — check for ambiguity
    if (!lat) {
      const { data } = await (supabase as any)
        .from('zip_codes')
        .select('city, state, lat, lng')
        .ilike('city', query.trim())
        .eq('country', 'US')

      if (data && data.length > 0) {
        // Deduplicate by state
        const byState = new Map<string, { city: string; state: string; lat: number; lng: number }>()
        for (const z of data) {
          if (!byState.has(z.state)) {
            byState.set(z.state, { city: z.city, state: z.state, lat: Number(z.lat), lng: Number(z.lng) })
          }
        }

        if (byState.size === 1) {
          // Unambiguous
          const match = Array.from(byState.values())[0]
          lat = match.lat
          lng = match.lng
          label = `Showing doctors near ${match.city}, ${match.state}`
        } else {
          // Ambiguous — return options instead of guessing
          return {
            doctors: [],
            label: `"${query.trim()}" exists in ${byState.size} states. Pick one:`,
            ambiguous: Array.from(byState.values()).map(v => ({ city: v.city, state: v.state }))
              .sort((a, b) => a.state.localeCompare(b.state)),
          }
        }
      }
    }
  }

  if (!lat || !lng) {
    return { doctors: [], label: `Could not resolve "${query}"` }
  }

  // Fetch all US doctors with valid coords
  const { data: doctors } = await supabase
    .from('doctors')
    .select('id, first_name, last_name, clinic_name, slug, city, state, latitude, longitude, verification_status, membership_tier, instagram_url')
    .in('verification_status', ['verified', 'pending'])
    .or('country.is.null,country.eq.US')

  if (!doctors) return { doctors: [], label }

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
      })
    }
  }

  results.sort((a, b) => a.distance_miles - b.distance_miles)
  return { doctors: results, label }
}

// ── Mentions ──

export async function getMentionsData(): Promise<MentionCity[]> {
  await checkAdminAuth()
  const supabase = createAdminClient()

  const { data: mentions } = await (supabase as any)
    .from('demand_mentions')
    .select('city, state, lat, lng')

  if (!mentions || mentions.length === 0) return []

  // Aggregate by city+state
  const cityMap = new Map<string, { city: string; state: string; lat: number; lng: number; count: number }>()
  for (const m of mentions) {
    const key = `${m.city}|${m.state}`
    const existing = cityMap.get(key)
    if (existing) {
      existing.count++
    } else {
      cityMap.set(key, { city: m.city, state: m.state, lat: Number(m.lat), lng: Number(m.lng), count: 1 })
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

export interface ParsedMention {
  input: string
  city: string | null
  state: string | null
  lat: number | null
  lng: number | null
  matched: boolean
}

export async function parseMentionsBatch(lines: string[]): Promise<ParsedMention[]> {
  await checkAdminAuth()
  const { resolveStateCode } = await import('@/lib/resolve-state')
  const supabase = createAdminClient()

  const results: ParsedMention[] = []

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    // Parse city/state from messy input: "tulsa ok", "Tulsa, Oklahoma", "TULSA OK", "tulsa, ok"
    let city = ''
    let stateInput = ''

    if (line.includes(',')) {
      const parts = line.split(',').map(p => p.trim())
      city = parts[0]
      stateInput = parts.slice(1).join(' ').trim()
    } else {
      // No comma: last token is state
      const tokens = line.split(/\s+/)
      if (tokens.length >= 2) {
        // Check if last 2 tokens form a state name (e.g. "new york")
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
      results.push({ input: line, city: null, state: null, lat: null, lng: null, matched: false })
      continue
    }

    // Normalize city casing
    city = city.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())

    // Look up coords from zip_codes
    const { data } = await (supabase as any)
      .from('zip_codes')
      .select('city, state, lat, lng')
      .ilike('city', city)
      .eq('state', stateCode)
      .eq('country', 'US')
      .limit(1)

    if (data && data.length > 0) {
      results.push({
        input: line,
        city: data[0].city,
        state: data[0].state,
        lat: Number(data[0].lat),
        lng: Number(data[0].lng),
        matched: true,
      })
    } else {
      results.push({ input: line, city, state: stateCode, lat: null, lng: null, matched: false })
    }
  }

  return results
}

export async function saveMentionsBatch(
  mentions: { city: string; state: string; lat: number; lng: number }[],
  postRef: string,
  mentionedOn: string,
): Promise<{ saved: number; error?: string }> {
  await checkAdminAuth()
  const supabase = createAdminClient()

  const rows = mentions.map(m => ({
    city: m.city,
    state: m.state,
    lat: m.lat,
    lng: m.lng,
    source: 'instagram_comment',
    post_ref: postRef || null,
    mentioned_on: mentionedOn || null,
  }))

  const { error } = await (supabase as any).from('demand_mentions').insert(rows)
  if (error) {
    console.error('[MENTIONS] Insert error:', error)
    return { saved: 0, error: error.message }
  }

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

export async function recordReferral(
  doctorId: string,
  searchedCity: string,
  searchedState?: string,
): Promise<{ ok: boolean }> {
  await checkAdminAuth()
  const supabase = createAdminClient()

  await (supabase as any).from('referrals').insert({
    doctor_id: doctorId,
    searched_city: searchedCity,
    searched_state: searchedState || null,
  })

  return { ok: true }
}
