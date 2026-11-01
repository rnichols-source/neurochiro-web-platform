/** Synapse commercial terms. Numbers live here so pages cannot drift. No secrets. */

export const SYNAPSE_COUNTRIES = ['US', 'AU', 'GB', 'CA', 'AE'] as const
export type SynapseCountry = (typeof SYNAPSE_COUNTRIES)[number]

export const COUNTRY_LABELS: Record<SynapseCountry, string> = {
  US: 'United States',
  AU: 'Australia and New Zealand',
  GB: 'United Kingdom',
  CA: 'Canada',
  AE: 'United Arab Emirates',
}

export const ANCHOR_TERMS = {
  core: { floorCents: 600_000, rateCents: 6_000 },
  standard: { floorCents: 300_000, rateCents: 3_000 },
} as const

export const ALLY_ANNUAL_CENTS = 149_000
export const RENEWAL_CAP = 1.25
export const SEAT_HOLD_DAYS = 14
export const PROOF_MIN_RATINGS = 5
export const PROOF_WINDOW_DAYS = 180
export const AT_RISK_BELOW = 4.3
export const REVIEW_BELOW = 4.0
export const FIRST_LOOK_HOURS = 48
export const ANONYMITY_FLOOR = 10
export const MEMBERSHIP_PAYBACK_CENTS = 99_000

export const HOLDING_SEAT_STATUSES = ['pending_payment', 'active', 'at_risk', 'review'] as const
export type SeatStatus = 'pending_payment' | 'active' | 'at_risk' | 'review' | 'lapsed' | 'revoked'
export type SeatTier = 'anchor' | 'ally'

export const ADDONS = [
  { key: 'spotlight_read', label: 'Spotlight sponsor read', cents: 50_000, env: 'STRIPE_SYNAPSE_SPOTLIGHT_READ_PRICE_ID', interval: null },
  { key: 'proof_panel', label: 'Proof Panel', cents: 250_000, env: 'STRIPE_SYNAPSE_PROOF_PANEL_PRICE_ID', interval: null },
  { key: 'seminar_slot', label: 'Seminar Partner Lab slot', cents: 100_000, env: 'STRIPE_SYNAPSE_SEMINAR_SLOT_PRICE_ID', interval: null },
  { key: 'student_kit', label: 'Student Launch Kit', cents: 250_000, env: 'STRIPE_SYNAPSE_STUDENT_KIT_PRICE_ID', interval: null },
] as const

export type AddonKey = (typeof ADDONS)[number]['key']

export const PRICE_ENV = {
  anchorCoreFloor: 'STRIPE_SYNAPSE_ANCHOR_CORE_FLOOR_PRICE_ID',
  anchorStandardFloor: 'STRIPE_SYNAPSE_ANCHOR_STANDARD_FLOOR_PRICE_ID',
  anchorCorePerMember: 'STRIPE_SYNAPSE_ANCHOR_CORE_PER_MEMBER_PRICE_ID',
  anchorStandardPerMember: 'STRIPE_SYNAPSE_ANCHOR_STANDARD_PER_MEMBER_PRICE_ID',
  ally: 'STRIPE_SYNAPSE_ALLY_PRICE_ID',
} as const

export const VETTING_CHECKS = [
  { key: 'fit', label: 'Nervous-system or practice fit' },
  { key: 'no_disease_claims', label: 'No disease-cure or fear claims' },
  { key: 'cgmp', label: 'cGMP and third-party testing for supplements' },
  { key: 'member_users_or_proof', label: '3+ member users, or a Proof Panel is agreed' },
  { key: 'best_price_pledge', label: 'Best-member-price pledge' },
  { key: 'support_reply', label: 'Support reply within 1 business day' },
  { key: 'shares_redemption', label: 'Shares redemption data' },
  { key: 'baa', label: 'BAA if it handles PHI' },
  { key: 'years_operating', label: '2+ years operating' },
  { key: 'makers_spotlight', label: 'A leader will do a Maker\'s Spotlight' },
] as const

export function formatDollars(cents: number): string {
  const dollars = cents / 100
  return Number.isInteger(dollars) ? `$${dollars.toLocaleString('en-US')}` : `$${dollars.toFixed(2)}`
}

export function isSynapseCountry(value: string): value is SynapseCountry {
  return (SYNAPSE_COUNTRIES as readonly string[]).includes(value)
}

/** NZ shares the Australia seat. Anything else stays as typed so callers can reject it. */
export function marketplaceCountry(raw: string | null | undefined): SynapseCountry {
  const code = (raw || '').trim().toUpperCase()
  if (code === 'NZ' || code === 'AU' || code === 'AUSTRALIA' || code === 'NEW ZEALAND') return 'AU'
  if (code === 'UK' || code === 'GB' || code === 'UNITED KINGDOM') return 'GB'
  if (code === 'CA' || code === 'CANADA') return 'CA'
  if (code === 'AE' || code === 'UAE') return 'AE'
  if (code === 'US' || code === 'USA' || code === 'UNITED STATES') return 'US'
  return 'US'
}
