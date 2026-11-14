import { STUDENT_CONFIG } from '../../config/students.ts';

export type FoundingSeatSubscription = {
  id: string;
  status: string;
  priceId: string | null;
};

const COUNTED_STATUSES = new Set(['active', 'trialing', 'past_due']);

export function foundingSeatCap(): number {
  return STUDENT_CONFIG.founding.maxSeats;
}

export function foundingSeatLabel(cap = foundingSeatCap()): string {
  return `Founding ${cap}`;
}

export function foundingSpotsLeft(taken: number, cap = foundingSeatCap()): number {
  const used = Number.isFinite(taken) ? Math.max(0, Math.floor(taken)) : 0;
  return Math.max(0, cap - used);
}

/** Shown on the student pages. Unknown counts still name the cohort. */
export function foundingSpotsCopy(taken: number | null, cap = foundingSeatCap()): string {
  const label = foundingSeatLabel(cap);
  if (taken == null) return label;
  const left = foundingSpotsLeft(taken, cap);
  if (left === 0) return `${label} is full`;
  const spots = left === 1 ? '1 spot left' : `${left} spots left`;
  return `${label} · ${spots}`;
}

/**
 * A seat is the current price, not the price someone used to pay.
 * The legacy $12 subscription counts once it is on the founding monthly price.
 */
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
