import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveMembership } from './membership.ts';

test('founding member with no Stripe customer', () => {
  const membership = deriveMembership({
    isFoundingMember: true,
    membershipTier: 'pro',
    createdAt: '2026-01-01T00:00:00Z',
    hasStripeCustomer: false,
  });
  assert.equal(membership.tier, 'pro');
  assert.equal(membership.source, 'founding');
  assert.equal(membership.status, 'active');
  assert.equal(membership.priceLabel, null);
  assert.equal(membership.isFounder, true);
  assert.equal(membership.hasPracticeTools, true);
});

test('comped pro', () => {
  const membership = deriveMembership({
    membershipTier: 'pro',
    hasStripeCustomer: false,
    createdAt: '2026-08-01T00:00:00Z',
  });
  assert.equal(membership.tier, 'pro');
  assert.equal(membership.source, 'comped');
  assert.equal(membership.priceLabel, '$49/mo');
  assert.equal(membership.hasPracticeTools, false);
});

test('stripe active', () => {
  const membership = deriveMembership({
    membershipTier: 'pro',
    hasStripeCustomer: true,
    stripeStatus: 'active',
    renewsAt: '2026-12-01',
    createdAt: '2026-06-01T00:00:00Z',
  });
  assert.equal(membership.source, 'stripe');
  assert.equal(membership.status, 'active');
  assert.equal(membership.tier, 'pro');
  assert.equal(membership.priceLabel, '$49/mo');
  assert.equal(membership.renewsAt, '2026-12-01');
  assert.equal(membership.hasPracticeTools, true);
});

test('stripe canceled', () => {
  const membership = deriveMembership({
    membershipTier: 'pro',
    hasStripeCustomer: true,
    stripeStatus: 'canceled',
  });
  assert.equal(membership.tier, 'free');
  assert.equal(membership.source, 'stripe');
  assert.equal(membership.status, 'canceled');
  assert.equal(membership.priceLabel, null);
});

test('free', () => {
  const membership = deriveMembership({ membershipTier: 'free', profileTier: 'free' });
  assert.equal(membership.tier, 'free');
  assert.equal(membership.source, 'none');
  assert.equal(membership.hasPracticeTools, false);
  assert.equal(membership.isFounder, false);
});

test('neuros', () => {
  const membership = deriveMembership({
    neurosTier: 'neuros',
    membershipTier: 'pro',
    createdAt: '2026-08-02T00:00:00Z',
  });
  assert.equal(membership.tier, 'neuros');
  assert.equal(membership.source, 'comped');
});
