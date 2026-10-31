export const LEGACY_PRACTICE_TOOLS_CUTOFF = '2026-07-15T00:00:00Z';
export const PRO_PRICE_LABEL = '$49/mo';

export type MembershipTier = 'free' | 'pro' | 'neuros';
export type MembershipSource = 'stripe' | 'founding' | 'comped' | 'none';
export type MembershipStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'none';

export type Membership = {
  tier: MembershipTier;
  source: MembershipSource;
  status: MembershipStatus;
  priceLabel: string | null;
  renewsAt: string | null;
  hasPracticeTools: boolean;
  isFounder: boolean;
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
    tier = status === 'canceled' ? 'free' : 'pro';
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
  };
}
