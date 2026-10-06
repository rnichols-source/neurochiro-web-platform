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
  }
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

export interface ParsedMention {
  input: string
  city: string | null
  state: string | null
  lat: number | null
  lng: number | null
  matched: boolean
  country?: string
}

export async function parseMentionsBatch(lines: string[], country: string = 'US'): Promise<ParsedMention[]> {
  await checkAdminAuth()
  const { resolveStateCode } = await import('@/lib/resolve-state')
  const { detectPostalCode } = await import('@/lib/detect-postal')
  const { resolveLocation } = await import('@/lib/resolve-city')
  const supabase = createAdminClient()

  const results: ParsedMention[] = []

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    // Step 1: Check if the input is a postal/ZIP code
    const postal = detectPostalCode(line, country)
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
        })
      } else {
        results.push({ input: line, city: null, state: null, lat: null, lng: null, matched: false })
      }
      continue
    }

    // Step 2: Try resolveLocation for any free-text input (handles "city, state", bare city, international)
    const res = await resolveLocation(line, country)
    if (res.resolved) {
      results.push({
        input: line,
        city: res.resolved.city,
        state: res.resolved.state,
        lat: res.resolved.lat,
        lng: res.resolved.lng,
        matched: true,
        country,
      })
      continue
    }

    // Step 3: Legacy city/state parsing as fallback
    let city = ''
    let stateInput = ''

    if (line.includes(',')) {
      const parts = line.split(',').map(p => p.trim())
      city = parts[0]
      stateInput = parts.slice(1).join(' ').trim()
    } else {
      const tokens = line.split(/\s+/)
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
      results.push({ input: line, city: null, state: null, lat: null, lng: null, matched: false })
      continue
    }

    city = city.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())

    const { data } = await (supabase as any)
      .from('zip_codes')
      .select('city, state, lat, lng')
      .ilike('city', city)
      .eq('state', stateCode)
      .eq('country', country)
      .limit(1)

    if (data && data.length > 0) {
      results.push({
        input: line,
        city: data[0].city,
        state: data[0].state,
        lat: Number(data[0].lat),
        lng: Number(data[0].lng),
        matched: true,
        country,
      })
    } else {
      results.push({ input: line, city, state: stateCode, lat: null, lng: null, matched: false })
    }
  }

  return results
}

export async function saveMentionsBatch(
  mentions: { city: string; state: string; lat: number; lng: number; country?: string }[],
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

export async function logReply(
  templateId: string,
  searchedCity: string,
  searchedState?: string,
  doctorId?: string,
  demandMentionId?: string,
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
