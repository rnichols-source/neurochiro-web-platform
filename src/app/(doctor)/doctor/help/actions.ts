'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { createServerSupabase } from '@/lib/supabase-server'
import { FROM_ADDRESS, REPLY_TO } from '@/lib/leads/config'
import { isMissingTable } from '@/lib/leads/schema'

export type HelpResult = { ok: true } | { ok: false; error: string }

export async function sendHelpMessage(input: {
  name: string
  email: string
  clinic: string
  topic: string
  message: string
}): Promise<HelpResult> {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Sign in again, then send the message.' }
  const name = input.name.trim().slice(0, 120)
  const email = input.email.trim().slice(0, 200)
  const clinic = input.clinic.trim().slice(0, 160)
  const topic = input.topic.trim().slice(0, 80) || 'Other'
  const message = input.message.trim()
  if (message.length < 2) return { ok: false, error: 'Write a message before sending.' }
  if (message.length > 4000) return { ok: false, error: 'Keep the message under 4,000 characters.' }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'That email address does not look right.' }

  const admin = createAdminClient() as any
  const doctor = await admin.from('doctors').select('id').eq('user_id', user.id).maybeSingle()
  const stored = await admin.from('doctor_help_messages').insert({
    doctor_id: doctor.data?.id || null,
    user_id: user.id,
    name: name || null,
    email: email || user.email || null,
    clinic: clinic || null,
    topic,
    message,
  }).select('id').maybeSingle()
  const saved = Boolean(stored.data?.id)
  const storeMissing = isMissingTable(stored.error)

  const key = process.env.RESEND_API_KEY
  if (!key) {
    if (saved) return { ok: false, error: 'We saved the message, but email is not configured on this server, so it was not sent.' }
    return { ok: false, error: 'Email is not configured on this server, so the message was not sent.' }
  }
  const { Resend } = await import('resend')
  const resend = new Resend(key)
  const sent = await resend.emails.send({
    from: FROM_ADDRESS,
    to: REPLY_TO,
    replyTo: email || user.email || undefined,
    subject: `Help: ${topic}`,
    text: [`From: ${name || 'Doctor'}`, `Email: ${email || user.email || ''}`, `Clinic: ${clinic || ''}`, `Topic: ${topic}`, '', message].join('\n'),
  })
  if (sent.error) {
    if (saved) return { ok: false, error: 'We saved the message, but the email did not send. Try again in a minute.' }
    return { ok: false, error: storeMissing
      ? 'The email did not send, and the help inbox is not on this database yet.'
      : 'The email did not send. Nothing was marked as received.' }
  }
  return { ok: true }
}
