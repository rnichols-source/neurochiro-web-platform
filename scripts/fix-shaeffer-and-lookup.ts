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
  // 1. Fix Dr. Shaeffer
  const { error: shaefferErr } = await supabase
    .from('doctors')
    .update({ city: 'Greer', address: '996 Batesville Rd. #7' })
    .eq('last_name', 'Shaeffer')
    .eq('first_name', 'Mariya')
  console.log('Shaeffer fix:', shaefferErr ? shaefferErr.message : 'SUCCESS — city=Greer, address=996 Batesville Rd. #7')

  // Verify
  const { data: verify } = await supabase
    .from('doctors')
    .select('first_name, last_name, city, address, latitude, longitude')
    .eq('last_name', 'Shaeffer')
    .eq('first_name', 'Mariya')
    .single()
  console.log('Verified:', JSON.stringify(verify))

  // 2. Get Georgia Chiro Neurology address
  const { data: gcn } = await supabase
    .from('doctors')
    .select('id, clinic_name, address, city, state')
    .ilike('clinic_name', '%Georgia Chiro%')
  console.log('\nGeorgia Chiro Neurology:', JSON.stringify(gcn, null, 2))

  // 3. Get the 4 failed addresses
  console.log('\n=== 4 FAILED GEOCODES ===')
  const lookups = [
    { filter: { clinic_name: 'Reach Chiro' }, ilike: true },
    { filter: { last_name: 'Colby', first_name: 'Norman' } },
    { filter: { last_name: 'Cooper', first_name: 'Johnny' } },
    { filter: { last_name: 'Malina', first_name: 'Whitney' } },
  ]
  for (const l of lookups) {
    let q = supabase.from('doctors').select('id, first_name, last_name, clinic_name, address, city, state')
    if (l.ilike) {
      q = q.ilike('clinic_name', `%${(l.filter as any).clinic_name}%`)
    } else {
      for (const [k, v] of Object.entries(l.filter)) {
        q = q.eq(k, v)
      }
    }
    const { data } = await q
    if (data && data.length > 0) {
      const d = data[0]
      console.log(`\n${d.first_name} ${d.last_name} (${d.clinic_name}):`)
      console.log(`  ID: ${d.id}`)
      console.log(`  Address: ${d.address}`)
      console.log(`  City/State: ${d.city}, ${d.state}`)
    }
  }
}

main().catch(console.error)
