import test from 'node:test';
import assert from 'node:assert/strict';
import { formatPlanPrice, pickMembershipSubscription, statusLabel, type RawSubscription } from './membership-subscription.ts';

function raw(id: string, status: string, overrides: Partial<RawSubscription> = {}, amount = 9900, currency = 'usd', interval = 'month', count = 1, periodEnd = 1796000000): RawSubscription {
  return {
    id,
    status,
    created: 1790000000,
    cancel_at_period_end: false,
    metadata: {},
    items: { data: [{ current_period_end: periodEnd, price: { unit_amount: amount, currency, recurring: { interval, interval_count: count } } }] },
    ...overrides,
  };
}

test('picks the live membership over a canceled one and over a seminar subscription', () => {
  const picked = pickMembershipSubscription([
    raw('sub_old', 'canceled', { created: 1795000000 }),
    raw('sub_seminar', 'active', { metadata: { type: 'seminar_package' } }, 50000),
    raw('sub_member', 'active', {}, 3900),
  ]);
  assert.equal(picked?.id, 'sub_member');
  assert.equal(picked?.price, 39);
  assert.equal(picked?.periodEnd, 1796000000);
});

test('a past_due membership is still picked before an ended one', () => {
  assert.equal(pickMembershipSubscription([raw('a', 'incomplete_expired'), raw('b', 'past_due')])?.id, 'b');
});

test('the newest wins within the same status', () => {
  const picked = pickMembershipSubscription([raw('older', 'canceled', { created: 1 }), raw('newer', 'canceled', { created: 2 })]);
  assert.equal(picked?.id, 'newer');
});

test('only Synapse or seminar subscriptions means no membership', () => {
  assert.equal(pickMembershipSubscription([raw('s', 'active', { metadata: { type: 'synapse_seat' } })]), null);
  assert.equal(pickMembershipSubscription([]), null);
});

test('falls back to the subscription period end and reads cancel at period end', () => {
  const sub = raw('x', 'active', { current_period_end: 1700000000, cancel_at_period_end: true });
  sub.items = { data: [{ price: { unit_amount: 39700, currency: 'usd', recurring: { interval: 'month', interval_count: 12 } } }] };
  const picked = pickMembershipSubscription([sub]);
  assert.equal(picked?.periodEnd, 1700000000);
  assert.equal(picked?.cancelAtPeriodEnd, true);
  assert.equal(picked?.intervalCount, 12);
});

test('formatPlanPrice reads like the price the member pays', () => {
  assert.equal(formatPlanPrice({ price: 99, currency: 'usd', interval: 'month', intervalCount: 1 }), '$99/mo');
  assert.equal(formatPlanPrice({ price: 29, currency: 'usd', interval: 'month', intervalCount: 1 }), '$29/mo');
  assert.equal(formatPlanPrice({ price: 397, currency: 'usd', interval: 'month', intervalCount: 12 }), '$397/yr');
  assert.equal(formatPlanPrice({ price: 990, currency: 'usd', interval: 'year', intervalCount: 1 }), '$990/yr');
  assert.equal(formatPlanPrice({ price: 1990, currency: 'usd', interval: 'year', intervalCount: 1 }), '$1,990/yr');
  assert.equal(formatPlanPrice({ price: 79, currency: 'gbp', interval: 'month', intervalCount: 1 }), '£79/mo');
  assert.equal(formatPlanPrice({ price: 9.99, currency: 'usd', interval: 'month', intervalCount: 1 }), '$9.99/mo');
  assert.equal(formatPlanPrice({ price: 129, currency: 'cad', interval: 'month', intervalCount: 1 }), 'CA$129/mo');
  assert.equal(formatPlanPrice({ price: 50, currency: 'chf', interval: 'month', intervalCount: 3 }), 'CHF 50 every 3 months');
});

test('statusLabel is readable', () => {
  assert.equal(statusLabel('past_due'), 'Past due');
  assert.equal(statusLabel('active'), 'Active');
  assert.equal(statusLabel('something_new'), 'something_new');
});
