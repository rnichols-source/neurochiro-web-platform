import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveStudentMembership, hasMemberAccess } from './membership-pure.ts';
import { priceMatches } from './price-guard.ts';
import { canRequestShadow } from './shadow.ts';
import { autoCompletedSteps } from './roadmap.ts';

test('paid student is a member at $33', () => {
  const membership = deriveStudentMembership({ tier: 'student_paid', priceCents: 3300 });
  assert.equal(membership.status, 'member');
  assert.equal(membership.priceLabel, '$33/month');
  assert.equal(hasMemberAccess(membership), true);
});

test('annual price is labeled $333/year', () => {
  const membership = deriveStudentMembership({ subscriptionStatus: 'trialing', priceCents: 33300 });
  assert.equal(membership.plan, 'annual');
  assert.equal(membership.priceLabel, '$333/year');
});

test('$12 subscriber stays grandfathered', () => {
  const membership = deriveStudentMembership({ tier: 'student_paid', priceCents: 1200 });
  assert.equal(membership.source, 'grandfathered');
  assert.equal(membership.priceLabel, 'Your plan: $12/month (original rate)');
});

test('comped students are members', () => {
  const membership = deriveStudentMembership({ tier: 'student_comped' });
  assert.equal(membership.source, 'comped');
  assert.equal(membership.status, 'member');
});

test('admins count as members', () => {
  assert.equal(deriveStudentMembership({ role: 'founder' }).status, 'member');
});

test('grace covers signups from before launch', () => {
  const membership = deriveStudentMembership({
    tier: 'free',
    createdAt: '2026-10-01T00:00:00.000Z',
    launchAt: '2026-11-01T00:00:00.000Z',
    now: '2026-11-15T00:00:00.000Z',
    graceDays: 30,
  });
  assert.equal(membership.status, 'grace');
});

test('student_paid past_due stays past_due inside the window', () => {
  const membership = deriveStudentMembership({
    tier: 'student_paid',
    subscriptionStatus: 'past_due',
    pastDueSince: '2026-11-01T00:00:00.000Z',
    now: '2026-11-05T00:00:00.000Z',
  });
  assert.equal(membership.status, 'past_due');
  assert.equal(hasMemberAccess(membership), true);
});

test('past_due keeps access for 7 days', () => {
  const inside = deriveStudentMembership({
    subscriptionStatus: 'past_due',
    pastDueSince: '2026-11-01T00:00:00.000Z',
    now: '2026-11-05T00:00:00.000Z',
  });
  const outside = deriveStudentMembership({
    subscriptionStatus: 'past_due',
    pastDueSince: '2026-11-01T00:00:00.000Z',
    now: '2026-11-20T00:00:00.000Z',
  });
  assert.equal(inside.status, 'past_due');
  assert.equal(hasMemberAccess(inside), true);
  assert.equal(outside.status, 'free');
});

test('a wrong Stripe amount is refused', () => {
  assert.equal(priceMatches(2750, 'year', 33300, 'year'), false);
  assert.equal(priceMatches(33300, 'year', 33300, 'year'), true);
  assert.equal(priceMatches(3300, 'month', 3300, 'year'), false);
});

test('shadow requests stop at 3 and at one per doctor', () => {
  assert.equal(canRequestShadow({ openCount: 2, alreadyOpenWithDoctor: false }).ok, true);
  assert.equal(canRequestShadow({ openCount: 3, alreadyOpenWithDoctor: false }).ok, false);
  assert.equal(canRequestShadow({ openCount: 0, alreadyOpenWithDoctor: true }).ok, false);
});

test('roadmap auto-completes steps the data proves', () => {
  assert.deepEqual(autoCompletedSteps({ quizDone: true, contractSaved: true }), ['technique-quiz', 'sample-contract']);
});
