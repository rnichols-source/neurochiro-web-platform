import type { BillingCycle } from './prices.ts'

/** Shown on the plan screen and, when checkout is hosted, on the Stripe page. */
export function chargeApprovalCopy(amount: string, period: 'month' | 'year'): string {
  const clean = amount.trim() || (period === 'year' ? 'the annual price' : 'the monthly price')
  return `You're charged ${clean}/${period} only if approved. Cancel anytime.`
}

export function chargeCopyFromLabel(label: string, cycle: BillingCycle): string {
  const amount = label.replace(/\s+per\s+(month|year)\s*$/i, '').trim()
  return chargeApprovalCopy(amount || label, cycle === 'annual' ? 'year' : 'month')
}
