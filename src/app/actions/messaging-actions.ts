'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import {
  countUnread,
  currentUserId,
  getInbox,
  getThreadMessages,
  listBlocked,
  personForNewMessage,
  markRead,
  removeMessage,
  reportAsRecipient,
  savePrefs,
  searchDirectoryUsers,
  searchOwnMessages,
  setBlock,
  setMute,
} from '@/lib/messaging/db'
import { validateBody } from '@/lib/messaging/validate'
import { sendUserMessage } from '@/lib/messaging/send'
import { assertUuid, UuidError } from '@/lib/messaging/ids'

function denied(result: { ok: false; code: string; userMessage: string }) {
  return { ok: false as const, code: result.code, userMessage: result.userMessage, error: result.userMessage }
}

export async function sendMessage(recipientId: string, body: string, existingConversationId?: string, clientMessageId?: string) {
  const userId = await currentUserId()
  if (!userId) return { ok: false as const, code: 'auth', userMessage: 'Not authenticated', error: 'Not authenticated' }
  try {
    const result = await sendUserMessage(userId, {
      recipientId,
      body,
      conversationId: existingConversationId || null,
      clientMessageId: clientMessageId || null,
    })
    if (!result.ok) return denied(result)
    return {
      ok: true as const,
      success: true,
      conversationId: result.conversationId,
      message: result.message,
      error: undefined,
    }
  } catch (err) {
    if (err instanceof UuidError) return { ok: false as const, code: 'invalid_id', userMessage: 'That message cannot be sent.', error: 'That message cannot be sent.' }
    throw err
  }
}

export async function markMessagesRead(conversationId: string) {
  const userId = await currentUserId()
  if (!userId) return
  try {
    await markRead(userId, conversationId)
  } catch (err) {
    if (err instanceof UuidError) return
    throw err
  }
}

export async function searchUsersForMessage(query: string) {
  const userId = await currentUserId()
  if (!userId) return []
  return searchDirectoryUsers(userId, query)
}

export async function lookupMessagePerson(otherUserId: string) {
  const userId = await currentUserId()
  if (!userId) return null
  try {
    return await personForNewMessage(userId, otherUserId)
  } catch (err) {
    if (err instanceof UuidError) return null
    throw err
  }
}

export async function searchMyMessages(query: string) {
  const userId = await currentUserId()
  if (!userId) return []
  return searchOwnMessages(userId, query)
}

export async function getInboxPage(before?: string | null) {
  const userId = await currentUserId()
  if (!userId) return { rows: [], unreadMessages: 0, notificationsExcludingMessages: 0 }
  const [rows, unread] = await Promise.all([
    getInbox(userId, 30, before || null),
    countUnread(userId),
  ])
  return {
    rows,
    unreadMessages: unread.messages,
    notificationsExcludingMessages: unread.notificationsExcludingMessages,
  }
}

export async function getThreadPage(conversationId: string, cursor?: { createdAt: string; id: string } | null, after?: string | null) {
  const userId = await currentUserId()
  if (!userId) return null
  try {
    return await getThreadMessages(userId, conversationId, { before: cursor || null, after: after || null })
  } catch (err) {
    if (err instanceof UuidError) return null
    throw err
  }
}

export async function getUnreadSummary() {
  const userId = await currentUserId()
  if (!userId) return { messages: 0, notificationsExcludingMessages: 0 }
  return countUnread(userId)
}

export async function getUnreadMessageCount(): Promise<number> {
  const summary = await getUnreadSummary()
  return summary.messages
}

export async function deleteMessage(messageId: string) {
  const userId = await currentUserId()
  if (!userId) return { ok: false as const, error: 'Not authenticated', code: 'auth', userMessage: 'Not authenticated' }
  return removeMessage(userId, messageId)
}

export async function blockUser(blockedId: string) {
  const userId = await currentUserId()
  if (!userId) return { ok: false as const, error: 'Not authenticated', code: 'auth', userMessage: 'Not authenticated' }
  return setBlock(userId, blockedId, true)
}

export async function unblockUser(blockedId: string) {
  const userId = await currentUserId()
  if (!userId) return { ok: false as const, error: 'Not authenticated', code: 'auth', userMessage: 'Not authenticated' }
  return setBlock(userId, blockedId, false)
}

export async function muteConversation(conversationId: string) {
  const userId = await currentUserId()
  if (!userId) return { ok: false as const, error: 'Not authenticated', code: 'auth', userMessage: 'Not authenticated' }
  return setMute(userId, conversationId, true)
}

export async function unmuteConversation(conversationId: string) {
  const userId = await currentUserId()
  if (!userId) return { ok: false as const, error: 'Not authenticated', code: 'auth', userMessage: 'Not authenticated' }
  return setMute(userId, conversationId, false)
}

export async function reportMessage(messageId: string, reason: string) {
  const userId = await currentUserId()
  if (!userId) return { ok: false as const, error: 'Not authenticated', code: 'auth', userMessage: 'Not authenticated' }
  return reportAsRecipient(userId, messageId, reason)
}

export async function listBlockedPeople() {
  const userId = await currentUserId()
  if (!userId) return []
  return listBlocked(userId)
}

export async function saveNotificationPrefs(input: {
  appointment_requests?: boolean
  referrals?: boolean
  messages?: boolean
  system_updates?: boolean
}) {
  const userId = await currentUserId()
  if (!userId) return { ok: false as const, error: 'Not authenticated' }
  return savePrefs(userId, input)
}

async function requireAdmin() {
  const userId = await currentUserId()
  if (!userId) return null
  const admin = createAdminClient() as any
  const { data } = await admin.from('profiles').select('id, role, email, full_name').eq('id', userId).maybeSingle()
  if (!data || !['admin', 'super_admin', 'founder'].includes(data.role || '')) return null
  return data as { id: string; role: string; email: string | null; full_name: string | null }
}

export async function getMessageReports() {
  const profile = await requireAdmin()
  if (!profile) return []
  const admin = createAdminClient() as any
  const { data } = await admin
    .from('message_reports')
    .select('id, reason, created_at, reviewed_at, reporter_id, message_id')
    .order('created_at', { ascending: false })
    .range(0, 99)
  if (!data || data.length === 0) return []
  const reporterIds: string[] = Array.from(new Set<string>(data.map((row: any) => String(row.reporter_id))))
  const messageIds: string[] = Array.from(new Set<string>(data.map((row: any) => String(row.message_id))))
  const [{ data: reporters }, { data: msgs }] = await Promise.all([
    admin.from('profiles').select('id, full_name').in('id', reporterIds),
    admin.from('messages').select('id, body, sender_id, created_at').in('id', messageIds),
  ])
  const reporterMap = new Map((reporters || []).map((row: any) => [row.id, row.full_name]))
  const msgMap = new Map((msgs || []).map((row: any) => [row.id, row]))
  const senderIds = [...new Set((msgs || []).map((row: any) => row.sender_id).filter(Boolean))]
  const { data: senders } = await admin.from('profiles').select('id, full_name').in('id', senderIds.length > 0 ? senderIds : ['00000000-0000-4000-8000-000000000000'])
  const senderMap = new Map((senders || []).map((row: any) => [row.id, row.full_name]))
  return data.map((row: any) => {
    const msg = msgMap.get(row.message_id) as any
    return {
      id: row.id,
      reporterName: reporterMap.get(row.reporter_id) || 'Unknown',
      reason: row.reason,
      messageBody: msg?.body || '[deleted]',
      messageSenderName: senderMap.get(msg?.sender_id) || 'Unknown',
      messageDate: msg?.created_at,
      reportDate: row.created_at,
      reviewed: !!row.reviewed_at,
    }
  })
}

export async function markReportReviewed(reportId: string) {
  const profile = await requireAdmin()
  if (!profile) return { error: 'Admin access required' }
  try {
    assertUuid(reportId)
  } catch (err) {
    if (err instanceof UuidError) return { error: 'Invalid report' }
    throw err
  }
  const admin = createAdminClient() as any
  await admin.from('message_reports').update({ reviewed_at: new Date().toISOString(), reviewed_by: profile.id }).eq('id', reportId)
  return { success: true }
}

async function findBroadcastConversation(db: any, a: string, b: string): Promise<string | null> {
  const first = await db.from('conversations').select('id').eq('participant_one_id', a).eq('participant_two_id', b).eq('context_type', 'broadcast').limit(1).maybeSingle()
  if (first.data?.id) return first.data.id as string
  const second = await db.from('conversations').select('id').eq('participant_one_id', b).eq('participant_two_id', a).eq('context_type', 'broadcast').limit(1).maybeSingle()
  return (second.data?.id as string) || null
}

export async function sendBroadcast(
  subject: string,
  body: string,
  segment: 'all_pro' | 'all_students' | 'founding_members' | string,
  dryRun: boolean = false
) {
  const profile = await requireAdmin()
  if (!profile) return { error: 'Admin access required' }
  const admin = createAdminClient() as any
  let recipients: { id: string; full_name: string | null }[] = []

  if (segment === 'all_pro') {
    const { data: doctors } = await admin.from('doctors').select('user_id').eq('verification_status', 'verified').eq('membership_tier', 'pro').not('user_id', 'is', null)
    const userIds = (doctors || []).map((row: any) => row.user_id).filter(Boolean)
    if (userIds.length > 0) {
      const { data: profiles } = await admin.from('profiles').select('id, full_name').in('id', userIds)
      recipients = profiles || []
    }
  } else if (segment === 'all_students') {
    const { data: profiles } = await admin.from('profiles').select('id, full_name').eq('role', 'student')
    recipients = profiles || []
  } else if (segment === 'founding_members') {
    const { data: doctors } = await admin.from('doctors').select('user_id').eq('is_founding_member', true).not('user_id', 'is', null)
    const userIds = (doctors || []).map((row: any) => row.user_id).filter(Boolean)
    if (userIds.length > 0) {
      const { data: profiles } = await admin.from('profiles').select('id, full_name').in('id', userIds)
      recipients = profiles || []
    }
  } else if (segment.startsWith('country:')) {
    const country = segment.split(':')[1]
    const { data: doctors } = await admin.from('doctors').select('user_id').eq('country', country).eq('verification_status', 'verified').not('user_id', 'is', null)
    const userIds = (doctors || []).map((row: any) => row.user_id).filter(Boolean)
    if (userIds.length > 0) {
      const { data: profiles } = await admin.from('profiles').select('id, full_name').in('id', userIds)
      recipients = profiles || []
    }
  } else if (segment.startsWith('state:')) {
    const state = segment.split(':')[1]
    const { data: doctors } = await admin.from('doctors').select('user_id').eq('state', state).eq('verification_status', 'verified').not('user_id', 'is', null)
    const userIds = (doctors || []).map((row: any) => row.user_id).filter(Boolean)
    if (userIds.length > 0) {
      const { data: profiles } = await admin.from('profiles').select('id, full_name').in('id', userIds)
      recipients = profiles || []
    }
  } else if (segment.startsWith('user:')) {
    const targetId = segment.split(':')[1]
    try {
      assertUuid(targetId)
    } catch (err) {
      if (err instanceof UuidError) return { error: 'Invalid user' }
      throw err
    }
    const { data: person } = await admin.from('profiles').select('id, full_name').eq('id', targetId).maybeSingle()
    if (person) recipients = [person]
  }

  recipients = recipients.filter((row) => row.id !== profile.id)
  if (recipients.length === 0) return { error: 'No recipients found for this segment' }
  if (dryRun) {
    return {
      success: true,
      dryRun: true,
      recipientCount: recipients.length,
      recipients: recipients.map((row) => ({ id: row.id, name: row.full_name })),
      subject,
      bodyPreview: body.slice(0, 200),
    }
  }

  const validated = validateBody(body)
  if (!validated.ok) return { error: validated.userMessage }
  let created = 0
  for (const recipient of recipients) {
    let convId = await findBroadcastConversation(admin, profile.id, recipient.id)
    if (!convId) {
      const { data: conv } = await admin.from('conversations').insert({
        participant_one_id: profile.id,
        participant_two_id: recipient.id,
        context_type: 'broadcast',
      }).select('id').single()
      if (!conv) continue
      convId = conv.id
    }
    const inserted = await admin.from('messages').insert({
      conversation_id: convId,
      sender_id: profile.id,
      recipient_id: recipient.id,
      body: validated.body,
      message_type: 'user',
    })
    if (inserted.error) continue
    await admin.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', convId)
    await admin.from('notifications').insert({
      user_id: recipient.id,
      title: 'Message from Dr. Ray',
      body: 'You have a new message from Dr. Ray.',
      type: 'message',
      link: `/doctor/messages?c=${convId}`,
      priority: 'info',
    })
    created++
  }

  await admin.from('audit_logs').insert({
    category: 'COMMUNICATION',
    event: `In-Platform Broadcast: ${subject}`,
    user_name: profile.email || 'Admin',
    target: segment,
    status: 'Success',
    severity: 'Medium',
    metadata: { recipients: created, segment, subject },
  })
  return { success: true, recipientCount: created }
}
