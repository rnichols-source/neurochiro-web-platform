import { assertCanMessage, type AccessParty } from './access.ts';
import { assertUuid, UuidError } from './ids.ts';
import { validateBody } from './validate.ts';

export const MAX_NEW_CONVERSATIONS_PER_DAY = 20;
export const MAX_MESSAGES_PER_DAY = 100;
export const MAX_MESSAGES_PER_CONVERSATION_PER_MINUTE = 5;

export type ConversationRow = {
  id: string;
  participantOneId: string;
  participantTwoId: string;
};

export type StoredMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
  clientMessageId: string | null;
};

export type SendInput = {
  recipientId: string;
  body: string;
  conversationId?: string | null;
  clientMessageId?: string | null;
};

export type SendResult =
  | { ok: true; message: StoredMessage; conversationId: string }
  | { ok: false; code: string; userMessage: string };

export type SendDeps = {
  now: () => Date;
  loadConversation: (id: string) => Promise<ConversationRow | null>;
  findDirect: (a: string, b: string) => Promise<ConversationRow | null>;
  createDirect: (a: string, b: string) => Promise<ConversationRow>;
  insertMessage: (row: {
    conversationId: string;
    senderId: string;
    recipientId: string;
    body: string;
    clientMessageId: string | null;
    createdAt: string;
  }) => Promise<{ message: StoredMessage; created: boolean }>;
  touchConversation: (id: string, at: string) => Promise<void>;
  countDay: (senderId: string, sinceIso: string) => Promise<number>;
  countMinute: (senderId: string, conversationId: string, sinceIso: string) => Promise<number>;
  countNewConversations: (userId: string, sinceIso: string) => Promise<number>;
  isBlocked: (a: string, b: string) => Promise<boolean>;
  loadParty: (id: string) => Promise<AccessParty | null>;
  notify: (row: StoredMessage) => Promise<void>;
};

function fail(code: string, userMessage: string): SendResult {
  return { ok: false, code, userMessage };
}

function otherParticipant(conv: ConversationRow, actorId: string): string | null {
  if (conv.participantOneId === actorId) return conv.participantTwoId;
  if (conv.participantTwoId === actorId) return conv.participantOneId;
  return null;
}

export async function sendUserMessage(actorId: string, input: SendInput, deps: SendDeps): Promise<SendResult> {
  let recipientId = '';
  let conversationId = '';
  let clientMessageId: string | null = null;
  try {
    assertUuid(actorId);
    recipientId = assertUuid(input.recipientId);
    if (input.conversationId) conversationId = assertUuid(input.conversationId);
    if (input.clientMessageId) clientMessageId = assertUuid(input.clientMessageId);
  } catch (err) {
    if (err instanceof UuidError) return fail('invalid_id', 'That message cannot be sent.');
    throw err;
  }

  const validated = validateBody(input.body);
  if (!validated.ok) return fail(validated.code, validated.userMessage);
  if (recipientId === actorId) return fail('self', 'Cannot message yourself.');

  let conversation: ConversationRow | null = null;
  let existingThread = false;

  if (conversationId) {
    conversation = await deps.loadConversation(conversationId);
    if (!conversation) return fail('not_found', 'That conversation was not found.');
    const other = otherParticipant(conversation, actorId);
    if (!other) return fail('not_participant', 'You cannot post in that conversation.');
    if (recipientId !== other) return fail('recipient_mismatch', 'You cannot post in that conversation.');
    existingThread = true;
  } else {
    conversation = await deps.findDirect(actorId, recipientId);
    existingThread = Boolean(conversation);
  }

  const [sender, recipient, blocked] = await Promise.all([
    deps.loadParty(actorId),
    deps.loadParty(recipientId),
    deps.isBlocked(actorId, recipientId),
  ]);
  if (!sender || !recipient) return fail('not_found', 'That person was not found.');

  const access = assertCanMessage(sender, recipient, { blocked, existingThread });
  if (!access.allowed) return fail(access.code, access.userMessage);

  const now = deps.now();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const minuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();
  const dayCount = await deps.countDay(actorId, dayAgo);
  if (dayCount >= MAX_MESSAGES_PER_DAY) {
    return fail('rate_day', 'Daily message limit reached. Please try again tomorrow.');
  }

  if (!conversation) {
    const createdToday = await deps.countNewConversations(actorId, dayAgo);
    if (createdToday >= MAX_NEW_CONVERSATIONS_PER_DAY) {
      return fail('rate_conversations', 'Daily new conversation limit reached. Please try again tomorrow.');
    }
    conversation = await deps.createDirect(actorId, recipientId);
  }

  const minuteCount = await deps.countMinute(actorId, conversation.id, minuteAgo);
  if (minuteCount >= MAX_MESSAGES_PER_CONVERSATION_PER_MINUTE) {
    return fail('rate_minute', 'Slow down. Please wait a moment before sending another message.');
  }

  const inserted = await deps.insertMessage({
    conversationId: conversation.id,
    senderId: actorId,
    recipientId,
    body: validated.body,
    clientMessageId,
    createdAt: now.toISOString(),
  });

  if (inserted.created) {
    await deps.touchConversation(conversation.id, inserted.message.createdAt);
    await deps.notify(inserted.message);
  }

  return { ok: true, message: inserted.message, conversationId: inserted.message.conversationId };
}
