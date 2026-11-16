import { deriveMembership } from './portal/membership.ts'

export type NudgeDoctor = {
  user_id?: string | null
  verification_status?: string | null
  is_test?: boolean | null
  membership_tier?: string | null
  is_founding_member?: boolean | null
  neuros_tier?: string | null
  created_at?: string | null
  profile_tier?: string | null
}

/**
 * Paid, active doctor members only.
 * deriveMembership is the same decision the doctor portal uses.
 * There is no subscription_status column, so a leftover Stripe customer id
 * is not an active membership. Billing writes the current plan on
 * doctors.membership_tier. Founding members and neuros stay active.
 * A row with no user_id is a legacy directory listing.
 */
export function isPaidActiveNudgeDoctor(row: NudgeDoctor): boolean {
  if (!row.user_id) return false
  if (row.is_test === true) return false
  if ((row.verification_status || '').trim().toLowerCase() !== 'verified') return false
  const membership = deriveMembership({
    membershipTier: row.membership_tier,
    profileTier: row.profile_tier,
    isFoundingMember: row.is_founding_member,
    neurosTier: row.neuros_tier,
    createdAt: row.created_at,
    hasStripeCustomer: false,
    stripeStatus: null,
  })
  const paidTier = membership.tier === 'pro' || membership.tier === 'neuros'
  return paidTier && (membership.status === 'active' || membership.status === 'trialing')
}
