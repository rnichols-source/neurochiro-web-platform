/**
 * Batch geocode doctors with 0,0 coordinates.
 *
 * DRY RUN by default — shows results without writing.
 * Pass --write to apply changes.
 *
 * Uses full street address for accuracy (not city+state).
 * Flags mismatches and failures instead of guessing.
 *
 * Usage:
 *   npx tsx scripts/geocode-zero-coords.ts          # dry run
 *   npx tsx scripts/geocode-zero-coords.ts --write   # apply changes
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env
const envFile = readFileSync(resolve(__dirname, '../.env'), 'utf-8')
for (const line of envFile.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq === -1) continue
  const key = trimmed.slice(0, eq)
  const val = trimmed.slice(eq + 1).replace(/^["']|["']$/g, '')
  if (!process.env[key]) process.env[key] = val
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const WRITE_MODE = process.argv.includes('--write')

const STATE_ABBREV: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
  'DC': 'District of Columbia',
}

interface GeoResult {
  name: string
  id: string
  recordCity: string
  recordState: string
  address: string | null
  searchQuery: string
  lat: number | null
  lng: number | null
  resolvedCity: string | null
  resolvedState: string | null
  cityMatch: boolean
  stateMatch: boolean
  status: 'success' | 'no_address' | 'failed' | 'ambiguous' | 'mismatch'
  note: string
}

async function geocodeFree(query: string): Promise<{ lat: number; lng: number; display: string; city?: string; state?: string } | null> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=3&countrycodes=us&addressdetails=1`,
    { headers: { 'User-Agent': 'NeuroChiro/1.0 (support@neurochirodirectory.com)' } }
  )
  const data = await response.json()

  if (!data || data.length === 0) return null

  // If multiple results, check if they're in different cities — that's ambiguous
  if (data.length > 1) {
    const cities = new Set(data.map((r: any) => r.address?.city || r.address?.town || r.address?.village || '').filter(Boolean))
    if (cities.size > 1 && parseFloat(data[0].importance) < 0.5) {
      return null // ambiguous
    }
  }

  const best = data[0]
  return {
    lat: parseFloat(best.lat),
    lng: parseFloat(best.lon),
    display: best.display_name,
    city: best.address?.city || best.address?.town || best.address?.village,
    state: best.address?.state,
  }
}

async function geocodeStructured(street: string, city: string, state: string): Promise<{ lat: number; lng: number; display: string; city?: string; state?: string } | null> {
  const params = new URLSearchParams({
    format: 'json',
    street,
    city,
    state,
    country: 'United States',
    limit: '1',
    addressdetails: '1',
  })
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    { headers: { 'User-Agent': 'NeuroChiro/1.0 (support@neurochirodirectory.com)' } }
  )
  const data = await response.json()
  if (!data || data.length === 0) return null
  const best = data[0]
  return {
    lat: parseFloat(best.lat),
    lng: parseFloat(best.lon),
    display: best.display_name,
    city: best.address?.city || best.address?.town || best.address?.village,
    state: best.address?.state,
  }
}

/** Strip suite/unit/building numbers that confuse Nominatim */
function stripSuiteInfo(addr: string): string {
  return addr
    .replace(/,?\s*(Suite|Ste|Unit|Bldg|Building|Apt|#)\s*[\w#-]+/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Extract just the street portion from a full address string */
function extractStreet(addr: string): string {
  // Remove ZIP codes
  let street = addr.replace(/\d{5}(-\d{4})?/g, '')
  // Remove state abbreviations at end
  street = street.replace(/,\s*[A-Z]{2}\s*$/i, '')
  // Remove city portion — take everything before the last comma
  const parts = street.split(',').map(s => s.trim()).filter(Boolean)
  return parts[0] || street.trim()
}

async function geocodeWithRetries(
  address: string,
  city: string,
  state: string,
  expandedState: string,
): Promise<{ lat: number; lng: number; display: string; city?: string; state?: string; method: string } | null> {
  // Attempt 1: Full address as-is (free-form)
  const hasZip = /\d{5}(-\d{4})?/.test(address)
  const hasCityInAddr = address.toLowerCase().includes(city.toLowerCase())

  let query1 = hasCityInAddr || hasZip ? address : [address, city, expandedState].filter(Boolean).join(', ')
  let result = await geocodeFree(query1)
  if (result) return { ...result, method: 'free-form' }

  await new Promise(r => setTimeout(r, 1100))

  // Attempt 2: Strip suite/unit numbers
  const stripped = stripSuiteInfo(address)
  if (stripped !== address) {
    const query2 = hasCityInAddr || hasZip ? stripped : [stripped, city, expandedState].filter(Boolean).join(', ')
    result = await geocodeFree(query2)
    if (result) return { ...result, method: 'no-suite' }

    await new Promise(r => setTimeout(r, 1100))
  }

  // Attempt 3: Structured search (street + city + state as separate params)
  const streetOnly = stripSuiteInfo(extractStreet(address))
  result = await geocodeStructured(streetOnly, city, expandedState)
  if (result) return { ...result, method: 'structured' }

  return null
}

async function main() {
  console.log(`\n${WRITE_MODE ? '*** WRITE MODE — changes will be applied ***' : '*** DRY RUN — no changes will be written ***'}\n`)

  // Fetch all doctors with 0,0 coordinates
  const { data: doctors, error } = await supabase
    .from('doctors')
    .select('id, first_name, last_name, clinic_name, address, city, state, country, latitude, longitude, verification_status')
    .eq('latitude', 0)
    .eq('longitude', 0)
    .in('verification_status', ['verified', 'pending'])
    .order('last_name')

  if (error) {
    console.error('Query error:', error)
    process.exit(1)
  }

  if (!doctors || doctors.length === 0) {
    console.log('No doctors with 0,0 coordinates found.')
    return
  }

  console.log(`Found ${doctors.length} doctors with 0,0 coordinates.\n`)

  const results: GeoResult[] = []
  let successCount = 0
  let failCount = 0
  let mismatchCount = 0
  let noAddressCount = 0

  for (const doc of doctors) {
    const name = `${doc.first_name || ''} ${doc.last_name || ''}`.trim() || doc.clinic_name || 'Unknown'
    const expandedState = doc.state ? (STATE_ABBREV[doc.state.toUpperCase()] || doc.state) : null

    // Build search query — prefer full address
    let searchQuery: string
    let hasStreetAddress = false

    if (doc.address && doc.address.trim()) {
      // Full street address available
      // The address field often already contains city/state/ZIP — check if it does
      const addr = doc.address.trim()
      const hasZip = /\d{5}(-\d{4})?$/.test(addr)
      const hasCityState = addr.toLowerCase().includes((doc.city || '').toLowerCase())

      if (hasZip || hasCityState) {
        // Address already includes location info — use as-is
        searchQuery = addr
      } else {
        // Just a street address — append city + state
        const parts = [addr, doc.city, expandedState].filter(Boolean)
        searchQuery = parts.join(', ')
      }
      hasStreetAddress = true
    } else {
      // No street address — flag it, don't geocode to city center
      results.push({
        name,
        id: doc.id,
        recordCity: doc.city || '',
        recordState: doc.state || '',
        address: null,
        searchQuery: '',
        lat: null,
        lng: null,
        resolvedCity: null,
        resolvedState: null,
        cityMatch: false,
        stateMatch: false,
        status: 'no_address',
        note: 'NO STREET ADDRESS on record. Cannot geocode without guessing. Needs admin attention.',
      })
      noAddressCount++
      continue
    }

    // Rate limit: Nominatim requires 1 req/sec
    await new Promise(r => setTimeout(r, 1100))

    console.log(`  Geocoding: ${name} — ${searchQuery}`)

    const result = await geocodeWithRetries(doc.address!.trim(), doc.city || '', doc.state || '', expandedState || '')

    if (!result) {
      results.push({
        name,
        id: doc.id,
        recordCity: doc.city || '',
        recordState: doc.state || '',
        address: doc.address,
        searchQuery,
        lat: null,
        lng: null,
        resolvedCity: null,
        resolvedState: null,
        cityMatch: false,
        stateMatch: false,
        status: 'failed',
        note: 'Geocoding returned no results or ambiguous results. Stays at 0,0. Needs admin attention.',
      })
      failCount++
      continue
    }

    // Check city and state match
    const resolvedCity = result.city || ''
    const resolvedState = result.state || ''
    const recordCity = (doc.city || '').trim().toLowerCase()
    const resolvedCityLower = resolvedCity.toLowerCase()

    // City match: exact or one contains the other (e.g. "Johns Creek" vs "Johns Creek")
    const cityMatch = recordCity === resolvedCityLower ||
      recordCity.includes(resolvedCityLower) ||
      resolvedCityLower.includes(recordCity) ||
      // Handle metro area: Greer/Greenville, Marietta/Atlanta, etc.
      false

    // State match: compare resolved full name to our abbreviated record
    const expectedStateFull = expandedState?.toLowerCase() || ''
    const resolvedStateLower = resolvedState.toLowerCase()
    const stateMatch = resolvedStateLower === expectedStateFull ||
      resolvedStateLower.includes(expectedStateFull) ||
      expectedStateFull.includes(resolvedStateLower)

    const hasMismatch = !cityMatch || !stateMatch

    if (hasMismatch) {
      mismatchCount++
    } else {
      successCount++
    }

    results.push({
      name,
      id: doc.id,
      recordCity: doc.city || '',
      recordState: doc.state || '',
      address: doc.address,
      searchQuery,
      lat: result.lat,
      lng: result.lng,
      resolvedCity,
      resolvedState,
      cityMatch,
      stateMatch,
      status: hasMismatch ? 'mismatch' : 'success',
      note: hasMismatch
        ? `MISMATCH: record says ${doc.city}, ${doc.state} but geocoded to ${resolvedCity}, ${resolvedState}. Flagged for review.`
        : `OK: ${result.lat.toFixed(6)}, ${result.lng.toFixed(6)}`,
    })
  }

  // Print results table
  console.log('\n' + '='.repeat(120))
  console.log('GEOCODING RESULTS')
  console.log('='.repeat(120))

  // Group by status
  const successResults = results.filter(r => r.status === 'success')
  const mismatchResults = results.filter(r => r.status === 'mismatch')
  const failedResults = results.filter(r => r.status === 'failed')
  const noAddressResults = results.filter(r => r.status === 'no_address')

  if (successResults.length > 0) {
    console.log(`\n✓ READY TO WRITE (${successResults.length}):`)
    console.log('-'.repeat(120))
    for (const r of successResults) {
      console.log(`  ${r.name.padEnd(30)} | ${(r.address || '').padEnd(40)} | ${r.lat!.toFixed(6)}, ${r.lng!.toFixed(6)} | ${r.resolvedCity}, ${r.resolvedState}`)
    }
  }

  if (mismatchResults.length > 0) {
    console.log(`\n⚠ MISMATCH — NOT WRITING (${mismatchResults.length}):`)
    console.log('-'.repeat(120))
    for (const r of mismatchResults) {
      console.log(`  ${r.name.padEnd(30)} | Record: ${r.recordCity}, ${r.recordState} | Geocoded: ${r.resolvedCity}, ${r.resolvedState} | ${r.lat!.toFixed(6)}, ${r.lng!.toFixed(6)}`)
    }
  }

  if (failedResults.length > 0) {
    console.log(`\n✗ FAILED — STAYS AT 0,0 (${failedResults.length}):`)
    console.log('-'.repeat(120))
    for (const r of failedResults) {
      console.log(`  ${r.name.padEnd(30)} | Searched: ${r.searchQuery}`)
    }
  }

  if (noAddressResults.length > 0) {
    console.log(`\n○ NO STREET ADDRESS (${noAddressResults.length}):`)
    console.log('-'.repeat(120))
    for (const r of noAddressResults) {
      console.log(`  ${r.name.padEnd(30)} | ${r.recordCity}, ${r.recordState} | No address on file`)
    }
  }

  console.log('\n' + '='.repeat(120))
  console.log(`SUMMARY: ${successResults.length} ready | ${mismatchResults.length} mismatch | ${failedResults.length} failed | ${noAddressResults.length} no address`)
  console.log('='.repeat(120))

  // Write mode — only write successes
  if (WRITE_MODE && successResults.length > 0) {
    console.log('\nWriting coordinates...')
    let written = 0
    for (const r of successResults) {
      const { error } = await supabase
        .from('doctors')
        .update({ latitude: r.lat, longitude: r.lng })
        .eq('id', r.id)

      if (error) {
        console.error(`  FAILED to write ${r.name}: ${error.message}`)
      } else {
        written++
      }
    }
    console.log(`\nWrote ${written}/${successResults.length} coordinates.`)
    console.log(`${mismatchResults.length + failedResults.length + noAddressResults.length} doctors still need admin attention.`)
  }
}

main().catch(console.error)
