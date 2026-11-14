import 'server-only';
import { cache } from 'react';
import { STUDENT_CONFIG } from '@/config/students';
import { stripe } from '@/lib/stripe';
import {
  countFoundingSeats,
  foundingSeatCap,
  foundingSpotsCopy,
  type FoundingSeatSubscription,
} from '@/lib/students/founding-seats';

const STATUSES = ['active', 'trialing', 'past_due'] as const;

function envPriceId(name: string): string | null {
  const value = process.env[name]?.trim();
  return value || null;
}

async function foundingPriceIds(): Promise<string[]> {
  const fromEnv = [
    envPriceId(STUDENT_CONFIG.founding.monthly.stripePriceEnv),
    envPriceId(STUDENT_CONFIG.founding.annual.stripePriceEnv),
  ].filter((id): id is string => Boolean(id));
  if (fromEnv.length) return [...new Set(fromEnv)];
  if (!process.env.STRIPE_SECRET_KEY) return [];
  const found = await stripe.prices.search({
    query: "active:'true' AND metadata['kind']:'student_founding'",
    limit: 10,
  });
  return found.data.map((price) => price.id);
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

export const getFoundingSeatStatus = cache(async (): Promise<{ cap: number; taken: number | null; copy: string }> => {
  const cap = foundingSeatCap();
  try {
    const priceIds = await foundingPriceIds();
    if (!priceIds.length || !process.env.STRIPE_SECRET_KEY) {
      return { cap, taken: null, copy: foundingSpotsCopy(null, cap) };
    }
    const groups = await Promise.all(priceIds.map((priceId) => subscriptionsOnPrice(priceId)));
    const taken = countFoundingSeats(groups.flat(), priceIds);
    return { cap, taken, copy: foundingSpotsCopy(taken, cap) };
  } catch (error) {
    console.error('[students] founding seat count failed', error instanceof Error ? error.message : 'unknown');
    return { cap, taken: null, copy: foundingSpotsCopy(null, cap) };
  }
});
