import { isListingOrPaidMembership } from '../applications/existing-listing.ts'

/** Cookie name. The value is `${userId}:${doctorId}` so one browser cannot apply another login's clinic. */
export const SELECTED_DOCTOR_COOKIE = 'nc_selected_doctor'

export type ListingSortFields = {
  id: string
  city?: string | null
  clinic_name?: string | null
  first_name?: string | null
  last_name?: string | null
}

export type OwnedListingInput = ListingSortFields & {
  email?: string | null
  user_id?: string | null
  userId?: string | null
  is_approved?: boolean | null
  isApproved?: boolean | null
  verification_status?: string | null
  verificationStatus?: string | null
  paid_at?: string | null
  paidAt?: string | null
  membership_tier?: string | null
  membershipTier?: string | null
  stripe_subscription_id?: string | null
  stripeSubscriptionId?: string | null
}

function text(value: string | null | undefined): string {
  return (value || '').trim()
}

/** Clinic name when the listing has one, otherwise the doctor's name. */
export function listingDisplayName(row: ListingSortFields): string {
  const clinic = text(row.clinic_name)
  if (clinic) return clinic
  const person = [text(row.first_name), text(row.last_name)].filter(Boolean).join(' ')
  return person || 'Clinic'
}

/** Label shown in the portal switcher: clinic or doctor name, plus city. */
export function listingLabel(row: ListingSortFields): string {
  const name = listingDisplayName(row)
  const city = text(row.city)
  return city ? `${name} · ${city}` : name
}

export function compareListings(a: ListingSortFields, b: ListingSortFields): number {
  const city = text(a.city).localeCompare(text(b.city), 'en', { sensitivity: 'base' })
  if (city) return city
  const name = listingDisplayName(a).localeCompare(listingDisplayName(b), 'en', { sensitivity: 'base' })
  if (name) return name
  return a.id.localeCompare(b.id)
}

export function sortListings<T extends ListingSortFields>(rows: readonly T[]): T[] {
  return [...rows].sort(compareListings)
}

/**
 * The listing this request should use.
 * A missing, stale, or unowned id falls back to the first stable listing.
 * An empty list returns null. This never throws when several rows exist.
 */
export function resolveSelectedListing<T extends { id: string }>(
  listings: readonly T[],
  requestedId: string | null | undefined,
): T | null {
  if (!listings.length) return null
  if (requestedId) {
    const match = listings.find((row) => row.id === requestedId)
    if (match) return match
  }
  return listings[0]
}

export function shouldShowLocationSwitcher(count: number): boolean {
  return count > 1
}

export function selectionCookieValue(userId: string, doctorId: string): string {
  return `${userId}:${doctorId}`
}

/** Returns the doctor id only when the cookie was written for this user. */
export function readSelectionFromCookie(raw: string | null | undefined, userId: string): string | null {
  const owner = text(userId)
  if (!raw || !owner) return null
  const prefix = `${owner}:`
  if (!raw.startsWith(prefix)) return null
  const doctorId = raw.slice(prefix.length).trim()
  if (!doctorId || doctorId.includes(':')) return null
  return doctorId
}

export function listingIsPaid(row: OwnedListingInput): boolean {
  return isListingOrPaidMembership({
    id: row.id,
    email: text(row.email),
    userId: text(row.userId || row.user_id) || null,
    isApproved: row.isApproved === true || row.is_approved === true,
    verificationStatus: row.verificationStatus || row.verification_status || null,
    paidAt: row.paidAt || row.paid_at || null,
    membershipTier: row.membershipTier || row.membership_tier || null,
    stripeSubscriptionId: row.stripeSubscriptionId || row.stripe_subscription_id || null,
  })
}

/**
 * A login that already owns a listing must not get another draft row.
 * A paid or live listing wins over a blank draft. Otherwise the stable first listing is used.
 */
export function chooseOwnedListing<T extends OwnedListingInput>(rows: readonly T[]): { row: T; paid: boolean } | null {
  const sorted = sortListings(rows.filter((row) => text(row.id)))
  if (!sorted.length) return null
  const paid = sorted.filter((row) => listingIsPaid(row))
  if (paid.length) return { row: paid[0], paid: true }
  return { row: sorted[0], paid: false }
}
