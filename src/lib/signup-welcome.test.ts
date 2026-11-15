import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  isDoctorSignupRole,
  resolvedSignupRole,
  shouldQueueSignupWelcome,
  signupWelcomeKind,
} from './signup-welcome.ts'

test('membership checkout role lives on app metadata and is a doctor', () => {
  const role = resolvedSignupRole({
    userMetadataRole: null,
    appMetadataRole: 'doctor',
  })
  assert.equal(role, 'doctor')
  assert.equal(shouldQueueSignupWelcome(role), false)
  assert.equal(signupWelcomeKind({ queuedRole: 'patient', accountRole: role }), 'skip')
})

test('a queued patient welcome is skipped when the account is a doctor', () => {
  assert.equal(signupWelcomeKind({ queuedRole: 'patient', accountRole: 'doctor' }), 'skip')
  assert.equal(signupWelcomeKind({ queuedRole: 'Doctor', accountRole: null }), 'skip')
  assert.equal(signupWelcomeKind({ queuedRole: 'patient', accountRole: 'doctor_pro' }), 'skip')
})

test('community member signups still get the community welcome', () => {
  const role = resolvedSignupRole({ userMetadataRole: 'patient', appMetadataRole: null })
  assert.equal(role, 'patient')
  assert.equal(shouldQueueSignupWelcome(role), true)
  assert.equal(signupWelcomeKind({ queuedRole: role, accountRole: 'patient' }), 'community')
})

test('students and vendors still get their own welcomes', () => {
  assert.equal(shouldQueueSignupWelcome('student'), true)
  assert.equal(signupWelcomeKind({ queuedRole: 'student', accountRole: 'student' }), 'student')
  assert.equal(shouldQueueSignupWelcome('vendor'), true)
  assert.equal(signupWelcomeKind({ queuedRole: 'vendor', accountRole: 'vendor' }), 'vendor')
})

test('an unknown role stays on the generic welcome and is not treated as a community member', () => {
  assert.equal(signupWelcomeKind({ queuedRole: '', accountRole: null }), 'generic')
  assert.equal(signupWelcomeKind({ queuedRole: 'admin', accountRole: 'admin' }), 'generic')
})

test('the database trigger uses the same doctor rule', () => {
  const sql = readFileSync(join(
    dirname(fileURLToPath(import.meta.url)),
    '../../supabase/migrations/20261115163000_skip_doctor_signup_welcome.sql',
  ), 'utf8')
  assert.match(sql, /raw_app_meta_data->>'role'/)
  assert.match(sql, /if app_role like '%doctor%'/)
  assert.match(sql, /if user_role_raw not like '%doctor%'/)
  assert.match(sql, /'welcome_email'/)
  assert.match(sql, /community members, students, and vendors/i)
})

test('app metadata doctor wins over an empty or patient user metadata role', () => {
  assert.equal(resolvedSignupRole({ userMetadataRole: '', appMetadataRole: 'doctor' }), 'doctor')
  assert.equal(resolvedSignupRole({ userMetadataRole: 'patient', appMetadataRole: 'doctor' }), 'doctor')
  assert.equal(resolvedSignupRole({ userMetadataRole: 'student', appMetadataRole: '' }), 'student')
  assert.equal(resolvedSignupRole({ userMetadataRole: null, appMetadataRole: null }), 'patient')
  assert.equal(isDoctorSignupRole('  Doctor '), true)
  assert.equal(isDoctorSignupRole('patient'), false)
})
