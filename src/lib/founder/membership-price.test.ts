import assert from 'node:assert/strict'
import test from 'node:test'
import { isDoctorMembershipPrice } from './membership-price.ts'

const env = {
  STRIPE_DOCTOR_PRICE_USD_MONTHLY: 'price_doctor_99',
  STRIPE_DOCTOR_PRICE_USD_ANNUAL: 'price_doctor_990',
  STRIPE_DOCTOR_PRICE_CAD_MONTHLY: 'price_doctor_cad',
  STRIPE_VENDOR_MONTHLY_PRICE_ID: 'price_vendor_99',
  STRIPE_SEMINAR_LISTING_PRICE_ID: 'price_seminar_199',
} as unknown as NodeJS.ProcessEnv

test('configured doctor prices count, including when the amount is shared', () => {
  assert.equal(isDoctorMembershipPrice({ id: 'price_doctor_99', currency: 'usd', unitAmount: 9900, interval: 'month' }, env), true)
  assert.equal(isDoctorMembershipPrice({ id: 'price_doctor_990', currency: 'usd', unitAmount: 99000, interval: 'year' }, env), true)
  assert.equal(isDoctorMembershipPrice({ id: 'price_doctor_cad', currency: 'cad', unitAmount: 13900, interval: 'month' }, env), true)
})

test('other businesses on the same Stripe account are left out', () => {
  assert.equal(isDoctorMembershipPrice({ id: 'price_vendor_99', currency: 'usd', unitAmount: 9900, interval: 'month' }, env), false)
  assert.equal(isDoctorMembershipPrice({ id: 'price_other_297', currency: 'usd', unitAmount: 29700, interval: 'month' }, env), false)
  assert.equal(isDoctorMembershipPrice({ id: 'price_other_29', currency: 'usd', unitAmount: 2900, interval: 'month' }, env), false)
  assert.equal(isDoctorMembershipPrice({ id: 'price_seminar_199', currency: 'usd', unitAmount: 19900, interval: null }, env), false)
})

test('$199 recurring and unlabeled doctor amounts still count', () => {
  assert.equal(isDoctorMembershipPrice({ id: 'price_founding_199', currency: 'usd', unitAmount: 19900, interval: 'month' }, env), true)
  assert.equal(isDoctorMembershipPrice({ id: 'price_legacy_990', currency: 'usd', unitAmount: 99000, interval: 'year' }, env), true)
})
