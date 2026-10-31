import 'server-only';
import { postSystemMessage as post } from './db';

/** The only place a row is inserted with message_type = 'system'. */
export async function postSystemMessage(conversationId: string, text: string): Promise<void> {
  await post(conversationId, text);
}
