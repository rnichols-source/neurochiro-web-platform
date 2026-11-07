import test from 'node:test'
import assert from 'node:assert/strict'
import {
  NEW_PRICING_START,
  USD_DOCTOR_PLANS,
  activeUsdDoctorPlan,
  isNewPricing,
  NEW_USD_ANNUAL_URL,
  NEW_USD_MONTHLY_URL,
  newUsdPaymentLink,
  prospectStripeLinks,
} from './pricing.ts'
import { knownPlanLabel } from './applications/prices.ts'
import { usDoctorPaymentLinks } from './onboarding-config.ts'

const JUST_BEFORE = Date.parse('2026-12-01T04:59:00.000Z') // Nov 30, 23:59 America/New_York
const ONE_SECOND_BEFORE = Date.parse('2026-12-01T04:59:59.000Z')
const AT_START = Date.parse('2026-12-01T05:00:00.000Z') // Dec 1, 00:00 America/New_York

test('new US pricing starts at Dec 1, 2026 00:00 Eastern', () => {
  assert.equal(NEW_PRICING_START, AT_START)
  assert.equal(isNewPricing(JUST_BEFORE), false)
  assert.equal(isNewPricing(ONE_SECOND_BEFORE), false)
  assert.equal(isNewPricing(AT_START), true)
  assert.equal(isNewPricing(AT_START + 60_000), true)
})

test('legacy and new US amounts, including the annual savings', () => {
  assert.equal(USD_DOCTOR_PLANS.legacy.monthly, 99)
  assert.equal(USD_DOCTOR_PLANS.legacy.annual, 990)
  assert.equal(USD_DOCTOR_PLANS.legacy.annualSavings, 198)
  assert.equal(USD_DOCTOR_PLANS.legacy.annualSaves, '$990/year, saves $198')
  assert.equal(USD_DOCTOR_PLANS.legacy.perMonth, '$99/mo')
  assert.equal(USD_DOCTOR_PLANS.legacy.yearAtMonthlyRate, 1188)
  assert.equal(USD_DOCTOR_PLANS.legacy.annualPerMonth, 83)

  assert.equal(USD_DOCTOR_PLANS.next.monthly, 199)
  assert.equal(USD_DOCTOR_PLANS.next.annual, 1990)
  assert.equal(USD_DOCTOR_PLANS.next.monthly * 12 - USD_DOCTOR_PLANS.next.annual, 398)
  assert.equal(USD_DOCTOR_PLANS.next.annualSavings, 398)
  assert.equal(USD_DOCTOR_PLANS.next.savingsDollars, '$398')
  assert.equal(USD_DOCTOR_PLANS.next.perMonth, '$199/mo')
  assert.equal(USD_DOCTOR_PLANS.next.perYear, '$1,990/yr')
  assert.equal(USD_DOCTOR_PLANS.next.perMonthLong, '$199 per month')
  assert.equal(USD_DOCTOR_PLANS.next.perYearLong, '$1,990 per year')
  assert.equal(USD_DOCTOR_PLANS.next.annualSaves, '$1,990/year, saves $398')
  assert.equal(USD_DOCTOR_PLANS.next.monthlyCents, 19900)
  assert.equal(USD_DOCTOR_PLANS.next.annualCents, 199000)
  assert.equal(USD_DOCTOR_PLANS.next.yearAtMonthlyRate, 2388)
  assert.equal(USD_DOCTOR_PLANS.next.annualPerMonth, 166)
})

test('active plan follows the boundary', () => {
  assert.equal(activeUsdDoctorPlan(JUST_BEFORE).perMonth, '$99/mo')
  assert.equal(activeUsdDoctorPlan(AT_START).perMonth, '$199/mo')
})

test('USD fallback labels follow the boundary and other currencies do not', () => {
  assert.equal(knownPlanLabel('USD', 'monthly', JUST_BEFORE), '$99 per month')
  assert.equal(knownPlanLabel('USD', 'annual', JUST_BEFORE), '$990 per year')
  assert.equal(knownPlanLabel('USD', 'monthly', AT_START), '$199 per month')
  assert.equal(knownPlanLabel('USD', 'annual', AT_START), '$1,990 per year')
  assert.equal(knownPlanLabel('CAD', 'monthly', AT_START), 'CA$139 per month')
  assert.equal(knownPlanLabel('AUD', 'annual', AT_START), 'A$1,290 per year')
  assert.equal(knownPlanLabel('GBP', 'monthly', AT_START), '£79 per month')
})

test('new payment links and labels are used only after the cutoff', () => {
  const env: NodeJS.ProcessEnv = {
    NODE_ENV: 'test',
    STRIPE_LINK_USD_MONTHLY_199: 'https://buy.stripe.com/monthly199',
    STRIPE_LINK_USD_ANNUAL_1990: 'https://buy.stripe.com/annual1990',
    NEXT_PUBLIC_STRIPE_PRO_MONTHLY: 'https://buy.stripe.com/legacy-pro-monthly',
    NEXT_PUBLIC_STRIPE_PRO_ANNUAL: 'https://buy.stripe.com/legacy-pro-annual',
  }

  assert.equal(newUsdPaymentLink('monthly', env, JUST_BEFORE), '')
  assert.equal(newUsdPaymentLink('annual', env, JUST_BEFORE), '')

  const before = usDoctorPaymentLinks(env, JUST_BEFORE)
  assert.equal(before.monthly.url, 'https://buy.stripe.com/eVq00l3EH0NCeOW4vO7wA0W')
  assert.equal(before.monthly.label, '$99/month')
  assert.equal(before.annual.url, 'https://buy.stripe.com/cNieVf4IL67W22a5zS7wA0X')
  assert.equal(before.annual.label, '$990/year, saves $198')

  const after = usDoctorPaymentLinks(env, AT_START)
  assert.equal(after.monthly.url, 'https://buy.stripe.com/monthly199')
  assert.equal(after.monthly.label, '$199/month')
  assert.equal(after.annual.url, 'https://buy.stripe.com/annual1990')
  assert.equal(after.annual.label, '$1,990/year, saves $398')

  const unset = usDoctorPaymentLinks({ NODE_ENV: 'test' }, AT_START)
  assert.equal(unset.monthly.url, NEW_USD_MONTHLY_URL)
  assert.equal(unset.annual.url, NEW_USD_ANNUAL_URL)
  assert.equal(unset.monthly.label, '$199/month')
  assert.equal(unset.annual.label, '$1,990/year, saves $398')

  const publicOnly = usDoctorPaymentLinks({
    NODE_ENV: 'test',
    NEXT_PUBLIC_STRIPE_LINK_USD_MONTHLY_199: 'https://buy.stripe.com/public-monthly',
    NEXT_PUBLIC_STRIPE_LINK_USD_ANNUAL_1990: 'https://buy.stripe.com/public-annual',
  }, AT_START)
  assert.equal(publicOnly.monthly.url, 'https://buy.stripe.com/public-monthly')
  assert.equal(publicOnly.annual.url, 'https://buy.stripe.com/public-annual')

  assert.deepEqual(prospectStripeLinks(env, JUST_BEFORE), {
    monthly: 'https://buy.stripe.com/legacy-pro-monthly',
    annual: 'https://buy.stripe.com/legacy-pro-annual',
  })
  assert.deepEqual(prospectStripeLinks(env, AT_START), {
    monthly: 'https://buy.stripe.com/monthly199',
    annual: 'https://buy.stripe.com/annual1990',
  })
  assert.deepEqual(prospectStripeLinks({
    NODE_ENV: 'test',
    NEXT_PUBLIC_STRIPE_PRO_MONTHLY: 'https://buy.stripe.com/legacy-pro-monthly',
    NEXT_PUBLIC_STRIPE_PRO_ANNUAL: 'https://buy.stripe.com/legacy-pro-annual',
  }, AT_START), {
    monthly: NEW_USD_MONTHLY_URL,
    annual: NEW_USD_ANNUAL_URL,
  })
})
