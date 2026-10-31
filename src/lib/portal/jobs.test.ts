import assert from 'node:assert/strict';
import test from 'node:test';
import { jobDateLine } from './jobs.ts';

const now = new Date('2026-10-31T16:00:00Z');

test('job dates distinguish open, expired, and closed', () => {
  assert.deepEqual(jobDateLine({ status: 'Active', expires_at: '2026-11-30T12:00:00Z' }, now), {
    pill: 'Open',
    expiry: 'Expires Nov 30, 2026',
  });
  assert.deepEqual(jobDateLine({ status: 'Active', expires_at: '2026-10-25T12:00:00Z' }, now), {
    pill: 'Expired',
    expiry: 'Expired Oct 25, 2026',
  });
  assert.deepEqual(jobDateLine({ status: 'Closed', expires_at: '2026-10-25T12:00:00Z' }, now), {
    pill: 'Closed',
    expiry: null,
  });
});
