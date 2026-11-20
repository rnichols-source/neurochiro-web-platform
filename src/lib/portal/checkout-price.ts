import { foundingRateOpen } from '../member-referrals/logic.ts'

export type CheckoutPrice = {
  monthly: string
  monthlyWithUnit: string
  annualWithUnit: string
  lockLine: string
}

/**
 * New-membership price shown next to checkout.
 * Before December 1, 2026 this matches the live Payment Link labels ($99 / $990).
 * On December 1 it matches the Stripe prices marked effective=2026-12-01 ($199 / $1,990).
 * A doctor's own locked rate is separate and is not changed here.
 */
export function doctorCheckoutPrice(now: Date = new Date()): CheckoutPrice {
  if (foundingRateOpen(now)) {
    return {
      monthly: '$99',
      monthlyWithUnit: '$99/month',
      annualWithUnit: '$990/year',
      lockLine: '$99/month or $990/year',
    }
  }
  return {
    monthly: '$199',
    monthlyWithUnit: '$199/month',
    annualWithUnit: '$1,990/year',
    lockLine: '$199/month or $1,990/year',
  }
}
