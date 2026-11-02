import assert from 'node:assert/strict'
import test from 'node:test'
import { classifyMemberBilling } from './billing-class.ts'

test('live stripe status wins over a stored paid tier', () => {
  assert.equal(classifyMemberBilling({ stripeOk: true, live: 'active', membershipTier: 'pro' }), 'paying')
  assert.equal(classifyMemberBilling({ stripeOk: true, live: 'trialing', membershipTier: 'pro' }), 'trialing')
  assert.equal(classifyMemberBilling({ stripeOk: true, live: 'past_due', membershipTier: 'pro' }), 'past_due')
})

test('a paid stored tier with no live subscription is a mismatch', () => {
  assert.equal(classifyMemberBilling({ stripeOk: true, live: null, membershipTier: 'pro' }), 'mismatch')
  assert.equal(classifyMemberBilling({ stripeOk: true, live: null, membershipTier: 'growth' }), 'mismatch')
  assert.equal(classifyMemberBilling({ stripeOk: true, live: null, neurosTier: 'neuros' }), 'mismatch')
})

test('founding and explicit comped stay founding when there is no live subscription', () => {
  assert.equal(
    classifyMemberBilling({ stripeOk: true, live: null, membershipTier: 'pro', isFoundingMember: true }),
    'founding-comped',
  )
  assert.equal(classifyMemberBilling({ stripeOk: true, live: null, profileTier: 'comped' }), 'founding-comped')
  assert.equal(classifyMemberBilling({ stripeOk: true, live: null, neurosTier: 'neuros_founding' }), 'founding-comped')
})

test('stripe failure is unknown and pending verification is pending', () => {
  assert.equal(classifyMemberBilling({ stripeOk: false, live: null, membershipTier: 'pro' }), 'unknown')
  assert.equal(classifyMemberBilling({ stripeOk: true, live: null, verificationStatus: 'pending' }), 'pending')
  assert.equal(classifyMemberBilling({ stripeOk: true, live: null, membershipTier: 'free' }), 'free')
})
