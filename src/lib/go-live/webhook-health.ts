import 'server-only'

import { Resend } from 'resend'
import { stripe } from '@/lib/stripe'
import { isMissingTable } from '@/lib/leads/schema'
import { createAdminClient } from '@/lib/supabase-admin'
import { decideWebhookHealth, DEFAULT_WEBHOOK_STALE_HOURS } from './health.ts'

const ADMIN_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'drray@neurochirodirectory.com'

function db() {
  return createAdminClient() as any
}

function staleHours(): number {
  const parsed = Number(process.env.WEBHOOK_STALE_HOURS || DEFAULT_WEBHOOK_STALE_HOURS)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_WEBHOOK_STALE_HOURS
}

async function readHealth(): Promise<{
  lastEventAt: string | null
  lastSignatureFailureAt: string | null
  lastAlertAt: string | null
  missing?: boolean
}> {
  const { data, error } = await db().from('stripe_webhook_health').select('last_event_at, last_signature_failure_at, last_alert_at').eq('id', 'stripe').maybeSingle()
  if (error && isMissingTable(error)) return { lastEventAt: null, lastSignatureFailureAt: null, lastAlertAt: null, missing: true }
  return {
    lastEventAt: data?.last_event_at || null,
    lastSignatureFailureAt: data?.last_signature_failure_at || null,
    lastAlertAt: data?.last_alert_at || null,
  }
}

async function emailAdmin(reason: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY || ''
  if (!key || process.env.GO_LIVE_DRY_RUN === '1' || process.env.GO_LIVE_DRY_RUN === 'true') return false
  const resend = new Resend(key)
  const result = await resend.emails.send({
    from: 'NeuroChiro <support@neurochirodirectory.com>',
    to: [ADMIN_EMAIL],
    subject: 'Stripe webhook needs a look',
    html: `<p>${reason.replace(/</g, '')}</p><p>Endpoint: https://neurochiro.co/api/webhooks/stripe</p>`,
  })
  return !result.error
}

export async function noteWebhookEvent(eventId: string, eventType: string): Promise<void> {
  const now = new Date().toISOString()
  await db().from('stripe_webhook_health').upsert({
    id: 'stripe',
    last_event_at: now,
    last_event_id: eventId,
    last_event_type: eventType,
  })
}

export async function noteSignatureFailure(): Promise<void> {
  const now = new Date().toISOString()
  const current = await readHealth()
  await db().from('stripe_webhook_health').upsert({
    id: 'stripe',
    last_signature_failure_at: now,
    last_event_at: current.lastEventAt,
    last_alert_at: current.lastAlertAt,
  })
  const decision = decideWebhookHealth({
    now,
    lastEventAt: current.lastEventAt,
    lastSignatureFailureAt: now,
    lastAlertAt: current.lastAlertAt,
    paidCheckoutsInWindow: 0,
  })
  if (!decision.alert || !decision.reason) return
  const sent = await emailAdmin(decision.reason)
  if (sent) {
    await db().from('stripe_webhook_health').update({
      last_alert_at: now,
      last_alert_reason: decision.reason,
    }).eq('id', 'stripe')
  }
}

export async function checkWebhookHealth(): Promise<{ alert: boolean; reason: string | null }> {
  const now = new Date().toISOString()
  const current = await readHealth()
  if (current.missing) return { alert: false, reason: 'stripe_webhook_health is not in the database yet.' }
  const hours = staleHours()
  const since = Math.floor((Date.now() - hours * 3_600_000) / 1000)
  let paidCheckoutsInWindow = 0
  try {
    const sessions = await stripe.checkout.sessions.list({ limit: 100, created: { gte: since } })
    paidCheckoutsInWindow = sessions.data.filter((session) => session.payment_status === 'paid' && session.mode === 'subscription').length
  } catch (error) {
    console.error('[go-live] stripe checkout list failed', error instanceof Error ? error.name : 'error')
  }
  const decision = decideWebhookHealth({
    now,
    lastEventAt: current.lastEventAt,
    lastSignatureFailureAt: current.lastSignatureFailureAt,
    lastAlertAt: current.lastAlertAt,
    paidCheckoutsInWindow,
    staleHours: hours,
  })
  if (decision.alert && decision.reason) {
    const sent = await emailAdmin(decision.reason)
    if (sent) {
      await db().from('stripe_webhook_health').update({
        last_alert_at: now,
        last_alert_reason: decision.reason,
      }).eq('id', 'stripe')
    }
  }
  return decision
}
