/**
 * Seed the chiro_schools table with recognized chiropractic program domains.
 * Source: ACA/CCE accredited programs list + international accrediting bodies.
 *
 * Usage: npx tsx scripts/seed-chiro-schools.ts
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

const envFile = readFileSync(resolve(__dirname, '../.env'), 'utf-8')
for (const line of envFile.split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const eq = t.indexOf('=')
  if (eq === -1) continue
  if (!process.env[t.slice(0, eq)]) process.env[t.slice(0, eq)] = t.slice(eq + 1).replace(/^["']|["']$/g, '')
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const SCHOOLS = [
  // ── United States (CCE-accredited + Pitt seeking accreditation) ──
  { name: 'Cleveland University-Kansas City', domain: 'cleveland.edu', country: 'US', city: 'Overland Park', state: 'KS' },
  { name: "D'Youville University", domain: 'dyc.edu', country: 'US', city: 'Buffalo', state: 'NY' },
  { name: 'Keiser University', domain: 'keiseruniversity.edu', country: 'US', city: 'West Palm Beach', state: 'FL' },
  { name: 'Keiser University', domain: 'keiser-education.com', country: 'US', city: 'West Palm Beach', state: 'FL' },
  { name: 'Life Chiropractic College West', domain: 'lifewest.edu', country: 'US', city: 'Hayward', state: 'CA' },
  { name: 'Life University', domain: 'life.edu', country: 'US', city: 'Marietta', state: 'GA' },
  { name: 'Logan University', domain: 'logan.edu', country: 'US', city: 'Chesterfield', state: 'MO' },
  { name: 'National University of Health Sciences', domain: 'nuhs.edu', country: 'US', city: 'Lombard', state: 'IL' },
  { name: 'Northeast College of Health Sciences', domain: 'nycc.edu', country: 'US', city: 'Seneca Falls', state: 'NY' },
  { name: 'Northwestern Health Sciences University', domain: 'nwhealth.edu', country: 'US', city: 'Bloomington', state: 'MN' },
  { name: 'Palmer College of Chiropractic', domain: 'palmer.edu', country: 'US', city: 'Davenport', state: 'IA' },
  { name: 'Parker University', domain: 'parker.edu', country: 'US', city: 'Dallas', state: 'TX' },
  { name: 'Sherman College of Chiropractic', domain: 'sherman.edu', country: 'US', city: 'Boiling Springs', state: 'SC' },
  { name: 'Southern California University of Health Sciences', domain: 'scuhs.edu', country: 'US', city: 'Whittier', state: 'CA' },
  { name: 'Texas Chiropractic College', domain: 'txchiro.edu', country: 'US', city: 'Pasadena', state: 'TX' },
  { name: 'Universidad Central del Caribe', domain: 'uccaribe.edu', country: 'US', city: 'Bayamon', state: 'PR' },
  { name: 'University of Bridgeport', domain: 'bridgeport.edu', country: 'US', city: 'Bridgeport', state: 'CT' },
  { name: 'University of Pittsburgh', domain: 'pitt.edu', country: 'US', city: 'Pittsburgh', state: 'PA', accreditation_status: 'seeking' },
  { name: 'University of Western States', domain: 'uws.edu', country: 'US', city: 'Portland', state: 'OR' },

  // ── Canada ──
  { name: 'Canadian Memorial Chiropractic College', domain: 'cmcc.ca', country: 'CA', city: 'Toronto', state: 'ON' },
  { name: 'Université du Québec à Trois-Rivières', domain: 'uqtr.ca', country: 'CA', city: 'Trois-Rivières', state: 'QC' },

  // ── United Kingdom ──
  { name: 'Anglo-European College of Chiropractic', domain: 'aecc.ac.uk', country: 'GB', city: 'Bournemouth' },
  { name: 'Anglo-European College of Chiropractic (BU)', domain: 'bournemouth.ac.uk', country: 'GB', city: 'Bournemouth' },
  { name: 'McTimoney College of Chiropractic', domain: 'bpp.com', country: 'GB', city: 'Abingdon' },
  { name: 'McTimoney College of Chiropractic', domain: 'mctimoney-college.ac.uk', country: 'GB', city: 'Abingdon' },
  { name: 'University of South Wales', domain: 'southwales.ac.uk', country: 'GB', city: 'Pontypridd' },

  // ── Australia ──
  { name: 'Macquarie University', domain: 'mq.edu.au', country: 'AU', city: 'Sydney', state: 'NSW' },
  { name: 'Macquarie University (students)', domain: 'students.mq.edu.au', country: 'AU', city: 'Sydney', state: 'NSW' },
  { name: 'Murdoch University', domain: 'murdoch.edu.au', country: 'AU', city: 'Perth', state: 'WA' },
  { name: 'RMIT University', domain: 'rmit.edu.au', country: 'AU', city: 'Melbourne', state: 'VIC' },
  { name: 'RMIT University (students)', domain: 'student.rmit.edu.au', country: 'AU', city: 'Melbourne', state: 'VIC' },
  { name: 'Central Queensland University', domain: 'cqu.edu.au', country: 'AU', city: 'Rockhampton', state: 'QLD' },
  { name: 'Central Queensland University (students)', domain: 'cqumail.com', country: 'AU', city: 'Rockhampton', state: 'QLD' },

  // ── New Zealand ──
  { name: 'New Zealand College of Chiropractic', domain: 'nzchiro.co.nz', country: 'NZ', city: 'Auckland' },
]

async function main() {
  console.log(`Seeding ${SCHOOLS.length} school domains...`)

  const { error } = await (sb as any)
    .from('chiro_schools')
    .upsert(
      SCHOOLS.map(s => ({
        name: s.name,
        domain: s.domain.toLowerCase(),
        country: s.country,
        city: s.city || null,
        state: (s as any).state || null,
        accreditation_status: (s as any).accreditation_status || 'accredited',
        is_active: true,
      })),
      { onConflict: 'domain' }
    )

  if (error) {
    console.error('Seed error:', error.message)
  } else {
    console.log('Done.')
  }

  // Verify
  const { count } = await (sb as any).from('chiro_schools').select('id', { count: 'exact', head: true })
  console.log('Total schools in table:', count)

  // Grandfather existing students
  console.log('\nGrandfathering existing students...')
  const existingStudents = [
    { email: 'colbyleezg@gmail.com', name: 'Colby Lee' },
    { email: 'alvaradomaria10@gmail.com', name: 'Malu Alvarado' },
    { email: 'dldewitt02@gmail.com', name: 'Damontae Dewitt' },
    { email: 'abbyfrick1@gmail.com', name: 'Abigail Frick' },
  ]

  for (const s of existingStudents) {
    // Update profiles table
    const { error: profErr } = await sb.from('profiles')
      .update({ school_verified: true, school_name: 'Grandfathered (pre-verification)' } as any)
      .eq('email', s.email)
    console.log(`  ${s.name}: ${profErr ? 'ERROR ' + profErr.message : 'grandfathered'}`)
  }
}

main().catch(console.error)
