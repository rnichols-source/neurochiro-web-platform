import assert from 'node:assert/strict';
import test from 'node:test';
import { certificateIssuedAt } from './ce.ts';

test('a day-1 check-in is dated at the event end', () => {
  const now = new Date('2026-05-29T15:00:00Z');
  const issued = certificateIssuedAt(now, { dates: 'May 29–30, 2026', ends_at: null });
  assert.equal(issued.toISOString(), '2026-05-30T23:59:59.000Z');
});

test('a check-in after the event keeps the current time', () => {
  const now = new Date('2026-06-02T15:00:00Z');
  const issued = certificateIssuedAt(now, { ends_at: '2026-05-30T09:00:00Z', dates: 'May 29–30, 2026' });
  assert.equal(issued.toISOString(), now.toISOString());
});

test('an unparseable date uses now', () => {
  const now = new Date('2026-04-14T12:00:00Z');
  const issued = certificateIssuedAt(now, { dates: 'sometime', ends_at: null });
  assert.equal(issued.toISOString(), now.toISOString());
});
