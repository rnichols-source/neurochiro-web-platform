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
  count: number
  /** true if no doctor within 50 miles */
  gap: boolean
}

export interface CoverageStats {
  verified: number
  pending: number
  invisible: number
  internationalCount: number
  statesWithDoctor: string[]
  statesWithout: string[]
  totalSubscribers: number
  topGaps: { city: string; state: string; count: number }[]
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

  // Get confirmed subscribers with ZIPs
  const { data: subscribers } = await (supabase as any)
    .from('subscribers')
    .select('zip')
    .eq('status', 'confirmed')
    .not('zip', 'is', null)

  if (!subscribers || subscribers.length === 0) return []

  // Count by ZIP
  const zipCounts = new Map<string, number>()
  for (const s of subscribers) {
    const z = (s.zip || '').trim().slice(0, 5)
    if (z.length === 5 && /^\d{5}$/.test(z)) {
      zipCounts.set(z, (zipCounts.get(z) || 0) + 1)
    }
  }

  if (zipCounts.size === 0) return []

  // Look up coordinates for each ZIP
  const zipList = Array.from(zipCounts.keys())
  const { data: zipCoords } = await (supabase as any)
    .from('zip_codes')
    .select('zip, city, state, lat, lng')
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
    const count = zipCounts.get(z.zip) || 0
    const lat = Number(z.lat)
    const lng = Number(z.lng)

    // Check if any doctor is within 50 miles
    const hasNearbyDoctor = validDoctors.some(d =>
      haversineDistance(lat, lng, d.latitude!, d.longitude!) <= 50
    )

    return {
      zip: z.zip,
      city: z.city || '',
      state: z.state || '',
      lat,
      lng,
      count,
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
  const usDocs = docs.filter(d => !d.country || d.country === 'United States' || d.country === 'US' || d.country === 'USA')
  const intlDocs = docs.filter(d => d.country && d.country !== 'United States' && d.country !== 'US' && d.country !== 'USA')

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
  const totalSubscribers = confirmedSubs.length

  // Top gaps: ZIP areas with subscribers but no doctor within 50mi
  const demandData = await getDemandData()
  const gaps = demandData
    .filter(d => d.gap && d.count >= 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(d => ({ city: d.city, state: d.state, count: d.count }))

  return {
    verified,
    pending,
    invisible,
    internationalCount: intlDocs.length,
    statesWithDoctor,
    statesWithout,
    totalSubscribers,
    topGaps: gaps,
    invisibleCount: invisible,
  }
}

export async function lookupNearby(query: string): Promise<{ doctors: LookupResult[]; label: string }> {
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

    // Try bare city name
    if (!lat) {
      const { data } = await (supabase as any)
        .from('zip_codes')
        .select('city, state, lat, lng')
        .ilike('city', query.trim())
        .limit(1)
      if (data && data.length > 0) {
        lat = Number(data[0].lat)
        lng = Number(data[0].lng)
        label = `Showing doctors near ${data[0].city}, ${data[0].state}`
      }
    }
  }

  if (!lat || !lng) {
    return { doctors: [], label: `Could not resolve "${query}"` }
  }

  // Fetch all US doctors with valid coords
  const { data: doctors } = await supabase
    .from('doctors')
    .select('id, first_name, last_name, clinic_name, slug, city, state, latitude, longitude, verification_status, membership_tier')
    .in('verification_status', ['verified', 'pending'])
    .or('country.is.null,country.eq.US')

  if (!doctors) return { doctors: [], label }

  // Calculate distances, filter to 100mi
  const results: LookupResult[] = []
  for (const d of doctors) {
    if (!d.latitude || !d.longitude || d.latitude === 0) continue
    const dist = haversineDistance(lat, lng, d.latitude, d.longitude)
    if (dist <= 100) {
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
      })
    }
  }

  results.sort((a, b) => a.distance_miles - b.distance_miles)
  return { doctors: results, label }
}
