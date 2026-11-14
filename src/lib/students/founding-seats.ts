import { STUDENT_CONFIG } from '../../config/students.ts';

export type StudentPlan = 'monthly' | 'annual';

export type FoundingSeatSubscription = {
  id: string;
  status: string;
  priceId: string | null;
};

export type OpenFoundingHold = {
  id: string;
  created: number;
  userId: string | null;
  plan?: string | null;
};

const COUNTED_STATUSES = new Set(['active', 'trialing', 'past_due']);

export function foundingSeatCap(): number {
  return STUDENT_CONFIG.founding.maxSeats;
}

/** Null when the count is unknown or the cohort is full. The page then shows the regular price. */
export function foundingSpotsCopy(taken: number | null, cap = foundingSeatCap()): string | null {
  if (taken == null || !Number.isFinite(taken)) return null;
  const used = Math.max(0, Math.floor(taken));
  const left = Math.max(0, cap - used);
  if (left === 0) return null;
  const spots = left === 1 ? '1 spot' : `${left} spots`;
  return `Founding ${cap}: ${spots} left at $9.99/mo`;
}

export function countsTowardFoundingCap(
  subscription: FoundingSeatSubscription,
  foundingPriceIds: readonly string[],
): boolean {
  if (!subscription.priceId) return false;
  if (!COUNTED_STATUSES.has(subscription.status)) return false;
  return foundingPriceIds.includes(subscription.priceId);
}

export function countFoundingSeats(
  subscriptions: readonly FoundingSeatSubscription[],
  foundingPriceIds: readonly string[],
): number {
  const ids = new Set<string>();
  for (const subscription of subscriptions) {
    if (countsTowardFoundingCap(subscription, foundingPriceIds)) ids.add(subscription.id);
  }
  return ids.size;
}

/** Other people's open founding checkouts count as holds. This student's own open checkout does not. */
export function foundingSeatAvailable(input: {
  subscriptionCount: number;
  otherOpenHolds: number;
  cap?: number;
}): boolean {
  const cap = input.cap ?? foundingSeatCap();
  const subs = Math.max(0, Math.floor(input.subscriptionCount));
  const holds = Math.max(0, Math.floor(input.otherOpenHolds));
  return subs + holds < cap;
}

/**
 * After two checkouts are created together, the earlier one keeps the last seat.
 * The later one is expired and sent to the regular price.
 */
export function sessionKeepsFoundingSeat(input: {
  subscriptionCount: number;
  holds: readonly OpenFoundingHold[];
  sessionId: string;
  cap?: number;
}): boolean {
  const cap = input.cap ?? foundingSeatCap();
  const ranked = [...input.holds].sort((a, b) => a.created - b.created || a.id.localeCompare(b.id));
  const index = ranked.findIndex((hold) => hold.id === input.sessionId);
  if (index < 0) return false;
  return Math.max(0, Math.floor(input.subscriptionCount)) + index < cap;
}
