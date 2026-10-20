'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { Automations } from '@/lib/automations'

const MAX_MESSAGE_LENGTH = 2000
const MAX_NEW_CONVERSATIONS_PER_DAY = 20
const MAX_MESSAGES_PER_DAY = 100
const MAX_MESSAGES_PER_CONVERSATION_PER_MINUTE = 5

// ── Auth helper ─────────────────────────────────────────────────────────────

async function getAuthUser() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

async function getUserProfile(userId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('id, full_name, role, email')
    .eq('id', userId)
    .single()
  return data
}

async function getUserDoctorRecord(userId: string) {
  const admin = createAdminClient()
  const { data } = await (admin as any)
    .from('doctors')
    .select('id, verification_status, membership_tier, is_founding_member, accepts_student_messages')
    .eq('user_id', userId)
    .maybeSingle()
  return data as { id: string; verification_status: string; membership_tier: string; is_founding_member: boolean; accepts_student_messages: boolean } | null
}

// ── Check if user is blocked ────────────────────────────────────────────────

async function isBlocked(userId1: string, userId2: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await (admin as any)
    .from('user_blocks')
    .select('id')
    .or(`and(blocker_id.eq.${userId1},blocked_id.eq.${userId2}),and(blocker_id.eq.${userId2},blocked_id.eq.${userId1})`)
    .limit(1) // intentional bound
    .maybeSingle()
  return !!data
}

// ── Rate limiting ───────────────────────────────────────────────────────────

async function checkRateLimits(userId: string, conversationId?: string): Promise<string | null> {
  const admin = createAdminClient()
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()

  // Messages per day
  const { count: dayCount } = await admin
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('sender_id', userId)
    .gte('created_at', oneDayAgo)

  if ((dayCount || 0) >= MAX_MESSAGES_PER_DAY) {
    return 'Daily message limit reached. Please try again tomorrow.'
  }

  // Messages per conversation per minute
  if (conversationId) {
    const { count: minuteCount } = await admin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('sender_id', userId)
      .eq('conversation_id', conversationId)
      .gte('created_at', oneMinuteAgo)

    if ((minuteCount || 0) >= MAX_MESSAGES_PER_CONVERSATION_PER_MINUTE) {
      return 'Slow down. Please wait a moment before sending another message.'
    }
  }

  return null
}

async function checkConversationRateLimit(userId: string): Promise<string | null> {
  const admin = createAdminClient()
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { count } = await admin
    .from('conversations')
    .select('id', { count: 'exact', head: true })
    .eq('participant_one_id', userId)
    .gte('created_at', oneDayAgo)

  if ((count || 0) >= MAX_NEW_CONVERSATIONS_PER_DAY) {
    return 'Daily new conversation limit reached. Please try again tomorrow.'
  }

  return null
}

// ── Access control ──────────────────────────────────────────────────────────

async function canInitiateWith(senderId: string, recipientId: string): Promise<{ allowed: boolean; reason?: string }> {
  const [sender, recipient] = await Promise.all([
    getUserProfile(senderId),
    getUserProfile(recipientId),
  ])

  if (!sender || !recipient) return { allowed: false, reason: 'User not found' }

  const isAdmin = ['admin', 'super_admin', 'founder'].includes(sender.role || '')
  if (isAdmin) return { allowed: true }

  // Patients cannot initiate
  if (sender.role === 'patient') return { allowed: false, reason: 'Patient accounts cannot send messages' }

  // Cannot message patients
  if (recipient.role === 'patient') return { allowed: false, reason: 'Cannot message patient accounts' }

  // Check blocks
  if (await isBlocked(senderId, recipientId)) return { allowed: false, reason: 'This user is not available for messaging' }

  // Doctor to doctor: both must be verified+pro (or founding)
  if (sender.role === 'doctor' && recipient.role === 'doctor') {
    const senderDoc = await getUserDoctorRecord(senderId)
    if (!senderDoc) return { allowed: false, reason: 'Doctor profile not found' }
    const isPaid = senderDoc.membership_tier === 'pro' || senderDoc.is_founding_member
    if (!isPaid) return { allowed: false, reason: 'Pro membership required to message other doctors' }
    return { allowed: true }
  }

  // Doctor to student: open
  if (sender.role === 'doctor' && recipient.role === 'student') return { allowed: true }

  // Student to student: open
  if (sender.role === 'student' && recipient.role === 'student') return { allowed: true }

  // Student to doctor: gated on accepts_student_messages
  if (sender.role === 'student' && recipient.role === 'doctor') {
    const recipientDoc = await getUserDoctorRecord(recipientId)
    if (!recipientDoc?.accepts_student_messages) {
      return { allowed: false, reason: 'This doctor is not accepting student messages' }
    }
    return { allowed: true }
  }

  return { allowed: false, reason: 'Not allowed' }
}

// ── 1. Send a message ───────────────────────────────────────────────────────

export async function sendMessage(recipientId: string, body: string, existingConversationId?: string) {
  const user = await getAuthUser()
  if (!user) return { error: 'Not authenticated' }
  if (!body.trim() || body.length > MAX_MESSAGE_LENGTH) return { error: `Message must be 1-${MAX_MESSAGE_LENGTH} characters` }
  if (recipientId === user.id) return { error: 'Cannot message yourself' }

  const admin = createAdminClient()

  // Check blocks
  if (await isBlocked(user.id, recipientId)) {
    return { error: 'This user is not available for messaging' }
  }

  let conversationId = existingConversationId

  if (!conversationId) {
    // Check for existing conversation
    const { data: existing } = await admin
      .from('conversations')
      .select('id')
      .or(`and(participant_one_id.eq.${user.id},participant_two_id.eq.${recipientId}),and(participant_one_id.eq.${recipientId},participant_two_id.eq.${user.id})`)
      .limit(1) // intentional bound
      .maybeSingle()

    if (existing) {
      conversationId = existing.id
    } else {
      // New conversation: check access rules and rate limit
      const access = await canInitiateWith(user.id, recipientId)
      if (!access.allowed) return { error: access.reason || 'Not allowed' }

      // Check cancelled members cannot initiate new conversations
      const senderProfile = await getUserProfile(user.id)
      if (senderProfile?.role === 'doctor') {
        const senderDoc = await getUserDoctorRecord(user.id)
        const isActive = senderDoc && (senderDoc.membership_tier === 'pro' || senderDoc.is_founding_member)
        const isAdmin = ['admin', 'super_admin', 'founder'].includes(senderProfile.role || '')
        if (!isActive && !isAdmin) {
          return { error: 'Active membership required to start new conversations' }
        }
      }

      const convLimit = await checkConversationRateLimit(user.id)
      if (convLimit) return { error: convLimit }

      const { data: newConv, error: convError } = await admin
        .from('conversations')
        .insert({
          participant_one_id: user.id,
          participant_two_id: recipientId,
          context_type: 'direct',
        })
        .select('id')
        .single()

      if (convError || !newConv) return { error: 'Failed to create conversation' }
      conversationId = newConv.id
    }
  }

  // Rate limit on messages
  const msgLimit = await checkRateLimits(user.id, conversationId)
  if (msgLimit) return { error: msgLimit }

  // Insert message
  const { data: msg, error: msgError } = await admin
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      recipient_id: recipientId,
      body: body.trim(),
      message_type: 'user',
    })
    .select()
    .single()

  if (msgError) return { error: 'Failed to send message' }

  // Update last_message_at
  await admin
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId)

  // Get sender name for notification
  const sender = await getUserProfile(user.id)
  const recipient = await getUserProfile(recipientId)

  if (sender && recipient) {
    await Automations.onMessageSent(
      user.id,
      sender.full_name || 'A member',
      recipientId,
      recipient.role || 'doctor'
    )
  }

  return { success: true, conversationId, message: msg }
}

// ── 2. Mark messages as read ────────────────────────────────────────────────

export async function markMessagesRead(conversationId: string) {
  const user = await getAuthUser()
  if (!user) return

  const admin = createAdminClient()
  await admin
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('recipient_id', user.id)
    .is('read_at', null)
}

// ── 3. Search users for compose ─────────────────────────────────────────────

export async function searchUsersForMessage(query: string) {
  const user = await getAuthUser()
  if (!user) return []
  if (query.length < 2) return []

  const admin = createAdminClient()
  const sender = await getUserProfile(user.id)
  if (!sender) return []

  const isAdmin = ['admin', 'super_admin', 'founder'].includes(sender.role || '')
  const isDoctor = sender.role === 'doctor'
  const isStudent = sender.role === 'student'

  // Build role filter based on who the sender can message
  let roleFilter: string[] = []
  if (isAdmin) {
    roleFilter = ['doctor', 'student', 'admin', 'founder', 'super_admin']
  } else if (isDoctor) {
    roleFilter = ['doctor', 'student']
  } else if (isStudent) {
    roleFilter = ['doctor', 'student']
  } else {
    return [] // patients cannot initiate
  }

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name, role')
    .neq('id', user.id)
    .ilike('full_name', `%${query}%`)
    .in('role', roleFilter)
    .limit(20) // intentional bound — filter down after

  if (!profiles) return []

  // For students searching doctors, filter to those with accepts_student_messages
  if (isStudent) {
    const doctorProfiles = profiles.filter((p: any) => p.role === 'doctor')
    const studentProfiles = profiles.filter((p: any) => p.role !== 'doctor')

    if (doctorProfiles.length > 0) {
      const doctorUserIds = doctorProfiles.map((p: any) => p.id)
      const { data: doctors } = await admin
        .from('doctors')
        .select('user_id, accepts_student_messages')
        .in('user_id', doctorUserIds)
        .eq('accepts_student_messages', true)

      const allowedDoctorIds = new Set((doctors || []).map((d: any) => d.user_id))
      const filteredDoctors = doctorProfiles.filter((p: any) => allowedDoctorIds.has(p.id))
      return [...filteredDoctors, ...studentProfiles].slice(0, 8)
    }

    return studentProfiles.slice(0, 8)
  }

  // For doctors, filter to verified+pro doctors only (for doctor targets)
  if (isDoctor) {
    const doctorProfiles = profiles.filter((p: any) => p.role === 'doctor')
    const otherProfiles = profiles.filter((p: any) => p.role !== 'doctor')

    if (doctorProfiles.length > 0) {
      const doctorUserIds = doctorProfiles.map((p: any) => p.id)
      const { data: doctors } = await admin
        .from('doctors')
        .select('user_id')
        .in('user_id', doctorUserIds)
        .eq('verification_status', 'verified')
        .eq('membership_tier', 'pro')

      const verifiedIds = new Set((doctors || []).map((d: any) => d.user_id))
      // Also include founding members
      const { data: founders } = await admin
        .from('doctors')
        .select('user_id')
        .in('user_id', doctorUserIds)
        .eq('is_founding_member', true)

      for (const f of (founders || [])) verifiedIds.add(f.user_id)

      const filteredDoctors = doctorProfiles.filter((p: any) => verifiedIds.has(p.id))
      return [...filteredDoctors, ...otherProfiles].slice(0, 8)
    }

    return otherProfiles.slice(0, 8)
  }

  return profiles.slice(0, 8)
}

// ── 4. Delete message (soft delete) ─────────────────────────────────────────

export async function deleteMessage(messageId: string) {
  const user = await getAuthUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()

  // Verify sender owns this message
  const { data: msg } = await admin
    .from('messages')
    .select('id, sender_id')
    .eq('id', messageId)
    .single()

  if (!msg || msg.sender_id !== user.id) return { error: 'Cannot delete this message' }

  await admin
    .from('messages')
    .update({ deleted_at: new Date().toISOString(), body: '' })
    .eq('id', messageId)

  return { success: true }
}

// ── 5. Block/unblock user ───────────────────────────────────────────────────

export async function blockUser(blockedId: string) {
  const user = await getAuthUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()
  const { error } = await (admin as any)
    .from('user_blocks')
    .upsert({ blocker_id: user.id, blocked_id: blockedId }, { onConflict: 'blocker_id,blocked_id' })

  if (error) return { error: 'Failed to block user' }
  return { success: true }
}

export async function unblockUser(blockedId: string) {
  const user = await getAuthUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()
  await (admin as any)
    .from('user_blocks')
    .delete()
    .eq('blocker_id', user.id)
    .eq('blocked_id', blockedId)

  return { success: true }
}

// ── 6. Mute/unmute conversation ─────────────────────────────────────────────

export async function muteConversation(conversationId: string) {
  const user = await getAuthUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()
  await (admin as any)
    .from('conversation_mutes')
    .upsert({ user_id: user.id, conversation_id: conversationId }, { onConflict: 'user_id,conversation_id' })

  return { success: true }
}

export async function unmuteConversation(conversationId: string) {
  const user = await getAuthUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()
  await (admin as any)
    .from('conversation_mutes')
    .delete()
    .eq('user_id', user.id)
    .eq('conversation_id', conversationId)

  return { success: true }
}

// ── 7. Report message ───────────────────────────────────────────────────────

export async function reportMessage(messageId: string, reason: string) {
  const user = await getAuthUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()
  const { error } = await (admin as any)
    .from('message_reports')
    .insert({ reporter_id: user.id, message_id: messageId, reason })

  if (error) return { error: 'Failed to report message' }
  return { success: true }
}

// ── 8. Get unread message count (for nav badge) ─────────────────────────────

export async function getUnreadMessageCount(): Promise<number> {
  const user = await getAuthUser()
  if (!user) return 0

  const admin = createAdminClient()
  const { count } = await admin
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .is('read_at', null)
    .is('deleted_at', null)

  return count || 0
}

// ── 9. Create context-attached conversation ─────────────────────────────────

export async function createContextConversation(
  otherUserId: string,
  contextType: 'referral' | 'job_application' | 'chiromatch',
  contextId: string,
  systemMessage: string
) {
  const user = await getAuthUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()

  // Check for existing conversation with same context
  const { data: existing } = await admin
    .from('conversations')
    .select('id')
    .eq('context_type', contextType)
    .eq('context_id', contextId)
    .limit(1) // intentional bound
    .maybeSingle()

  if (existing) return { success: true, conversationId: existing.id }

  // Create conversation
  const { data: conv, error: convError } = await admin
    .from('conversations')
    .insert({
      participant_one_id: user.id,
      participant_two_id: otherUserId,
      context_type: contextType,
      context_id: contextId,
    })
    .select('id')
    .single()

  if (convError || !conv) return { error: 'Failed to create conversation' }

  // Insert system message
  await admin
    .from('messages')
    .insert({
      conversation_id: conv.id,
      sender_id: user.id,
      recipient_id: otherUserId,
      body: systemMessage,
      message_type: 'system',
    })

  // Update last_message_at
  await admin
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conv.id)

  return { success: true, conversationId: conv.id }
}

// ── 10. Broadcast (admin only) ──────────────────────────────────────────────

export async function sendBroadcast(
  subject: string,
  body: string,
  segment: 'all_pro' | 'all_students' | 'founding_members' | string,
  dryRun: boolean = false
) {
  const user = await getAuthUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()
  const profile = await getUserProfile(user.id)
  if (!profile || !['admin', 'super_admin', 'founder'].includes(profile.role || '')) {
    return { error: 'Admin access required' }
  }

  // Build recipient list based on segment
  let recipients: { id: string; full_name: string | null }[] = []

  if (segment === 'all_pro') {
    const { data: doctors } = await admin
      .from('doctors')
      .select('user_id')
      .eq('verification_status', 'verified')
      .eq('membership_tier', 'pro')
      .not('user_id', 'is', null)
    const userIds = (doctors || []).map((d: any) => d.user_id).filter(Boolean)
    if (userIds.length > 0) {
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)
      recipients = profiles || []
    }
  } else if (segment === 'all_students') {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'student')
    recipients = profiles || []
  } else if (segment === 'founding_members') {
    const { data: doctors } = await admin
      .from('doctors')
      .select('user_id')
      .eq('is_founding_member', true)
      .not('user_id', 'is', null)
    const userIds = (doctors || []).map((d: any) => d.user_id).filter(Boolean)
    if (userIds.length > 0) {
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)
      recipients = profiles || []
    }
  } else if (segment.startsWith('country:')) {
    const country = segment.split(':')[1]
    const { data: doctors } = await admin
      .from('doctors')
      .select('user_id')
      .eq('country', country)
      .eq('verification_status', 'verified')
      .not('user_id', 'is', null)
    const userIds = (doctors || []).map((d: any) => d.user_id).filter(Boolean)
    if (userIds.length > 0) {
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)
      recipients = profiles || []
    }
  } else if (segment.startsWith('state:')) {
    const state = segment.split(':')[1]
    const { data: doctors } = await admin
      .from('doctors')
      .select('user_id')
      .eq('state', state)
      .eq('verification_status', 'verified')
      .not('user_id', 'is', null)
    const userIds = (doctors || []).map((d: any) => d.user_id).filter(Boolean)
    if (userIds.length > 0) {
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)
      recipients = profiles || []
    }
  } else if (segment.startsWith('user:')) {
    // Single user (for testing)
    const targetId = segment.split(':')[1]
    const { data: p } = await admin.from('profiles').select('id, full_name').eq('id', targetId).single()
    if (p) recipients = [p]
  }

  // Filter out self
  recipients = recipients.filter(r => r.id !== user.id)

  if (recipients.length === 0) return { error: 'No recipients found for this segment' }

  if (dryRun) {
    return {
      success: true,
      dryRun: true,
      recipientCount: recipients.length,
      recipients: recipients.map(r => ({ id: r.id, name: r.full_name })),
      subject,
      bodyPreview: body.slice(0, 200),
    }
  }

  // Create individual conversations + messages (rate limited, 10/sec)
  let created = 0
  for (const recipient of recipients) {
    // Check for existing broadcast conversation
    const { data: existing } = await admin
      .from('conversations')
      .select('id')
      .or(`and(participant_one_id.eq.${user.id},participant_two_id.eq.${recipient.id}),and(participant_one_id.eq.${recipient.id},participant_two_id.eq.${user.id})`)
      .eq('context_type', 'broadcast')
      .limit(1) // intentional bound
      .maybeSingle()

    let convId: string
    if (existing) {
      convId = existing.id
    } else {
      const { data: conv } = await admin
        .from('conversations')
        .insert({
          participant_one_id: user.id,
          participant_two_id: recipient.id,
          context_type: 'broadcast',
        })
        .select('id')
        .single()
      if (!conv) continue
      convId = conv.id
    }

    await admin.from('messages').insert({
      conversation_id: convId,
      sender_id: user.id,
      recipient_id: recipient.id,
      body,
      message_type: 'user',
    })

    await admin
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', convId)

    // In-app notification
    await admin.from('notifications').insert({
      user_id: recipient.id,
      title: `Message from Dr. Ray`,
      body: body.slice(0, 100) + (body.length > 100 ? '...' : ''),
      type: 'message',
      link: '/doctor/messages',
      priority: 'info',
    })

    created++
  }

  // Log broadcast
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
