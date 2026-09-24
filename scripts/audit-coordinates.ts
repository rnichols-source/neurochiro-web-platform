/**
 * Audit doctor coordinates — find doctors with null, zero, or obviously wrong coordinates.
 *
 * Usage: npx tsx scripts/audit-coordinates.ts
 * Requires .env with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env manually (no dotenv dependency)
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

// US bounding box — all 50 states + territories
const US_BOUNDS = {
  latMin: 17.5,   // south: US Virgin Islands / Puerto Rico
  latMax: 71.5,   // north: Barrow, Alaska
  lngMin: -180.0, // west: Aleutian Islands cross the date line
  lngMax: -64.5,  // east: US Virgin Islands
}

async function main() {
  const { data: doctors, error } = await supabase
    .from('doctors')
    .select('id, first_name, last_name, city, state, country, latitude, longitude, verification_status')
    .in('verification_status', ['verified', 'pending'])
    .order('last_name')

  if (error) {
    console.error('Query error:', error)
    process.exit(1)
  }

  if (!doctors || doctors.length === 0) {
    console.log('No doctors found.')
    return
  }

  console.log(`\nTotal verified/pending doctors: ${doctors.length}\n`)

  const nullCoords: typeof doctors = []
  const zeroCoords: typeof doctors = []
  const outOfBounds: typeof doctors = []
  const international: typeof doctors = []
  const valid: typeof doctors = []

  for (const d of doctors) {
    const isInternational = d.country && d.country !== 'United States' && d.country !== 'US' && d.country !== 'USA'

    if (isInternational) {
      // International doctors have their own category — valid coords for their country
      if (d.latitude && d.longitude && d.latitude !== 0 && d.longitude !== 0) {
        international.push(d) // valid international
      } else {
        zeroCoords.push(d) // broken international
      }
    } else if (d.latitude == null || d.longitude == null) {
      nullCoords.push(d)
    } else if (d.latitude === 0 && d.longitude === 0) {
      zeroCoords.push(d)
    } else if (
      d.latitude < US_BOUNDS.latMin || d.latitude > US_BOUNDS.latMax ||
      d.longitude < US_BOUNDS.lngMin || d.longitude > US_BOUNDS.lngMax
    ) {
      outOfBounds.push(d)
    } else {
      valid.push(d)
    }
  }

  console.log('=== SUMMARY ===')
  console.log(`Valid US coordinates:  ${valid.length}`)
  console.log(`International (valid): ${international.length}`)
  console.log(`NULL coordinates:      ${nullCoords.length}`)
  console.log(`Zero (0,0) coords:     ${zeroCoords.length}`)
  console.log(`Out of US bounds:      ${outOfBounds.length}`)
  console.log(`INVISIBLE TO SEARCH:   ${nullCoords.length + zeroCoords.length + outOfBounds.length}`)
  console.log()

  if (nullCoords.length > 0) {
    console.log('=== NULL COORDINATES ===')
    for (const d of nullCoords) {
      console.log(`  ${`${d.first_name} ${d.last_name}`} — ${d.city}, ${d.state} (${d.verification_status})`)
    }
    console.log()
  }

  if (zeroCoords.length > 0) {
    console.log('=== ZERO COORDINATES (0, 0) ===')
    for (const d of zeroCoords) {
      console.log(`  ${`${d.first_name} ${d.last_name}`} — ${d.city}, ${d.state} (${d.verification_status})`)
    }
    console.log()
  }

  if (outOfBounds.length > 0) {
    console.log('=== OUT OF US BOUNDS (US doctors with bad coordinates) ===')
    for (const d of outOfBounds) {
      console.log(`  ${`${d.first_name} ${d.last_name}`} — ${d.city}, ${d.state} (lat: ${d.latitude}, lng: ${d.longitude}) [country: ${d.country || 'null'}]`)
    }
    console.log()
  }

  if (international.length > 0) {
    console.log('=== INTERNATIONAL (valid, excluded from US search by country column) ===')
    for (const d of international) {
      console.log(`  ${`${d.first_name} ${d.last_name}`} — ${d.city}, ${d.country} (lat: ${d.latitude}, lng: ${d.longitude})`)
    }
    console.log()
  }

  // Also check for duplicate coordinates (multiple doctors at exact same point — suspicious if not same clinic)
  const coordMap = new Map<string, typeof doctors>()
  for (const d of valid) {
    const key = `${d.latitude},${d.longitude}`
    if (!coordMap.has(key)) coordMap.set(key, [])
    coordMap.get(key)!.push(d)
  }

  const dupes = [...coordMap.entries()].filter(([, docs]) => docs.length > 1)
  if (dupes.length > 0) {
    console.log('=== DUPLICATE COORDINATES (same exact lat/lng) ===')
    for (const [coord, docs] of dupes) {
      console.log(`  ${coord}:`)
      for (const d of docs) {
        console.log(`    ${`${d.first_name} ${d.last_name}`} — ${d.city}, ${d.state}`)
      }
    }
    console.log()
  }
}

main().catch(console.error)
