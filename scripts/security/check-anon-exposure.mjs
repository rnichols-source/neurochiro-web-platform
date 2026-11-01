import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PUBLIC_ENV_KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
]

function loadPublicEnv() {
  for (const name of ['.env.local', '.env']) {
    const file = resolve(name)
    if (!existsSync(file)) continue
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq < 1) continue
      const key = trimmed.slice(0, eq).trim()
      if (!PUBLIC_ENV_KEYS.includes(key) || process.env[key]) continue
      let value = trimmed.slice(eq + 1).trim()
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      process.env[key] = value
    }
  }
}

function jwtRole(key) {
  const parts = key.split('.')
  if (parts.length !== 3 || !parts[0].startsWith('eyJ')) return null
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
    return typeof payload.role === 'string' ? payload.role : null
  } catch {
    return null
  }
}

loadPublicEnv()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!url || !key) {
  console.error('missing NEXT_PUBLIC_SUPABASE_URL or public key name')
  process.exit(1)
}
const role = jwtRole(key)
if (key.startsWith('sb_secret') || key.includes('service_role') || role === 'service_role') {
  console.error('refusing service_role or sb_secret key')
  process.exit(1)
}

// Count 0 is not treated as protected. The inventory says those zeros are unproven.
const PRIVATE = [
  'profiles', 'leads', 'job_applications', 'students', 'automation_queue', 'match_cycles',
  'messages', 'conversations', 'doctor_referrals', 'seminar_registrations', 'contact_requests',
  'course_progress', 'student_calls', 'student_call_secrets', 'student_call_rsvps',
  'shadow_requests', 'ai_usage', 'student_notices', 'match_profiles', 'match_interests',
  'matches', 'match_outcomes', 'match_weights', 'match_outcome_tokens', 'match_outcome_prompts',
]
const PUBLIC = ['doctors']

function countFrom(header) {
  if (!header || !header.includes('/')) return null
  const total = header.split('/').pop()
  if (!total || total === '*') return null
  const parsed = Number(total)
  return Number.isFinite(parsed) ? parsed : null
}

async function probe(table) {
  const endpoint = `${url.replace(/\/$/, '')}/rest/v1/${table}?select=*&limit=0`
  const response = await fetch(endpoint, {
    method: 'HEAD',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'count=exact',
    },
  })
  const count = countFrom(response.headers.get('content-range'))
  console.log(`${table} ${response.status} ${count ?? '-'}`)
  return { status: response.status, count }
}

let failed = false
for (const table of PRIVATE) {
  const result = await probe(table)
  const denied = result.status === 401 || result.status === 403 || result.status === 404
  if (!denied) failed = true
}
for (const table of PUBLIC) {
  const result = await probe(table)
  const readable = result.status === 200 || result.status === 206
  if (!(readable && typeof result.count === 'number' && result.count > 0)) failed = true
}
if (failed) process.exit(1)
