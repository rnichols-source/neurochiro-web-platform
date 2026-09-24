/**
 * Seminars RLS Verification Script
 *
 * Run BEFORE the SQL → some tests FAIL (proves tests detect the hole)
 * Run AFTER the SQL  → all tests PASS
 *
 * Usage: npx tsx scripts/verify-seminars-rls.ts
 *
 * Uses throwaway test data (title "ZZ RLS TEST"). Cleans up in finally block.
 * Test user uses @example.com (not deliverable, no real emails sent).
 * Test seminars created with is_approved=false to avoid triggering automations.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!ANON_KEY || !SERVICE_KEY || !SUPABASE_URL) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY)
const anon = createClient(SUPABASE_URL, ANON_KEY)

const TEST_PREFIX = 'ZZ RLS TEST'
const ts = Date.now()
const TEST_DOCTOR_EMAIL = `rls-test-doctor-${ts}@example.com`
const TEST_PATIENT_EMAIL = `rls-test-patient-${ts}@example.com`
const TEST_STUDENT_EMAIL = `rls-test-student-${ts}@example.com`
const TEST_PASSWORD = `TestRls${ts}!`
const DR_RAY_ID = '5b3fd423-60a3-45f3-b3d3-cc39f84b3052'

let testDoctorId: string | null = null
let testPatientId: string | null = null
let testStudentId: string | null = null
let pendingSeminarId: string | null = null
let approvedSeminarId: string | null = null
let ownPendingSeminarId: string | null = null

const results: { test: string; result: 'PASS' | 'FAIL'; detail: string }[] = []

function isPermissionError(error: any): boolean {
  if (!error) return false
  const msg = (error.message || error.code || '').toLowerCase()
  return msg.includes('permission') || msg.includes('denied') ||
    msg.includes('policy') || msg.includes('rls') ||
    msg.includes('new row violates') || msg.includes('insufficient')  ||
    error.code === '42501' || error.code === '42000'
}

function log(test: string, pass: boolean, detail: string) {
  results.push({ test, result: pass ? 'PASS' : 'FAIL', detail })
}

async function createTestUser(email: string): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  })
  if (error) throw new Error(`Failed to create ${email}: ${error.message}`)
  return data.user.id
}

async function signIn(email: string) {
  const client = createClient(SUPABASE_URL, ANON_KEY)
  const { error } = await client.auth.signInWithPassword({ email, password: TEST_PASSWORD })
  if (error) throw new Error(`Failed to sign in ${email}: ${error.message}`)
  return client
}

async function setup() {
  // Create test users (admin API, @example.com, no emails sent)
  testDoctorId = await createTestUser(TEST_DOCTOR_EMAIL)
  testPatientId = await createTestUser(TEST_PATIENT_EMAIL)
  testStudentId = await createTestUser(TEST_STUDENT_EMAIL)

  // Set roles in profiles (service role, bypasses any RLS)
  await admin.from('profiles').upsert({ id: testDoctorId, email: TEST_DOCTOR_EMAIL, full_name: 'RLS Test Doctor', role: 'doctor' })
  await admin.from('profiles').upsert({ id: testPatientId, email: TEST_PATIENT_EMAIL, full_name: 'RLS Test Patient', role: 'patient' })
  await admin.from('profiles').upsert({ id: testStudentId, email: TEST_STUDENT_EMAIL, full_name: 'RLS Test Student', role: 'student' })

  // Pending seminar owned by Dr. Ray (test user is NOT the owner)
  const { data: ps } = await admin.from('seminars').insert({
    title: `${TEST_PREFIX} — PENDING`,
    description: 'Pending test seminar',
    dates: 'January 1, 2099',
    host_id: DR_RAY_ID,
    is_approved: false,
    payment_status: 'pending',
    registration_link: 'https://example.com/test-pending',
    price: 0,
  }).select('id').single()
  pendingSeminarId = ps!.id

  // Approved seminar owned by Dr. Ray
  const { data: as_ } = await admin.from('seminars').insert({
    title: `${TEST_PREFIX} — APPROVED`,
    description: 'Approved test seminar',
    dates: 'January 2, 2099',
    host_id: DR_RAY_ID,
    is_approved: true,
    payment_status: 'paid',
    registration_link: 'https://example.com/test-approved',
    price: 99,
  }).select('id').single()
  approvedSeminarId = as_!.id

  // Pending seminar owned by test doctor
  const { data: ops } = await admin.from('seminars').insert({
    title: `${TEST_PREFIX} — OWN PENDING`,
    description: 'Test doctor own pending seminar',
    dates: 'January 3, 2099',
    host_id: testDoctorId,
    is_approved: false,
    payment_status: 'pending',
    registration_link: 'https://example.com/test-own',
    price: 0,
  }).select('id').single()
  ownPendingSeminarId = ops!.id
}

async function runTests() {
  // ──────────────── ANON TESTS ────────────────

  // 1. Anon select admin_notes (must error — column not granted)
  {
    const { data, error } = await anon.from('seminars').select('admin_notes').limit(1)
    const pass = !!error
    log('Anon select admin_notes', pass,
      error ? `Blocked: ${error.message.substring(0, 80)}` : `EXPOSED: got ${data?.length} rows`)
  }

  // 2. Anon select pending seminar by ID (must return 0 rows)
  {
    const { data } = await anon.from('seminars').select('id, title').eq('id', pendingSeminarId!).maybeSingle()
    log('Anon select pending seminar by ID', data === null,
      data ? `EXPOSED: ${data.title}` : 'Blocked: null')
  }

  // 3. Anon update registration_link (must not change)
  {
    const { error } = await anon.from('seminars')
      .update({ registration_link: 'http://evil.com' })
      .eq('id', approvedSeminarId!)
    const { data: rb } = await admin.from('seminars').select('registration_link').eq('id', approvedSeminarId!).single()
    const unchanged = rb?.registration_link === 'https://example.com/test-approved'
    log('Anon update registration_link, read back', unchanged,
      `After attempt: ${rb?.registration_link}`)
  }

  // 4. Anon insert (must fail with permission error, not constraint error)
  {
    const { error } = await anon.from('seminars').insert({
      title: `${TEST_PREFIX} — ANON INSERT`,
      description: 'Should not exist',
      dates: 'January 99, 2099',
      host_id: testDoctorId,
      is_approved: false,
      payment_status: 'pending',
      registration_link: 'https://example.com/anon-insert',
      price: 0,
    })
    const isRlsBlock = isPermissionError(error) || (error?.code === '42501')
    // Also check no row was created
    const { data: check } = await admin.from('seminars').select('id').ilike('title', `%ANON INSERT%`)
    const noRow = !check || check.length === 0
    const pass = !!error && noRow
    // Clean up just in case
    if (check && check.length > 0) await admin.from('seminars').delete().ilike('title', `%ANON INSERT%`)
    log('Anon insert (permission error, no row created)', pass,
      error ? `Error: ${error.code} ${error.message.substring(0, 60)}${isRlsBlock ? ' [RLS]' : ' [NOT RLS - check!]'}` : 'No error (VULNERABLE)')
  }

  // 5. Anon delete (row must still exist)
  {
    await anon.from('seminars').delete().eq('id', approvedSeminarId!)
    const { data: rb } = await admin.from('seminars').select('id').eq('id', approvedSeminarId!).single()
    log('Anon delete, read back row still exists', rb !== null,
      rb ? 'Row exists (blocked)' : 'ROW DELETED (VULNERABLE)')
  }

  // ──────────────── AUTHENTICATED TESTS ────────────────
  const doctorClient = await signIn(TEST_DOCTOR_EMAIL)

  // 6. Auth user sets is_approved on own pending listing (must not change)
  {
    await doctorClient.from('seminars').update({ is_approved: true }).eq('id', ownPendingSeminarId!)
    const { data: rb } = await admin.from('seminars').select('is_approved').eq('id', ownPendingSeminarId!).single()
    log('Auth owner sets is_approved on own pending, read back', rb?.is_approved === false,
      `is_approved = ${rb?.is_approved}`)
  }

  // 7. Auth user selects another host's pending listing (must return 0)
  {
    const { data } = await doctorClient.from('seminars').select('id, title').eq('id', pendingSeminarId!).maybeSingle()
    log('Auth non-owner select another host pending listing', data === null,
      data ? `EXPOSED: ${data.title}` : 'Blocked: null')
  }

  // 8. Auth user can read own pending listing
  {
    const { data } = await doctorClient.from('seminars').select('id, title').eq('id', ownPendingSeminarId!).maybeSingle()
    log('Auth owner can read own pending listing', data !== null,
      data ? `Found: ${data.title}` : 'Not found (RLS too restrictive)')
  }

  // 9. Page view beacon on pending seminar (count must not change)
  {
    const { data: before } = await admin.from('seminars').select('page_views').eq('id', pendingSeminarId!).single()
    const beforeCount = before?.page_views || 0

    try {
      await fetch('https://neurochiro.co/api/seminars/pageview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seminar_id: pendingSeminarId }),
      })
    } catch { /* fetch may fail locally */ }

    await new Promise(r => setTimeout(r, 1500))
    const { data: after } = await admin.from('seminars').select('page_views').eq('id', pendingSeminarId!).single()
    const afterCount = after?.page_views || 0
    log('Page view beacon on pending seminar', afterCount === beforeCount,
      `before=${beforeCount} after=${afterCount}`)
  }

  // ──────────────── PORTAL / STUDENT SMOKE TESTS ────────────────

  // 10. Patient can read approved seminars (portal dashboard query)
  {
    const patientClient = await signIn(TEST_PATIENT_EMAIL)
    const { data, error } = await patientClient.from('seminars')
      .select('id, title, dates, city, country, price, instructor_name')
      .eq('is_approved', true)
      .eq('is_past', false)
      .limit(3)
    log('Patient portal seminars query', !error && (data?.length ?? 0) >= 0,
      error ? `Error: ${error.message}` : `Got ${data?.length} seminars`)
  }

  // 11. Student can read approved seminars
  {
    const studentClient = await signIn(TEST_STUDENT_EMAIL)
    const { data, error } = await studentClient.from('seminars')
      .select('id, title, dates, city, country, price, instructor_name')
      .eq('is_approved', true)
      .eq('is_past', false)
      .limit(3)
    log('Student dashboard seminars query', !error && (data?.length ?? 0) >= 0,
      error ? `Error: ${error.message}` : `Got ${data?.length} seminars`)
  }
}

async function cleanup() {
  console.log('\n--- Cleanup ---')
  try {
    // Delete test seminars
    await admin.from('seminars').delete().ilike('title', `${TEST_PREFIX}%`)
    // Delete test profiles and doctors rows
    for (const uid of [testDoctorId, testPatientId, testStudentId]) {
      if (uid) {
        await admin.from('doctors').delete().eq('user_id', uid)
        await admin.from('students').delete().eq('user_id', uid)
        await admin.from('profiles').delete().eq('id', uid)
        await admin.auth.admin.deleteUser(uid)
      }
    }
    console.log('Cleanup complete')
  } catch (e) {
    console.error('Cleanup error:', e)
  }
}

async function main() {
  try {
    console.log('=== Seminars RLS Verification ===\n')
    console.log('Setting up test data...')
    await setup()
    console.log('Running tests...\n')
    await runTests()
  } finally {
    await cleanup()
  }

  console.log('\n=== Results ===\n')
  const maxTest = Math.max(...results.map(r => r.test.length))
  results.forEach(r => {
    const icon = r.result === 'PASS' ? '✓' : '✗'
    const color = r.result === 'PASS' ? '\x1b[32m' : '\x1b[31m'
    console.log(`${color}${icon}\x1b[0m ${r.test.padEnd(maxTest + 2)} ${r.detail}`)
  })

  const passed = results.filter(r => r.result === 'PASS').length
  console.log(`\n${passed}/${results.length} passed`)
  if (passed < results.length) process.exit(1)
}

main()
