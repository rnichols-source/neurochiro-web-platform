'use server'

import { createAdminClient, fetchAllRows } from '@/lib/supabase-admin'
import { checkAdminAuth } from '@/lib/admin-auth'
import { bustAdminCoverage } from '@/lib/admin/bust-coverage'

export interface InvisibleDoctor {
  id: string
  first_name: string | null
  last_name: string | null
  clinic_name: string | null
  city: string | null
  state: string | null
  address: string | null
  verification_status: string
  membership_tier: string | null
  latitude: number | null
  longitude: number | null
  reason: 'no_address' | 'geocode_failed' | 'zero_coords' | 'missing_coords' | 'address_mismatch'
  mismatchNote?: string
}

/** Extract city from address string for mismatch detection */
function extractCityFromAddress(address: string, state: string): string | null {
  const cleaned = address
    .replace(/,?\s*(Suite|Ste|Unit|Bldg|Building|Apt|#)\s*[\w#-]+/gi, '')
    .replace(/\s+/g, ' ').trim()
  const STATE_CODES = new Set([
    'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN',
    'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
    'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT',
    'VT','VA','WA','WV','WI','WY'
  ])
  const parts = cleaned.split(',').map(p => p.trim()).filter(Boolean)
  if (parts.length < 2) return null
  for (let i = parts.length - 1; i >= 1; i--) {
    const words = parts[i].split(/\s+/)
    const firstWord = words[0]?.toUpperCase()
    if (STATE_CODES.has(firstWord) || firstWord === state?.toUpperCase()) {
      const cityPart = parts[i - 1]?.trim()
      if (cityPart && !/^\d/.test(cityPart)) return cityPart
    }
  }
  return null
}

function isUnitedStates(country: string | null | undefined): boolean {
  if (country == null) return true
  const value = country.trim().toLowerCase().replace(/\./g, '')
  if (!value) return true
  return value === 'us' || value === 'usa' || value === 'united states'
}

type DoctorPinRow = {
  id: string
  first_name: string | null
  last_name: string | null
  clinic_name: string | null
  city: string | null
  state: string | null
  address: string | null
  verification_status: string
  membership_tier: string | null
  latitude: number | null
  longitude: number | null
  country: string | null
}

export async function getInvisibleDoctors(): Promise<InvisibleDoctor[]> {
  await checkAdminAuth()
  const supabase = createAdminClient()

  const data = await fetchAllRows(
    supabase,
    'doctors',
    'id, first_name, last_name, clinic_name, city, state, address, verification_status, membership_tier, latitude, longitude, country',
    (query) => query.in('verification_status', ['verified', 'pending']),
    'last_name',
    true,
  ) as DoctorPinRow[]

  const invisible: InvisibleDoctor[] = []

  for (const d of data) {
    const lat = d.latitude
    const lng = d.longitude
    const missing = lat == null || lng == null
    const zero = lat === 0 && lng === 0
    const isZero = missing || zero

    // US address mismatch still applies when the pin itself is usable.
    if (!isZero && isUnitedStates(d.country) && d.address && d.city) {
      const addrCity = extractCityFromAddress(d.address, d.state || '')
      if (addrCity) {
        const recordCity = d.city.trim().toLowerCase()
        const addrCityLower = addrCity.trim().toLowerCase()
        if (recordCity !== addrCityLower && !recordCity.includes(addrCityLower) && !addrCityLower.includes(recordCity)) {
          invisible.push({
            id: d.id,
            first_name: d.first_name,
            last_name: d.last_name,
            clinic_name: d.clinic_name,
            city: d.city,
            state: d.state,
            address: d.address,
            verification_status: d.verification_status,
            membership_tier: d.membership_tier,
            latitude: lat,
            longitude: lng,
            reason: 'address_mismatch',
            mismatchNote: `Record: ${d.city}, ${d.state}. Address says: ${addrCity}.`,
          })
          continue
        }
      }
    }

    if (!isZero) continue

    let reason: InvisibleDoctor['reason']
    if (missing) reason = 'missing_coords'
    else if (!d.address || !d.address.trim()) reason = 'no_address'
    else reason = 'zero_coords'

    invisible.push({
      id: d.id,
      first_name: d.first_name,
      last_name: d.last_name,
      clinic_name: d.clinic_name,
      city: d.city,
      state: d.state,
      address: d.address,
      verification_status: d.verification_status,
      membership_tier: d.membership_tier,
      latitude: lat,
      longitude: lng,
      reason,
    })
  }

  return invisible
}

export async function updateDoctorCoordinates(doctorId: string, lat: number, lng: number) {
  await checkAdminAuth()
  const supabase = createAdminClient()

  // Validate bounds (all US states + territories)
  if (lat < 17.5 || lat > 71.5 || lng < -180 || lng > -64.5) {
    return { error: 'Coordinates are outside US bounds.' }
  }
  if (lat === 0 && lng === 0) {
    return { error: 'Cannot set coordinates to 0,0.' }
  }

  const { error } = await supabase
    .from('doctors')
    .update({ latitude: lat, longitude: lng })
    .eq('id', doctorId)

  if (error) return { error: error.message }
  bustAdminCoverage()
  return { success: true }
}

export async function geocodeDoctorFromAdmin(doctorId: string) {
  await checkAdminAuth()
  const supabase = createAdminClient()

  const { data: doc } = await supabase
    .from('doctors')
    .select('address, city, state')
    .eq('id', doctorId)
    .single()

  if (!doc || !doc.address) {
    return { error: 'No address on file. Add an address first.' }
  }

  const { geocodeDoctorAddress } = await import('@/lib/geocode')
  const result = await geocodeDoctorAddress(doc.address, doc.city || '', doc.state || '')

  if (!result) {
    // Try Census Bureau as fallback
    try {
      const url = new URL('https://geocoding.geo.census.gov/geocoder/locations/onelineaddress')
      url.searchParams.set('address', doc.address)
      url.searchParams.set('benchmark', 'Public_AR_Current')
      url.searchParams.set('format', 'json')
      const response = await fetch(url.toString())
      const data = await response.json()
      const matches = data?.result?.addressMatches
      if (matches && matches.length > 0) {
        const lat = matches[0].coordinates.y
        const lng = matches[0].coordinates.x
        const { error: censusError } = await supabase.from('doctors').update({ latitude: lat, longitude: lng }).eq('id', doctorId)
        if (censusError) return { error: censusError.message }
        bustAdminCoverage()
        return { success: true, lat, lng, method: 'census' }
      }
    } catch {}

    return { error: `Geocoding failed for "${doc.address}, ${doc.city}, ${doc.state}". Both Nominatim and Census Bureau returned no results.` }
  }

  const { error: geoError } = await supabase.from('doctors').update({ latitude: result.lat, longitude: result.lng }).eq('id', doctorId)
  if (geoError) return { error: geoError.message }
  bustAdminCoverage()
  return { success: true, lat: result.lat, lng: result.lng, method: 'nominatim' }
}
