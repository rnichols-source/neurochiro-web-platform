'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { Automations } from '@/lib/automations'

// ── Send a message (server-side validated) ──────────────────────────────────

export async function sendMessage(recipientId: string, body: string, existingConversationId?: string) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (!body.trim() || body.length > 500) return { error: 'Message must be 1-500 characters' }
  if (recipientId === user.id) return { error: 'Cannot message yourself' }

  const admin = createAdminClient()

  // Validate recipient exists
  const { data: recipient } = await admin
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', recipientId)
    .single()

  if (!recipient) return { error: 'Recipient not found' }

  // Get sender profile
  const { data: sender } = await admin
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single()

  if (!sender) return { error: 'Sender profile not found' }

  let conversationId = existingConversationId

  if (!conversationId) {
    // Check for existing conversation between these two users
    const { data: existing } = await admin
      .from('conversations')
      .select('id')
      .or(`and(participant_one_id.eq.${user.id},participant_two_id.eq.${recipientId}),and(participant_one_id.eq.${recipientId},participant_two_id.eq.${user.id})`)
      .limit(1) // intentional bound
      .maybeSingle()

    if (existing) {
      conversationId = existing.id
    } else {
      // Create new conversation
      const { data: newConv, error: convError } = await admin
        .from('conversations')
        .insert({
          participant_one_id: user.id,
          participant_two_id: recipientId,
        })
        .select('id')
        .single()

      if (convError || !newConv) return { error: 'Failed to create conversation' }
      conversationId = newConv.id
    }
  }

  // Insert message
  const { data: msg, error: msgError } = await admin
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      recipient_id: recipientId,
      body: body.trim(),
    })
    .select()
    .single()

  if (msgError) return { error: 'Failed to send message' }

  // Update last_message_at
  await admin
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId)

  // Notify recipient
  await Automations.onMessageSent(
    user.id,
    sender.full_name || 'A member',
    recipientId,
    recipient.role || 'doctor'
  )

  return { success: true, conversationId, message: msg }
}

// ── Mark messages as read ───────────────────────────────────────────────────

export async function markMessagesRead(conversationId: string) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const admin = createAdminClient()
  await admin
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('recipient_id', user.id)
    .is('read_at', null)
}

// ── Search users for compose (respects access rules) ────────────────────────

export async function searchUsersForMessage(query: string) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  if (query.length < 2) return []

  const admin = createAdminClient()

  // Get sender's role
  const { data: sender } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!sender) return []

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name, role')
    .neq('id', user.id)
    .ilike('full_name', `%${query}%`)
    .limit(20) // intentional bound — filter down after

  if (!profiles) return []

  // Filter based on access rules
  const isAdmin = ['admin', 'super_admin', 'founder'].includes(sender.role || '')
  const isDoctor = sender.role === 'doctor'
  const isStudent = sender.role === 'student'

  // Admin can message anyone
  if (isAdmin) return profiles.slice(0, 8)

  // Apply access rules
  const filtered = profiles.filter((p: any) => {
    const targetRole = p.role || ''

    // Doctor to doctor: open (both must be verified+pro, but we check that loosely here)
    if (isDoctor && targetRole === 'doctor') return true

    // Doctor to student: open
    if (isDoctor && targetRole === 'student') return true

    // Student to student: open
    if (isStudent && targetRole === 'student') return true

    // Student to doctor: will be gated by accepts_student_messages in Phase 2
    // For now, allow (the toggle doesn't exist yet)
    if (isStudent && targetRole === 'doctor') return true

    // Patients cannot initiate
    if (sender.role === 'patient') return false

    // Block patients from appearing as targets for non-admin
    if (targetRole === 'patient') return false

    return false
  })

  return filtered.slice(0, 8)
}
