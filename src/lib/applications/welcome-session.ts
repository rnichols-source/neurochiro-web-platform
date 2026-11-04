export type CheckoutSnapshot = {
  id?: string | null
  status?: string | null
  payment_status?: string | null
}

/** A country welcome form may create a listing only after Stripe says the Checkout was paid. */
export function isPaidCheckoutSession(session: CheckoutSnapshot | null | undefined): boolean {
  if (!session?.id) return false
  if (session.status !== 'complete') return false
  return session.payment_status === 'paid'
}
