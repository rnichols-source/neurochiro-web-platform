import { USD_DOCTOR_PLANS } from '../pricing.ts';

export const LEGACY_PRACTICE_TOOLS_CUTOFF = '2026-07-15T00:00:00Z';
/**
 * Label for an existing member's own plan. Stays on the pre-Dec 1, 2026 rate.
 * New-member prices come from src/lib/pricing.ts.
 */
export const PRO_PRICE_LABEL = USD_DOCTOR_PLANS.legacy.perMonth;

export type MembershipTier = 'free' | 'pro' | 'neuros';
export type MembershipSource = 'stripe' | 'founding' | 'comped' | 'none';
export type MembershipStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused'
  | 'none';

export type StripeAccess = {
  paid: boolean | 'unchanged';
  paymentIssue: boolean;
};

const PAID_ACCESS = new Set(['active', 'trialing']);
const FREE_ACCESS = new Set(['canceled', 'unpaid', 'incomplete_expired']);

/**
 * Doctors and students share this table. `role` does not change the result.
 * `paused` keeps the current tier and raises the payment-issue flag until Raymond decides otherwise.
 */
export function accessForStripeStatus(status: string, role: string): StripeAccess {
  if (typeof role !== 'string') return { paid: 'unchanged', paymentIssue: false };
  const normalized = status.trim().toLowerCase();
  if (PAID_ACCESS.has(normalized)) return { paid: true, paymentIssue: false };
  if (normalized === 'past_due') return { paid: true, paymentIssue: true };
  if (normalized === 'incomplete') return { paid: 'unchanged', paymentIssue: false };
  if (normalized === 'paused') return { paid: 'unchanged', paymentIssue: true };
  if (FREE_ACCESS.has(normalized)) return { paid: false, paymentIssue: false };
  return { paid: 'unchanged', paymentIssue: false };
}

export type Membership = {
  tier: MembershipTier;
  source: MembershipSource;
  status: MembershipStatus;
  priceLabel: string | null;
  renewsAt: string | null;
  hasPracticeTools: boolean;
  isFounder: boolean;
  hasStripeCustomer: boolean;
};

export type MembershipInput = {
  membershipTier?: string | null;
  profileTier?: string | null;
  isFoundingMember?: boolean | null;
  neurosTier?: string | null;
  createdAt?: string | null;
  hasStripeCustomer?: boolean;
  stripeStatus?: MembershipStatus | null;
  renewsAt?: string | null;
};

const PAID = new Set(['pro', 'growth', 'neuros']);

export function deriveMembership(input: MembershipInput): Membership {
  const founding = Boolean(input.isFoundingMember);
  const neuros = input.neurosTier === 'neuros' || input.neurosTier === 'neuros_founding';
  const stored = (input.membershipTier || input.profileTier || 'free').toLowerCase();
  const created = input.createdAt ? new Date(input.createdAt) : null;
  const legacy = Boolean(created && created < new Date(LEGACY_PRACTICE_TOOLS_CUTOFF));
  const stripeStatus = input.stripeStatus || null;
  const hasStripe = Boolean(input.hasStripeCustomer);

  let tier: MembershipTier = 'free';
  let source: MembershipSource = 'none';
  let status: MembershipStatus = 'none';
  let priceLabel: string | null = null;

  if (neuros) {
    tier = 'neuros';
    source = founding ? 'founding' : hasStripe ? 'stripe' : 'comped';
    status = stripeStatus && stripeStatus !== 'none' ? stripeStatus : 'active';
    priceLabel = source === 'founding' ? null : PRO_PRICE_LABEL;
  } else if (founding) {
    tier = 'pro';
    source = 'founding';
    status = 'active';
    priceLabel = null;
  } else if (hasStripe) {
    source = 'stripe';
    status = stripeStatus || 'active';
    if (status === 'canceled' || status === 'unpaid' || status === 'incomplete_expired') {
      tier = 'free';
    } else if (status === 'incomplete' || status === 'paused') {
      tier = stored === 'neuros' ? 'neuros' : PAID.has(stored) ? 'pro' : 'free';
    } else {
      tier = 'pro';
    }
    priceLabel = tier === 'pro' ? PRO_PRICE_LABEL : null;
  } else if (PAID.has(stored) || stored === 'comped') {
    tier = stored === 'neuros' ? 'neuros' : 'pro';
    source = 'comped';
    status = 'active';
    priceLabel = PRO_PRICE_LABEL;
  }

  const isPro = tier === 'pro' || tier === 'neuros' || founding;
  const hasPracticeTools = founding || (legacy && isPro && (stored === 'pro' || stored === 'growth' || founding || tier !== 'free'));

  return {
    tier,
    source,
    status,
    priceLabel,
    renewsAt: input.renewsAt || null,
    hasPracticeTools,
    isFounder: founding,
    hasStripeCustomer: hasStripe,
  };
}
