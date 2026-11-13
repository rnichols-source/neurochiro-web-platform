/** Same names as priceEnvName() in src/lib/applications/prices.ts, plus the legacy doctor price ids. */
const DOCTOR_ENV_KEYS = new Set<string>([
  'STRIPE_DOCTOR_MONTHLY_PRICE_ID',
  'STRIPE_DOCTOR_ANNUAL_PRICE_ID',
  'STRIPE_DOCTOR_PRICE_USD_MONTHLY',
  'STRIPE_DOCTOR_PRICE_USD_ANNUAL',
  'STRIPE_DOCTOR_PRICE_CAD_MONTHLY',
  'STRIPE_DOCTOR_PRICE_CAD_ANNUAL',
  'STRIPE_DOCTOR_PRICE_AUD_MONTHLY',
  'STRIPE_DOCTOR_PRICE_AUD_ANNUAL',
  'STRIPE_DOCTOR_PRICE_GBP_MONTHLY',
  'STRIPE_DOCTOR_PRICE_GBP_ANNUAL',
  'STRIPE_DOCTOR_PRICE_NZD_MONTHLY',
  'STRIPE_DOCTOR_PRICE_NZD_ANNUAL',
  'STRIPE_DOCTOR_PRICE_EUR_MONTHLY',
  'STRIPE_DOCTOR_PRICE_EUR_ANNUAL',
  'STRIPE_DOCTOR_PRICE_AED_MONTHLY',
  'STRIPE_DOCTOR_PRICE_AED_ANNUAL',
])

/** Recurring doctor membership amounts from the live plan labels, plus $199 founding. */
const KNOWN_AMOUNTS: { currency: string; unitAmount: number; interval: 'month' | 'year' }[] = [
  { currency: 'usd', unitAmount: 9900, interval: 'month' },
  { currency: 'usd', unitAmount: 99000, interval: 'year' },
  { currency: 'cad', unitAmount: 13900, interval: 'month' },
  { currency: 'cad', unitAmount: 139000, interval: 'year' },
  { currency: 'aud', unitAmount: 12900, interval: 'month' },
  { currency: 'aud', unitAmount: 129000, interval: 'year' },
  { currency: 'gbp', unitAmount: 7900, interval: 'month' },
  { currency: 'gbp', unitAmount: 79000, interval: 'year' },
]

export type MembershipPrice = {
  id: string
  currency: string | null
  unitAmount: number | null
  interval: string | null
}

function priceId(value: string | undefined): string | null {
  const trimmed = (value || '').trim()
  return trimmed.startsWith('price_') ? trimmed : null
}

export function configuredPriceIds(env: NodeJS.ProcessEnv = process.env): { doctor: Set<string>; other: Set<string> } {
  const doctor = new Set<string>()
  const other = new Set<string>()
  for (const [key, value] of Object.entries(env)) {
    if (!key.startsWith('STRIPE_')) continue
    const id = priceId(typeof value === 'string' ? value : undefined)
    if (!id) continue
    if (DOCTOR_ENV_KEYS.has(key)) doctor.add(id)
    else other.add(id)
  }
  for (const id of other) {
    if (doctor.has(id)) other.delete(id)
  }
  return { doctor, other }
}

export function isDoctorMembershipPrice(price: MembershipPrice, env: NodeJS.ProcessEnv = process.env): boolean {
  const { doctor, other } = configuredPriceIds(env)
  if (price.id && doctor.has(price.id)) return true
  if (price.id && other.has(price.id)) return false
  if (!price.interval || price.interval === 'one_time') return false
  const amount = price.unitAmount
  if (amount == null) return false
  // $199 recurring is a doctor membership. The $199 seminar price is one-time and already excluded.
  if (amount === 19900) return true
  const currency = (price.currency || '').toLowerCase()
  return KNOWN_AMOUNTS.some((row) => row.currency === currency && row.unitAmount === amount && row.interval === price.interval)
}
