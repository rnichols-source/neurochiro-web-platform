import { accessForStripeStatus } from '../portal/membership.ts'

/** active and past_due keep Pro. canceled and unpaid return the doctor to free. incomplete waits. */
export function membershipTierForStripeStatus(status: string): 'pro' | 'free' | null {
  const access = accessForStripeStatus(status, 'doctor')
  if (access.paid === true) return 'pro'
  if (access.paid === false) return 'free'
  return null
}
