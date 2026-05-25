/**
 * Profile gating logic for free doctor profiles.
 * Gates contact info (phone, website, email, socials, booking) on
 * new free profiles to drive upgrades. Existing free members are
 * grandfathered — only new signups after the cutoff date are gated.
 */

// Set to the date this feature was deployed.
// Any doctor created before this date keeps full visibility.
const GATING_CUTOFF_DATE = '2026-05-26T00:00:00Z';

export function isProfileGated(doctor: {
  membership_tier?: string;
  is_founding_member?: boolean;
  created_at?: string;
}): boolean {
  // Founding members bypass all gates
  if (doctor.is_founding_member) return false;

  // Paid tiers are never gated
  const tier = doctor.membership_tier || 'free';
  if (tier === 'growth' || tier === 'pro') return false;

  // Free/basic/starter doctors created BEFORE the cutoff are grandfathered.
  // If created_at is not available, assume grandfathered (existing doctor).
  if (!doctor.created_at) return false;
  if (new Date(doctor.created_at) < new Date(GATING_CUTOFF_DATE)) return false;

  // New free doctors after the cutoff: gated
  return true;
}
