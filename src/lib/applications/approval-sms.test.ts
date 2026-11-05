import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { deliverApprovalNotices, approvalText } from './approval-sms.ts'
import { approveApplication, type BillingPort, type ChargeResult } from './decide.ts'
import { APPROVED_SUBJECT, ONBOARDING_CALL_URL } from './emails.ts'
import type { ApplicationRecord } from './decide.ts'

const NOW = '2026-11-04T16:00:00.000Z'
const PROFILE = 'https://neurochiro.co/directory/ada-lovelace'

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
    lastName: 'Lovelace',
    profileUrl: PROFILE,
    mobileE164: '+18645550100',
    smsConsent: true,
    priceLabel: '$99 per month',
    ...overrides,
  }
}

function billing(result: ChargeResult): BillingPort {
  return {
    async createSubscription() {
      return result
    },
    async detachPaymentMethod() {},
  }
}

const paid: ChargeResult = {
  subscriptionId: 'sub_123',
  status: 'active',
  hostedInvoiceUrl: null,
  paymentState: 'paid',
  amountLabel: '$99.00',
  receiptUrl: 'https://invoice.stripe.com/i/acct_test/receipt',
}

describe('approval email and text', () => {
  it('sends the welcome email and the text after a successful charge', async () => {
    const decision = await approveApplication(application(), billing(paid), NOW, '')
    assert.equal(decision.ok, true)
    assert.equal(decision.charged, true)
    assert.equal(decision.email?.subject, APPROVED_SUBJECT)
    assert.match(decision.email?.html || '', /Congratulations, Dr\. Lovelace/)
    assert.match(decision.email?.html || '', /https:\/\/neurochiro\.co\/directory\/ada-lovelace/)
    assert.match(decision.email?.html || '', /\$99\.00/)
    assert.match(decision.email?.html || '', /invoice\.stripe\.com/)
    assert.match(decision.email?.html || '', /Spotlight interview/)
    assert.match(decision.email?.html || '', /Weekly Adjustment IG Live/)
    assert.match(decision.email?.html || '', /Dr\. Ray/)
    assert.match(decision.email?.html || '', new RegExp(ONBOARDING_CALL_URL.replace(/[.]/g, '\\.')))
    assert.equal(decision.sms?.to, '+18645550100')
    assert.match(decision.sms?.body || '', /Congrats Dr\. Lovelace!/)
    assert.match(decision.sms?.body || '', /Reply STOP to opt out/)
    assert.ok((decision.sms?.body || '').length <= 320)
    const longText = approvalText('Wolfeschlegelsteinhausenbergerdorff', `https://neurochiro.co/directory/${'a'.repeat(80)}`)
    assert.match(longText, /Reply STOP to opt out\.$/)
    assert.match(longText, /neurochiro-onboarding-call/)

    const emails: string[] = []
    const texts: Array<{ to: string; content: string }> = []
    const delivery = await deliverApprovalNotices({
      email: decision.email,
      sms: decision.sms,
      runtime: { enabled: true, testPhone: null, testRedirect: false },
      sendEmail: async (mail) => {
        emails.push(mail.subject)
        return true
      },
      sendSms: async (message) => {
        texts.push(message)
        return { ok: true }
      },
    })
    assert.deepEqual(emails, [APPROVED_SUBJECT])
    assert.equal(texts.length, 1)
    assert.equal(texts[0].to, '+18645550100')
    assert.match(texts[0].content, /Your profile is live: https:\/\/neurochiro\.co\/directory\/ada-lovelace/)
    assert.deepEqual(delivery.warnings, [])
  })

  it('skips the text when they did not consent, and still sends the email', async () => {
    const decision = await approveApplication(application({ smsConsent: false }), billing(paid), NOW, '')
    assert.equal(decision.sms, null)
    assert.equal(decision.email?.subject, APPROVED_SUBJECT)
    const texts: string[] = []
    const delivery = await deliverApprovalNotices({
      email: decision.email,
      sms: decision.sms,
      runtime: { enabled: true, testPhone: null, testRedirect: false },
      sendEmail: async () => true,
      sendSms: async () => {
        texts.push('sent')
        return { ok: true }
      },
    })
    assert.deepEqual(texts, [])
    assert.deepEqual(delivery.warnings, [])
  })

  it('does not send the congrats text when the bank still needs a step', async () => {
    const decision = await approveApplication(application(), billing({
      subscriptionId: 'sub_sca',
      status: 'incomplete',
      hostedInvoiceUrl: 'https://invoice.stripe.com/i/test',
      paymentState: 'requires_action',
    }), NOW, '')
    assert.equal(decision.sms, null)
    assert.match(decision.email?.html || '', /invoice\.stripe\.com/)
    assert.equal(decision.email?.subject.includes(APPROVED_SUBJECT), false)
  })

  it('does not send the congrats text when the card fails', async () => {
    const decision = await approveApplication(application(), billing({
      subscriptionId: 'sub_fail',
      status: 'incomplete',
      hostedInvoiceUrl: null,
      paymentState: 'failed',
    }), NOW, '')
    assert.equal(decision.ok, false)
    assert.equal(decision.email, null)
    assert.equal(decision.sms, null)
  })

  it('respects the text switch and the test phone, and a failed send does not throw', async () => {
    const body = approvalText('Lovelace', PROFILE)
    const off = await deliverApprovalNotices({
      email: null,
      sms: { to: '+18645550100', body },
      runtime: { enabled: false, testPhone: null, testRedirect: false },
      sendEmail: async () => true,
      sendSms: async () => {
        throw new Error('should not send')
      },
    })
    assert.equal(off.smsReason, 'disabled')
    assert.deepEqual(off.warnings, [])

    const redirected: string[] = []
    await deliverApprovalNotices({
      email: null,
      sms: { to: '+18645550100', body },
      runtime: { enabled: true, testPhone: '+15550001111', testRedirect: true },
      sendEmail: async () => true,
      sendSms: async (message) => {
        redirected.push(`${message.to} ${message.content}`)
        return { ok: true }
      },
    })
    assert.match(redirected[0], /^\+15550001111 \[TEST for \.\.\.0100\]/)

    const failed = await deliverApprovalNotices({
      email: { to: 'ada@example.com', subject: APPROVED_SUBJECT, html: '<p>Hi</p>' },
      sms: { to: '+18645550100', body },
      runtime: { enabled: true, testPhone: null, testRedirect: false },
      sendEmail: async () => false,
      sendSms: async () => ({ ok: false }),
    })
    assert.equal(failed.warnings.length, 2)
    assert.match(failed.warnings[0], /email did not send/)
    assert.match(failed.warnings[1], /text did not send/)
  })
})
