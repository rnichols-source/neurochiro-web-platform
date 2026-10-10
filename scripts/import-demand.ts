/**
 * Import demand mentions from CSV, geocode, and upsert into Supabase.
 *
 * Usage: npx tsx --env-file=.env scripts/import-demand.ts
 *
 * - Reads data/neurochiro_demand_requests.csv (2,152 rows)
 * - Geocodes using resolveLocation + detectPostalCode + country centroids
 * - Caches geocode results in data/geocode_cache.json
 * - Logs failures to data/geocode_failures.csv
 * - Deletes existing instagram/instagram_comment demand_mentions
 * - Inserts fresh rows with source = 'instagram'
 * - Idempotent: running twice produces the same result
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// Load env files manually for compatibility
function loadEnv(filename: string) {
  try {
    const content = readFileSync(resolve(process.cwd(), filename), 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      let val = trimmed.slice(eqIdx + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = val
    }
  } catch {}
}
loadEnv('.env.local')
loadEnv('.env')

import { createAdminClient } from '@/lib/supabase-admin'
import { resolveLocation } from '@/lib/resolve-city'
import { detectPostalCode } from '@/lib/detect-postal'

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

// ── Country centroids (fallback for country-only rows) ──
const COUNTRY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  US: { lat: 39.833, lng: -98.583 },
  GB: { lat: 55.378, lng: -3.436 },
  CA: { lat: 56.130, lng: -106.347 },
  AU: { lat: -25.274, lng: 133.775 },
  ZA: { lat: -30.559, lng: 22.937 },
  AE: { lat: 23.424, lng: 53.848 },
  NG: { lat: 9.082, lng: 8.675 },
  IN: { lat: 20.594, lng: 78.963 },
  DE: { lat: 51.166, lng: 10.452 },
  JP: { lat: 36.204, lng: 138.253 },
  MX: { lat: 23.635, lng: -102.553 },
  CH: { lat: 46.818, lng: 8.228 },
  TT: { lat: 10.692, lng: -61.223 },
  DK: { lat: 56.264, lng: 9.502 },
  SE: { lat: 60.128, lng: 18.644 },
  FR: { lat: 46.228, lng: 2.214 },
  PT: { lat: 39.400, lng: -8.225 },
  KE: { lat: -0.024, lng: 37.907 },
  TR: { lat: 38.964, lng: 35.243 },
  BG: { lat: 42.734, lng: 25.486 },
  HR: { lat: 45.100, lng: 15.200 },
  PK: { lat: 30.376, lng: 69.345 },
  MK: { lat: 41.512, lng: 21.745 },
  PH: { lat: 12.880, lng: 121.774 },
  ZM: { lat: -13.134, lng: 27.849 },
  SG: { lat: 1.352, lng: 103.820 },
  SA: { lat: 23.886, lng: 45.080 },
  ZW: { lat: -19.015, lng: 29.155 },
  CL: { lat: -35.675, lng: -71.543 },
  NZ: { lat: -40.901, lng: 174.886 },
  MA: { lat: 31.792, lng: -7.092 },
}

// ── CSV parser ──
interface CsvRow {
  country: string
  iso2: string
  region: string
  city: string
  postal: string
}

function parseCsv(filepath: string): CsvRow[] {
  const content = readFileSync(filepath, 'utf-8')
  const lines = content.split('\n').filter(l => l.trim())
  // Skip header
  const rows: CsvRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',')
    rows.push({
      country: (parts[0] || '').trim(),
      iso2: (parts[1] || '').trim(),
      region: (parts[2] || '').trim(),
      city: (parts[3] || '').trim(),
      postal: (parts[4] || '').trim(),
    })
  }
  return rows
}

// ── Geocode cache ──
const CACHE_PATH = resolve(process.cwd(), 'data/geocode_cache.json')
const FAILURE_PATH = resolve(process.cwd(), 'data/geocode_failures.csv')

let geocodeCache: Record<string, { city: string; state: string; lat: number; lng: number } | null> = {}

function loadCache() {
  if (existsSync(CACHE_PATH)) {
    try {
      geocodeCache = JSON.parse(readFileSync(CACHE_PATH, 'utf-8'))
      console.log(`Loaded ${Object.keys(geocodeCache).length} cached geocode results`)
    } catch {
      geocodeCache = {}
    }
  }
}

function saveCache() {
  writeFileSync(CACHE_PATH, JSON.stringify(geocodeCache, null, 2))
}

// ── Geocode a single row ──
interface GeoResult {
  city: string
  state: string
  lat: number
  lng: number
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000
}

function extractGbOutward(postal: string): string {
  const trimmed = postal.trim().toUpperCase()
  if (trimmed.includes(' ')) {
    return trimmed.split(' ')[0]
  }
  // No space: if length > 4, outward is everything except last 3
  if (trimmed.length > 4) {
    return trimmed.slice(0, trimmed.length - 3)
  }
  // Short code, treat as outward already
  return trimmed
}

async function geocodeRow(row: CsvRow): Promise<GeoResult | null> {
  const { iso2, region, city, postal } = row

  // Build a cache key from the row data
  const cacheKey = `${iso2}|${city}|${region}|${postal}`
  if (cacheKey in geocodeCache) {
    return geocodeCache[cacheKey]
  }

  let result: GeoResult | null = null

  // Strategy 1: US row with 5-digit ZIP
  if (iso2 === 'US' && postal && /^\d{5}/.test(postal.trim())) {
    const zip = postal.trim().slice(0, 5)
    const res = await resolveLocation(zip, 'US')
    if (res.resolved) {
      result = {
        city: res.resolved.city,
        state: res.resolved.state,
        lat: round3(res.resolved.lat),
        lng: round3(res.resolved.lng),
      }
    }
  }

  // Strategy 2: CA row with postal code
  if (!result && iso2 === 'CA' && postal) {
    const fsa = postal.trim().toUpperCase().replace(/\s+/g, '').slice(0, 3)
    if (/^[A-Z]\d[A-Z]$/.test(fsa)) {
      const res = await resolveLocation(fsa, 'CA')
      if (res.resolved) {
        result = {
          city: res.resolved.city,
          state: res.resolved.state,
          lat: round3(res.resolved.lat),
          lng: round3(res.resolved.lng),
        }
      }
    }
  }

  // Strategy 3: GB row with postcode
  if (!result && iso2 === 'GB' && postal) {
    const outward = extractGbOutward(postal)
    if (outward) {
      const res = await resolveLocation(outward, 'GB')
      if (res.resolved) {
        result = {
          city: res.resolved.city,
          state: res.resolved.state,
          lat: round3(res.resolved.lat),
          lng: round3(res.resolved.lng),
        }
      }
    }
  }

  // Strategy 4: Other countries with postal code
  if (!result && postal && iso2 !== 'US' && iso2 !== 'CA' && iso2 !== 'GB') {
    const query = city ? `${postal.trim()} ${city}` : postal.trim()
    const res = await resolveLocation(query, iso2)
    if (res.resolved) {
      result = {
        city: res.resolved.city,
        state: res.resolved.state,
        lat: round3(res.resolved.lat),
        lng: round3(res.resolved.lng),
      }
    }
  }

  // Strategy 5: City + region (no postal or postal failed)
  if (!result && city) {
    const query = region ? `${city}, ${region}` : city
    const res = await resolveLocation(query, iso2)
    if (res.resolved) {
      result = {
        city: res.resolved.city,
        state: res.resolved.state,
        lat: round3(res.resolved.lat),
        lng: round3(res.resolved.lng),
      }
    }
  }

  // Strategy 6: Region only
  if (!result && !city && region) {
    const res = await resolveLocation(region, iso2)
    if (res.resolved) {
      result = {
        city: res.resolved.city,
        state: res.resolved.state,
        lat: round3(res.resolved.lat),
        lng: round3(res.resolved.lng),
      }
    }
  }

  // Strategy 7: Country centroid fallback
  if (!result && COUNTRY_CENTROIDS[iso2]) {
    const c = COUNTRY_CENTROIDS[iso2]
    result = {
      city: city || row.country || iso2,
      state: region || '',
      lat: round3(c.lat),
      lng: round3(c.lng),
    }
  }

  geocodeCache[cacheKey] = result
  return result
}

// ── Main ──
async function main() {
  const csvPath = resolve(process.cwd(), 'data/neurochiro_demand_requests.csv')
  console.log('Reading CSV...')
  const rows = parseCsv(csvPath)
  console.log(`Parsed ${rows.length} rows from CSV`)

  loadCache()

  // Geocode all rows
  const geocoded: Array<{ row: CsvRow; geo: GeoResult | null }> = []
  const failures: CsvRow[] = []
  let nominatimCalls = 0
  let cacheHits = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const cacheKey = `${row.iso2}|${row.city}|${row.region}|${row.postal}`
    const wasCached = cacheKey in geocodeCache

    const geo = await geocodeRow(row)
    geocoded.push({ row, geo })

    if (wasCached) {
      cacheHits++
    } else {
      nominatimCalls++
      // Rate limit: 1 request per second for Nominatim
      if (i < rows.length - 1) {
        await delay(1100)
      }
      // Save cache every 50 new geocodes
      if (nominatimCalls % 50 === 0) {
        saveCache()
        console.log(`  [cache saved at ${nominatimCalls} new geocodes]`)
      }
    }

    if (!geo) {
      failures.push(row)
    }

    if ((i + 1) % 100 === 0 || i === rows.length - 1) {
      const failCount = failures.length
      console.log(`  Progress: ${i + 1}/${rows.length} | Cache hits: ${cacheHits} | Nominatim calls: ${nominatimCalls} | Failures: ${failCount}`)
    }
  }

  // Save final cache
  saveCache()
  console.log(`\nGeocoding complete. Cache saved with ${Object.keys(geocodeCache).length} entries.`)

  // Write failures
  if (failures.length > 0) {
    const failCsv = ['country,iso2,region,city,postal', ...failures.map(f => `${f.country},${f.iso2},${f.region},${f.city},${f.postal}`)].join('\n')
    writeFileSync(FAILURE_PATH, failCsv)
    console.log(`Wrote ${failures.length} failures to ${FAILURE_PATH}`)
  } else {
    console.log('No geocoding failures.')
  }

  // ── Supabase import ──
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  // Delete old instagram rows
  console.log('\nDeleting existing instagram/instagram_comment demand_mentions...')
  const { error: delError, count: delCount } = await (supabase as any)
    .from('demand_mentions')
    .delete({ count: 'exact' })
    .in('source', ['instagram', 'instagram_comment'])

  if (delError) {
    console.error('Delete error:', delError)
    process.exit(1)
  }
  console.log(`Deleted ${delCount ?? 0} existing rows.`)

  // Prepare insert rows
  const insertRows = geocoded
    .filter(g => g.geo !== null)
    .map(g => ({
      city: g.geo!.city || g.row.city || g.row.country || g.row.iso2,
      state: g.geo!.state || g.row.region || '',
      lat: g.geo!.lat,
      lng: g.geo!.lng,
      source: 'instagram',
      status: 'unworked',
      country: g.row.iso2,
      mentioned_on: today,
    }))

  // Also add rows that failed geocoding with country centroid if available
  // (Already handled in geocodeRow with centroid fallback, so all non-null geos are included)

  console.log(`\nInserting ${insertRows.length} rows into demand_mentions...`)

  // Insert in batches of 500
  const BATCH_SIZE = 500
  let inserted = 0
  for (let i = 0; i < insertRows.length; i += BATCH_SIZE) {
    const batch = insertRows.slice(i, i + BATCH_SIZE)
    const { error: insError } = await (supabase as any)
      .from('demand_mentions')
      .insert(batch)

    if (insError) {
      console.error(`Insert error at batch ${Math.floor(i / BATCH_SIZE) + 1}:`, insError)
      process.exit(1)
    }
    inserted += batch.length
    console.log(`  Inserted ${inserted}/${insertRows.length}`)
  }

  // ── Verification table ──
  console.log('\n' + '='.repeat(60))
  console.log('VERIFICATION TABLE')
  console.log('='.repeat(60))

  // Count CSV rows per country
  const csvCounts: Record<string, number> = {}
  for (const r of rows) {
    csvCounts[r.iso2] = (csvCounts[r.iso2] || 0) + 1
  }

  // Count imported rows per country
  const importedCounts: Record<string, number> = {}
  for (const g of geocoded) {
    if (g.geo) {
      importedCounts[g.row.iso2] = (importedCounts[g.row.iso2] || 0) + 1
    }
  }

  // Count failures per country
  const failCounts: Record<string, number> = {}
  for (const f of failures) {
    failCounts[f.iso2] = (failCounts[f.iso2] || 0) + 1
  }

  const allCountries = [...new Set([...Object.keys(csvCounts), ...Object.keys(importedCounts)])].sort()

  console.log(`${'Country'.padEnd(10)} ${'CSV'.padStart(6)} ${'Imported'.padStart(10)} ${'Failed'.padStart(8)} ${'Match'.padStart(7)}`)
  console.log('-'.repeat(45))

  let totalCsv = 0
  let totalImported = 0
  let totalFailed = 0

  for (const c of allCountries) {
    const csv = csvCounts[c] || 0
    const imp = importedCounts[c] || 0
    const fail = failCounts[c] || 0
    const match = csv === imp ? 'OK' : `DIFF`
    totalCsv += csv
    totalImported += imp
    totalFailed += fail
    console.log(`${c.padEnd(10)} ${String(csv).padStart(6)} ${String(imp).padStart(10)} ${String(fail).padStart(8)} ${match.padStart(7)}`)
  }

  console.log('-'.repeat(45))
  console.log(`${'TOTAL'.padEnd(10)} ${String(totalCsv).padStart(6)} ${String(totalImported).padStart(10)} ${String(totalFailed).padStart(8)}`)
  console.log('='.repeat(60))

  // Verify count in database
  const { count: dbCount } = await (supabase as any)
    .from('demand_mentions')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'instagram')

  console.log(`\nDatabase verification: ${dbCount} rows with source='instagram'`)
  console.log(`Expected: ${insertRows.length}`)
  console.log(dbCount === insertRows.length ? 'MATCH - Import successful!' : 'MISMATCH - Check for issues!')

  // Also count coverage_search to confirm untouched
  const { count: csCount } = await (supabase as any)
    .from('demand_mentions')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'coverage_search')

  console.log(`\ncoverage_search rows (should be unchanged): ${csCount}`)
  console.log('\nDone.')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
