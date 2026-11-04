/**
 * Who shows up on the public directory, profile pages, and sitemap.
 *
 * Unclaimed seeded listings stay public, including pending ones.
 * Verified, founding, and paying rows stay public.
 * A claimed self-signup that is still pending, not approved, not founding,
 * and not paid stays off the site. That is the junk free-signup case.
 */

export type PublicListingRow = {
  verification_status?: string | null
  user_id?: string | null
  is_approved?: boolean | null
  is_founding_member?: boolean | null
  membership_tier?: string | null
  paid_at?: string | null
}

const PUBLIC_STATUSES = new Set(['verified', 'pending'])
const PAID_TIERS = new Set(['basic', 'growth', 'pro', 'neuros'])

export function isDoctorPubliclyVisible(row: PublicListingRow): boolean {
  const status = (row.verification_status || '').trim().toLowerCase()
  if (!PUBLIC_STATUSES.has(status)) return false
  if (!row.user_id) return true
  if (row.is_approved === true) return true
  if (row.is_founding_member === true) return true
  const tier = (row.membership_tier || '').trim().toLowerCase()
  if (PAID_TIERS.has(tier)) return true
  if (row.paid_at) return true
  if (status === 'verified') return true
  return false
}

/** PostgREST `or` filter. Pair it with verification_status in (verified, pending). */
export const PUBLIC_LISTING_OR =
  'user_id.is.null,is_approved.eq.true,is_founding_member.eq.true,membership_tier.in.(basic,growth,pro,neuros),paid_at.not.is.null,verification_status.eq.verified'

export function applyPublicListing<T extends { or: (filters: string) => T }>(query: T): T {
  return query.or(PUBLIC_LISTING_OR)
}
