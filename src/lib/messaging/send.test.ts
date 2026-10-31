import assert from 'node:assert/strict';
import test from 'node:test';
import type { AccessParty } from './access.ts';
import { sendUserMessage, type ConversationRow, type SendDeps, type StoredMessage } from './send-core.ts';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const C = '33333333-3333-4333-8333-333333333333';
const CONV = '44444444-4444-4444-8444-444444444444';
const CLIENT = '55555555-5555-4555-8555-555555555555';

function party(id: string): AccessParty {
  return { id, role: 'doctor', verified: true, membershipActive: true, acceptsStudentMessages: false };
}

function harness(participants: [string, string]) {
  const rows: StoredMessage[] = [];
  const conversation: ConversationRow = { id: CONV, participantOneId: participants[0], participantTwoId: participants[1] };
  const deps: SendDeps = {
    now: () => new Date('2026-08-01T00:00:00.000Z'),
    loadConversation: async () => conversation,
    findDirect: async () => conversation,
    createDirect: async () => conversation,
    insertMessage: async (row) => {
      const existing = rows.find((item) => item.clientMessageId && item.clientMessageId === row.clientMessageId && item.senderId === row.senderId);
      if (existing) return { message: existing, created: false };
      const message: StoredMessage = {
        id: `msg-${rows.length + 1}`,
        conversationId: row.conversationId,
        senderId: row.senderId,
        recipientId: row.recipientId,
        body: row.body,
        createdAt: row.createdAt,
        clientMessageId: row.clientMessageId,
      };
      rows.push(message);
      return { message, created: true };
    },
    touchConversation: async () => {},
    countDay: async () => 0,
    countMinute: async () => 0,
    countNewConversations: async () => 0,
    isBlocked: async () => false,
    loadParty: async (id) => party(id),
    notify: async () => {},
  };
  return { deps, rows };
}

test('a caller who is not a participant cannot post', async () => {
  const { deps, rows } = harness([A, B]);
  const result = await sendUserMessage(C, { recipientId: B, body: 'hello', conversationId: CONV }, deps);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, 'not_participant');
  assert.equal(rows.length, 0);
});

test('the recipient must be the other participant', async () => {
  const { deps, rows } = harness([A, B]);
  const result = await sendUserMessage(A, { recipientId: C, body: 'hello', conversationId: CONV }, deps);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, 'recipient_mismatch');
  assert.equal(rows.length, 0);
});

test('the same client message id inserts one row', async () => {
  const { deps, rows } = harness([A, B]);
  const first = await sendUserMessage(A, { recipientId: B, body: 'hello', conversationId: CONV, clientMessageId: CLIENT }, deps);
  const second = await sendUserMessage(A, { recipientId: B, body: 'hello', conversationId: CONV, clientMessageId: CLIENT }, deps);
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(rows.length, 1);
  if (first.ok && second.ok) assert.equal(first.message.id, second.message.id);
});
