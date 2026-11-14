import 'server-only';
import { cache } from 'react';
import { STUDENT_CONFIG } from '@/config/students';
import { stripe } from '@/lib/stripe';
import {
  countFoundingSeats,
  foundingSeatAvailable,
  foundingSeatCap,
  foundingSpotsCopy,
  type FoundingSeatSubscription,
  type OpenFoundingHold,
  type StudentPlan,
} from '@/lib/students/founding-seats';

const STATUSES = ['active', 'trialing', 'past_due'] as const;

type PriceSpec = { stripePriceEnv: string; priceId: string; expectCents: number; interval: 'month' | 'year'; usd: number };

export type FoundingOffer = {
  cap: number;
  taken: number | null;
  spotsLeft: number | null;
  copy: string | null;
  open: boolean;
};

export function resolveStudentPriceId(spec: { stripePriceEnv: string; priceId: string }): string {
  const fromEnv = process.env[spec.stripePriceEnv]?.trim();
  return fromEnv || spec.priceId;
}

export function priceSpec(plan: StudentPlan, founding: boolean): PriceSpec {
  if (founding) {
    return plan === 'annual' ? STUDENT_CONFIG.founding.annual : STUDENT_CONFIG.founding.monthly;
  }
  return plan === 'annual' ? STUDENT_CONFIG.membership.annual : STUDENT_CONFIG.membership.monthly;
}

export function foundingPriceIdList(): string[] {
  return [
    resolveStudentPriceId(STUDENT_CONFIG.founding.monthly),
    resolveStudentPriceId(STUDENT_CONFIG.founding.annual),
  ];
}

async function subscriptionsOnPrice(priceId: string): Promise<FoundingSeatSubscription[]> {
  const rows: FoundingSeatSubscription[] = [];
  for (const status of STATUSES) {
    let startingAfter: string | undefined;
    for (let page = 0; page < 5; page += 1) {
      const listed = await stripe.subscriptions.list({
        price: priceId,
        status,
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });
      for (const subscription of listed.data) {
        const price = subscription.items?.data?.[0]?.price?.id ?? priceId;
        rows.push({ id: subscription.id, status: subscription.status, priceId: price });
      }
      if (!listed.has_more || listed.data.length === 0) break;
      startingAfter = listed.data[listed.data.length - 1]?.id;
    }
  }
  return rows;
}

export async function countFoundingSubscriptions(): Promise<number> {
  const priceIds = foundingPriceIdList();
  const groups = await Promise.all(priceIds.map((priceId) => subscriptionsOnPrice(priceId)));
  return countFoundingSeats(groups.flat(), priceIds);
}

export async function listOpenFoundingHolds(): Promise<OpenFoundingHold[]> {
  const priceIds = new Set(foundingPriceIdList());
  const holds: OpenFoundingHold[] = [];
  let startingAfter: string | undefined;
  for (let page = 0; page < 5; page += 1) {
    const listed = await stripe.checkout.sessions.list({
      status: 'open',
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    for (const session of listed.data) {
      const priceId = session.metadata?.priceId || null;
      if (session.metadata?.founding !== '1') continue;
      if (priceId && !priceIds.has(priceId)) continue;
      holds.push({
        id: session.id,
        created: session.created || 0,
        userId: session.metadata?.userId || session.client_reference_id || null,
        plan: session.metadata?.plan || null,
      });
    }
    if (!listed.has_more || listed.data.length === 0) break;
    startingAfter = listed.data[listed.data.length - 1]?.id;
  }
  return holds;
}

export function offerFromCount(taken: number | null): FoundingOffer {
  const cap = foundingSeatCap();
  const copy = foundingSpotsCopy(taken, cap);
  const spotsLeft = taken == null ? null : Math.max(0, cap - taken);
  return { cap, taken, spotsLeft, copy, open: spotsLeft != null && spotsLeft > 0 };
}

export async function loadFoundingOffer(): Promise<FoundingOffer> {
  if (!process.env.STRIPE_SECRET_KEY) return offerFromCount(null);
  try {
    const [taken, holds] = await Promise.all([countFoundingSubscriptions(), listOpenFoundingHolds()]);
    return offerFromCount(taken + holds.length);
  } catch (error) {
    console.error('[students] founding seat count failed', error instanceof Error ? error.message : 'unknown');
    return offerFromCount(null);
  }
}

export const getFoundingSeatStatus = cache(loadFoundingOffer);

export async function foundingCheckoutOpen(userId: string): Promise<boolean> {
  const [taken, holds] = await Promise.all([countFoundingSubscriptions(), listOpenFoundingHolds()]);
  const otherOpenHolds = holds.filter((hold) => hold.userId !== userId).length;
  return foundingSeatAvailable({ subscriptionCount: taken, otherOpenHolds });
}
