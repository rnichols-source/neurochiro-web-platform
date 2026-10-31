import 'server-only';
import { ensureContextConversation as ensureContext, getOrCreateDirect } from './db';

/** Atomic when the messaging migration's RPC is present. Order-independent either way. */
export async function getOrCreateDirectConversation(actorId: string, otherUserId: string): Promise<string | null> {
  return getOrCreateDirect(actorId, otherUserId);
}

/** Server-only. Not exported from a `'use server'` file. */
export async function ensureContextConversation(input: {
  participantOne: string;
  participantTwo: string;
  contextType: 'referral' | 'job_application' | 'chiromatch';
  contextId: string;
}): Promise<string | null> {
  return ensureContext(input);
}
