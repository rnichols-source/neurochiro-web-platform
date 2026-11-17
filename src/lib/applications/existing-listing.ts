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

/** Shown after we email the address on the listing. The form password is not used. */
export const LISTING_PASSWORD_EMAIL = 'Check your email to set your password.'

export type ListingClaimResult = {
  ok: boolean
  message: string
  /** The doctors row stays unlinked until the emailed link is verified. */
  linked: false
}

export type ListingClaimPorts = {
  /** Creates a login the form cannot use. The argument has no password field. */
  createUnconfirmedLogin: (input: { email: string }) => Promise<{ userId: string } | { alreadyExists: true } | { failed: true }>
  /** Records which listing to attach after the email is verified. Does not set doctors.user_id. */
  rememberPendingClaim: (input: { userId: string; doctorId: string }) => Promise<boolean>
  /** Emails a password-reset or magic link to the address on the listing. */
  sendPasswordLink: (input: { email: string; doctorId: string; userId: string | null }) => Promise<{ ok: boolean; userId: string | null }>
}

/**
 * Someone typed the email of a listing that already exists.
 * Never turn their submitted password into that login, and never link the row yet.
 */
export async function startListingClaim(input: {
  submittedPassword: string
  doctor: ListingDoctor
  existingUserId: string | null
  ports: ListingClaimPorts
}): Promise<ListingClaimResult> {
  const email = input.doctor.email.trim().toLowerCase()
  // The password typed on the form is discarded. None of the ports receive it.
  void input.submittedPassword
  if (!email.includes('@')) {
    return { ok: false, message: 'Something went wrong. Please try again.', linked: false }
  }
  let userId = input.doctor.userId || input.existingUserId
  if (!userId) {
    const created = await input.ports.createUnconfirmedLogin({ email })
    if ('userId' in created) userId = created.userId
    else if (!('alreadyExists' in created)) {
      return { ok: false, message: 'Something went wrong. Please try again.', linked: false }
    }
  }
  if (userId && !input.doctor.userId) {
    const remembered = await input.ports.rememberPendingClaim({ userId, doctorId: input.doctor.id })
    if (!remembered) return { ok: false, message: 'Something went wrong. Please try again.', linked: false }
  }
  const sent = await input.ports.sendPasswordLink({ email, doctorId: input.doctor.id, userId })
  if (!sent.ok) return { ok: false, message: 'Something went wrong. Please try again.', linked: false }
  if (sent.userId && !userId && !input.doctor.userId) {
    await input.ports.rememberPendingClaim({ userId: sent.userId, doctorId: input.doctor.id })
  }
  return { ok: true, message: LISTING_PASSWORD_EMAIL, linked: false }
}

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
