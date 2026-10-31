import 'server-only';
import { messagingV2 } from '@/config/portal-features';
import { Automations } from '@/lib/automations';
import { getMembership } from '@/lib/portal/membership-load';
import { patientLabel, statusLabel } from '@/lib/referrals/pure';
import { createAdminClient } from '@/lib/supabase-admin';
import { createServerSupabase } from '@/lib/supabase-server';
import { hiddenTestUserIds } from '@/lib/profiles/test-users';
import { decideAccess, type AccessParty } from './access';
import { assertUuid, isUuid, UuidError } from './ids';
import { sendUserMessage as deliverCore, type ConversationRow, type SendDeps, type SendInput, type SendResult, type StoredMessage } from './send-core';
import { validateBody } from './validate';

const MESSAGE_COLUMNS = 'id, conversation_id, sender_id, recipient_id, body, created_at, read_at, message_type, deleted_at';

let clientIdColumn: boolean | null = null;
let inboxRpc: boolean | null = null;
let summaryRpc: boolean | null = null;
let directRpc: boolean | null = null;

export function messagingV2On(): boolean {
  return messagingV2 === 'beta' || messagingV2 === 'live';
}

function admin() {
  return createAdminClient() as any;
}

export async function currentUserId(): Promise<string | null> {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function hasClientMessageId(): Promise<boolean> {
  if (clientIdColumn !== null) return clientIdColumn;
  const probe = await admin().from('messages').select('client_message_id').limit(1);
  clientIdColumn = !probe.error;
  return clientIdColumn;
}

export async function isBlocked(a: string, b: string): Promise<boolean> {
  const db = admin();
  const left = await db.from('user_blocks').select('id').eq('blocker_id', a).eq('blocked_id', b).limit(1);
  if (left.data?.length) return true;
  const right = await db.from('user_blocks').select('id').eq('blocker_id', b).eq('blocked_id', a).limit(1);
  return Boolean(right.data?.length);
}

async function loadParty(userId: string): Promise<AccessParty | null> {
  const { data: profile } = await admin().from('profiles').select('id, role').eq('id', userId).maybeSingle();
  if (!profile) return null;
  let verified = false;
  let acceptsStudentMessages = false;
  let membershipActive = false;
  if (profile.role === 'doctor') {
    const { data: doctor } = await admin().from('doctors').select('verification_status, accepts_student_messages').eq('user_id', userId).maybeSingle();
    verified = doctor?.verification_status === 'verified';
    acceptsStudentMessages = Boolean(doctor?.accepts_student_messages);
    const membership = await getMembership(userId);
    membershipActive = membership.tier !== 'free' && membership.status !== 'canceled' && membership.status !== 'none';
  }
  return { id: profile.id, role: profile.role, verified, membershipActive, acceptsStudentMessages };
}

function toConversation(row: any): ConversationRow | null {
  if (!row?.id) return null;
  return { id: row.id, participantOneId: row.participant_one_id, participantTwoId: row.participant_two_id };
}

export async function loadConversation(id: string): Promise<(ConversationRow & { contextType: string | null; contextId: string | null }) | null> {
  const { data } = await admin().from('conversations').select('id, participant_one_id, participant_two_id, context_type, context_id').eq('id', id).maybeSingle();
  const conv = toConversation(data);
  if (!conv || !data) return null;
  return { ...conv, contextType: data.context_type ?? null, contextId: data.context_id ?? null };
}

async function findDirect(a: string, b: string): Promise<ConversationRow | null> {
  const db = admin();
  const first = await db.from('conversations').select('id, participant_one_id, participant_two_id, context_type').eq('participant_one_id', a).eq('participant_two_id', b).limit(10);
  const second = await db.from('conversations').select('id, participant_one_id, participant_two_id, context_type').eq('participant_one_id', b).eq('participant_two_id', a).limit(10);
  const rows = [...(first.data || []), ...(second.data || [])];
  const direct = rows.find((row) => row.context_type == null || row.context_type === 'direct');
  return toConversation(direct);
}

async function createDirect(a: string, b: string): Promise<ConversationRow> {
  if (messagingV2On() && directRpc !== false) {
    const supabase = createServerSupabase() as any;
    const rpc = await supabase.rpc('ensure_direct_conversation', { other: b });
    if (!rpc.error && rpc.data) {
      directRpc = true;
      const loaded = await loadConversation(String(rpc.data));
      if (loaded) return loaded;
    } else if (rpc.error && /function|schema cache|does not exist|PGRST202/i.test(rpc.error.message || '')) {
      directRpc = false;
    }
  }
  const inserted = await admin().from('conversations').insert({
    participant_one_id: a,
    participant_two_id: b,
    context_type: 'direct',
  }).select('id, participant_one_id, participant_two_id').single();
  const conv = toConversation(inserted.data);
  if (!conv) throw new Error('conversation create failed');
  return conv;
}

function mapStored(row: any, clientMessageId: string | null): StoredMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    body: row.body || '',
    createdAt: row.created_at,
    clientMessageId: row.client_message_id || clientMessageId,
  };
}

async function profileName(userId: string): Promise<{ name: string; role: string }> {
  const { data } = await admin().from('profiles').select('full_name, role').eq('id', userId).maybeSingle();
  return { name: data?.full_name || 'A member', role: data?.role || 'doctor' };
}

export async function deliverUserMessage(actorId: string, input: SendInput): Promise<SendResult> {
  const deps: SendDeps = {
    now: () => new Date(),
    loadConversation: async (id) => loadConversation(id),
    findDirect,
    createDirect,
    isBlocked,
    loadParty,
    countDay: async (senderId, sinceIso) => {
      const { count } = await admin().from('messages').select('id', { count: 'exact', head: true }).eq('sender_id', senderId).gte('created_at', sinceIso);
      return count || 0;
    },
    countMinute: async (senderId, conversationId, sinceIso) => {
      const { count } = await admin().from('messages').select('id', { count: 'exact', head: true }).eq('sender_id', senderId).eq('conversation_id', conversationId).gte('created_at', sinceIso);
      return count || 0;
    },
    countNewConversations: async (userId, sinceIso) => {
      const { count } = await admin().from('conversations').select('id', { count: 'exact', head: true }).eq('participant_one_id', userId).gte('created_at', sinceIso);
      return count || 0;
    },
    touchConversation: async (id, at) => {
      await admin().from('conversations').update({ last_message_at: at }).eq('id', id);
    },
    insertMessage: async (row) => {
      const base = {
        conversation_id: row.conversationId,
        sender_id: row.senderId,
        recipient_id: row.recipientId,
        body: row.body,
        message_type: 'user',
      };
      const db = admin();
      if (row.clientMessageId && await hasClientMessageId()) {
        const inserted = await db.from('messages').insert({ ...base, client_message_id: row.clientMessageId }).select(`${MESSAGE_COLUMNS}, client_message_id`).single();
        if (!inserted.error && inserted.data) return { message: mapStored(inserted.data, row.clientMessageId), created: true };
        const duplicate = inserted.error?.code === '23505' || /duplicate|client_message_id/i.test(inserted.error?.message || '');
        if (duplicate && inserted.error?.code === '23505') {
          const existing = await db.from('messages').select(`${MESSAGE_COLUMNS}, client_message_id`).eq('sender_id', row.senderId).eq('client_message_id', row.clientMessageId).maybeSingle();
          if (existing.data) return { message: mapStored(existing.data, row.clientMessageId), created: false };
          throw new Error('message insert failed');
        }
        if (inserted.error && /client_message_id/.test(inserted.error.message || '') && inserted.error.code !== '23505') {
          clientIdColumn = false;
        } else if (inserted.error) {
          throw new Error('message insert failed');
        }
      }
      const inserted = await db.from('messages').insert(base).select(MESSAGE_COLUMNS).single();
      if (inserted.error || !inserted.data) throw new Error('message insert failed');
      return { message: mapStored(inserted.data, row.clientMessageId), created: true };
    },
    notify: async (message) => {
      const sender = await profileName(message.senderId);
      const recipient = await profileName(message.recipientId);
      await Automations.onMessageSent(message.senderId, sender.name, message.recipientId, recipient.role, message.conversationId);
    },
  };
  return deliverCore(actorId, input, deps);
}

export async function getOrCreateDirect(actorId: string, otherUserId: string): Promise<string | null> {
  assertUuid(actorId);
  assertUuid(otherUserId);
  const existing = await findDirect(actorId, otherUserId);
  if (existing) return existing.id;
  const [sender, recipient, blocked] = await Promise.all([
    loadParty(actorId),
    loadParty(otherUserId),
    isBlocked(actorId, otherUserId),
  ]);
  if (!sender || !recipient) return null;
  const access = decideAccess(sender, recipient, { blocked, existingThread: false });
  if (!access.allowed) return null;
  const created = await createDirect(actorId, otherUserId);
  return created.id;
}

export async function ensureContextConversation(input: {
  participantOne: string;
  participantTwo: string;
  contextType: 'referral' | 'job_application' | 'chiromatch' | 'shadow' | 'match';
  contextId: string;
}): Promise<string | null> {
  assertUuid(input.participantOne);
  assertUuid(input.participantTwo);
  assertUuid(input.contextId);
  const db = admin();
  const existing = await db.from('conversations').select('id').eq('context_type', input.contextType).eq('context_id', input.contextId).limit(1).maybeSingle();
  if (existing.data?.id) return existing.data.id as string;
  const inserted = await db.from('conversations').insert({
    participant_one_id: input.participantOne,
    participant_two_id: input.participantTwo,
    context_type: input.contextType,
    context_id: input.contextId,
  }).select('id').single();
  return inserted.data?.id ?? null;
}

export async function postSystemMessage(conversationId: string, text: string): Promise<void> {
  const id = assertUuid(conversationId);
  const validated = validateBody(text);
  if (!validated.ok) return;
  const conv = await loadConversation(id);
  if (!conv) return;
  const db = admin();
  const already = await db.from('messages').select('id').eq('conversation_id', id).eq('message_type', 'system').eq('body', validated.body).limit(1);
  if (already.data?.length) return;
  const inserted = await db.from('messages').insert({
    conversation_id: id,
    sender_id: conv.participantOneId,
    recipient_id: conv.participantTwoId,
    body: validated.body,
    message_type: 'system',
  });
  if (inserted.error) return;
  await db.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', id);
}

async function referralChip(contextType: string | null, contextId: string | null) {
  if (contextType !== 'referral' || !contextId) return null;
  const { data, error } = await admin().from('doctor_referrals').select('id, patient_first_name, patient_last_initial, status').eq('id', contextId).maybeSingle();
  if (error || !data) return null;
  return {
    label: `Referral · ${patientLabel(data.patient_first_name || '', data.patient_last_initial || '')} · ${statusLabel(data.status || 'sent')}`,
    href: `/doctor/referrals/${data.id}`,
  };
}

export type InboxPerson = { id: string; full_name: string; role: string };
export type InboxRow = {
  id: string;
  otherUser: InboxPerson;
  last_message_at: string;
  lastMessagePreview: string;
  unreadCount: number;
  contextType: string | null;
  contextId: string | null;
  referralChip: { label: string; href: string } | null;
};

function personOrFormer(profile: { id: string; full_name: string | null; role: string | null } | undefined, id: string): InboxPerson {
  if (!profile?.full_name) return { id, full_name: 'Former member', role: profile?.role || '' };
  return { id: profile.id, full_name: profile.full_name, role: profile.role || '' };
}

async function inboxFallback(userId: string, limit: number, before: string | null): Promise<InboxRow[]> {
  const db = admin();
  const cols = 'id, participant_one_id, participant_two_id, last_message_at, context_type, context_id';
  const [one, two] = await Promise.all([
    db.from('conversations').select(cols).eq('participant_one_id', userId).order('last_message_at', { ascending: false }).limit(limit),
    db.from('conversations').select(cols).eq('participant_two_id', userId).order('last_message_at', { ascending: false }).limit(limit),
  ]);
  let rows = [...(one.data || []), ...(two.data || [])];
  if (before) rows = rows.filter((row) => row.last_message_at && row.last_message_at < before);
  rows.sort((a, b) => String(b.last_message_at || '').localeCompare(String(a.last_message_at || '')));
  rows = rows.slice(0, limit);
  if (!rows.length) return [];
  const ids = rows.map((row) => row.id);
  const otherIds = rows.map((row) => (row.participant_one_id === userId ? row.participant_two_id : row.participant_one_id)).filter(Boolean);
  const [messages, profiles] = await Promise.all([
    db.from('messages').select('conversation_id, body, created_at, recipient_id, read_at, deleted_at').in('conversation_id', ids).order('created_at', { ascending: false }).limit(Math.min(ids.length * 30, 500)),
    db.from('profiles').select('id, full_name, role').in('id', otherIds),
  ]);
  const profileMap = new Map<string, { id: string; full_name: string | null; role: string | null }>((profiles.data || []).map((row: any) => [row.id, row]));
  const preview = new Map<string, string>();
  const unread = new Map<string, number>();
  for (const message of messages.data || []) {
    if (message.deleted_at) continue;
    if (!preview.has(message.conversation_id)) preview.set(message.conversation_id, message.body || '');
    if (message.recipient_id === userId && !message.read_at) unread.set(message.conversation_id, (unread.get(message.conversation_id) || 0) + 1);
  }
  const built: InboxRow[] = [];
  for (const row of rows) {
    const otherId = row.participant_one_id === userId ? row.participant_two_id : row.participant_one_id;
    built.push({
      id: row.id,
      otherUser: personOrFormer(profileMap.get(otherId), otherId),
      last_message_at: row.last_message_at || new Date(0).toISOString(),
      lastMessagePreview: preview.get(row.id) || '',
      unreadCount: unread.get(row.id) || 0,
      contextType: row.context_type ?? null,
      contextId: row.context_id ?? null,
      referralChip: await referralChip(row.context_type ?? null, row.context_id ?? null),
    });
  }
  return built;
}

export async function getInbox(userId: string, limit = 30, before: string | null = null): Promise<InboxRow[]> {
  const size = Math.min(Math.max(limit, 1), 30);
  if (messagingV2On() && inboxRpc !== false) {
    const supabase = createServerSupabase() as any;
    const rpc = await supabase.rpc('get_inbox', { lim: size, before });
    if (!rpc.error && Array.isArray(rpc.data)) {
      inboxRpc = true;
      const rows: InboxRow[] = [];
      for (const row of rpc.data) {
        rows.push({
          id: row.conversation_id,
          otherUser: personOrFormer(row.other_user_id ? { id: row.other_user_id, full_name: row.other_name, role: row.other_role } : undefined, row.other_user_id),
          last_message_at: row.last_message_at || new Date(0).toISOString(),
          lastMessagePreview: row.last_preview || '',
          unreadCount: row.unread_count || 0,
          contextType: row.context_type ?? null,
          contextId: row.context_id ?? null,
          referralChip: await referralChip(row.context_type ?? null, row.context_id ?? null),
        });
      }
      return rows;
    }
    if (rpc.error && /function|schema cache|does not exist|PGRST202/i.test(rpc.error.message || '')) inboxRpc = false;
  }
  return inboxFallback(userId, size, before);
}

export type ThreadMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
  message_type: string;
  deleted_at: string | null;
  client_message_id: string | null;
};

export async function getThreadMessages(userId: string, conversationId: string, opts?: { before?: { createdAt: string; id: string } | null; after?: string | null }) {
  const id = assertUuid(conversationId);
  const conv = await loadConversation(id);
  if (!conv) return null;
  const otherId = conv.participantOneId === userId ? conv.participantTwoId : conv.participantTwoId === userId ? conv.participantOneId : null;
  if (!otherId) return null;
  const db = admin();
  const withClient = await hasClientMessageId();
  const columns = withClient ? `${MESSAGE_COLUMNS}, client_message_id` : MESSAGE_COLUMNS;
  let query = db.from('messages').select(columns).eq('conversation_id', id).order('created_at', { ascending: false }).order('id', { ascending: false }).limit(80);
  if (opts?.after) query = db.from('messages').select(columns).eq('conversation_id', id).gt('created_at', opts.after).order('created_at', { ascending: true }).limit(100);
  else if (opts?.before?.createdAt) query = db.from('messages').select(columns).eq('conversation_id', id).lte('created_at', opts.before.createdAt).order('created_at', { ascending: false }).order('id', { ascending: false }).limit(80);
  const { data } = await query;
  let rows = (data || []) as any[];
  if (opts?.before?.createdAt) {
    rows = rows.filter((row) => row.created_at < opts.before!.createdAt || (row.created_at === opts.before!.createdAt && row.id < opts.before!.id));
  }
  const hasEarlier = !opts?.after && rows.length > 50;
  const page = (opts?.after ? rows : rows.slice(0, 50).reverse()).map((row) => ({
    id: row.id,
    conversation_id: row.conversation_id,
    sender_id: row.sender_id,
    recipient_id: row.recipient_id,
    body: row.deleted_at ? '' : (row.body || ''),
    created_at: row.created_at,
    read_at: row.read_at ?? null,
    message_type: row.message_type || 'user',
    deleted_at: row.deleted_at ?? null,
    client_message_id: row.client_message_id ?? null,
  }));
  const { data: profile } = await db.from('profiles').select('id, full_name, role').eq('id', otherId).maybeSingle();
  return {
    conversationId: id,
    otherUser: personOrFormer(profile, otherId),
    messages: page,
    hasEarlier,
    contextType: conv.contextType,
    chip: await referralChip(conv.contextType, conv.contextId),
  };
}

export async function markRead(userId: string, conversationId: string): Promise<void> {
  const id = assertUuid(conversationId);
  const conv = await loadConversation(id);
  if (!conv) return;
  if (conv.participantOneId !== userId && conv.participantTwoId !== userId) return;
  const db = admin();
  const now = new Date().toISOString();
  await db.from('messages').update({ read_at: now }).eq('conversation_id', id).eq('recipient_id', userId).is('read_at', null);
  await db.from('notifications').update({ read_at: now }).eq('user_id', userId).eq('type', 'message').is('read_at', null).eq('conversation_id', id);
  await db.from('notifications').update({ read_at: now }).eq('user_id', userId).eq('type', 'message').is('read_at', null).like('link', `%${id}%`);
  await db.from('message_email_log').delete().eq('user_id', userId).eq('conversation_id', id);
}

export async function countUnread(userId: string): Promise<{ messages: number; notificationsExcludingMessages: number }> {
  if (messagingV2On() && summaryRpc !== false) {
    const supabase = createServerSupabase() as any;
    const rpc = await supabase.rpc('get_unread_summary');
    if (!rpc.error && rpc.data) {
      summaryRpc = true;
      const data = Array.isArray(rpc.data) ? rpc.data[0] : rpc.data;
      return {
        messages: Number(data?.messages || 0),
        notificationsExcludingMessages: Number(data?.notifications_excluding_messages || data?.notificationsExcludingMessages || 0),
      };
    }
    if (rpc.error && /function|schema cache|does not exist|PGRST202/i.test(rpc.error.message || '')) summaryRpc = false;
  }
  const db = admin();
  const messages = await db.from('messages').select('id', { count: 'exact', head: true }).eq('recipient_id', userId).is('read_at', null).is('deleted_at', null);
  const notes = await db.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', userId).is('read_at', null).neq('type', 'message').neq('type', 'portal_login');
  return { messages: messages.count || 0, notificationsExcludingMessages: notes.count || 0 };
}

export async function searchDirectoryUsers(actorId: string, query: string) {
  const safe = query.replace(/[%_\\,]/g, '').trim().slice(0, 60);
  if (safe.length < 2) return [];
  const sender = await loadParty(actorId);
  if (!sender || sender.role === 'patient') return [];
  const db = admin();
  const hidden = new Set(await hiddenTestUserIds());
  let result = await db.from('profiles').select('id, full_name, role, is_test').neq('id', actorId).ilike('full_name', `%${safe}%`).limit(20);
  if (result.error) result = await db.from('profiles').select('id, full_name, role').neq('id', actorId).ilike('full_name', `%${safe}%`).limit(20);
  const profiles = (result.data || []).filter((row: any) => row.is_test !== true && !hidden.has(row.id));
  const kept = [];
  for (const profile of profiles) {
    if (profile.role === 'patient') continue;
    const recipient = await loadParty(profile.id);
    if (!recipient) continue;
    const access = decideAccess(sender, recipient, { blocked: false, existingThread: false });
    if (!access.allowed) continue;
    kept.push({ id: profile.id, full_name: profile.full_name, role: profile.role });
    if (kept.length >= 8) break;
  }
  return kept;
}

export async function searchOwnMessages(userId: string, query: string) {
  if (!messagingV2On()) return [];
  const safe = query.replace(/[%_\\,]/g, '').trim().slice(0, 80);
  if (safe.length < 2) return [];
  const { data } = await admin().from('messages').select('id, conversation_id, body, created_at').eq('sender_id', userId).is('deleted_at', null).ilike('body', `%${safe}%`).order('created_at', { ascending: false }).limit(20);
  return (data || []).map((row: any) => ({
    id: row.id,
    conversationId: row.conversation_id,
    body: String(row.body || '').slice(0, 140),
    createdAt: row.created_at,
  }));
}

export async function listBlocked(userId: string) {
  const { data } = await admin().from('user_blocks').select('blocked_id').eq('blocker_id', userId).limit(100);
  const ids = (data || []).map((row: any) => row.blocked_id).filter(Boolean);
  if (!ids.length) return [];
  const profiles = await admin().from('profiles').select('id, full_name').in('id', ids);
  const names = new Map<string, string>((profiles.data || []).map((row: any) => [row.id, row.full_name || 'Former member']));
  return ids.map((id: string) => ({ id, full_name: names.get(id) || 'Former member' }));
}

export async function savePrefs(userId: string, input: Record<string, unknown>) {
  const keys = ['appointment_requests', 'referrals', 'messages', 'system_updates'] as const;
  const { data } = await admin().from('profiles').select('notification_preferences').eq('id', userId).maybeSingle();
  const current = data?.notification_preferences && typeof data.notification_preferences === 'object' ? data.notification_preferences : {};
  const next = { ...current };
  for (const key of keys) {
    if (typeof input[key] === 'boolean') next[key] = input[key];
  }
  const updated = await admin().from('profiles').update({ notification_preferences: next }).eq('id', userId);
  if (updated.error) return { ok: false as const, error: 'Could not save those settings.' };
  return { ok: true as const };
}

function fail(code: string, userMessage: string) {
  return { ok: false as const, code, userMessage, error: userMessage };
}

export async function removeMessage(userId: string, messageId: string) {
  try {
    assertUuid(messageId);
  } catch (err) {
    if (err instanceof UuidError) return fail('invalid_id', 'That message cannot be deleted.');
    throw err;
  }
  const db = admin();
  const { data } = await db.from('messages').select('id, sender_id').eq('id', messageId).maybeSingle();
  if (!data || data.sender_id !== userId) return fail('not_allowed', 'Cannot delete this message.');
  await db.from('messages').update({ deleted_at: new Date().toISOString(), body: '' }).eq('id', messageId).eq('sender_id', userId);
  return { ok: true as const };
}

export async function reportAsRecipient(userId: string, messageId: string, reason: string) {
  try {
    assertUuid(messageId);
  } catch (err) {
    if (err instanceof UuidError) return fail('invalid_id', 'That message cannot be reported.');
    throw err;
  }
  const clean = reason.trim().slice(0, 500);
  if (!clean) return fail('empty', 'Add a short reason.');
  const { data } = await admin().from('messages').select('id, recipient_id').eq('id', messageId).maybeSingle();
  if (!data || data.recipient_id !== userId) return fail('not_allowed', 'You can report a message sent to you.');
  const inserted = await admin().from('message_reports').insert({ reporter_id: userId, message_id: messageId, reason: clean });
  if (inserted.error) return fail('report_failed', 'Failed to report message.');
  return { ok: true as const };
}

export async function setBlock(userId: string, otherId: string, blocked: boolean) {
  try {
    assertUuid(otherId);
  } catch (err) {
    if (err instanceof UuidError) return fail('invalid_id', 'That person cannot be updated.');
    throw err;
  }
  if (otherId === userId) return fail('self', 'You cannot block yourself.');
  const db = admin();
  if (blocked) {
    const { error } = await db.from('user_blocks').upsert({ blocker_id: userId, blocked_id: otherId }, { onConflict: 'blocker_id,blocked_id' });
    if (error) return fail('block_failed', 'Failed to block user.');
  } else {
    await db.from('user_blocks').delete().eq('blocker_id', userId).eq('blocked_id', otherId);
  }
  return { ok: true as const };
}

export async function setMute(userId: string, conversationId: string, muted: boolean) {
  try {
    assertUuid(conversationId);
  } catch (err) {
    if (err instanceof UuidError) return fail('invalid_id', 'That conversation cannot be updated.');
    throw err;
  }
  const conv = await loadConversation(conversationId);
  if (!conv || (conv.participantOneId !== userId && conv.participantTwoId !== userId)) {
    return fail('not_participant', 'You cannot change that conversation.');
  }
  const db = admin();
  if (muted) {
    await db.from('conversation_mutes').upsert({ user_id: userId, conversation_id: conversationId }, { onConflict: 'user_id,conversation_id' });
  } else {
    await db.from('conversation_mutes').delete().eq('user_id', userId).eq('conversation_id', conversationId);
  }
  return { ok: true as const };
}

export async function personForNewMessage(actorId: string, otherId: string): Promise<InboxPerson | null> {
  assertUuid(otherId);
  const [sender, recipient, blocked] = await Promise.all([
    loadParty(actorId),
    loadParty(otherId),
    isBlocked(actorId, otherId),
  ]);
  if (!sender || !recipient) return null;
  const access = decideAccess(sender, recipient, { blocked, existingThread: false });
  if (!access.allowed) return null;
  const { data } = await admin().from('profiles').select('id, full_name, role').eq('id', otherId).maybeSingle();
  return personOrFormer(data, otherId);
}

export function requireUuid(value: string): string | null {
  if (!isUuid(value)) return null;
  return value;
}
