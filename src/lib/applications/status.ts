export type ApplicationStatus = 'draft' | 'under_review' | 'approved' | 'declined' | 'needs_action'

/** A saved card counts only after Stripe says the SetupIntent succeeded. */
export function setupIntentConfirmsCard(status: string | null | undefined): boolean {
  return status === 'succeeded'
}

/**
 * Draft becomes under_review only when the SetupIntent succeeded.
 * A real payment (payment link) is approved, so it does not sit in the review queue.
 * Returns null when nothing should change.
 */
export function applicationStatusAfterCard(input: {
  setupStatus: string | null | undefined
  currentStatus: string
  paymentReceived: boolean
}): ApplicationStatus | null {
  if (input.currentStatus === 'declined') return 'declined'
  if (input.paymentReceived) return 'approved'
  if (input.currentStatus === 'approved') return 'approved'
  if (!setupIntentConfirmsCard(input.setupStatus)) return null
  return 'under_review'
}

/**
 * A new card on an application that is already approved retries the charge
 * only when no payment and no subscription are on file.
 */
export function shouldRechargeAfterNewCard(input: {
  previousStatus: string
  paymentReceived: boolean
  subscriptionId: string | null
}): boolean {
  if (input.previousStatus !== 'approved') return false
  if (input.paymentReceived) return false
  if ((input.subscriptionId || '').trim()) return false
  return true
}

/** Payment-link checkout already collected money. The application is approved. */
export const PAID_CHECKOUT_APPLICATION_STATUS = 'approved' as const

export function applicationQueue(status: string): 'decision' | 'progress' | 'closed' {
  if (status === 'under_review' || status === 'needs_action') return 'decision'
  if (status === 'draft') return 'progress'
  return 'closed'
}
