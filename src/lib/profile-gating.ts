/**
 * Profile gating logic for free doctor profiles.
 *
 * CONTACT INFO GATING IS CURRENTLY DISABLED.
 * Set NEXT_PUBLIC_GATE_CONTACT_INFO=true to re-enable.
 *
 * Decision (2026-09-23): A patient who can't reach a doctor leaves and
 * Googles the practice directly. Gating costs us the patient and costs
 * the doctor nothing. Pro's value is interviews, clips, promotion, and
 * dashboard analytics — not withholding a phone number from someone in pain.
 *
 * Dashboard analytics, profile views, and lead data remain Pro-only.
 */

const GATING_CUTOFF_DATE = '2026-05-26T00:00:00Z';
const CONTACT_GATING_ENABLED = process.env.NEXT_PUBLIC_GATE_CONTACT_INFO === 'true';

export function isProfileGated(doctor: {
  membership_tier?: string;
  is_founding_member?: boolean;
  created_at?: string;
}): boolean {
  // Contact gating disabled by default — all contact info visible
  if (!CONTACT_GATING_ENABLED) return false;

  // Founding members bypass all gates
  if (doctor.is_founding_member) return false;

  // Pro tier is never gated
  const tier = doctor.membership_tier || 'free';
  if (tier === 'pro' || tier === 'growth') return false;

  // Free/basic/starter doctors created BEFORE the cutoff are grandfathered.
  if (!doctor.created_at) return false;
  if (new Date(doctor.created_at) < new Date(GATING_CUTOFF_DATE)) return false;

  return true;
}
