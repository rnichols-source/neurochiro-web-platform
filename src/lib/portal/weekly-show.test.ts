import assert from 'node:assert/strict';
import test from 'node:test';
import { nextWeeklyShow } from './weekly-show.ts';

test('Thursday afternoon is tonight, Wednesday is tomorrow', () => {
  assert.equal(nextWeeklyShow(new Date('2026-11-05T15:00:00-05:00')).label, 'Tonight 8 PM ET');
  assert.equal(nextWeeklyShow(new Date('2026-11-04T15:00:00-05:00')).label, 'Tomorrow 8 PM ET');
});

test('after 8 PM ET Thursday the next show is the following Thursday', () => {
  const next = nextWeeklyShow(new Date('2026-11-05T21:30:00-05:00'));
  assert.equal(next.dateKey, '2026-11-12');
  assert.match(next.label, /Nov 12/);
});

test('DST fallback does not add an extra day before Thursday Nov 5', () => {
  const before = nextWeeklyShow(new Date('2026-10-31T20:00:00-04:00'));
  const after = nextWeeklyShow(new Date('2026-11-01T01:30:00-05:00'));
  assert.equal(before.dateKey, '2026-11-05');
  assert.equal(after.dateKey, '2026-11-05');
  assert.match(before.label, /Nov 5/);
  assert.match(after.label, /Nov 5/);
});
