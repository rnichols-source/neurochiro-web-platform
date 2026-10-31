import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeMessages } from './realtime.ts';

test('gap-fill replaces the pending bubble and sorts without duplicates', () => {
  const pending = { id: 'pending-1', client_message_id: 'client-1', created_at: '2026-08-01T00:00:02.000Z', body: 'second' };
  const older = { id: 'm-1', client_message_id: null, created_at: '2026-08-01T00:00:01.000Z', body: 'first' };
  const confirmed = { id: 'm-2', client_message_id: 'client-1', created_at: '2026-08-01T00:00:02.000Z', body: 'second' };
  const again = { id: 'm-2', client_message_id: 'client-1', created_at: '2026-08-01T00:00:02.000Z', body: 'second' };
  const merged = mergeMessages([older, pending], [confirmed, again]);
  assert.deepEqual(merged.map((row) => row.id), ['m-1', 'm-2']);
  assert.equal(merged.filter((row) => row.client_message_id === 'client-1').length, 1);
});
