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
  if (!cooledDown(input)) return { alert: false, reason: null }

  const signatureIsNew = Boolean(
    input.lastSignatureFailureAt
    && (!input.lastAlertAt || input.lastSignatureFailureAt > input.lastAlertAt),
  )
  if (signatureIsNew) {
    return {
      alert: true,
      reason: 'Stripe webhook signature verification failed. Paid checkouts will not create doctor accounts until the signing secret matches.',
    }
  }

  const quietHours = input.lastEventAt ? hoursBetween(input.now, input.lastEventAt) : Number.POSITIVE_INFINITY
  if (quietHours >= staleHours && input.paidCheckoutsInWindow > 0) {
    const paid = input.paidCheckoutsInWindow
    return {
      alert: true,
      reason: `The Stripe webhook has not accepted an event in ${staleHours} hours, and Stripe shows ${paid} paid checkout${paid === 1 ? '' : 's'} in that window. Those doctors will not go live until the endpoint is receiving events.`,
    }
  }

  return { alert: false, reason: null }
}
