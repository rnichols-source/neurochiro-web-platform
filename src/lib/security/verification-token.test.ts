import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  consumeVerificationToken,
  hashVerificationToken,
  isVerificationExpired,
  verificationExpiryIso,
  verificationTokensMatch,
  VERIFICATION_TTL_MS,
} from './verification-token.ts'

test('hash is sha256 hex and does not echo the raw token', () => {
  const raw = 'raw-token-value'
  const digest = hashVerificationToken(raw)
  assert.match(digest, /^[0-9a-f]{64}$/)
  assert.equal(digest.includes(raw), false)
  assert.equal(hashVerificationToken(raw), digest)
  assert.notEqual(hashVerificationToken('other'), digest)
})

test('compare is constant-time on the hash and rejects a stored raw token', () => {
  const raw = 'email-link-token'
  const digest = hashVerificationToken(raw)
  assert.equal(verificationTokensMatch(digest, raw), true)
  assert.equal(verificationTokensMatch(raw, raw), false)
  assert.equal(verificationTokensMatch(digest, 'wrong'), false)
  assert.equal(verificationTokensMatch('', raw), false)
})

test('tokens expire after 48 hours', () => {
  const now = Date.parse('2026-11-01T00:00:00Z')
  const expiry = verificationExpiryIso(now)
  assert.equal(Date.parse(expiry) - now, VERIFICATION_TTL_MS)
  assert.equal(isVerificationExpired(expiry, now + VERIFICATION_TTL_MS), true)
  assert.equal(isVerificationExpired(expiry, now + VERIFICATION_TTL_MS - 1), false)
  assert.equal(isVerificationExpired(null, now), false)
})

test('single use clears the stored token', () => {
  const spent = consumeVerificationToken({ id: 's1', verification_token: 'abc' })
  assert.equal(spent.verification_token, null)
  assert.equal(spent.id, 's1')
})

test('verify page source contains the resend copy', () => {
  const source = readFileSync(new URL('../../app/(student)/student/verify/page.tsx', import.meta.url), 'utf8')
  assert.match(source, /This link expired — send a new one/)
  assert.match(source, /VerifyResend/)
  const form = readFileSync(new URL('../../app/(student)/student/verify/resend.tsx', import.meta.url), 'utf8')
  assert.match(form, /sendSchoolVerification/)
  assert.match(form, /Send a new link/)
})
