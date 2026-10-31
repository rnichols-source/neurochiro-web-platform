import assert from 'node:assert/strict';
import test from 'node:test';
import { isHiddenNotification } from './notifications.ts';

test('badge seed rows are hidden and real rows stay', () => {
  assert.equal(isHiddenNotification({ type: 'badge_earned', title: 'Badge earned: Top 10' }), true);
  assert.equal(isHiddenNotification({ type: 'system', title: 'Badge earned: Top 10' }), true);
  assert.equal(isHiddenNotification({ type: 'badge', title: 'Top 10' }), true);
  assert.equal(isHiddenNotification({ type: 'portal_login', title: 'You logged in' }), true);
  assert.equal(isHiddenNotification({ type: 'lead', title: 'New patient request' }), false);
});
