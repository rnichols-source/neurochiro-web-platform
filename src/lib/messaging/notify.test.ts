import assert from 'node:assert/strict';
import test from 'node:test';
import { clearIncoming, recordIncoming } from './notify.ts';

test('three messages in one thread leave one unread notification, and reading clears it', () => {
  let open = new Map<string, number>();
  const thread = 'conv-1';
  open = recordIncoming(open, thread);
  open = recordIncoming(open, thread);
  open = recordIncoming(open, thread);
  assert.equal(open.size, 1);
  assert.equal(open.get(thread), 1);
  open = clearIncoming(open, thread);
  assert.equal(open.size, 0);
});
