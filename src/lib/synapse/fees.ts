import { ALLY_ANNUAL_CENTS, ANCHOR_TERMS, RENEWAL_CAP, type SeatTier } from './config.ts'
import type { CategoryClass } from './categories.ts'

export type AnchorFeeInput = {
  categoryClass: CategoryClass
  members: number
  founding: boolean
  inFirstYear: boolean
  previousFeeCents?: number | null
}

export function anchorFeeCents(input: AnchorFeeInput): number {
  const terms = ANCHOR_TERMS[input.categoryClass]
  const members = Math.max(0, Math.floor(input.members))
  if (input.founding && input.inFirstYear) return terms.floorCents
  const computed = Math.max(terms.floorCents, terms.rateCents * members)
  if (input.founding && input.previousFeeCents != null && input.previousFeeCents > 0) {
    const capped = Math.round(input.previousFeeCents * RENEWAL_CAP)
    return Math.min(computed, capped)
  }
  return computed
}

export type CheckoutPlan = {
  priceEnv: 'floor' | 'per_member' | 'ally'
  quantity: number
  feeCents: number
}

/** Floor price when the formula is at the floor, or founding year 1. Otherwise per-member quantity. */
export function anchorCheckoutPlan(input: AnchorFeeInput): CheckoutPlan {
  const terms = ANCHOR_TERMS[input.categoryClass]
  const members = Math.max(0, Math.floor(input.members))
  const variable = terms.rateCents * members
  const useFloor = (input.founding && input.inFirstYear) || variable <= terms.floorCents
  if (useFloor) {
    return { priceEnv: 'floor', quantity: 1, feeCents: anchorFeeCents(input) }
  }
  return { priceEnv: 'per_member', quantity: members, feeCents: variable }
}

export function allyCheckoutPlan(): CheckoutPlan {
  return { priceEnv: 'ally', quantity: 1, feeCents: ALLY_ANNUAL_CENTS }
}

export function checkoutPlanFor(tier: SeatTier, input: AnchorFeeInput): CheckoutPlan {
  return tier === 'ally' ? allyCheckoutPlan() : anchorCheckoutPlan(input)
}
