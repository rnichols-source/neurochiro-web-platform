import assert from 'node:assert/strict'
import test from 'node:test'
import {
  claimReviewAlert,
  decideDoctorClaim,
  existingMemberLoginAlert,
  isBlankSignupRow,
  isEstablishedDoctor,
  normalizeClaimEmail,
  userAlreadyHasRealProfile,
  profilePatchForClaim,
  shouldAttemptDoctorClaim,
  type ClaimCandidate,
} from './claim-existing.ts'

const real: ClaimCandidate = {
  id: 'real',
  user_id: null,
  email: '  Rise@RiseWellnessChiro.com ',
  first_name: 'Rachel',
  last_name: 'Babbitt',
  slug: 'dr-rachel-babbitt',
  clinic_name: 'Rise Wellness',
  city: 'Greenville',
  membership_tier: 'pro',
  verification_status: 'verified',
  is_approved: true,
  stripe_customer_id: 'cus_rachel',
}

test('email match ignores case and surrounding spaces', () => {
  assert.equal(normalizeClaimEmail('  Rise@Example.com '), 'rise@example.com')
  const decision = decideDoctorClaim('user-1', 'rise@risewellnesschiro.com', [real])
  assert.equal(decision.action, 'claim')
  if (decision.action === 'claim') assert.equal(decision.doctor.id, 'real')
})

test('claims only the single unclaimed row', () => {
  const taken: ClaimCandidate = { ...real, id: 'taken', user_id: 'someone-else', email: 'rise@risewellnesschiro.com' }
  const decision = decideDoctorClaim('user-1', 'rise@risewellnesschiro.com', [real, taken])
  assert.equal(decision.action, 'claim')
  if (decision.action === 'claim') assert.equal(decision.doctor.id, 'real')
})

test('does not steal a profile that already has a different login', () => {
  const taken: ClaimCandidate = { ...real, user_id: 'someone-else' }
  const decision = decideDoctorClaim('user-1', 'rise@risewellnesschiro.com', [taken])
  assert.deepEqual(decision, { action: 'review', reason: 'taken' })
})

test('does not claim when two unclaimed profiles match', () => {
  const second: ClaimCandidate = { ...real, id: 'other', slug: 'dr-rachel-2' }
  const decision = decideDoctorClaim('user-1', 'rise@risewellnesschiro.com', [real, second])
  assert.deepEqual(decision, { action: 'review', reason: 'ambiguous' })
})

test('an incomplete lookup is treated as ambiguous', () => {
  const decision = decideDoctorClaim('user-1', 'rise@risewellnesschiro.com', [real], { truncated: true })
  assert.deepEqual(decision, { action: 'review', reason: 'ambiguous' })
})

test('a profile already linked to this login is left as-is', () => {
  const mine: ClaimCandidate = { ...real, user_id: 'user-1' }
  const decision = decideDoctorClaim('user-1', 'rise@risewellnesschiro.com', [mine])
  assert.equal(decision.action, 'already-linked')
})

test('no email match means a normal new signup', () => {
  assert.deepEqual(decideDoctorClaim('user-1', 'new@example.com', [real]), { action: 'none' })
  assert.deepEqual(decideDoctorClaim('user-1', '   ', []), { action: 'none' })
})

test('profile sync copies pro tier, stripe customer, and the listing name', () => {
  assert.deepEqual(profilePatchForClaim(real), {
    role: 'doctor',
    tier: 'pro',
    stripe_customer_id: 'cus_rachel',
    full_name: 'Rachel Babbitt',
  })
  const founding: ClaimCandidate = { ...real, membership_tier: 'free', stripe_customer_id: null, is_founding_member: true }
  assert.equal(profilePatchForClaim(founding).tier, 'pro')
  assert.equal('stripe_customer_id' in profilePatchForClaim(founding), false)
})

test('a free unclaimed listing does not become Pro', () => {
  const seeded: ClaimCandidate = {
    ...real,
    membership_tier: 'free',
    verification_status: 'pending',
    is_approved: false,
    stripe_customer_id: null,
    paid_at: null,
    is_founding_member: false,
  }
  const patch = profilePatchForClaim(seeded)
  assert.equal(patch.role, 'doctor')
  assert.equal('tier' in patch, false)
  assert.equal(isEstablishedDoctor(seeded), false)
  assert.equal(isEstablishedDoctor({ ...seeded, verification_status: 'verified' }), true)
})

test('blank signup rows are the empty duplicates, not the real listing', () => {
  assert.equal(isBlankSignupRow(real), false)
  assert.equal(isBlankSignupRow({
    id: 'blank',
    user_id: 'user-1',
    email: 'rise@risewellnesschiro.com',
    clinic_name: '',
    city: '',
    bio: '',
    membership_tier: 'free',
    verification_status: 'hidden',
  }), true)
  assert.equal(isBlankSignupRow({
    id: 'trigger',
    user_id: 'user-1',
    email: 'rise@risewellnesschiro.com',
    clinic_name: 'Private Practice',
    membership_tier: 'starter',
    verification_status: 'pending',
  }), true)
})

test('a login that already has a real profile does not take a second one', () => {
  assert.equal(userAlreadyHasRealProfile([real]), true)
  assert.equal(userAlreadyHasRealProfile([{
    id: 'blank',
    user_id: 'user-1',
    email: 'rise@risewellnesschiro.com',
    clinic_name: '',
    membership_tier: 'free',
    verification_status: 'hidden',
  }]), false)
})

test('students and staff are not auto-linked on login', () => {
  assert.equal(shouldAttemptDoctorClaim('doctor'), true)
  assert.equal(shouldAttemptDoctorClaim('patient'), true)
  assert.equal(shouldAttemptDoctorClaim(''), true)
  assert.equal(shouldAttemptDoctorClaim('student'), false)
  assert.equal(shouldAttemptDoctorClaim('admin'), false)
})

test('existing-member alert is distinct from a new application', () => {
  const message = existingMemberLoginAlert({
    name: 'Rachel Babbitt',
    email: 'rise@risewellnesschiro.com',
    slug: 'dr-rachel-babbitt',
  })
  assert.match(message, /Existing member Rachel Babbitt created their login/)
  assert.match(message, /https:\/\/neurochiro\.co\/directory\/dr-rachel-babbitt/)
  assert.doesNotMatch(message, /NEW SIGNUP/i)
  assert.doesNotMatch(message, /application started/i)
  assert.doesNotMatch(message, /cus_/)

  const review = claimReviewAlert({ email: 'rise@risewellnesschiro.com', reason: 'taken' })
  assert.match(review, /already linked to a different login/)
  assert.match(review, /https:\/\/neurochiro\.co\/admin\/members/)
})
