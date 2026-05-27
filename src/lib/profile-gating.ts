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
  trial_ends_at?: string | null;
}): boolean {
  // Founding members bypass all gates
  if (doctor.is_founding_member) return false;

  // Pro tier is never gated
  const tier = doctor.membership_tier || 'free';
  if (tier === 'pro' || tier === 'growth') return false;

  // Active trial bypasses gates
  if (doctor.trial_ends_at && new Date(doctor.trial_ends_at) > new Date()) return false;

  // Free/basic/starter doctors created BEFORE the cutoff are grandfathered.
  if (!doctor.created_at) return false;
  if (new Date(doctor.created_at) < new Date(GATING_CUTOFF_DATE)) return false;

  // New free doctors after the cutoff: gated
  return true;
}
