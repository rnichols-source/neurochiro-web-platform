import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { PUBLIC_LISTING_OR, isDoctorPubliclyVisible, type PublicListingRow } from './visibility.ts'

function row(overrides: PublicListingRow): PublicListingRow {
  return {
    verification_status: 'pending',
    user_id: null,
    is_approved: false,
    is_founding_member: false,
    membership_tier: 'free',
    paid_at: null,
    ...overrides,
  }
}

describe('public doctor listings', () => {
  it('keeps an unclaimed pending seeded listing public', () => {
    assert.equal(isDoctorPubliclyVisible(row({ user_id: null, verification_status: 'pending' })), true)
  })

  it('keeps an unclaimed verified free listing public', () => {
    assert.equal(isDoctorPubliclyVisible(row({
      user_id: null,
      verification_status: 'verified',
      membership_tier: 'free',
    })), true)
  })

  it('keeps verified and paying members public even when approval is still false', () => {
    assert.equal(isDoctorPubliclyVisible(row({
      user_id: 'user-1',
      verification_status: 'verified',
      membership_tier: 'pro',
      is_approved: false,
    })), true)
    assert.equal(isDoctorPubliclyVisible(row({
      user_id: 'user-2',
      verification_status: 'pending',
      membership_tier: 'pro',
      is_approved: false,
    })), true)
    assert.equal(isDoctorPubliclyVisible(row({
      user_id: 'user-3',
      is_founding_member: true,
      membership_tier: 'free',
      is_approved: false,
    })), true)
    assert.equal(isDoctorPubliclyVisible(row({
      user_id: 'user-4',
      paid_at: '2026-08-01T00:00:00Z',
      membership_tier: 'free',
      is_approved: false,
    })), true)
  })

  it('hides a claimed pending free signup that was never approved or paid', () => {
    assert.equal(isDoctorPubliclyVisible(row({
      user_id: 'user-junk',
      verification_status: 'pending',
      membership_tier: 'free',
      is_approved: false,
      is_founding_member: false,
      paid_at: null,
    })), false)
    assert.equal(isDoctorPubliclyVisible(row({
      user_id: 'user-junk',
      membership_tier: null,
      is_approved: null,
    })), false)
  })

  it('hides rejected, hidden, and empty statuses', () => {
    assert.equal(isDoctorPubliclyVisible(row({ verification_status: 'hidden', user_id: null })), false)
    assert.equal(isDoctorPubliclyVisible(row({ verification_status: 'rejected', user_id: null })), false)
    assert.equal(isDoctorPubliclyVisible(row({ verification_status: '', user_id: null })), false)
  })

  it('publishes an approved doctor', () => {
    assert.equal(isDoctorPubliclyVisible(row({
      user_id: 'user-5',
      verification_status: 'verified',
      is_approved: true,
      membership_tier: 'pro',
    })), true)
  })

  it('matches the database filter clauses', () => {
    assert.match(PUBLIC_LISTING_OR, /user_id\.is\.null/)
    assert.match(PUBLIC_LISTING_OR, /is_approved\.eq\.true/)
    assert.match(PUBLIC_LISTING_OR, /is_founding_member\.eq\.true/)
    assert.match(PUBLIC_LISTING_OR, /membership_tier\.in\.\(basic,growth,pro,neuros\)/)
    assert.match(PUBLIC_LISTING_OR, /paid_at\.not\.is\.null/)
    assert.match(PUBLIC_LISTING_OR, /verification_status\.eq\.verified/)
  })
})
