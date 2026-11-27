/**
 * Pure helpers for the doctor billing page: pick the membership subscription out of a
 * Stripe customer's subscriptions and format its real price.
 */

export type RawSubscription = {
  id: string;
  status: string;
  created?: number;
  cancel_at_period_end?: boolean | null;
  cancel_at?: number | null;
  current_period_end?: number | null;
  metadata?: Record<string, string | undefined> | null;
  items?: {
    data?: {
      current_period_end?: number | null;
      price?: {
        unit_amount?: number | null;
        currency?: string | null;
        recurring?: { interval?: string | null; interval_count?: number | null } | null;
      } | null;
      plan?: { interval?: string | null; interval_count?: number | null } | null;
    }[];
  } | null;
};

export type MembershipSubscription = {
  id: string;
  status: string;
  /** Major units, for example 39 for $39.00. */
  price: number;
  currency: string;
  interval: string;
  intervalCount: number;
  /** Unix seconds of the current period end, or null. */
  periodEnd: number | null;
  cancelAtPeriodEnd: boolean;
};

/** Subscriptions that are not the doctor membership. */
const NON_MEMBERSHIP_TYPES = new Set(['synapse_seat', 'synapse_addon', 'seminar_package', 'job_feature', 'job_post_nonmember']);

/** Statuses where the membership still exists in Stripe (paid, being retried, or waiting on a first payment). */
export const LIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing', 'past_due', 'unpaid', 'paused', 'incomplete']);

const STATUS_RANK: Record<string, number> = {
  active: 0,
  trialing: 1,
  past_due: 2,
  unpaid: 3,
  paused: 4,
  incomplete: 5,
  canceled: 6,
  incomplete_expired: 7,
};

function toMembership(sub: RawSubscription): MembershipSubscription {
  const item = sub.items?.data?.[0];
  const price = item?.price;
  const interval = price?.recurring?.interval || item?.plan?.interval || 'month';
  const intervalCount = price?.recurring?.interval_count || item?.plan?.interval_count || 1;
  const cents = typeof price?.unit_amount === 'number' ? price.unit_amount : 0;
  return {
    id: sub.id,
    status: sub.status,
    price: cents / 100,
    currency: (price?.currency || 'usd').toLowerCase(),
    interval,
    intervalCount,
    periodEnd: item?.current_period_end ?? sub.current_period_end ?? sub.cancel_at ?? null,
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
  };
}

/**
 * The membership subscription to show: skip seminar, Synapse, and job subscriptions,
 * prefer a live one over an ended one, and the newest within the same status.
 */
export function pickMembershipSubscription(subs: RawSubscription[]): MembershipSubscription | null {
  const candidates = subs.filter((sub) => !NON_MEMBERSHIP_TYPES.has(sub.metadata?.type || ''));
  if (candidates.length === 0) return null;
  const sorted = [...candidates].sort((a, b) => {
    const rank = (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9);
    if (rank !== 0) return rank;
    return (b.created || 0) - (a.created || 0);
  });
  return toMembership(sorted[0]);
}

const SYMBOLS: Record<string, string> = {
  usd: '$',
  gbp: '£',
  eur: '€',
  cad: 'CA$',
  aud: 'A$',
  nzd: 'NZ$',
};

function amountText(amount: number): string {
  return Number.isInteger(amount) ? amount.toLocaleString('en-US') : amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** "$39/mo", "$397/yr", "£79/mo", "$297/yr". 12 months reads as a year. */
export function formatPlanPrice(sub: Pick<MembershipSubscription, 'price' | 'currency' | 'interval' | 'intervalCount'>): string {
  const symbol = SYMBOLS[sub.currency] ?? `${sub.currency.toUpperCase()} `;
  const months = sub.interval === 'month' ? sub.intervalCount : sub.interval === 'year' ? sub.intervalCount * 12 : null;
  let per: string;
  if (months === 1) per = '/mo';
  else if (months === 12) per = '/yr';
  else if (months && months % 12 === 0) per = ` every ${months / 12} years`;
  else if (months) per = ` every ${months} months`;
  else per = sub.interval === 'week' ? '/wk' : `/${sub.interval}`;
  return `${symbol}${amountText(sub.price)}${per}`;
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  trialing: 'Trial',
  past_due: 'Past due',
  unpaid: 'Unpaid',
  paused: 'Paused',
  incomplete: 'Waiting on payment',
  canceled: 'Canceled',
  incomplete_expired: 'Expired',
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}
