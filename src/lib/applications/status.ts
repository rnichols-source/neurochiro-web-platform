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
  if (input.currentStatus === 'approved' || input.currentStatus === 'declined') {
    return input.currentStatus
  }
  if (input.paymentReceived) return 'approved'
  if (!setupIntentConfirmsCard(input.setupStatus)) return null
  return 'under_review'
}

/** Payment-link checkout already collected money. The application is approved. */
export const PAID_CHECKOUT_APPLICATION_STATUS = 'approved' as const

export function applicationQueue(status: string): 'decision' | 'progress' | 'closed' {
  if (status === 'under_review' || status === 'needs_action') return 'decision'
  if (status === 'draft') return 'progress'
  return 'closed'
}
