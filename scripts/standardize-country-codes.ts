/**
 * Standardize doctors.country to ISO 3166-1 alpha-2 codes.
 *
 * Mapping:
 *   "United States" → "US"
 *   "Canada"        → "CA"
 *   "United Kingdom" → "GB"
 *   "New Zealand"   → "NZ"
 *   NULL            → "US" (all NULL doctors are US-based)
 *   "US"            → no change
 *
 * Usage: npx tsx scripts/standardize-country-codes.ts
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

const MAPPING: Record<string, string> = {
  'United States': 'US',
  'Canada': 'CA',
  'United Kingdom': 'GB',
  'New Zealand': 'NZ',
  'USA': 'US',
}

async function main() {
  // Normalize named values
  for (const [from, to] of Object.entries(MAPPING)) {
    const { data, error } = await supabase
      .from('doctors')
      .update({ country: to })
      .eq('country', from)
      .select('id', { count: 'exact' })

    const count = data?.length || 0
    console.log(`"${from}" → "${to}": ${error ? 'ERROR ' + error.message : count + ' updated'}`)
  }

  // Set NULL to US
  const { data: nullData, error: nullErr } = await supabase
    .from('doctors')
    .update({ country: 'US' })
    .is('country', null)
    .select('id', { count: 'exact' })

  console.log(`NULL → "US": ${nullErr ? 'ERROR ' + nullErr.message : (nullData?.length || 0) + ' updated'}`)

  // Verify
  const { data: verify } = await supabase.from('doctors').select('country')
  const counts = new Map<string, number>()
  for (const d of (verify || [])) {
    const c = d.country || 'NULL'
    counts.set(c, (counts.get(c) || 0) + 1)
  }
  console.log('\nPost-migration:')
  for (const [val, count] of [...counts.entries()].sort((a,b) => b[1] - a[1])) {
    console.log(`  ${val}: ${count}`)
  }
}

main().catch(console.error)
