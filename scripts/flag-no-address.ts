/**
 * Flag verified doctors with 0,0 coordinates as needing admin attention.
 * Inserts entries into automation_queue so admin can see them.
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

async function main() {
  // Find verified doctors still at 0,0
  const { data: zeroDocs } = await supabase
    .from('doctors')
    .select('id, first_name, last_name, clinic_name, address, city, state, verification_status')
    .eq('latitude', 0)
    .eq('longitude', 0)
    .in('verification_status', ['verified', 'pending'])
    .or('country.is.null,country.eq.United States,country.eq.US,country.eq.USA')

  if (!zeroDocs || zeroDocs.length === 0) {
    console.log('No doctors with 0,0 coordinates.')
    return
  }

  const verified = zeroDocs.filter(d => d.verification_status === 'verified')
  const pending = zeroDocs.filter(d => d.verification_status === 'pending')

  console.log(`Verified with 0,0: ${verified.length}`)
  console.log(`Pending with 0,0: ${pending.length}`)

  // Flag each verified doctor in automation_queue
  for (const d of verified) {
    const reason = d.address ? 'geocode_failed' : 'no_address'
    const { error } = await supabase.from('automation_queue').insert({
      event_type: 'doctor_invisible',
      payload: {
        doctorId: d.id,
        name: `${d.first_name} ${d.last_name}`.trim() || d.clinic_name,
        city: d.city,
        state: d.state,
        address: d.address,
        reason,
        message: reason === 'no_address'
          ? 'Verified doctor has no street address. Cannot geocode. Invisible to all location searches.'
          : 'Verified doctor has address but geocoding failed. Invisible to all location searches.',
      }
    })
    if (error) {
      console.error(`  Failed to flag ${d.first_name} ${d.last_name}: ${error.message}`)
    } else {
      console.log(`  Flagged: ${d.first_name} ${d.last_name} — ${reason}`)
    }
  }

  console.log(`\nDone. ${verified.length} verified doctors flagged as needing attention.`)
  console.log(`${pending.length} pending doctors remain hidden by their pending status.`)
}

main().catch(console.error)
