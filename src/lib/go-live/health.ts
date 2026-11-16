/** An unsigned request has no Stripe-Signature header and must not write health or alert. */
export function signatureFailureIsActionable(signatureHeader: string | null | undefined): boolean {
  return Boolean(signatureHeader && signatureHeader.trim())
}

export const DEFAULT_WEBHOOK_STALE_HOURS = 6
export const WEBHOOK_ALERT_COOLDOWN_HOURS = 6

export type WebhookHealthInput = {
  now: string
  lastEventAt: string | null
  lastSignatureFailureAt: string | null
  lastAlertAt: string | null
  paidCheckoutsInWindow: number
  staleHours?: number
}

export type WebhookHealthDecision = {
  alert: boolean
  reason: string | null
  kind: 'signature' | 'stale' | null
}

/** The live Stripe webhook. The apex host is not this endpoint. */
export const STRIPE_WEBHOOK_ENDPOINT = 'https://www.neurochiro.co/api/webhooks/stripe'

export function webhookHealthEmailHtml(input: { reason: string; failedAt: string | null }): string {
  const reason = input.reason.replace(/</g, '')
  const failedAt = (input.failedAt || '').trim()
  const parsed = Date.parse(failedAt)
  const when = failedAt && Number.isFinite(parsed) ? `${new Date(parsed).toISOString()} UTC` : ''
  const time = when ? `<p>Failure time: ${when}</p>` : ''
  return `<p>${reason}</p>${time}<p>Endpoint: ${STRIPE_WEBHOOK_ENDPOINT}</p>`
}

function hoursBetween(laterIso: string, earlierIso: string): number {
  const later = new Date(laterIso).getTime()
  const earlier = new Date(earlierIso).getTime()
  if (!Number.isFinite(later) || !Number.isFinite(earlier)) return Number.POSITIVE_INFINITY
  return (later - earlier) / 3_600_000
}

function cooledDown(input: WebhookHealthInput): boolean {
  if (!input.lastAlertAt) return true
  return hoursBetween(input.now, input.lastAlertAt) >= WEBHOOK_ALERT_COOLDOWN_HOURS
}

/**
 * Alert Raymond when signature checks fail, or when Stripe shows paid
 * checkouts during a stretch with no accepted webhook events.
 */
export function decideWebhookHealth(input: WebhookHealthInput): WebhookHealthDecision {
  const staleHours = input.staleHours && input.staleHours > 0 ? input.staleHours : DEFAULT_WEBHOOK_STALE_HOURS
  if (!cooledDown(input)) return { alert: false, reason: null, kind: null }

  const signatureIsNew = Boolean(
    input.lastSignatureFailureAt
    && (!input.lastEventAt || input.lastEventAt < input.lastSignatureFailureAt)
    && (!input.lastAlertAt || input.lastSignatureFailureAt > input.lastAlertAt),
  )
  if (signatureIsNew) {
    return {
      alert: true,
      kind: 'signature',
      reason: 'Stripe webhook signature verification failed. Paid checkouts will not create doctor accounts until the signing secret matches.',
    }
  }

  const quietHours = input.lastEventAt ? hoursBetween(input.now, input.lastEventAt) : Number.POSITIVE_INFINITY
  if (quietHours >= staleHours && input.paidCheckoutsInWindow > 0) {
    const paid = input.paidCheckoutsInWindow
    return {
      alert: true,
      kind: 'stale',
      reason: `The Stripe webhook has not accepted an event in ${staleHours} hours, and Stripe shows ${paid} paid checkout${paid === 1 ? '' : 's'} in that window. Those doctors will not go live until the endpoint is receiving events.`,
    }
  }

  return { alert: false, reason: null, kind: null }
}
