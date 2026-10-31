import 'server-only';
import * as Sentry from '@sentry/nextjs';
import { deliverUserMessage } from './db';
import type { SendInput, SendResult } from './send-core';

export async function sendUserMessage(actorId: string, input: SendInput): Promise<SendResult> {
  try {
    return await deliverUserMessage(actorId, input);
  } catch (err) {
    Sentry.captureException(err instanceof Error ? err : new Error('message send failed'), {
      extra: {
        senderId: actorId,
        recipientId: input.recipientId,
        conversationId: input.conversationId || null,
      },
    });
    return { ok: false, code: 'send_failed', userMessage: 'Not sent. Try again.' };
  }
}
