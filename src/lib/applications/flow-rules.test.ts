import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { APPLICATION_SMS_CONSENT } from './consent.ts'
import { applicationGaps, approveBlockMessage } from './checklist.ts'
import { chargeApprovalCopy } from './charge-copy.ts'
import { approveApplication, type ApplicationRecord, type BillingPort } from './decide.ts'
import { EXISTING_LISTING_MESSAGE, LISTING_PASSWORD_EMAIL, signupDuplicateDecision, startListingClaim, type ListingDoctor } from './existing-listing.ts'
import { magicResumeUrl, resumePathOnly } from './magic-link.ts'
import { currencyForCountry } from './prices.ts'
import { applicationTimezone, reminderInQuietHours } from './quiet.ts'
import { deliverReminders, type ReminderCandidate } from './reminder-plan.ts'
import { currencyForSignup, defaultSignupCountry } from './signup-country.ts'
import { applicationQueue, applicationStatusAfterCard, PAID_CHECKOUT_APPLICATION_STATUS, shouldRechargeAfterNewCard } from './status.ts'

const NOW = '2026-11-04T16:00:00.000Z'

function doctor(overrides: Partial<ListingDoctor> = {}): ListingDoctor {
  return {
    id: 'doc-1',
    email: 'ada@example.com',
    userId: null,
    isApproved: false,
    verificationStatus: 'hidden',
    paidAt: null,
    membershipTier: 'free',
    stripeSubscriptionId: null,
    ...overrides,
  }
}

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
    profileUrl: 'https://neurochiro.co/directory/ada',
    mobileE164: '+18645550100',
    smsConsent: false,
    priceLabel: '$99 per month',
    checklistAnswers: {
      practiceApproach: 'We focus on the nervous system and how the body adapts.',
      heardAbout: 'Instagram',
      techniques: 'Toggle',
      usesNervousSystemScans: false,
      yearsInPractice: 8,
      officeAddress: '123 Main Street',
      city: 'Greenville',
      country: 'US',
    },
    ...overrides,
  }
}

const billing: BillingPort = {
  async createSubscription() {
    return { subscriptionId: 'sub_should_not', status: 'active', hostedInvoiceUrl: null, paymentState: 'paid' }
  },
  async detachPaymentMethod() {},
}

describe('card confirmation and approval', () => {
  it('cannot reach under_review without a confirmed card', () => {
    assert.equal(applicationStatusAfterCard({ setupStatus: 'requires_payment_method', currentStatus: 'draft', paymentReceived: false }), null)
    assert.equal(applicationStatusAfterCard({ setupStatus: 'processing', currentStatus: 'draft', paymentReceived: false }), null)
    assert.equal(applicationStatusAfterCard({ setupStatus: 'canceled', currentStatus: 'draft', paymentReceived: false }), null)
    assert.equal(applicationStatusAfterCard({ setupStatus: null, currentStatus: 'draft', paymentReceived: false }), null)
    assert.equal(applicationStatusAfterCard({ setupStatus: 'succeeded', currentStatus: 'draft', paymentReceived: false }), 'under_review')
    assert.equal(applicationStatusAfterCard({ setupStatus: 'succeeded', currentStatus: 'needs_action', paymentReceived: false }), 'under_review')
    assert.equal(applicationStatusAfterCard({ setupStatus: 'succeeded', currentStatus: 'approved', paymentReceived: true }), 'approved')
    assert.equal(PAID_CHECKOUT_APPLICATION_STATUS, 'approved')
    assert.equal(applicationStatusAfterCard({ setupStatus: null, currentStatus: 'draft', paymentReceived: true }), 'approved')
    assert.equal(applicationQueue('under_review'), 'decision')
    assert.equal(applicationQueue('needs_action'), 'decision')
    assert.equal(applicationQueue('draft'), 'progress')
    assert.equal(applicationQueue('approved'), 'closed')
    assert.equal(shouldRechargeAfterNewCard({ previousStatus: 'needs_action', paymentReceived: false, subscriptionId: null }), false)
    assert.equal(shouldRechargeAfterNewCard({ previousStatus: 'approved', paymentReceived: true, subscriptionId: null }), false)
    assert.equal(shouldRechargeAfterNewCard({ previousStatus: 'approved', paymentReceived: false, subscriptionId: 'sub_123' }), false)
    assert.equal(shouldRechargeAfterNewCard({ previousStatus: 'approved', paymentReceived: false, subscriptionId: null }), true)
  })

  it('blocks approve when the checklist is incomplete', async () => {
    const decision = await approveApplication(application({
      checklistAnswers: { country: 'US', practiceApproach: 'Too short' },
      cardOnFile: false,
      stripePaymentMethodId: null,
      mobileE164: null,
    }), billing, NOW, '')
    assert.equal(decision.ok, false)
    assert.equal(decision.doctor, null)
    assert.equal(decision.charged, false)
    assert.match(decision.message, /how you practice/i)
    assert.match(decision.message, /Card on file/)
    assert.match(decision.message, /Mobile number/)
    const gaps = applicationGaps({
      practiceApproach: 'We focus on the nervous system and how the body adapts.',
      heardAbout: 'Google',
      techniques: 'Toggle',
      usesNervousSystemScans: false,
      yearsInPractice: 8,
      officeAddress: '123 Main Street',
      city: 'Greenville',
      country: 'US',
      email: 'ada@example.com',
      mobile: '+18645550100',
      plan: 'monthly',
      cardOnFile: false,
    })
    assert.deepEqual(gaps.map((gap) => gap.label), ['Card on file'])
    assert.equal(approveBlockMessage([]), null)
  })
})

describe('signup country, duplicates, and consent', () => {
  it('defaults Canada to CAD from a .ca email or a Canadian area code', () => {
    assert.equal(defaultSignupCountry({ email: 'ada@clinic.ca', phone: '' }), 'CA')
    assert.equal(currencyForSignup({ email: 'ada@clinic.ca', phone: '' }), 'CAD')
    assert.equal(currencyForCountry(defaultSignupCountry({ email: 'ada@gmail.com', phone: '6045550100' })), 'CAD')
    assert.equal(currencyForCountry('CA'), 'CAD')
    assert.equal(defaultSignupCountry({ email: 'ada@gmail.com', phone: '8645550100' }), 'US')
    assert.equal(currencyForCountry('US'), 'USD')
  })

  it('links an existing listing instead of starting another draft', () => {
    const draft = doctor()
    const paid = doctor({ id: 'doc-paid', email: 'ada@example.com', paidAt: '2026-01-01T00:00:00.000Z', stripeSubscriptionId: 'sub_123' })
    assert.deepEqual(signupDuplicateDecision('ada@example.com', [draft]), { action: 'create' })
    assert.deepEqual(signupDuplicateDecision('ada@example.com', [paid]), {
      action: 'link',
      doctorId: 'doc-paid',
      message: EXISTING_LISTING_MESSAGE,
    })
    assert.equal(EXISTING_LISTING_MESSAGE, 'You already have a listing, set your password')
    assert.deepEqual(signupDuplicateDecision('other@example.com', [paid]), { action: 'create' })
    const listed = signupDuplicateDecision('ada@example.com', [doctor({ isApproved: true, verificationStatus: 'verified' })])
    assert.equal(listed.action, 'link')
  })

  it('does not create a login with the submitted password or link the listing before the email is verified', async () => {
    const submittedPassword = 'attacker-password'
    const seen: unknown[] = []
    const result = await startListingClaim({
      submittedPassword,
      doctor: doctor({ id: 'doc-paid', userId: null, paidAt: '2026-01-01T00:00:00.000Z', isApproved: true }),
      existingUserId: null,
      ports: {
        async createUnconfirmedLogin(input) {
          seen.push(input)
          assert.equal(JSON.stringify(input).includes(submittedPassword), false)
          assert.equal('password' in input, false)
          return { userId: 'user-new' }
        },
        async rememberPendingClaim(input) {
          seen.push(input)
          assert.equal(JSON.stringify(input).includes(submittedPassword), false)
          return true
        },
        async sendPasswordLink(input) {
          seen.push(input)
          assert.equal(input.email, 'ada@example.com')
          assert.equal(JSON.stringify(input).includes(submittedPassword), false)
          return { ok: true, userId: input.userId }
        },
      },
    })
    assert.equal(result.ok, true)
    assert.equal(result.linked, false)
    assert.equal(result.message, LISTING_PASSWORD_EMAIL)
    assert.equal(seen.some((item) => JSON.stringify(item).includes(submittedPassword)), false)
  })

  it('says patient requests on the optional text consent', () => {
    assert.match(APPLICATION_SMS_CONSENT, /patient request/)
    assert.equal(APPLICATION_SMS_CONSENT.includes('community member'), false)
    assert.match(chargeApprovalCopy('$99', 'month'), /You're charged \$99\/month only if approved\. Cancel anytime\./)
    assert.match(chargeApprovalCopy('CA$139', 'year'), /CA\$139\/year/)
  })
})

describe('resume link and quiet hours', () => {
  it('builds a one-time magic link that lands on the exact step', () => {
    const url = magicResumeUrl('tok_123', '/doctor/apply?step=2&part=2&resume=1')
    const parsed = new URL(url)
    assert.equal(parsed.origin, 'https://neurochiro.co')
    assert.equal(parsed.pathname, '/auth/activate')
    assert.equal(parsed.searchParams.get('type'), 'magiclink')
    assert.equal(parsed.searchParams.get('token_hash'), 'tok_123')
    assert.equal(parsed.searchParams.get('next'), '/doctor/apply?step=2&part=2&resume=1')
    const full = 'https://neurochiro.co/doctor/apply?step=3&resume=1'
    assert.equal(resumePathOnly(full), '/doctor/apply?step=3&resume=1')
    assert.equal(new URL(magicResumeUrl('tok_123', full)).searchParams.get('next'), '/doctor/apply?step=2&resume=1')
    assert.equal(new URL(magicResumeUrl('tok_123', resumePathOnly(full))).searchParams.get('next'), '/doctor/apply?step=3&resume=1')
  })

  it('uses the office state, then the phone area code, and holds 9 PM to 8 AM', () => {
    assert.equal(applicationTimezone({ state: 'SC', country: 'US', phone: '+16045550100' }), 'America/New_York')
    assert.equal(applicationTimezone({ state: '', country: 'US', phone: '+16045550100' }), 'America/Vancouver')
    const evening = new Date('2026-11-06T02:30:00.000Z')
    assert.equal(reminderInQuietHours('America/New_York', evening), true)
    const morning = new Date('2026-11-05T13:00:00.000Z')
    assert.equal(reminderInQuietHours('America/New_York', morning), false)
  })

  it('does not send a reminder during quiet hours and does not claim it', async () => {
    const claimed: string[] = []
    const row: ReminderCandidate = {
      id: 'app-1',
      email: 'ada@example.com',
      firstName: 'Ada',
      status: 'draft',
      cardOnFile: false,
      createdAt: new Date('2026-11-06T04:00:00.000Z').toISOString(),
      reminder1hSentAt: null,
      reminder24hSentAt: null,
      smsConsent: true,
      mobile: '+16045550100',
      timezone: 'America/Vancouver',
      resumeUrl: 'https://neurochiro.co/doctor/apply?step=2&resume=1',
    }
    const result = await deliverReminders({
      now: new Date('2026-11-06T06:00:00.000Z'),
      smsEnabled: true,
      rows: [row],
      claim: async (id) => {
        claimed.push(id)
        return 'claimed'
      },
      release: async () => {},
      sendEmail: async () => true,
      sendSms: async () => true,
    })
    assert.deepEqual(claimed, [])
    assert.equal(result.emailed, 0)
    assert.equal(result.texted, 0)
  })
})
