import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase-admin'
import { FROM_ADDRESS, REPLY_TO } from './config'
import { isMissingTable } from './schema'

export type SendTrackedInput = {
  requestId: string | null
  kind: string
  channel: 'email' | 'sms' | 'discord' | 'portal'
  to: string | string[]
  subject: string
  html: string
  text?: string
  cc?: string[]
  /** Retry an existing lead_notifications row instead of inserting another one. */
  existingId?: string
  attempt?: number
}

export type SendTrackedResult = { ok: boolean; id?: string; error?: string }

const BACKOFF_MS = [500, 1500, 4000]
const RETRIES = 3

let resendClient: Resend | null = null
let resendKey: string | null = null

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  if (!resendClient || resendKey !== key) {
    resendClient = new Resend(key)
    resendKey = key
  }
  return resendClient
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function asList(value: string | string[] | undefined): string[] {
  if (!value) return []
  const list = Array.isArray(value) ? value : [value]
  return list.map((item) => item.trim()).filter(Boolean)
}

/** When LEADS_TEST_REDIRECT_EMAIL is set, nothing goes to a real doctor or patient. */
export function applyTestRedirect(to: string[], cc: string[], subject: string): { to: string[]; cc: string[]; subject: string } {
  const redirect = process.env.LEADS_TEST_REDIRECT_EMAIL?.trim()
  if (!redirect) return { to, cc, subject }
  const inbox = redirect.split(',')[0].trim()
  const original = [...to, ...cc.map((addr) => `cc:${addr}`)].join(', ') || 'no-recipient'
  return {
    to: [inbox],
    cc: [],
    subject: `[TEST → ${original}] ${subject}`,
  }
}

async function writeNotification(
  db: any,
  input: SendTrackedInput,
  recipient: string,
  attempt: number,
): Promise<string | null> {
  if (!input.requestId) return null
  if (input.existingId) return input.existingId
  const { data, error } = await db.from('lead_notifications').insert({
    contact_request_id: input.requestId,
    kind: input.kind,
    channel: input.channel,
    recipient,
    status: 'pending',
    attempt,
  }).select('id').single()
  if (error) {
    if (isMissingTable(error)) {
      console.error('[LEADS] lead_notifications table is missing. The email will still send. Apply migration 20261030000000_lead_followup.sql.', error.message)
    } else {
      console.error('[LEADS] could not log lead notification:', error.message)
    }
    return null
  }
  return data?.id ?? null
}

async function markNotification(
  db: any,
  id: string | null,
  patch: Record<string, unknown>,
): Promise<void> {
  if (!id) return
  const { error } = await db.from('lead_notifications').update({
    ...patch,
    updated_at: new Date().toISOString(),
  }).eq('id', id)
  if (error) console.error('[LEADS] could not update lead notification:', error.message)
}

/**
 * Send one email, log the attempt, and retry with backoff.
 * Never throws. A missing RESEND_API_KEY is a failed attempt the cron can retry.
 */
export async function sendTracked(input: SendTrackedInput): Promise<SendTrackedResult> {
  try {
    const originalTo = asList(input.to)
    const originalCc = asList(input.cc)
    const redirected = applyTestRedirect(originalTo, originalCc, input.subject)
    const recipientLog = originalTo.join(', ') || redirected.to.join(', ')

    let db: any = null
    try {
      db = createAdminClient()
    } catch (err) {
      console.error('[LEADS] admin client unavailable:', err instanceof Error ? err.message : err)
    }

    let attempt = input.attempt && input.attempt > 0 ? input.attempt : 1
    const notificationId = db
      ? await writeNotification(db, input, recipientLog, attempt)
      : null
    if (input.existingId && db) {
      await markNotification(db, notificationId, { status: 'pending', attempt, error: null, recipient: recipientLog })
    }

    const resend = getResend()
    if (!resend) {
      await markNotification(db, notificationId, { status: 'failed', attempt, error: 'RESEND_API_KEY missing' })
      return { ok: false, id: notificationId || undefined, error: 'RESEND_API_KEY missing' }
    }
    if (redirected.to.length === 0) {
      await markNotification(db, notificationId, { status: 'skipped', attempt, error: 'No recipient' })
      return { ok: false, id: notificationId || undefined, error: 'No recipient' }
    }

    let lastError = 'Email was not sent'
    const tries = RETRIES + 1
    for (let i = 0; i < tries && attempt <= 5; i++) {
      const result = await resend.emails.send({
        from: FROM_ADDRESS,
        to: redirected.to,
        cc: redirected.cc.length ? redirected.cc : undefined,
        subject: redirected.subject,
        html: input.html,
        text: input.text,
        replyTo: REPLY_TO,
      })
      if (!result.error && result.data?.id) {
        await markNotification(db, notificationId, {
          status: 'sent',
          attempt,
          provider_message_id: result.data.id,
          error: null,
        })
        return { ok: true, id: result.data.id }
      }
      lastError = result.error?.message || 'Resend returned an error without a message'
      await markNotification(db, notificationId, { status: 'failed', attempt, error: lastError.slice(0, 500) })
      const moreRoom = i < RETRIES && attempt < 5
      if (!moreRoom) break
      await sleep(BACKOFF_MS[Math.min(i, BACKOFF_MS.length - 1)])
      attempt += 1
    }

    return { ok: false, id: notificationId || undefined, error: lastError }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'sendTracked failed'
    console.error('[LEADS] sendTracked failed:', message)
    return { ok: false, error: message }
  }
}

/** Portal / in-app ack. No email. Never throws. */
export async function logPortalEvent(input: {
  requestId: string
  kind: string
  recipient?: string | null
  status?: string
}): Promise<void> {
  try {
    const db = createAdminClient() as any
    const { error } = await db.from('lead_notifications').insert({
      contact_request_id: input.requestId,
      kind: input.kind,
      channel: 'portal',
      recipient: input.recipient || null,
      status: input.status || 'sent',
      attempt: 1,
    })
    if (error && !isMissingTable(error)) console.error('[LEADS] portal event log failed:', error.message)
    if (error && isMissingTable(error)) {
      console.error('[LEADS] lead_notifications table is missing. Apply migration 20261030000000_lead_followup.sql.', error.message)
    }
  } catch (err) {
    console.error('[LEADS] portal event log threw:', err instanceof Error ? err.message : err)
  }
}
