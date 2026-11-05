import assert from 'node:assert/strict';
import test from 'node:test';
import { REFERRAL_DOCTOR_SELECT } from './columns.ts';

test('referral doctor select does not ask for a missing subscription column', () => {
  const columns = REFERRAL_DOCTOR_SELECT.split(',').map((column) => column.trim());
  assert.equal(columns.includes('subscription_status'), false);
  assert.equal(columns.includes('verification_status'), true);
  assert.equal(columns.includes('membership_tier'), true);
  assert.equal(columns.includes('accepting_new_patients'), true);
});
