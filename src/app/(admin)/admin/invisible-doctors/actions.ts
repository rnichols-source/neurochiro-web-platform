'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { checkAdminAuth } from '@/lib/admin-auth'

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
  reason: 'no_address' | 'geocode_failed' | 'zero_coords'
}

export async function getInvisibleDoctors(): Promise<InvisibleDoctor[]> {
  await checkAdminAuth()
  const supabase = createAdminClient()

  // Fetch all verified/pending US doctors with 0,0 or null coordinates
  const { data, error } = await supabase
    .from('doctors')
    .select('id, first_name, last_name, clinic_name, city, state, address, verification_status, membership_tier, latitude, longitude, country')
    .in('verification_status', ['verified', 'pending'])
    .or('country.is.null,country.eq.United States,country.eq.US,country.eq.USA')
    .order('verification_status', { ascending: true }) // verified first
    .order('last_name')

  if (error || !data) return []

  const invisible: InvisibleDoctor[] = []

  for (const d of data) {
    const lat = d.latitude
    const lng = d.longitude
    const isZero = (lat === 0 && lng === 0) || lat == null || lng == null

    if (!isZero) continue

    let reason: InvisibleDoctor['reason']
    if (!d.address || !d.address.trim()) {
      reason = 'no_address'
    } else if (lat === 0 && lng === 0) {
      reason = 'geocode_failed'
    } else {
      reason = 'zero_coords'
    }

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
        await supabase.from('doctors').update({ latitude: lat, longitude: lng }).eq('id', doctorId)
        return { success: true, lat, lng, method: 'census' }
      }
    } catch {}

    return { error: `Geocoding failed for "${doc.address}, ${doc.city}, ${doc.state}". Both Nominatim and Census Bureau returned no results.` }
  }

  await supabase.from('doctors').update({ latitude: result.lat, longitude: result.lng }).eq('id', doctorId)
  return { success: true, lat: result.lat, lng: result.lng, method: 'nominatim' }
}
