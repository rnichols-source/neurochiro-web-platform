import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isPaidCheckoutSession } from './welcome-session.ts'

describe('country welcome Stripe session', () => {
  it('accepts a completed paid Checkout session', () => {
    assert.equal(isPaidCheckoutSession({ id: 'cs_test', status: 'complete', payment_status: 'paid' }), true)
  })

  it('rejects a missing, open, or unpaid session', () => {
    assert.equal(isPaidCheckoutSession(null), false)
    assert.equal(isPaidCheckoutSession({ id: '', status: 'complete', payment_status: 'paid' }), false)
    assert.equal(isPaidCheckoutSession({ id: 'cs_test', status: 'open', payment_status: 'unpaid' }), false)
    assert.equal(isPaidCheckoutSession({ id: 'cs_test', status: 'complete', payment_status: 'unpaid' }), false)
    assert.equal(isPaidCheckoutSession({ id: 'cs_test', status: 'complete', payment_status: 'no_payment_required' }), false)
    assert.equal(isPaidCheckoutSession({ id: 'cs_test', status: 'expired', payment_status: 'unpaid' }), false)
  })
})
