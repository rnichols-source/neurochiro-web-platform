export type LiveBillingStatus = 'active' | 'trialing' | 'past_due' | null

export type BillingClass =
  | 'paying'
  | 'trialing'
  | 'past_due'
  | 'founding-comped'
  | 'free'
  | 'pending'
  | 'mismatch'
  | 'unknown'

const PAID_STORED = new Set(['pro', 'growth', 'neuros'])

export type BillingClassInput = {
  stripeOk: boolean
  live: LiveBillingStatus
  isFoundingMember?: boolean | null
  membershipTier?: string | null
  profileTier?: string | null
  neurosTier?: string | null
  verificationStatus?: string | null
}

/**
 * Shared Members and Coverage precedence.
 * A paid stored tier with no live Stripe subscription is a mismatch.
 * A founding flag or an explicit comped tier stays founding/comped.
 * When Stripe is down, return unknown so callers do not cache a wrong label.
 */
export function classifyMemberBilling(input: BillingClassInput): BillingClass {
  if (!input.stripeOk) return 'unknown'
  if (input.live === 'active') return 'paying'
  if (input.live === 'trialing') return 'trialing'
  if (input.live === 'past_due') return 'past_due'
  const stored = (input.membershipTier || input.profileTier || '').toLowerCase()
  const founding = input.isFoundingMember === true
  const explicitComped = stored === 'comped' || stored === 'student_comped' || input.neurosTier === 'neuros_founding'
  const paidStored = PAID_STORED.has(stored) || input.neurosTier === 'neuros'
  if (paidStored && !founding && !explicitComped) return 'mismatch'
  if (founding || explicitComped) return 'founding-comped'
  if ((input.verificationStatus || '').toLowerCase() === 'pending') return 'pending'
  return 'free'
}
