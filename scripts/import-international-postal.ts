/**
 * Import GeoNames postal codes for CA, GB, NZ into the zip_codes table.
 *
 * Prerequisites:
 *   1. Run sql/zip_codes_international.sql to add the country column
 *   2. Existing US data stays untouched (country defaults to 'US')
 *
 * GeoNames tab-separated format:
 *   [0] country code  [1] postal code  [2] place name
 *   [3] admin name 1  [4] admin code 1
 *   [5-8] admin levels 2-4
 *   [9] latitude  [10] longitude  [11] accuracy
 *
 * For CA: postal code is FSA (forward sortation area, e.g. "T0A")
 * For GB: postal code is outward code (e.g. "SW1A", "M9")
 * For NZ: postal code is 4-digit (e.g. "0600")
 *
 * Usage: npx tsx scripts/import-international-postal.ts
 *
 * Source: GeoNames (geonames.org), CC BY 4.0
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load env
const envFile = readFileSync(resolve(__dirname, '../.env'), 'utf-8')
for (const line of envFile.split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const eq = t.indexOf('=')
  if (eq === -1) continue
  if (!process.env[t.slice(0, eq)]) process.env[t.slice(0, eq)] = t.slice(eq + 1).replace(/^["']|["']$/g, '')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const COUNTRIES = [
  { code: 'CA', file: 'CA', stateField: 4 },  // admin code 1 = province abbreviation (AB, BC, ON)
  { code: 'GB', file: 'GB', stateField: 4 },  // admin code 1 = region code (ENG, SCT, WLS, NIR)
  { code: 'NZ', file: 'NZ', stateField: 4 },  // admin code 1 = region code
]

async function downloadAndParse(countryFile: string): Promise<string> {
  const url = `https://download.geonames.org/export/zip/${countryFile}.zip`
  console.log(`Downloading ${url}...`)

  const response = await fetch(url)
  const buffer = await response.arrayBuffer()

  // Use adm-zip to extract
  const AdmZip = (await import('adm-zip')).default
  const zip = new AdmZip(Buffer.from(buffer))
  const entry = zip.getEntries().find(e => e.entryName === `${countryFile}.txt`)
  if (!entry) throw new Error(`${countryFile}.txt not found in archive`)
  return entry.getData().toString('utf-8')
}

async function importCountry(countryCode: string, fileCode: string, stateField: number) {
  const text = await downloadAndParse(fileCode)
  const lines = text.split('\n').filter(l => l.trim())

  // Parse and dedupe by postal code (keep first occurrence)
  const seen = new Set<string>()
  const rows: { country: string; zip: string; city: string; state: string; lat: number; lng: number }[] = []

  for (const line of lines) {
    const cols = line.split('\t')
    if (cols.length < 11) continue

    const postalCode = cols[1].trim()
    if (!postalCode || seen.has(postalCode)) continue
    seen.add(postalCode)

    const city = cols[2].trim()
    const state = cols[stateField]?.trim() || cols[3]?.trim() || ''
    const lat = parseFloat(cols[9])
    const lng = parseFloat(cols[10])

    if (isNaN(lat) || isNaN(lng)) continue

    rows.push({
      country: countryCode,
      zip: postalCode,
      city,
      state,
      lat,
      lng,
    })
  }

  console.log(`${countryCode}: ${rows.length} unique postal codes parsed`)

  // Upsert in batches
  const BATCH_SIZE = 500
  let upserted = 0
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await (supabase as any)
      .from('zip_codes')
      .upsert(batch, { onConflict: 'country,zip' })

    if (error) {
      console.error(`  Batch ${i / BATCH_SIZE + 1} error:`, error.message)
    } else {
      upserted += batch.length
    }
  }

  console.log(`${countryCode}: ${upserted} rows upserted`)
}

async function main() {
  // First, set country='US' on all existing rows that don't have it
  const { error: updateErr } = await (supabase as any)
    .from('zip_codes')
    .update({ country: 'US' })
    .is('country', null)
  if (updateErr) console.warn('Warning: could not set NULL countries to US:', updateErr.message)

  for (const c of COUNTRIES) {
    await importCountry(c.code, c.file, c.stateField)
  }

  // Verify counts
  for (const code of ['US', 'CA', 'GB', 'NZ']) {
    const { count } = await (supabase as any)
      .from('zip_codes')
      .select('zip', { count: 'exact', head: true })
      .eq('country', code)
    console.log(`${code}: ${count} total rows`)
  }
}

main().catch(console.error)
