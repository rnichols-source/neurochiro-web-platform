import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { nudgeCopy } from './messages.ts'
import { isStopMessage, waitlistTextGate } from '../sms/waitlist-text.ts'
import {
  canTextNumber,
  daysSince,
  duplicateKey,
  formatNewMembers,
  isDoctorMembershipCheckout,
  listingContentPatch,
  listingPhonesFromCheckout,
  needsProfileFinish,
  nextNudge,
  orderWaitlistTiers,
  paymentIntentIdFromInvoicePayment,
  phoneFromCheckout,
  planCheckoutIntake,
  planInvoiceIntake,
  planPathB,
  profileCompleteness,
  publishOnPayment,
  readCheckoutContact,
  shouldHideUnpaid,
  subscriptionIdFromInvoice,
  smsAlertsEnabled,
  webhookDisposition,
  type CheckoutIdentity,
  type ExistingListing,
  type ListingSource,
} from './plan.ts'

const NOW = '2026-11-14T18:00:00.000Z'

function identity(overrides: Partial<CheckoutIdentity> = {}): CheckoutIdentity {
  return {
    sessionId: 'cs_1',
    customerId: 'cus_1',
    subscriptionId: 'sub_1',
    email: 'ada@example.com',
    name: 'Ada Lovelace',
    phone: '+18645550100',
    smsConsent: true,
    city: 'Greenville',
    state: 'SC',
    country: 'US',
    clinicName: 'Lovelace Chiropractic',
    amountTotal: 9900,
    currency: 'usd',
    priceId: null,
    metadataType: null,
    metadataRole: null,
    userId: null,
    mode: 'subscription',
    paymentLinkPresent: true,
    ...overrides,
  }
}

function listing(overrides: Partial<ExistingListing & { verificationStatus: string | null; isApproved: boolean | null }> = {}): ExistingListing & { verificationStatus?: string | null; isApproved?: boolean | null } {
  return {
    id: 'doc-1',
    email: 'ada@example.com',
    firstName: 'Ada',
    lastName: 'Lovelace',
    city: 'Greenville',
    userId: 'user-1',
    stripeCustomerId: null,
    ...overrides,
  }
}

const emptyDone = {
  activate_login: false,
  finish_profile: false,
  book_spotlight: false,
  book_ig_live: false,
  add_text_number: false,
}

describe('webhook idempotency', () => {
  it('processes a new event once and skips a retry or an existing claim', () => {
    assert.deepEqual(webhookDisposition({ alreadyProcessed: false, claimed: false }), { process: true })
    assert.deepEqual(webhookDisposition({ alreadyProcessed: true, claimed: false }), { process: false, reason: 'duplicate_event' })
    assert.deepEqual(webhookDisposition({ alreadyProcessed: false, claimed: true }), { process: false, reason: 'already_claimed' })
  })
})

describe('path B auto-create', () => {
  const known = { priceIds: ['price_doctor'], studentPriceIds: ['price_student'] }

  it('creates a doctor from a membership payment link when nobody matches', () => {
    const row = identity()
    assert.equal(isDoctorMembershipCheckout(row, known), true)
    assert.deepEqual(planPathB({ identity: row, existing: [], claimed: false, membership: true }), { action: 'create' })
  })

  it('is idempotent when the checkout was already claimed', () => {
    const plan = planPathB({ identity: identity(), existing: [], claimed: true, membership: true })
    assert.deepEqual(plan, { action: 'skip', reason: 'already_claimed' })
  })

  it('attaches to an existing listing with the same email instead of creating another', () => {
    const plan = planPathB({
      identity: identity(),
      existing: [listing({ email: 'Ada@example.com' })],
      claimed: false,
      membership: true,
    })
    assert.deepEqual(plan, { action: 'attach', doctorId: 'doc-1', reason: 'email' })
  })

  it('flags the same name and city instead of creating a second listing', () => {
    const plan = planPathB({
      identity: identity({ email: 'new@example.com' }),
      existing: [listing({ email: 'other@example.com' })],
      claimed: false,
      membership: true,
    })
    assert.deepEqual(plan, { action: 'flag_duplicate', doctorId: 'doc-1' })
    assert.equal(duplicateKey('Ada', 'Lovelace', 'Greenville'), duplicateKey(' ada ', 'lovelace', 'greenville'))
  })

  it('ignores seminars, students, and checkouts that already have an account', () => {
    assert.equal(isDoctorMembershipCheckout(identity({ metadataType: 'seminar_package' }), known), false)
    assert.equal(isDoctorMembershipCheckout(identity({ metadataRole: 'student', paymentLinkPresent: false, mode: 'payment' }), known), false)
    assert.equal(isDoctorMembershipCheckout(identity({ priceId: 'price_student', paymentLinkPresent: false }), known), false)
    assert.equal(isDoctorMembershipCheckout(identity({ priceId: 'price_doctor', paymentLinkPresent: false, mode: 'payment' }), known), true)
    const linked = planPathB({
      identity: identity({ userId: 'user-9' }),
      existing: [],
      claimed: false,
      membership: true,
    })
    assert.deepEqual(linked, { action: 'skip', reason: 'account_already_linked' })
  })

  it('does not hide a live doctor who pays a Payment Link', () => {
    const live = listing({ verificationStatus: 'verified', isApproved: true })
    assert.deepEqual(planCheckoutIntake({ membership: true, listings: [live] }), {
      action: 'link_live',
      doctorId: 'doc-1',
    })
  })

  it('ignores a renewal invoice for a live doctor with no application', () => {
    const decision = planInvoiceIntake({
      billingReason: 'subscription_cycle',
      amountPaid: 9900,
      applications: [],
      listings: [{ verificationStatus: 'verified', isApproved: true }],
    })
    assert.deepEqual(decision, { action: 'ignore', reason: 'renewal' })
  })

  it('opens a pending listing only for the first invoice when nobody is already live', () => {
    const created = planInvoiceIntake({
      billingReason: 'subscription_create',
      amountPaid: 9900,
      applications: [],
      listings: [],
    })
    assert.deepEqual(created, { action: 'create_pending' })
    const renewal = planInvoiceIntake({
      billingReason: 'subscription_cycle',
      amountPaid: 9900,
      applications: [],
      listings: [],
    })
    assert.deepEqual(renewal, { action: 'ignore', reason: 'renewal' })
  })

  it('reads the subscription id from the current invoice parent and the built-in phone', () => {
    assert.equal(subscriptionIdFromInvoice({
      parent: { subscription_details: { subscription: 'sub_new' } },
    }), 'sub_new')
    assert.equal(phoneFromCheckout([], '+18645550100'), '+18645550100')
    assert.equal(phoneFromCheckout([{ key: 'mobile', text: { value: '8645550199' } }], '+18645550100'), '8645550199')
    assert.equal(paymentIntentIdFromInvoicePayment({
      status: 'paid',
      payment: { type: 'payment_intent', payment_intent: 'pi_123' },
    }), 'pi_123')
  })

  it('reads the phone and consent custom fields', () => {
    const contact = readCheckoutContact([
      { key: 'mobile', text: { value: '8645550100' } },
      { key: 'sms_consent', dropdown: { value: 'yes' } },
      { key: 'city', text: { value: 'Greenville' } },
    ])
    assert.equal(contact.phone, '8645550100')
    assert.equal(contact.smsConsent, true)
    assert.equal(contact.city, 'Greenville')
  })
})

describe('nudge stop conditions', () => {
  it('sends only the next unfinished step and stops once that step is done', () => {
    const first = nextNudge({ daysSinceLive: 1, done: emptyDone, sentKeys: [] })
    assert.equal(first?.step, 'activate_login')
    assert.equal(first?.key, 'setup:1:activate_login')

    const afterLogin = nextNudge({
      daysSinceLive: 1,
      done: { ...emptyDone, activate_login: true },
      sentKeys: [],
    })
    assert.equal(afterLogin?.step, 'finish_profile')

    const finished = nextNudge({
      daysSinceLive: 2,
      done: {
        activate_login: true,
        finish_profile: true,
        book_spotlight: true,
        book_ig_live: true,
        add_text_number: true,
      },
      sentKeys: [],
    })
    assert.equal(finished, null)
  })

  it('does not repeat a step that was already sent that day', () => {
    const again = nextNudge({
      daysSinceLive: 1,
      done: emptyDone,
      sentKeys: ['setup:1:activate_login'],
    })
    assert.equal(again, null)
  })

  it('sends day 7, 14, and 30 check-ins once, and nothing on the days in between', () => {
    assert.equal(nextNudge({ daysSinceLive: 5, done: emptyDone, sentKeys: [] }), null)
    const day7 = nextNudge({ daysSinceLive: 7, done: emptyDone, sentKeys: [] })
    assert.equal(day7?.kind, 'checkin')
    assert.equal(day7?.day, 7)
    assert.equal(nextNudge({ daysSinceLive: 7, done: emptyDone, sentKeys: ['checkin:7'] }), null)
    assert.equal(nextNudge({ daysSinceLive: 14, done: emptyDone, sentKeys: [] })?.day, 14)
    assert.equal(nextNudge({ daysSinceLive: 30, done: emptyDone, sentKeys: [] })?.day, 30)
    const copy = nudgeCopy(day7!, { name: 'Lovelace', requestCount: 2, activateUrl: 'https://neurochiro.co/auth/activate' })
    assert.match(copy.body, /community member/)
    assert.equal(copy.body.includes('patient'), false)
    assert.match(copy.body, /https:\/\/neurochiro\.co\/doctor\/leads/)
  })

  it('counts whole days since the listing went live', () => {
    assert.equal(daysSince('2026-11-13T18:00:00.000Z', NOW), 1)
    assert.equal(daysSince('2026-11-14T17:00:00.000Z', NOW), 0)
  })
})

function practice(overrides: Partial<ListingSource> = {}): ListingSource {
  return {
    firstName: 'Ada',
    lastName: 'Lovelace',
    practiceApproach: 'We focus on the nervous system and how the body adapts.',
    techniques: 'Toggle and Blair',
    officeAddress: '123 Main Street',
    city: 'Greenville',
    state: 'SC',
    country: 'US',
    website: 'https://example.com',
    instagram: '@lovelace',
    phone: '+18645550100',
    clinicName: 'Lovelace Chiropractic',
    hours: 'Mon 9-5',
    bookingUrl: 'https://example.com/book',
    photoUrl: 'https://example.com/photo.jpg',
    ...overrides,
  }
}

describe('listing build and unpaid hide', () => {
  it('copies practice answers onto the listing and scores what is still missing', () => {
    const patch = listingContentPatch(practice())
    assert.equal(patch.clinic_name, 'Lovelace Chiropractic')
    assert.deepEqual(patch.specialties, ['Toggle', 'Blair'])
    assert.equal('phone' in patch, false)
    assert.equal(patch.instagram_url, 'https://www.instagram.com/lovelace/')
    const score = profileCompleteness({
      clinicName: '',
      bio: '',
      photo: '',
      specialties: [],
      hours: '',
      phone: '',
      address: '',
      city: '',
      bookingUrl: '',
      latitude: null,
      longitude: null,
      textNumber: false,
    })
    assert.equal(score.percent, 0)
    assert.equal(needsProfileFinish(score.missing), true)
    assert.equal(publishOnPayment('paid'), true)
    assert.equal(publishOnPayment('requires_action'), false)
    assert.equal(publishOnPayment('failed'), false)
  })

  it('keeps an existing listing phone when the application is approved', () => {
    const kept = listingContentPatch(practice({
      phone: '+18645550199',
      officePhone: '(864) 555-0100',
      currentPhone: '(864) 555-0142',
    }))
    assert.equal('phone' in kept, false)

    const filled = listingContentPatch(practice({
      phone: '+18645550199',
      officePhone: '(864) 555-0100',
      currentPhone: '',
    }))
    assert.equal(filled.phone, '(864) 555-0100')
  })

  it('never puts the checkout cell on the public listing phone', () => {
    const consented = listingPhonesFromCheckout({ phone: '+18645550100', smsConsent: true })
    assert.equal(consented.phone, '')
    assert.equal(consented.alertPhone, '+18645550100')

    const builtIn = listingPhonesFromCheckout({
      phone: phoneFromCheckout([], '+18645550188'),
      smsConsent: true,
    })
    assert.equal(builtIn.phone, '')
    assert.equal(builtIn.alertPhone, '+18645550188')

    const customCell = listingPhonesFromCheckout({
      phone: phoneFromCheckout([{ key: 'mobile', text: { value: '8645550199' } }], '+18645550100'),
      smsConsent: true,
    })
    assert.equal(customCell.phone, '')
    assert.equal(customCell.alertPhone, '8645550199')

    const noConsent = listingPhonesFromCheckout({ phone: '+18645550100', smsConsent: false })
    assert.equal(noConsent.phone, '')
    assert.equal(noConsent.alertPhone, null)

    const unanswered = listingPhonesFromCheckout({ phone: '+18645550100', smsConsent: null })
    assert.equal(unanswered.phone, '')
    assert.equal(unanswered.alertPhone, null)
  })

  it('hides an unpaid listing after 72 hours and leaves a paid one up', () => {
    assert.equal(shouldHideUnpaid({
      status: 'needs_action',
      reviewedAt: '2026-11-11T17:00:00.000Z',
      paid: false,
      now: NOW,
    }), true)
    assert.equal(shouldHideUnpaid({
      status: 'needs_action',
      reviewedAt: '2026-11-14T10:00:00.000Z',
      paid: false,
      now: NOW,
    }), false)
    assert.equal(shouldHideUnpaid({
      status: 'needs_action',
      reviewedAt: '2026-11-01T00:00:00.000Z',
      paid: true,
      now: NOW,
    }), false)
  })

  it('texts a waitlister once when they consented, and honors STOP', () => {
    assert.equal(waitlistTextGate({ phone: '+18645550100', consent: true, optedOut: false, alreadySent: false }), 'send')
    assert.equal(waitlistTextGate({ phone: '+18645550100', consent: false, optedOut: false, alreadySent: false }), 'no_consent')
    assert.equal(waitlistTextGate({ phone: '+447911123456', consent: true, optedOut: false, alreadySent: false }), 'not_textable')
    assert.equal(waitlistTextGate({ phone: '+18645550100', consent: true, optedOut: true, alreadySent: false }), 'opted_out')
    assert.equal(waitlistTextGate({ phone: '+18645550100', consent: true, optedOut: false, alreadySent: true }), 'already_sent')
    assert.equal(isStopMessage('STOP'), true)
    assert.equal(isStopMessage('hello'), false)
  })

  it('texts only US and Canadian numbers and treats a blank alert switch as off', () => {
    assert.equal(canTextNumber('+18645550100'), true)
    assert.equal(canTextNumber('+447911123456'), false)
    assert.equal(smsAlertsEnabled(true), true)
    assert.equal(smsAlertsEnabled(null), false)
    assert.equal(smsAlertsEnabled(false), false)
  })

  it('sends the 25-mile waitlist tier before the 50-mile tier', () => {
    const ordered = orderWaitlistTiers([
      { id: 'far', distanceMiles: 40, confirmed: true },
      { id: 'near', distanceMiles: 10, confirmed: false },
      { id: 'edge', distanceMiles: 25, confirmed: true },
    ])
    assert.deepEqual(ordered.map((row) => row.id), ['near', 'edge', 'far'])
  })

  it('lists new members in the Monday digest without a per-member ping', () => {
    const lines = formatNewMembers([{
      name: 'Dr. Ada Lovelace',
      city: 'Greenville',
      loginActivated: false,
      profilePercent: 40,
      textNumber: true,
      spotlightBooked: false,
      igLiveBooked: false,
      exceptions: ['needs profile finish'],
    }])
    assert.match(lines.join('\n'), /New members this week/)
    assert.match(lines.join('\n'), /login not activated/)
    assert.match(lines.join('\n'), /needs profile finish/)
  })
})
