/**
 * US NeuroChiro Pro price for someone who is not already a member.
 *
 * New members pay $99/month or $990/year until Dec 1, 2026 at 00:00
 * America/New_York, then $199/month or $1,990/year.
 * People who already subscribed keep the rate on their own subscription.
 * Do not use this for an existing member's billing screen.
 *
 * 12 × 199 = 2,388. 2,388 − 1,990 = 398 saved on the annual plan.
 * 12 × 99 = 1,188. 1,188 − 990 = 198 saved on the legacy annual plan.
 */

export const NEW_PRICING_START = Date.parse('2026-12-01T05:00:00Z')

export function isNewPricing(now: number = Date.now()): boolean {
  return now >= NEW_PRICING_START
}

export type UsdDoctorPlan = {
  monthly: number
  annual: number
  annualSavings: number
  /** Rounded monthly equivalent when billed annually (990/12 → 83). */
  annualPerMonth: number
  monthlyDollars: string
  annualDollars: string
  savingsDollars: string
  /** 12 × monthly. What a year costs if they pay month to month, not the annual plan. */
  yearAtMonthlyRate: number
  yearAtMonthlyDollars: string
  perMonth: string
  perYear: string
  perMonthSlash: string
  perYearSlash: string
  perMonthLong: string
  perYearLong: string
  /** "$990/year, saves $198" */
  annualSaves: string
  monthlyCents: number
  annualCents: number
}

function dollars(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`
}

function plan(monthly: number, annual: number): UsdDoctorPlan {
  const annualSavings = monthly * 12 - annual
  const yearAtMonthlyRate = monthly * 12
  const monthlyDollars = dollars(monthly)
  const annualDollars = dollars(annual)
  const savingsDollars = dollars(annualSavings)
  return {
    monthly,
    annual,
    annualSavings,
    annualPerMonth: Math.round(annual / 12),
    monthlyDollars,
    annualDollars,
    savingsDollars,
    yearAtMonthlyRate,
    yearAtMonthlyDollars: dollars(yearAtMonthlyRate),
    perMonth: `${monthlyDollars}/mo`,
    perYear: `${annualDollars}/yr`,
    perMonthSlash: `${monthlyDollars}/month`,
    perYearSlash: `${annualDollars}/year`,
    perMonthLong: `${monthlyDollars} per month`,
    perYearLong: `${annualDollars} per year`,
    annualSaves: `${annualDollars}/year, saves ${savingsDollars}`,
    monthlyCents: monthly * 100,
    annualCents: annual * 100,
  }
}

export const USD_DOCTOR_PLANS: { legacy: UsdDoctorPlan; next: UsdDoctorPlan } = {
  legacy: plan(99, 990),
  next: plan(199, 1990),
}

export function activeUsdDoctorPlan(now: number = Date.now()): UsdDoctorPlan {
  return isNewPricing(now) ? USD_DOCTOR_PLANS.next : USD_DOCTOR_PLANS.legacy
}

function trimmedEnv(env: NodeJS.ProcessEnv, name: string): string {
  return (env[name] || '').trim()
}

/** $199/month and $1,990/year Payment Links. Used only after NEW_PRICING_START. Env vars can replace them. */
export const NEW_USD_MONTHLY_URL = 'https://buy.stripe.com/bJeeVfb793ZO36e1jC7wA1f'
export const NEW_USD_ANNUAL_URL = 'https://buy.stripe.com/4gMbJ35MPdAo8qy8M47wA1g'

/**
 * US Payment Link for a new member after the price change.
 * Returns "" before that date so callers keep the current $99 links.
 * After the date, an env var wins and these defaults are the fallback.
 */
export function newUsdPaymentLink(
  cycle: 'monthly' | 'annual',
  env: NodeJS.ProcessEnv = process.env,
  now: number = Date.now(),
): string {
  if (!isNewPricing(now)) return ''
  if (cycle === 'monthly') {
    return trimmedEnv(env, 'STRIPE_LINK_USD_MONTHLY_199')
      || trimmedEnv(env, 'NEXT_PUBLIC_STRIPE_LINK_USD_MONTHLY_199')
      || NEW_USD_MONTHLY_URL
  }
  return trimmedEnv(env, 'STRIPE_LINK_USD_ANNUAL_1990')
    || trimmedEnv(env, 'NEXT_PUBLIC_STRIPE_LINK_USD_ANNUAL_1990')
    || NEW_USD_ANNUAL_URL
}

/** Join buttons on /pro. Before the cutoff, the existing public links. After it, the $199 links. */
export function prospectStripeLinks(
  env: NodeJS.ProcessEnv = process.env,
  now: number = Date.now(),
): { monthly: string; annual: string } {
  return {
    monthly: newUsdPaymentLink('monthly', env, now) || trimmedEnv(env, 'NEXT_PUBLIC_STRIPE_PRO_MONTHLY'),
    annual: newUsdPaymentLink('annual', env, now) || trimmedEnv(env, 'NEXT_PUBLIC_STRIPE_PRO_ANNUAL'),
  }
}
