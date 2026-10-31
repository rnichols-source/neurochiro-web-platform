import 'server-only';
import { createAdminClient } from '@/lib/supabase-admin';
import { messageThreadUrl } from './email';

async function blocked(admin: any, a: string, b: string): Promise<boolean> {
  const left = await admin.from('user_blocks').select('id').eq('blocker_id', a).eq('blocked_id', b).limit(1);
  if (left.data?.length) return true;
  const right = await admin.from('user_blocks').select('id').eq('blocker_id', b).eq('blocked_id', a).limit(1);
  return Boolean(right.data?.length);
}

async function muted(admin: any, userId: string, conversationId: string): Promise<boolean> {
  const { data, error } = await admin.from('conversation_mutes').select('id').eq('user_id', userId).eq('conversation_id', conversationId).limit(1);
  if (error) return false;
  return Boolean(data?.length);
}

/** One unread notification per conversation. Skips mutes and blocks. Never stores the message body. */
export async function recordThreadNotification(input: {
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientRole: string;
  conversationId: string;
}): Promise<void> {
  const admin = createAdminClient() as any;
  if (await blocked(admin, input.senderId, input.recipientId)) return;
  if (await muted(admin, input.recipientId, input.conversationId)) return;

  const link = messageThreadUrl(input.recipientRole, input.conversationId).replace('https://neurochiro.co', '');
  const title = `New messages from ${input.senderName}`;
  const body = `You have new messages from ${input.senderName}.`;
  const row = {
    user_id: input.recipientId,
    title,
    body,
    type: 'message',
    link,
    priority: 'info',
    conversation_id: input.conversationId,
  };

  const existing = await admin
    .from('notifications')
    .select('id')
    .eq('user_id', input.recipientId)
    .eq('type', 'message')
    .is('read_at', null)
    .eq('conversation_id', input.conversationId)
    .limit(1)
    .maybeSingle();

  if (!existing.error && existing.data?.id) {
    await admin.from('notifications').update({ title, body, link }).eq('id', existing.data.id);
    return;
  }

  const byLink = await admin
    .from('notifications')
    .select('id')
    .eq('user_id', input.recipientId)
    .eq('type', 'message')
    .is('read_at', null)
    .eq('link', link)
    .limit(1)
    .maybeSingle();
  if (byLink.data?.id) {
    await admin.from('notifications').update({ title, body, link }).eq('id', byLink.data.id);
    return;
  }

  const inserted = await admin.from('notifications').insert(row);
  if (inserted.error) {
    const { conversation_id, ...without } = row;
    void conversation_id;
    await admin.from('notifications').insert(without);
  }
}
