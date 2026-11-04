import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { approveApplication, declineApplication, type ApplicationRecord, type BillingPort, type ChargeResult } from './decide.ts'
import { ONBOARDING_CALL_URL } from './emails.ts'
import { membershipTierForStripeStatus } from './membership.ts'
import { doctorSignupStatus } from './signup.ts'
import { doctorJoinCtaLabel, doctorJoinHomeLine, doctorJoinMenuLabel } from './flag.ts'

const NOW = '2026-11-04T16:00:00.000Z'

function application(overrides: Partial<ApplicationRecord> = {}): ApplicationRecord {
  return {
    id: 'app-1',
    doctorId: 'doc-1',
    userId: 'user-1',
    status: 'under_review',
    plan: 'monthly',
    stripePriceId: 'price_usd_monthly',
    stripeCustomerId: 'cus_123',
    stripePaymentMethodId: 'pm_123',
    stripeSubscriptionId: null,
    cardOnFile: true,
    chargeAttempt: 0,
    email: 'ada@example.com',
    firstName: 'Ada',
    ...overrides,
  }
}

function billing(result: ChargeResult | Error): { port: BillingPort; calls: string[] } {
  const calls: string[] = []
  const port: BillingPort = {
    async createSubscription(input) {
      calls.push(`create:${input.idempotencyKey}:${input.priceId}`)
      if (result instanceof Error) throw result
      return result
    },
    async detachPaymentMethod(id) {
      calls.push(`detach:${id}`)
    },
  }
  return { port, calls }
}

describe('approve a doctor application', () => {
  it('starts the membership, publishes the listing, and emails the onboarding link', async () => {
    const { port, calls } = billing({
      subscriptionId: 'sub_123',
      status: 'active',
      hostedInvoiceUrl: null,
      paymentState: 'paid',
    })
    const decision = await approveApplication(application(), port, NOW, 'Looks like a fit')
    assert.equal(decision.ok, true)
    assert.equal(decision.charged, true)
    assert.equal(decision.doctor?.is_approved, true)
    assert.equal(decision.doctor?.verification_status, 'verified')
    assert.equal(decision.doctor?.membership_tier, 'pro')
    assert.equal(decision.doctor?.paid_at, NOW)
    assert.equal(decision.application?.status, 'approved')
    assert.equal(decision.application?.stripe_subscription_id, 'sub_123')
    assert.equal(decision.email?.to, 'ada@example.com')
    assert.match(decision.email?.html || '', new RegExp(ONBOARDING_CALL_URL.replace(/[.]/g, '\\.')))
    assert.deepEqual(calls, ['create:doctor-app-sub-app-1-0:price_usd_monthly'])
  })

  it('publishes and emails a Stripe confirmation link when the bank needs a step', async () => {
    const { port, calls } = billing({
      subscriptionId: 'sub_sca',
      status: 'incomplete',
      hostedInvoiceUrl: 'https://invoice.stripe.com/i/test',
      paymentState: 'requires_action',
    })
    const decision = await approveApplication(application(), port, NOW, '')
    assert.equal(decision.ok, true)
    assert.equal(decision.charged, false)
    assert.equal(decision.doctor?.verification_status, 'verified')
    assert.equal(decision.doctor?.is_approved, true)
    assert.equal(decision.doctor?.membership_tier, undefined)
    assert.equal(decision.application?.status, 'needs_action')
    assert.match(decision.email?.html || '', /invoice\.stripe\.com/)
    assert.match(decision.email?.html || '', /calendly\.com\/drray-neurochirodirectory\/neurochiro-onboarding-call/)
    assert.equal(calls.length, 1)
  })

  it('does not publish when the card is declined', async () => {
    const { port, calls } = billing({
      subscriptionId: 'sub_fail',
      status: 'incomplete',
      hostedInvoiceUrl: null,
      paymentState: 'failed',
      errorMessage: 'The card was declined.',
    })
    const decision = await approveApplication(application(), port, NOW, '')
    assert.equal(decision.ok, false)
    assert.equal(decision.doctor, null)
    assert.equal(decision.email, null)
    assert.equal(decision.charged, false)
    assert.equal(decision.application?.status, 'under_review')
    assert.equal(decision.application?.charge_attempt, 1)
    assert.equal(calls.length, 1)
  })

  it('does not create a second subscription after approval', async () => {
    const { port, calls } = billing({
      subscriptionId: 'sub_again',
      status: 'active',
      hostedInvoiceUrl: null,
      paymentState: 'paid',
    })
    const decision = await approveApplication(application({
      status: 'approved',
      stripeSubscriptionId: 'sub_123',
    }), port, NOW, '')
    assert.equal(decision.ok, true)
    assert.equal(decision.charged, false)
    assert.equal(decision.doctor, null)
    assert.deepEqual(calls, [])
  })

  it('refuses to approve when there is no card', async () => {
    const { port, calls } = billing({
      subscriptionId: 'sub_nope',
      status: 'active',
      hostedInvoiceUrl: null,
      paymentState: 'paid',
    })
    const decision = await approveApplication(application({ cardOnFile: false, stripePaymentMethodId: null }), port, NOW, '')
    assert.equal(decision.ok, false)
    assert.equal(decision.doctor, null)
    assert.deepEqual(calls, [])
  })
})

describe('decline a doctor application', () => {
  it('hides the listing, removes the card, and does not charge', async () => {
    const { port, calls } = billing({
      subscriptionId: 'sub_should_not_exist',
      status: 'active',
      hostedInvoiceUrl: null,
      paymentState: 'paid',
    })
    const decision = await declineApplication(application(), port, NOW, 'Not a nervous system practice')
    assert.equal(decision.ok, true)
    assert.equal(decision.charged, false)
    assert.equal(decision.detached, true)
    assert.equal(decision.doctor?.verification_status, 'hidden')
    assert.equal(decision.doctor?.is_approved, false)
    assert.equal(decision.application?.status, 'declined')
    assert.equal(decision.application?.card_on_file, false)
    assert.equal(decision.application?.stripe_payment_method_id, null)
    assert.match(decision.email?.html || '', /not charged/i)
    assert.deepEqual(calls, ['detach:pm_123'])
  })

  it('is safe to decline twice', async () => {
    const { port, calls } = billing({
      subscriptionId: 'sub_no',
      status: 'active',
      hostedInvoiceUrl: null,
      paymentState: 'paid',
    })
    const decision = await declineApplication(application({ status: 'declined' }), port, NOW, '')
    assert.equal(decision.ok, true)
    assert.equal(decision.email, null)
    assert.deepEqual(calls, [])
  })
})

describe('subscription status and the signup flag', () => {
  it('maps active and past_due to pro, and canceled to free', () => {
    assert.equal(membershipTierForStripeStatus('active'), 'pro')
    assert.equal(membershipTierForStripeStatus('past_due'), 'pro')
    assert.equal(membershipTierForStripeStatus('canceled'), 'free')
    assert.equal(membershipTierForStripeStatus('incomplete'), null)
  })

  it('hides a new signup only when the application flag is on', () => {
    assert.equal(doctorSignupStatus({ APPLICATION_FLOW_ENABLED: 'true' } as unknown as NodeJS.ProcessEnv), 'hidden')
    assert.equal(doctorSignupStatus({} as unknown as NodeJS.ProcessEnv), 'pending')
    assert.equal(doctorSignupStatus({ APPLICATION_FLOW_ENABLED: 'false' } as unknown as NodeJS.ProcessEnv), 'pending')
  })

  it('switches the public join wording with the same flag', () => {
    const on = { APPLICATION_FLOW_ENABLED: 'true' } as unknown as NodeJS.ProcessEnv
    const off = { APPLICATION_FLOW_ENABLED: 'false' } as unknown as NodeJS.ProcessEnv
    assert.equal(doctorJoinCtaLabel(on), 'Apply to join')
    assert.equal(doctorJoinMenuLabel(on), 'Apply to join')
    assert.equal(doctorJoinHomeLine(on), 'Are you a nervous system chiropractor? Apply to join')
    assert.equal(doctorJoinCtaLabel(off), 'Join as a doctor')
    assert.equal(doctorJoinMenuLabel(off), 'Join NeuroChiro')
    assert.equal(doctorJoinHomeLine({} as unknown as NodeJS.ProcessEnv), 'Are you a nervous system chiropractor? Join NeuroChiro')
  })
})
