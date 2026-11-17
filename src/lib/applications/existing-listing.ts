export type ListingDoctor = {
  id: string
  email: string
  userId: string | null
  isApproved: boolean
  verificationStatus: string | null
  paidAt: string | null
  membershipTier: string | null
  stripeSubscriptionId: string | null
}

export const EXISTING_LISTING_MESSAGE = 'You already have a listing, set your password'

export function isListingOrPaidMembership(doctor: ListingDoctor): boolean {
  if (doctor.isApproved) return true
  if ((doctor.verificationStatus || '').trim().toLowerCase() === 'verified') return true
  if ((doctor.paidAt || '').trim()) return true
  if ((doctor.stripeSubscriptionId || '').trim()) return true
  const tier = (doctor.membershipTier || '').trim().toLowerCase()
  if (tier && tier !== 'free') return true
  return false
}

/**
 * A matching doctors row that already has a listing or a paid membership
 * is linked to the auth user. A blank draft is not that row.
 */
export function signupDuplicateDecision(
  email: string,
  doctors: ListingDoctor[],
): { action: 'create' } | { action: 'link'; doctorId: string; message: string } {
  const wanted = email.trim().toLowerCase()
  if (!wanted.includes('@')) return { action: 'create' }
  const match = doctors.find((doctor) => {
    return doctor.email.trim().toLowerCase() === wanted && isListingOrPaidMembership(doctor)
  })
  if (!match) return { action: 'create' }
  return { action: 'link', doctorId: match.id, message: EXISTING_LISTING_MESSAGE }
}
