/**
 * Decide whether a new login should take over an admin-built doctor profile.
 * Pure on purpose: the database lookup lives in claim-existing-run.ts.
 */

const PAID_TIERS = new Set(['basic', 'growth', 'pro', 'neuros'])
const SKIP_LOGIN_ROLES = new Set([
  'student',
  'student_paid',
  'vendor',
  'admin',
  'founder',
  'super_admin',
  'regional_admin',
])

export type ClaimCandidate = {
  id: string
  user_id: string | null
  email: string | null
  first_name?: string | null
  last_name?: string | null
  slug?: string | null
  clinic_name?: string | null
  city?: string | null
  bio?: string | null
  membership_tier?: string | null
  verification_status?: string | null
  is_founding_member?: boolean | null
  is_approved?: boolean | null
  paid_at?: string | null
  stripe_customer_id?: string | null
}

export type ClaimDecision =
  | { action: 'claim'; doctor: ClaimCandidate }
  | { action: 'already-linked'; doctor: ClaimCandidate }
  | { action: 'none' }
  | { action: 'review'; reason: 'taken' | 'ambiguous' }

export function normalizeClaimEmail(email: string | null | undefined): string {
  return (email || '').trim().toLowerCase()
}

export function doctorDisplayName(doctor: Pick<ClaimCandidate, 'first_name' | 'last_name'>, fallback = ''): string {
  const name = `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim()
  return name || fallback.trim()
}

/** Pro, legacy paid tiers, founding members, and rows with a paid date. */
export function isPaidDoctor(doctor: Pick<ClaimCandidate, 'membership_tier' | 'is_founding_member' | 'paid_at'>): boolean {
  if (doctor.is_founding_member === true) return true
  if ((doctor.paid_at || '').trim()) return true
  return PAID_TIERS.has((doctor.membership_tier || '').trim().toLowerCase())
}

/** Paid or already-verified listings are real directory profiles, not a fresh free signup. */
export function isEstablishedDoctor(doctor: Pick<ClaimCandidate, 'membership_tier' | 'is_founding_member' | 'paid_at' | 'verification_status'>): boolean {
  if (isPaidDoctor(doctor)) return true
  return (doctor.verification_status || '').trim().toLowerCase() === 'verified'
}

/**
 * The empty row the signup form inserts: hidden or pending, free, no clinic.
 * Safe to remove only after the real profile has been linked to the same login.
 */
export function isBlankSignupRow(doctor: ClaimCandidate): boolean {
  if (isEstablishedDoctor(doctor)) return false
  if (doctor.is_approved === true) return false
  if ((doctor.stripe_customer_id || '').trim()) return false
  if ((doctor.paid_at || '').trim()) return false
  const clinic = (doctor.clinic_name || '').trim().toLowerCase()
  if (clinic && clinic !== 'private practice') return false
  if ((doctor.bio || '').trim()) return false
  if ((doctor.city || '').trim()) return false
  const tier = (doctor.membership_tier || '').trim().toLowerCase()
  if (tier && tier !== 'free' && tier !== 'starter') return false
  const status = (doctor.verification_status || '').trim().toLowerCase()
  if (status && status !== 'pending' && status !== 'hidden') return false
  return true
}

/** True when this login already has a real doctor profile, so we must not attach a second one. */
export function userAlreadyHasRealProfile(owned: ClaimCandidate[]): boolean {
  return owned.some((row) => !isBlankSignupRow(row))
}

/** Login may link a doctor, patient, or still-unset account. Students and staff stay as they are. */
export function shouldAttemptDoctorClaim(role: string | null | undefined): boolean {
  const normalized = (role || '').trim().toLowerCase()
  if (SKIP_LOGIN_ROLES.has(normalized)) return false
  return true
}

export function profilePatchForClaim(doctor: ClaimCandidate): Record<string, string> {
  const patch: Record<string, string> = { role: 'doctor' }
  if (isPaidDoctor(doctor)) patch.tier = 'pro'
  const customer = (doctor.stripe_customer_id || '').trim()
  if (customer) patch.stripe_customer_id = customer
  const name = doctorDisplayName(doctor)
  if (name) patch.full_name = name
  return patch
}

/**
 * Claim only when exactly one matching row has no login.
 * A row already tied to someone else is left alone.
 * A row already tied to this same login is not claimed a second time.
 */
export function decideDoctorClaim(
  userId: string,
  email: string,
  rows: ClaimCandidate[],
  options?: { truncated?: boolean },
): ClaimDecision {
  if (options?.truncated) return { action: 'review', reason: 'ambiguous' }
  const normalized = normalizeClaimEmail(email)
  if (!normalized || !normalized.includes('@')) return { action: 'none' }

  const matches = rows.filter((row) => normalizeClaimEmail(row.email) === normalized)
  const unclaimed = matches.filter((row) => !row.user_id)
  const mine = matches.filter((row) => row.user_id === userId)
  const taken = matches.filter((row) => row.user_id && row.user_id !== userId)

  if (unclaimed.length === 1) return { action: 'claim', doctor: unclaimed[0] }
  if (unclaimed.length > 1) return { action: 'review', reason: 'ambiguous' }
  if (mine.length > 0) return { action: 'already-linked', doctor: mine[0] }
  if (taken.length > 0) return { action: 'review', reason: 'taken' }
  return { action: 'none' }
}

export function existingMemberLoginAlert(input: { name: string; email: string; slug?: string | null }): string {
  const name = input.name.trim() || 'A doctor'
  const slug = (input.slug || '').trim().toLowerCase()
  const profile = /^[a-z0-9-]{1,80}$/.test(slug)
    ? `https://neurochiro.co/directory/${slug}`
    : 'https://neurochiro.co/directory'
  return [
    `✅ **Existing member ${name} created their login**`,
    `Email: ${input.email.trim()}`,
    `Profile: ${profile}`,
    'Their existing profile is linked. No new application was started.',
    'Dashboard: https://neurochiro.co/doctor/dashboard',
  ].join('\n')
}

export function claimReviewAlert(input: { email: string; reason: 'taken' | 'ambiguous' }): string {
  const why = input.reason === 'taken'
    ? 'That email matches a doctor profile already linked to a different login. Nothing was moved. A new signup was created instead.'
    : 'More than one unclaimed doctor profile matches that email. No profile was linked. A new signup was created instead.'
  return [
    '⚠️ **Doctor signup needs a look**',
    `Email: ${input.email.trim()}`,
    why,
    'Search the email in Members: https://neurochiro.co/admin/members',
  ].join('\n')
}
