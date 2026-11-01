import 'server-only'
import { stripe } from '@/lib/stripe'
import { ADDONS, ALLY_ANNUAL_CENTS, ANCHOR_TERMS, PRICE_ENV, type AddonKey } from './config.ts'
import type { CategoryClass } from './categories.ts'
import type { CheckoutPlan } from './fees.ts'
import { priceMismatch } from './price-check.ts'

export function seatPriceEnv(plan: CheckoutPlan, categoryClass: CategoryClass): string {
  if (plan.priceEnv === 'ally') return PRICE_ENV.ally
  if (plan.priceEnv === 'floor') {
    return categoryClass === 'core' ? PRICE_ENV.anchorCoreFloor : PRICE_ENV.anchorStandardFloor
  }
  return categoryClass === 'core' ? PRICE_ENV.anchorCorePerMember : PRICE_ENV.anchorStandardPerMember
}

export function expectedSeatPrice(plan: CheckoutPlan, categoryClass: CategoryClass): { unitAmount: number; interval: 'year' } {
  if (plan.priceEnv === 'ally') return { unitAmount: ALLY_ANNUAL_CENTS, interval: 'year' }
  const terms = ANCHOR_TERMS[categoryClass]
  if (plan.priceEnv === 'floor') return { unitAmount: terms.floorCents, interval: 'year' }
  return { unitAmount: terms.rateCents, interval: 'year' }
}

export async function loadVerifiedPrice(envName: string, expected: { unitAmount: number; interval: 'year' | null }): Promise<{ priceId: string } | { error: string }> {
  const priceId = process.env[envName]
  if (!priceId) return { error: `Missing ${envName}. Add that price in Vercel before taking payment.` }
  const price = await stripe.prices.retrieve(priceId)
  const mismatch = priceMismatch({
    unit_amount: price.unit_amount,
    currency: price.currency,
    recurring: price.recurring ? { interval: price.recurring.interval } : null,
  }, expected)
  if (mismatch) return { error: `${envName}: ${mismatch}` }
  return { priceId }
}

export function addonByKey(key: string) {
  return ADDONS.find((addon) => addon.key === key) ?? null
}

export function isAddonKey(key: string): key is AddonKey {
  return ADDONS.some((addon) => addon.key === key)
}
