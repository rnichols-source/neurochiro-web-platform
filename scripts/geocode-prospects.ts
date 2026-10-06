/**
 * One-time batch geocode script for outreach_prospects table.
 * Fetches all rows with NULL latitude, resolves via resolveLocation, updates coords.
 *
 * Usage: npx tsx scripts/geocode-prospects.ts
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load env files manually (no dotenv dependency)
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
      // Strip surrounding quotes
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

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

async function main() {
  const sb = createAdminClient()

  // Fetch all prospects with NULL latitude
  const { data: prospects, error } = await sb
    .from('outreach_prospects')
    .select('id, city, state, country, postal_code')
    .is('latitude', null)
    .order('id', { ascending: true })

  if (error) {
    console.error('Failed to fetch prospects:', error.message)
    process.exit(1)
  }

  if (!prospects || prospects.length === 0) {
    console.log('No prospects with NULL latitude found.')
    return
  }

  console.log(`Found ${prospects.length} prospects to geocode.\n`)

  let exact = 0
  let dominant = 0
  let approximate = 0
  let ambiguous = 0
  let failed = 0
  const failures: { id: number; city: string; state: string; reason: string }[] = []

  for (let i = 0; i < prospects.length; i++) {
    const p = prospects[i] as any
    const { id, city, state, country, postal_code } = p

    // Build input string
    let input: string
    if (postal_code) {
      input = postal_code
    } else if (city && state) {
      input = `${city}, ${state}`
    } else if (city) {
      input = city
    } else {
      failed++
      failures.push({ id, city: city || '', state: state || '', reason: 'No city or postal_code' })
      if ((i + 1) % 50 === 0) logProgress(i + 1, prospects.length, exact, dominant, approximate, ambiguous, failed)
      continue
    }

    try {
      const result = await resolveLocation(input, country || 'US')

      if (result.resolved) {
        const conf = result.confidence || 'exact'
        if (conf === 'exact') exact++
        else if (conf === 'dominant') dominant++
        else if (conf === 'approximate') approximate++
        else exact++ // fallback

        const { error: updateErr } = await sb
          .from('outreach_prospects')
          .update({ latitude: result.resolved.lat, longitude: result.resolved.lng })
          .eq('id', id)

        if (updateErr) {
          console.error(`  [${i + 1}] Update failed for id=${id}: ${updateErr.message}`)
        }
      } else if (result.ambiguous) {
        ambiguous++
        failures.push({ id, city: city || '', state: state || '', reason: `Ambiguous: ${result.ambiguous.length} states` })
      } else {
        failed++
        failures.push({ id, city: city || '', state: state || '', reason: result.label || 'Unknown' })
      }
    } catch (err: any) {
      failed++
      failures.push({ id, city: city || '', state: state || '', reason: err.message || 'Exception' })
      console.error(`  [${i + 1}] Error for id=${id} (${input}): ${err.message}`)
    }

    if ((i + 1) % 50 === 0) logProgress(i + 1, prospects.length, exact, dominant, approximate, ambiguous, failed)

    // Rate limit: 1 request per second
    if (i < prospects.length - 1) {
      await delay(1000)
    }
  }

  // Final summary
  console.log('\n========================================')
  console.log('GEOCODE COMPLETE')
  console.log('========================================')
  console.log(`Total processed: ${prospects.length}`)
  console.log(`Exact:           ${exact}`)
  console.log(`Dominant:        ${dominant}`)
  console.log(`Approximate:     ${approximate}`)
  console.log(`Ambiguous:       ${ambiguous}`)
  console.log(`Failed:          ${failed}`)
  console.log(`Success rate:    ${(((exact + dominant + approximate) / prospects.length) * 100).toFixed(1)}%`)

  if (failures.length > 0) {
    console.log(`\n--- Failures (${failures.length}) ---`)
    for (const f of failures) {
      console.log(`  id=${f.id}  ${f.city}, ${f.state}  =>  ${f.reason}`)
    }
  }

  console.log('\nDone.')
}

function logProgress(
  done: number, total: number,
  exact: number, dominant: number, approximate: number, ambiguous: number, failed: number,
) {
  const resolved = exact + dominant + approximate
  console.log(`[${done}/${total}] resolved=${resolved} (exact=${exact} dominant=${dominant} approx=${approximate}) ambiguous=${ambiguous} failed=${failed}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
