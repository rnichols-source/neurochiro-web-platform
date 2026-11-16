import assert from 'node:assert/strict';
import test from 'node:test';
import {
  countFoundingSeats,
  countsTowardFoundingCap,
  foundingSeatAvailable,
  foundingSeatCap,
  foundingSpotsCopy,
  sessionKeepsFoundingSeat,
} from './founding-seats.ts';

const FOUNDING_MONTHLY = 'price_founding_monthly';
const FOUNDING_ANNUAL = 'price_founding_annual';
const LEGACY = 'price_legacy_12';
const PRICES = [FOUNDING_MONTHLY, FOUNDING_ANNUAL];

test('the founding student cap is the first 50 paying students', () => {
  assert.equal(foundingSeatCap(), 50);
  assert.equal(foundingSpotsCopy(0), 'Founding 50: 50 spots left at $9.99/mo');
  assert.equal(foundingSpotsCopy(49), 'Founding 50: 1 spot left at $9.99/mo');
  assert.equal(foundingSpotsCopy(50), null);
  assert.equal(foundingSpotsCopy(null), null);
});

test('only founding-price subscriptions in active, trialing, or past_due count', () => {
  assert.equal(countFoundingSeats([
    { id: 'sub_month', status: 'active', priceId: FOUNDING_MONTHLY },
    { id: 'sub_year', status: 'trialing', priceId: FOUNDING_ANNUAL },
    { id: 'sub_due', status: 'past_due', priceId: FOUNDING_MONTHLY },
    { id: 'sub_canceled', status: 'canceled', priceId: FOUNDING_MONTHLY },
    { id: 'sub_legacy', status: 'active', priceId: LEGACY },
    { id: 'sub_regular', status: 'active', priceId: 'price_regular' },
  ], PRICES), 3);
  assert.equal(countsTowardFoundingCap({ id: 'sub_legacy', status: 'active', priceId: LEGACY }, PRICES), false);
});

test('the moved $12 subscription counts once toward the founding cap', () => {
  const moved = { id: 'sub_1TWyUBQ4WJOENoxrOxzuf9i8', status: 'active', priceId: LEGACY };
  assert.equal(countsTowardFoundingCap(moved, PRICES), true);
  assert.equal(countsTowardFoundingCap({ ...moved, status: 'canceled' }, PRICES), false);
  assert.equal(countFoundingSeats([
    moved,
    { id: moved.id, status: 'active', priceId: FOUNDING_MONTHLY },
    { id: 'sub_other_legacy', status: 'active', priceId: LEGACY },
  ], PRICES), 1);
});

test('an open checkout from someone else holds a seat, and a tie goes to the earlier session', () => {
  assert.equal(foundingSeatAvailable({ subscriptionCount: 49, otherOpenHolds: 0 }), true);
  assert.equal(foundingSeatAvailable({ subscriptionCount: 49, otherOpenHolds: 1 }), false);
  assert.equal(foundingSeatAvailable({ subscriptionCount: 50, otherOpenHolds: 0 }), false);

  const holds = [
    { id: 'cs_later', created: 200, userId: 'student-b' },
    { id: 'cs_earlier', created: 100, userId: 'student-a' },
  ];
  assert.equal(sessionKeepsFoundingSeat({ subscriptionCount: 49, holds, sessionId: 'cs_earlier' }), true);
  assert.equal(sessionKeepsFoundingSeat({ subscriptionCount: 49, holds, sessionId: 'cs_later' }), false);
  assert.equal(sessionKeepsFoundingSeat({ subscriptionCount: 48, holds, sessionId: 'cs_later' }), true);
});
