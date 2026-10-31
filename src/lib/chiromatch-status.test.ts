import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveCycleStatus } from './chiromatch-status.ts';

const cycle = {
  ranking_opens_at: '2026-08-01',
  ranking_closes_at: '2026-09-14',
  match_day: '2026-09-21',
  status: 'ranking_open',
};

test('a cycle that closes 2026-09-14 and matches 2026-09-21 is not open on 2026-09-15', () => {
  const status = deriveCycleStatus(cycle, new Date('2026-09-15T15:00:00.000Z'));
  assert.equal(status.open, false);
  assert.notEqual(status.phase, 'open');
  assert.equal(status.finished, false);
});

test('the close date itself is still inside the ranking window', () => {
  const status = deriveCycleStatus(cycle, new Date('2026-09-14T15:00:00.000Z'));
  assert.equal(status.open, true);
  assert.equal(status.phase, 'open');
});

test('the cycle is finished after match day', () => {
  const status = deriveCycleStatus(cycle, new Date('2026-09-22T00:00:00.000Z'));
  assert.equal(status.open, false);
  assert.equal(status.finished, true);
  assert.equal(status.phase, 'finished');
});
