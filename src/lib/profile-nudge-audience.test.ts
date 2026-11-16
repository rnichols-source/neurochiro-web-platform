import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isPaidActiveNudgeDoctor, type NudgeDoctor } from './profile-nudge-audience.ts'

function row(overrides: NudgeDoctor): NudgeDoctor {
  return {
    user_id: 'user-1',
    verification_status: 'verified',
    is_test: false,
    membership_tier: 'pro',
    is_founding_member: false,
    neuros_tier: null,
    created_at: '2026-08-01T00:00:00Z',
    profile_tier: 'pro',
    ...overrides,
  }
}

describe('profile nudge audience', () => {
  it('includes a verified paid doctor', () => {
    assert.equal(isPaidActiveNudgeDoctor(row({})), true)
  })

  it('includes a founding member and a neuros member', () => {
    assert.equal(isPaidActiveNudgeDoctor(row({
      membership_tier: 'free',
      profile_tier: 'free',
      is_founding_member: true,
    })), true)
    assert.equal(isPaidActiveNudgeDoctor(row({
      membership_tier: 'free',
      profile_tier: 'free',
      neuros_tier: 'neuros',
    })), true)
  })

  it('includes an older growth plan', () => {
    assert.equal(isPaidActiveNudgeDoctor(row({ membership_tier: 'growth', profile_tier: 'standard' })), true)
  })

  it('skips unpaid, unverified, test, and legacy listings', () => {
    assert.equal(isPaidActiveNudgeDoctor(row({ membership_tier: 'free', profile_tier: 'free' })), false)
    assert.equal(isPaidActiveNudgeDoctor(row({ verification_status: 'pending' })), false)
    assert.equal(isPaidActiveNudgeDoctor(row({ verification_status: 'hidden' })), false)
    assert.equal(isPaidActiveNudgeDoctor(row({ is_test: true })), false)
    assert.equal(isPaidActiveNudgeDoctor(row({ user_id: null })), false)
  })
})
