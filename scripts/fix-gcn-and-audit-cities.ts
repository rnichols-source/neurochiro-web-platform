/**
 * 1. Fix Georgia Chiro Neurology: city → Marietta, write coordinates
 * 2. Audit ALL doctors for city-vs-address mismatches
 *
 * Uses the city embedded in the address field (or ZIP → city lookup) to detect
 * cases where the record's city doesn't match the actual physical city.
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

/** Extract city from an address string like "123 Main St, Suite 5, Marietta, GA 30066" */
function extractCityFromAddress(address: string, state: string): string | null {
  // Remove suite/unit info
  let cleaned = address
    .replace(/,?\s*(Suite|Ste|Unit|Bldg|Building|Apt|#)\s*[\w#-]+/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  // Try to find city by looking for ", CITY, STATE" or ", CITY, ST ZIP"
  // Pattern: ..., City, ST 12345  or  ..., City, State
  const STATE_CODES = new Set([
    'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN',
    'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
    'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT',
    'VT','VA','WA','WV','WI','WY'
  ])

  const parts = cleaned.split(',').map(p => p.trim()).filter(Boolean)
  if (parts.length < 2) return null

  // Work backwards — last part is usually "STATE ZIP" or just "STATE"
  for (let i = parts.length - 1; i >= 1; i--) {
    const part = parts[i].trim()
    // Check if this part contains a state code
    const words = part.split(/\s+/)
    const firstWord = words[0]?.toUpperCase()
    if (STATE_CODES.has(firstWord) || firstWord === state?.toUpperCase()) {
      // The part before this is the city
      const cityPart = parts[i - 1]?.trim()
      if (cityPart && !/^\d/.test(cityPart)) { // Not a street number
        return cityPart
      }
    }
    // Check if it's just a ZIP
    if (/^\d{5}(-\d{4})?$/.test(part)) {
      // The part before this should be "City, ST" or just "City"
      continue
    }
  }

  // Fallback: if address has a ZIP, look up the city from zip_codes table later
  return null
}

/** Extract ZIP from address */
function extractZip(address: string): string | null {
  const match = address.match(/\b(\d{5})(?:-\d{4})?\b/)
  return match ? match[1] : null
}

async function main() {
  // 1. Fix Georgia Chiro Neurology
  console.log('=== Fixing Georgia Chiro Neurology ===')
  const { error: gcnErr } = await supabase
    .from('doctors')
    .update({ city: 'Marietta', latitude: 33.928511, longitude: -84.479086 })
    .ilike('clinic_name', '%Georgia Chiro%')
    .eq('latitude', 0)
  console.log(gcnErr ? `ERROR: ${gcnErr.message}` : 'SUCCESS: city=Marietta, coords written')

  // 2. Audit all doctors
  console.log('\n=== City/Address Mismatch Audit ===\n')

  const { data: doctors, error } = await supabase
    .from('doctors')
    .select('id, first_name, last_name, clinic_name, address, city, state, verification_status')
    .in('verification_status', ['verified', 'pending'])
    .not('address', 'is', null)
    .order('last_name')

  if (error || !doctors) {
    console.error('Query error:', error)
    return
  }

  // Load ZIP codes for fallback lookup
  const { data: zips } = await supabase
    .from('zip_codes')
    .select('zip, city')

  const zipToCity = new Map<string, string>()
  if (zips) {
    for (const z of zips) zipToCity.set(z.zip, z.city)
  }

  const mismatches: { name: string; id: string; recordCity: string; addressCity: string; address: string; state: string; status: string; source: string }[] = []

  for (const d of doctors) {
    if (!d.address || !d.city) continue

    const recordCity = d.city.trim().toLowerCase()

    // Try extracting city from the address text
    let addressCity = extractCityFromAddress(d.address, d.state || '')
    let source = 'address-parse'

    // If parsing failed, try ZIP lookup
    if (!addressCity) {
      const zip = extractZip(d.address)
      if (zip && zipToCity.has(zip)) {
        addressCity = zipToCity.get(zip)!
        source = 'zip-lookup'
      }
    }

    if (!addressCity) continue

    const addressCityLower = addressCity.trim().toLowerCase()

    // Check for mismatch — allow if one contains the other (e.g. "Fort Collins" matches)
    if (
      recordCity !== addressCityLower &&
      !recordCity.includes(addressCityLower) &&
      !addressCityLower.includes(recordCity)
    ) {
      const name = [d.first_name, d.last_name].filter(Boolean).join(' ') || d.clinic_name || 'Unknown'
      mismatches.push({
        name,
        id: d.id,
        recordCity: d.city,
        addressCity: addressCity,
        address: d.address,
        state: d.state || '',
        status: d.verification_status,
        source,
      })
    }
  }

  if (mismatches.length === 0) {
    console.log('No city/address mismatches found.')
    return
  }

  console.log(`Found ${mismatches.length} city/address mismatches:\n`)
  console.log('Doctor'.padEnd(35) + ' | ' + 'Record City'.padEnd(20) + ' | ' + 'Address City'.padEnd(20) + ' | ' + 'Source'.padEnd(12) + ' | Status')
  console.log('-'.repeat(110))

  for (const m of mismatches) {
    console.log(
      m.name.padEnd(35) + ' | ' +
      m.recordCity.padEnd(20) + ' | ' +
      m.addressCity.padEnd(20) + ' | ' +
      m.source.padEnd(12) + ' | ' +
      m.status
    )
  }

  console.log(`\n${mismatches.length} total mismatches. Review before changing.`)
}

main().catch(console.error)
