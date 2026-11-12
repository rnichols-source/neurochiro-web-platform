import { priceEnvName, type BillingCycle, type DoctorCurrency } from '../applications/prices.ts'

const CURRENCIES: DoctorCurrency[] = ['USD', 'CAD', 'AUD', 'GBP', 'NZD', 'EUR', 'AED']
const CYCLES: BillingCycle[] = ['monthly', 'annual']

function priceIds(values: Array<string | undefined>): string[] {
  return values.map((value) => (value || '').trim()).filter((value) => value.startsWith('price_'))
}

export function doctorPriceIds(env: NodeJS.ProcessEnv = process.env): string[] {
  return priceIds([
    env.STRIPE_DOCTOR_MONTHLY_PRICE_ID,
    env.STRIPE_DOCTOR_ANNUAL_PRICE_ID,
    ...CURRENCIES.flatMap((currency) => CYCLES.map((cycle) => env[priceEnvName(currency, cycle)])),
  ])
}

export function studentPriceIds(env: NodeJS.ProcessEnv = process.env): string[] {
  return priceIds([
    env.STRIPE_STUDENT_MEMBERSHIP_MONTHLY_PRICE_ID,
    env.STRIPE_STUDENT_MONTHLY_PRICE_ID,
    env.STRIPE_STUDENT_MEMBERSHIP_ANNUAL_PRICE_ID,
    env.STRIPE_STUDENT_ANNUAL_PRICE_ID,
  ])
}
