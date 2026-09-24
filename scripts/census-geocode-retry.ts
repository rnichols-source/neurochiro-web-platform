/**
 * Retry failed geocodes using the US Census Bureau Geocoding API.
 * https://geocoding.geo.census.gov/geocoder/locations/onelineaddress
 *
 * Much better at US commercial addresses than Nominatim.
 * Free, no API key, no rate limit published (but be respectful).
 *
 * DRY RUN — shows results, does not write.
 * Pass --write to apply.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

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

interface CensusResult {
  matchedAddress: string
  lat: number
  lng: number
  tigerLine: string
}

async function censusGeocode(address: string): Promise<CensusResult | null> {
  const url = new URL('https://geocoding.geo.census.gov/geocoder/locations/onelineaddress')
  url.searchParams.set('address', address)
  url.searchParams.set('benchmark', 'Public_AR_Current')
  url.searchParams.set('format', 'json')

  const response = await fetch(url.toString())
  const data = await response.json()

  const matches = data?.result?.addressMatches
  if (!matches || matches.length === 0) return null

  const best = matches[0]
  return {
    matchedAddress: best.matchedAddress,
    lat: best.coordinates.y,
    lng: best.coordinates.x,
    tigerLine: best.tigerLine?.tigerLineId || '',
  }
}

/** Strip suite/unit numbers that might confuse the geocoder */
function stripSuite(addr: string): string {
  return addr
    .replace(/,?\s*(Suite|Ste|Unit|Bldg|Building|Apt|#)\s*[\w#-]+/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const DOCTORS = [
  {
    id: '8c0a5ee9-55f0-405e-a56a-875bbbaa89e6',
    name: 'Lorena (Reach Chiropractic)',
    address: '965 Piedmont Rd, Suite 130, Marietta, GA 30066',
    city: 'Marietta', state: 'GA',
  },
  {
    id: '40399b01-2977-4885-b3fb-365533061534',
    name: 'Norman Colby',
    address: '1501 Regency Way, Woodstock, GA',
    city: 'Woodstock', state: 'GA',
  },
  {
    id: '5099cd07-c869-47fb-9e73-8f4bd607bd7b',
    name: 'Johnny Cooper',
    address: '840 N State Road 434, Suite 1000, Altamonte Springs, FL 32714',
    city: 'Altamonte Springs', state: 'FL',
  },
  {
    id: '19c8fffa-8eba-4e26-a256-1ebe1e74fc7d',
    name: 'Whitney Malina',
    address: '3826 North Druid Hills Road, Decatur, GA 30033',
    city: 'Decatur', state: 'GA',
  },
]

async function main() {
  console.log(`\n${WRITE_MODE ? '*** WRITE MODE ***' : '*** DRY RUN ***'}\n`)
  console.log('Using US Census Bureau Geocoding API\n')

  const results: { name: string; id: string; searched: string; matched: string | null; lat: number | null; lng: number | null; status: string }[] = []

  for (const doc of DOCTORS) {
    console.log(`Geocoding: ${doc.name}`)

    // Attempt 1: full address as-is
    let result = await censusGeocode(doc.address)
    let searched = doc.address

    if (!result) {
      // Attempt 2: strip suite numbers
      const stripped = stripSuite(doc.address)
      if (stripped !== doc.address) {
        console.log(`  Retry without suite: ${stripped}`)
        await new Promise(r => setTimeout(r, 500))
        result = await censusGeocode(stripped)
        searched = stripped + ' (no suite)'
      }
    }

    if (!result) {
      // Attempt 3: just street + city + state (no ZIP, no suite)
      const street = doc.address.split(',')[0].trim()
      const simple = `${stripSuite(street)}, ${doc.city}, ${doc.state}`
      console.log(`  Retry simple: ${simple}`)
      await new Promise(r => setTimeout(r, 500))
      result = await censusGeocode(simple)
      searched = simple + ' (simple)'
    }

    if (result) {
      console.log(`  MATCH: ${result.matchedAddress}`)
      console.log(`  Coords: ${result.lat.toFixed(6)}, ${result.lng.toFixed(6)}`)
      results.push({
        name: doc.name, id: doc.id, searched,
        matched: result.matchedAddress,
        lat: result.lat, lng: result.lng,
        status: 'success',
      })
    } else {
      console.log(`  FAILED: no match from Census Bureau`)
      results.push({
        name: doc.name, id: doc.id, searched,
        matched: null, lat: null, lng: null,
        status: 'failed',
      })
    }

    await new Promise(r => setTimeout(r, 500))
  }

  console.log('\n' + '='.repeat(100))
  console.log('RESULTS')
  console.log('='.repeat(100))

  const successes = results.filter(r => r.status === 'success')
  const failures = results.filter(r => r.status === 'failed')

  if (successes.length > 0) {
    console.log(`\n✓ RESOLVED (${successes.length}):`)
    for (const r of successes) {
      console.log(`  ${r.name.padEnd(35)} | ${r.lat!.toFixed(6)}, ${r.lng!.toFixed(6)} | Census match: ${r.matched}`)
    }
  }

  if (failures.length > 0) {
    console.log(`\n✗ STILL FAILED (${failures.length}):`)
    for (const r of failures) {
      console.log(`  ${r.name.padEnd(35)} | Searched: ${r.searched}`)
    }
  }

  if (WRITE_MODE && successes.length > 0) {
    console.log('\nWriting...')
    for (const r of successes) {
      const { error } = await supabase
        .from('doctors')
        .update({ latitude: r.lat, longitude: r.lng })
        .eq('id', r.id)
      console.log(`  ${r.name}: ${error ? 'FAILED — ' + error.message : 'written'}`)
    }
  }
}

main().catch(console.error)
