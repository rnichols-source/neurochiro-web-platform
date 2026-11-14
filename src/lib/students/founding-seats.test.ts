import assert from 'node:assert/strict';
import test from 'node:test';
import {
  countFoundingSeats,
  countsTowardFoundingCap,
  foundingSeatCap,
  foundingSeatLabel,
  foundingSpotsCopy,
  foundingSpotsLeft,
} from './founding-seats.ts';

const FOUNDING_MONTHLY = 'price_founding_monthly';
const FOUNDING_ANNUAL = 'price_founding_annual';
const LEGACY_MONTHLY = 'price_legacy_12';
const PRICES = [FOUNDING_MONTHLY, FOUNDING_ANNUAL];

test('the founding student cap defaults to 50', () => {
  assert.equal(foundingSeatCap(), 50);
  assert.equal(foundingSeatLabel(), 'Founding 50');
});

test('spots-left copy uses the 50 cap', () => {
  assert.equal(foundingSpotsCopy(0), 'Founding 50 · 50 spots left');
  assert.equal(foundingSpotsCopy(1), 'Founding 50 · 49 spots left');
  assert.equal(foundingSpotsCopy(49), 'Founding 50 · 1 spot left');
  assert.equal(foundingSpotsCopy(50), 'Founding 50 is full');
  assert.equal(foundingSpotsCopy(null), 'Founding 50');
  assert.equal(foundingSpotsLeft(7), 43);
});

test('the legacy subscription counts once it is on the founding monthly price', () => {
  const moved = {
    id: 'sub_legacy',
    status: 'active',
    priceId: FOUNDING_MONTHLY,
  };
  const stillLegacy = {
    id: 'sub_legacy',
    status: 'active',
    priceId: LEGACY_MONTHLY,
  };
  assert.equal(countsTowardFoundingCap(moved, PRICES), true);
  assert.equal(countsTowardFoundingCap(stillLegacy, PRICES), false);
  assert.equal(countFoundingSeats([moved, {
    id: 'sub_yearly',
    status: 'trialing',
    priceId: FOUNDING_ANNUAL,
  }, {
    id: 'sub_canceled',
    status: 'canceled',
    priceId: FOUNDING_MONTHLY,
  }, stillLegacy], PRICES), 2);
});
