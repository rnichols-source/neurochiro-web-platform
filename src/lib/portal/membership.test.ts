import test from 'node:test';
import assert from 'node:assert/strict';
import { accessForStripeStatus, deriveMembership, PRO_PRICE_LABEL } from './membership.ts';
import { NEW_PRICING_START, activeUsdDoctorPlan } from '../pricing.ts';

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
  assert.equal(membership.priceLabel, PRO_PRICE_LABEL);
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
  assert.equal(membership.priceLabel, PRO_PRICE_LABEL);
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

const accessCases = [
  { status: 'active', paid: true, paymentIssue: false },
  { status: 'trialing', paid: true, paymentIssue: false },
  { status: 'past_due', paid: true, paymentIssue: true },
  { status: 'incomplete', paid: 'unchanged', paymentIssue: false },
  { status: 'paused', paid: 'unchanged', paymentIssue: true },
  { status: 'canceled', paid: false, paymentIssue: false },
  { status: 'unpaid', paid: false, paymentIssue: false },
  { status: 'incomplete_expired', paid: false, paymentIssue: false },
] as const;

for (const role of ['doctor', 'student']) {
  for (const entry of accessCases) {
    test(`access ${role} ${entry.status}`, () => {
      assert.deepEqual(accessForStripeStatus(entry.status, role), {
        paid: entry.paid,
        paymentIssue: entry.paymentIssue,
      });
    });
  }
}

test('derive unpaid is free', () => {
  const membership = deriveMembership({
    hasStripeCustomer: true,
    stripeStatus: 'unpaid',
    membershipTier: 'pro',
  });
  assert.equal(membership.tier, 'free');
  assert.equal(membership.status, 'unpaid');
});

test('derive incomplete_expired is free', () => {
  const membership = deriveMembership({
    hasStripeCustomer: true,
    stripeStatus: 'incomplete_expired',
    membershipTier: 'pro',
  });
  assert.equal(membership.tier, 'free');
  assert.equal(membership.status, 'incomplete_expired');
});

test('derive past_due stays pro', () => {
  const membership = deriveMembership({
    hasStripeCustomer: true,
    stripeStatus: 'past_due',
    membershipTier: 'pro',
  });
  assert.equal(membership.tier, 'pro');
  assert.equal(membership.status, 'past_due');
  assert.equal(membership.priceLabel, PRO_PRICE_LABEL);
});

test('an existing member keeps the legacy price label after new-member pricing starts', () => {
  assert.equal(PRO_PRICE_LABEL, '$99/mo');
  assert.notEqual(PRO_PRICE_LABEL, activeUsdDoctorPlan(NEW_PRICING_START).perMonth);
  const membership = deriveMembership({
    membershipTier: 'pro',
    hasStripeCustomer: true,
    stripeStatus: 'active',
    createdAt: '2026-06-01T00:00:00Z',
  });
  assert.equal(membership.priceLabel, '$99/mo');
});

test('derive trialing stays pro', () => {
  const membership = deriveMembership({
    hasStripeCustomer: true,
    stripeStatus: 'trialing',
    membershipTier: 'pro',
  });
  assert.equal(membership.tier, 'pro');
  assert.equal(membership.status, 'trialing');
});

test('derive incomplete does not grant access', () => {
  const membership = deriveMembership({
    hasStripeCustomer: true,
    stripeStatus: 'incomplete',
    membershipTier: 'free',
  });
  assert.equal(membership.tier, 'free');
  assert.equal(membership.status, 'incomplete');
});

test('derive incomplete does not revoke stored pro', () => {
  const membership = deriveMembership({
    hasStripeCustomer: true,
    stripeStatus: 'incomplete',
    membershipTier: 'pro',
  });
  assert.equal(membership.tier, 'pro');
  assert.equal(membership.status, 'incomplete');
});

test('derive paused keeps stored pro', () => {
  const membership = deriveMembership({
    hasStripeCustomer: true,
    stripeStatus: 'paused',
    membershipTier: 'pro',
  });
  assert.equal(membership.tier, 'pro');
  assert.equal(membership.status, 'paused');
});
