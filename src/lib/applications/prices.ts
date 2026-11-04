import { EUROPEAN_ISO } from '../directory-countries.ts'

export type BillingCycle = 'monthly' | 'annual'

export type DoctorCurrency = 'USD' | 'CAD' | 'AUD' | 'GBP' | 'NZD' | 'EUR' | 'AED'

const ENV_KEY: Record<DoctorCurrency, Record<BillingCycle, string>> = {
  USD: { monthly: 'STRIPE_DOCTOR_PRICE_USD_MONTHLY', annual: 'STRIPE_DOCTOR_PRICE_USD_ANNUAL' },
  CAD: { monthly: 'STRIPE_DOCTOR_PRICE_CAD_MONTHLY', annual: 'STRIPE_DOCTOR_PRICE_CAD_ANNUAL' },
  AUD: { monthly: 'STRIPE_DOCTOR_PRICE_AUD_MONTHLY', annual: 'STRIPE_DOCTOR_PRICE_AUD_ANNUAL' },
  GBP: { monthly: 'STRIPE_DOCTOR_PRICE_GBP_MONTHLY', annual: 'STRIPE_DOCTOR_PRICE_GBP_ANNUAL' },
  NZD: { monthly: 'STRIPE_DOCTOR_PRICE_NZD_MONTHLY', annual: 'STRIPE_DOCTOR_PRICE_NZD_ANNUAL' },
  EUR: { monthly: 'STRIPE_DOCTOR_PRICE_EUR_MONTHLY', annual: 'STRIPE_DOCTOR_PRICE_EUR_ANNUAL' },
  AED: { monthly: 'STRIPE_DOCTOR_PRICE_AED_MONTHLY', annual: 'STRIPE_DOCTOR_PRICE_AED_ANNUAL' },
}

/** Labels already printed on the live Payment Links and country pages. Stripe amounts win when we can read the Price. */
const KNOWN_LABELS: Partial<Record<DoctorCurrency, Record<BillingCycle, string>>> = {
  USD: { monthly: '$99 per month', annual: '$990 per year' },
  CAD: { monthly: 'CA$139 per month', annual: 'CA$1,390 per year' },
  AUD: { monthly: 'A$129 per month', annual: 'A$1,290 per year' },
  GBP: { monthly: '£79 per month', annual: '£790 per year' },
}

const europeanCountries = new Set(EUROPEAN_ISO.filter((code) => code !== 'GB'))

export function currencyForCountry(country: string | null | undefined): DoctorCurrency {
  const code = (country || 'US').trim().toUpperCase()
  if (code === 'UK') return 'GBP'
  if (code === 'GB') return 'GBP'
  if (code === 'CA') return 'CAD'
  if (code === 'AU') return 'AUD'
  if (code === 'NZ') return 'NZD'
  if (code === 'AE' || code === 'UAE') return 'AED'
  if (europeanCountries.has(code) || code === 'EU') return 'EUR'
  return 'USD'
}

export function priceEnvName(currency: DoctorCurrency, cycle: BillingCycle): string {
  return ENV_KEY[currency][cycle]
}

export function priceIdFor(
  currency: DoctorCurrency,
  cycle: BillingCycle,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const value = (env[priceEnvName(currency, cycle)] || '').trim()
  return value.startsWith('price_') ? value : ''
}

export function knownPlanLabel(currency: DoctorCurrency, cycle: BillingCycle): string {
  return KNOWN_LABELS[currency]?.[cycle] || `${cycle === 'monthly' ? 'Monthly' : 'Annual'} (${currency})`
}

export function formatStripeAmount(unitAmount: number | null | undefined, currency: string): string | null {
  if (unitAmount == null || !Number.isFinite(unitAmount)) return null
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(unitAmount / 100)
  } catch {
    return null
  }
}

export function planLabel(currency: DoctorCurrency, cycle: BillingCycle, unitAmount?: number | null): string {
  const fromStripe = formatStripeAmount(unitAmount, currency)
  if (fromStripe) {
    return cycle === 'monthly' ? `${fromStripe} per month` : `${fromStripe} per year`
  }
  return knownPlanLabel(currency, cycle)
}
