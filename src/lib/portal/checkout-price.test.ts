import assert from 'node:assert/strict'
import test from 'node:test'
import { FOUNDING_RATE_ENDS_AT } from '../member-referrals/logic.ts'
import { doctorCheckoutPrice } from './checkout-price.ts'

test('practice tool pricing follows the checkout date', () => {
  const before = new Date(Date.parse(FOUNDING_RATE_ENDS_AT) - 1000)
  const after = new Date(Date.parse(FOUNDING_RATE_ENDS_AT) + 1000)
  assert.equal(doctorCheckoutPrice(before).monthly, '$99')
  assert.equal(doctorCheckoutPrice(before).lockLine, '$99/month or $990/year')
  assert.equal(doctorCheckoutPrice(after).monthly, '$199')
  assert.equal(doctorCheckoutPrice(after).annualWithUnit, '$1,990/year')
})
