import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { nudgeCopy } from './messages.ts'
import { decideWebhookHealth, signatureFailureIsActionable, webhookHealthEmailHtml } from './health.ts'
import { APPROVAL_GO_LIVE_STEPS } from './steps.ts'
import { welcomeInputFromListing, WELCOME_REPLY_TO } from './welcome-email.ts'
import { isDoctorMembershipProduct } from './products.ts'
import { isStopMessage, waitlistTextGate } from '../sms/waitlist-text.ts'
import {
  canTextNumber,
  checkoutApplicationContact,
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
  adminGoLiveSummary,
  minimumProfileGaps,
  blocksNewDoctor,
  listingNeverGoneLive,
  planCheckoutIntake,
  planDuplicateGuard,
  planInvoiceIntake,
  planLoggedInCheckout,
  nextBookingNudge,
  nudgeProgress,
  portalPasswordIsSet,
  goLiveStepRetry,
  portalRecoveryLinkWanted,
  profileTierForDoctor,
  loginPasswordState,
  welcomeSendDecision,
  resumeClaimPlan,
  processedWebhookAction,
  reconcileIntakeReport,
  reconciliationLetter,
  retryPlanForDoctor,
  unmatchedPaymentLine,
  planPathB,
  promotionPlan,
  shouldSendWelcome,
  smsPromptRequired,
  stepsToRun,
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

  it('runs go-live for a verified doctor with no prior run and only stores ids after an ok run', () => {
    const live = listing({ verificationStatus: 'verified', isApproved: true })
    assert.deepEqual(planCheckoutIntake({ membership: true, hasOkGoLive: false, listings: [live] }), {
      action: 'go_live',
      doctorId: 'doc-1',
    })
    assert.deepEqual(planCheckoutIntake({ membership: true, hasOkGoLive: true, listings: [live] }), {
      action: 'link_live',
      doctorId: 'doc-1',
    })
  })

  it('ignores a renewal invoice for a live doctor with no application', () => {
    const decision = planInvoiceIntake({
      billingReason: 'subscription_cycle',
      amountPaid: 9900,
      membership: true,
      hasSubscription: true,
      applications: [],
      listings: [{ id: 'doc-1', verificationStatus: 'verified', isApproved: true }],
    })
    assert.deepEqual(decision, { action: 'ignore', reason: 'renewal' })
  })

  it('starts go-live on the first subscription invoice and never on a renewal', () => {
    const created = planInvoiceIntake({
      billingReason: 'subscription_create',
      amountPaid: 9900,
      membership: true,
      hasSubscription: true,
      applications: [],
      listings: [],
    })
    assert.deepEqual(created, { action: 'create_and_go_live' })
    const renewal = planInvoiceIntake({
      billingReason: 'subscription_cycle',
      amountPaid: 9900,
      membership: true,
      hasSubscription: true,
      applications: [],
      listings: [],
    })
    assert.deepEqual(renewal, { action: 'needs_review', reason: 'matched_no_listing' })
    assert.notEqual(renewal.action, 'create_and_go_live')
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

  it('stores the checkout cell on the application whether or not they consent', () => {
    const consented = checkoutApplicationContact({
      phone: phoneFromCheckout([{ key: 'mobile', text: { value: '8645550100' } }], null),
      smsConsent: true,
      country: 'US',
      now: NOW,
    })
    assert.equal(consented.listingPhone, '')
    assert.deepEqual(consented.application, {
      mobile_e164: '+18645550100',
      sms_consent: true,
      sms_consent_at: NOW,
    })
    assert.equal(consented.alertPhone, '+18645550100')

    const declined = checkoutApplicationContact({
      phone: phoneFromCheckout([], '(864) 555-0199'),
      smsConsent: false,
      country: 'US',
      now: NOW,
    })
    assert.equal(declined.listingPhone, '')
    assert.deepEqual(declined.application, {
      mobile_e164: '+18645550199',
      sms_consent: false,
      sms_consent_at: null,
    })
    assert.equal(declined.alertPhone, null)
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

describe('payment go-live paths', () => {
  const europe = { id: 'prod_VYaJmk3eCkPiUy', name: 'NeuroChiro Europe - Founding Member', metadata: {} }
  const pro = { id: 'prod_VHErgcWaKV4LZe', name: 'NeuroChiro Pro - Monthly', metadata: {}, priceMetadata: { effective: '2026-12-01' } }
  const student = { id: 'prod_VXtrG9w7WGWKdW', name: 'NeuroChiro Student Membership', metadata: { kind: 'student_membership' } }
  const known = { priceIds: ['price_doctor'], studentPriceIds: ['price_student'] }

  it('recognizes a EUR payment link, the $199 price, and a Brave first month by product', () => {
    assert.equal(isDoctorMembershipCheckout(identity({ currency: 'eur', amountTotal: 7900, priceId: 'price_eur' }), known, europe), true)
    assert.equal(isDoctorMembershipProduct(europe), true)
    assert.equal(isDoctorMembershipCheckout(identity({
      amountTotal: 19900,
      priceId: 'price_199',
      paymentLinkPresent: false,
    }), known, pro), true)
    assert.equal(isDoctorMembershipCheckout(identity({
      amountTotal: 19900,
      currency: 'usd',
      priceId: null,
    }), known, null), true)
    assert.equal(isDoctorMembershipCheckout(identity({
      mode: 'payment',
      amountTotal: 4900,
      priceId: 'price_brave',
    }), known, { ...pro, priceMetadata: { source: 'brave_practice', offer: '49_first_month' } }), true)
    assert.equal(isDoctorMembershipCheckout(identity({ priceId: 'price_student_live', paymentLinkPresent: false }), known, student), false)
  })

  it('starts go-live for a one-off invoice and a dashboard subscription, and not for a renewal', () => {
    assert.deepEqual(planInvoiceIntake({
      billingReason: 'manual',
      amountPaid: 4900,
      membership: true,
      hasSubscription: false,
      applications: [],
      listings: [],
    }), { action: 'create_and_go_live' })
    assert.deepEqual(planInvoiceIntake({
      billingReason: 'subscription_create',
      amountPaid: 9900,
      membership: true,
      hasSubscription: true,
      applications: [],
      listings: [],
    }), { action: 'create_and_go_live' })
    assert.deepEqual(planInvoiceIntake({
      billingReason: 'subscription_cycle',
      amountPaid: 9900,
      membership: true,
      hasSubscription: true,
      applications: [],
      listings: [],
    }), { action: 'needs_review', reason: 'matched_no_listing' })
    assert.deepEqual(planInvoiceIntake({
      billingReason: 'manual',
      amountPaid: 3300,
      membership: false,
      hasSubscription: false,
      applications: [],
      listings: [],
    }), { action: 'ignore', reason: 'not_membership' })
  })

  it('runs go-live for a logged-in doctor who is not live yet and promotes a community member', () => {
    assert.deepEqual(planLoggedInCheckout({
      membership: true,
      role: 'doctor',
      doctorId: 'doc-1',
      hasOkGoLive: false,
    }), { action: 'go_live', doctorId: 'doc-1' })
    assert.deepEqual(planLoggedInCheckout({
      membership: true,
      role: 'doctor',
      doctorId: 'doc-1',
      hasOkGoLive: true,
    }), { action: 'store_ids', doctorId: 'doc-1' })
    assert.deepEqual(promotionPlan({ hasAccount: true, hasDoctor: false, role: 'patient' }), {
      action: 'link_existing',
      promoteRole: true,
    })
    assert.deepEqual(planLoggedInCheckout({
      membership: true,
      role: 'student',
      doctorId: null,
      hasOkGoLive: false,
    }), { action: 'ignore', reason: 'student' })
  })

  it('describes a basic profile and a missing mobile, and keeps the welcome on a force retry', () => {
    assert.deepEqual(minimumProfileGaps({ website: '', photo: '', bio: '' }), ['website', 'photo', 'write-up'])
    const summary = adminGoLiveSummary({
      doctorName: 'Dr. Lovelace',
      email: 'ada@example.com',
      profileUrl: 'https://neurochiro.co/directory/ada',
      city: 'Greenville',
      source: 'payment_link',
      missing: ['website', 'photo', 'write-up'],
      textSent: false,
    })
    assert.match(summary.text, /Profile went live in basic form: needs website\/photo\/write-up/)
    assert.match(summary.text, /Missing: website, photo, write-up/)
    assert.match(summary.text, /No text sent: no mobile on file/)
    assert.equal(summary.text.includes('patient'), false)
    assert.equal(smsPromptRequired({ phone: null, consent: false }), true)
    assert.equal(smsPromptRequired({ phone: '+18645550100', consent: true }), false)
    assert.equal(shouldSendWelcome({ alreadyOk: true, resendWelcome: false }), false)
    assert.equal(shouldSendWelcome({ alreadyOk: true, resendWelcome: true }), true)
    const forced = stepsToRun({
      completed: [
        { step: 'checkout', status: 'ok' },
        { step: 'profile', status: 'ok' },
        { step: 'portal', status: 'ok' },
        { step: 'welcome', status: 'ok' },
        { step: 'waitlist', status: 'ok' },
        { step: 'instagram', status: 'ok' },
        { step: 'summary', status: 'ok' },
      ],
      force: true,
      resendWelcome: false,
    })
    assert.equal(forced.includes('welcome'), false)
    assert.equal(stepsToRun({
      completed: [{ step: 'welcome', status: 'ok' }],
      force: true,
      resendWelcome: true,
    }).includes('welcome'), true)
  })
})

describe('existing members and invoice go-live', () => {
  it('only links Stripe ids for a pre-automation doctor or one who already got a welcome', () => {
    const live = listing({ verificationStatus: 'verified', isApproved: true })
    assert.deepEqual(planCheckoutIntake({
      membership: true,
      hasOkGoLive: false,
      preAutomation: true,
      listings: [live],
    }), { action: 'link_live', doctorId: 'doc-1' })
    assert.deepEqual(planCheckoutIntake({
      membership: true,
      welcomeOk: true,
      listings: [listing({ verificationStatus: 'hidden' })],
    }), { action: 'link_live', doctorId: 'doc-1' })
    assert.deepEqual(planInvoiceIntake({
      billingReason: 'subscription_create',
      amountPaid: 9900,
      membership: true,
      hasSubscription: true,
      welcomeOk: true,
      applications: [],
      listings: [{ id: 'doc-1', verificationStatus: 'verified' }],
    }), { action: 'link_live', doctorId: 'doc-1' })
    assert.deepEqual(planLoggedInCheckout({
      membership: true,
      role: 'doctor',
      doctorId: 'doc-1',
      hasOkGoLive: false,
      preAutomation: true,
    }), { action: 'store_ids', doctorId: 'doc-1' })
  })

  it('ignores a zero-dollar invoice and runs go-live on the first paid invoice', () => {
    assert.deepEqual(planInvoiceIntake({
      billingReason: 'subscription_create',
      amountPaid: 0,
      membership: true,
      hasSubscription: true,
      neverGoneLive: true,
      applications: [],
      listings: [],
    }), { action: 'ignore', reason: 'not_paid' })
    const renewal = planInvoiceIntake({
      billingReason: 'subscription_cycle',
      amountPaid: 9900,
      membership: true,
      hasSubscription: true,
      neverGoneLive: true,
      applications: [],
      listings: [],
    })
    assert.deepEqual(renewal, { action: 'needs_review', reason: 'matched_no_listing' })
    assert.notEqual(renewal.action, 'create_and_go_live')
    assert.notEqual(renewal.action, 'go_live')
    assert.deepEqual(planInvoiceIntake({
      billingReason: 'subscription_cycle',
      amountPaid: 9900,
      membership: true,
      hasSubscription: true,
      hasOkGoLive: true,
      welcomeOk: false,
      neverGoneLive: true,
      applications: [],
      listings: [{ id: 'doc-1' }],
    }), { action: 'link_live', doctorId: 'doc-1' })
  })

  it('records checkout on the approval path', () => {
    assert.equal(APPROVAL_GO_LIVE_STEPS.includes('checkout'), true)
    assert.equal(APPROVAL_GO_LIVE_STEPS.includes('welcome'), true)
  })
})

describe('duplicate doctors from go-live', () => {
  it('does not create a doctor for a renewal invoice that matches no listing, and alerts for review', () => {
    for (const billingReason of ['subscription_cycle', 'subscription_update', 'subscription_threshold']) {
      const decision = planInvoiceIntake({
        billingReason,
        amountPaid: 9900,
        membership: true,
        hasSubscription: true,
        neverGoneLive: true,
        applications: [],
        listings: [],
      })
      assert.deepEqual(decision, { action: 'needs_review', reason: 'matched_no_listing' })
      assert.equal(blocksNewDoctor({ billingReason, earlierPaidInvoice: false }), true)
    }
    const earlier = planInvoiceIntake({
      billingReason: 'subscription_create',
      amountPaid: 9900,
      membership: true,
      hasSubscription: true,
      earlierPaidInvoice: true,
      applications: [],
      listings: [],
    })
    assert.deepEqual(earlier, { action: 'needs_review', reason: 'matched_no_listing' })
    assert.equal(listingNeverGoneLive({ listingCount: 0, welcomeOk: false }), false)
    assert.equal(listingNeverGoneLive({ listingCount: 1, welcomeOk: false }), true)
    assert.equal(listingNeverGoneLive({ listingCount: 1, welcomeOk: true }), false)
    const line = unmatchedPaymentLine('Vincent Farrar', 'billing@example.com')
    assert.equal(line, 'needs review: payment from Vincent Farrar/billing@example.com matched no listing')
    const letter = reconciliationLetter({ missing: [], failed: [], review: [line] })
    assert.match(letter?.html || '', /needs review: payment from Vincent Farrar\/billing@example.com matched no listing/)
    assert.equal((letter?.html || '').toLowerCase().includes('patient'), false)
    assert.match(letter?.html || '', /https:\/\/neurochiro\.co\/admin\/go-live/)
    assert.equal(letter?.html.includes('create'), false)
  })

  it('links or flags a re-signup with a different billing email and the same last name and city', () => {
    const plan = planPathB({
      identity: identity({
        email: 'bridget.billing@example.com',
        name: 'Vincent & Bridget Farrar',
        city: 'Charleston',
        state: 'SC',
        customerId: 'cus_new',
      }),
      existing: [listing({
        email: 'vincent@practice.example',
        firstName: 'Vincent',
        lastName: 'Farrar',
        city: 'Charleston',
        state: 'SC',
        stripeCustomerId: 'cus_old',
        emails: ['office@practice.example'],
      })],
      claimed: false,
      membership: true,
    })
    assert.notEqual(plan.action, 'create')
    assert.equal(plan.action === 'flag_duplicate' || plan.action === 'attach', true)
    if (plan.action === 'flag_duplicate' || plan.action === 'attach') assert.equal(plan.doctorId, 'doc-1')
    const byState = planPathB({
      identity: identity({
        email: 'other.billing@example.com',
        name: 'Bridget Farrar',
        city: '',
        state: 'South Carolina',
        customerId: 'cus_state',
      }),
      existing: [listing({
        email: 'vincent@practice.example',
        firstName: 'Vincent',
        lastName: 'Farrar',
        city: 'Greenville',
        state: 'SC',
        stripeCustomerId: null,
      })],
      claimed: false,
      membership: true,
    })
    assert.notEqual(byState.action, 'create')
    const byPracticeEmail = planDuplicateGuard({
      identity: identity({ email: 'office@practice.example', name: 'Someone New', city: 'Austin', customerId: 'cus_other' }),
      existing: [listing({ email: 'listing@example.com', emails: ['Office@practice.example'], city: 'Dallas', state: 'TX' })],
    })
    assert.deepEqual(byPracticeEmail, { action: 'flag_duplicate', doctorId: 'doc-1' })
    const byPracticeEmailSameName = planDuplicateGuard({
      identity: identity({ email: 'office@practice.example', name: 'Ada Lovelace', city: 'Austin', state: 'TX', customerId: 'cus_other' }),
      existing: [listing({ email: 'listing@example.com', emails: ['Office@practice.example'], city: 'Dallas', state: 'TX' })],
    })
    assert.deepEqual(byPracticeEmailSameName, { action: 'attach', doctorId: 'doc-1', reason: 'email' })
    const byPhone = planPathB({
      identity: identity({ email: 'new@example.com', name: 'New Person', city: 'Austin', phone: '(864) 555-0100' }),
      existing: [listing({ email: 'other@example.com', city: 'Dallas', phones: ['+1 864-555-0100'], firstName: 'Ada', lastName: 'Other' })],
      claimed: false,
      membership: true,
    })
    assert.deepEqual(byPhone, { action: 'flag_duplicate', doctorId: 'doc-1' })
    const byPhoneSameName = planPathB({
      identity: identity({ email: 'new@example.com', name: 'Ada Other', city: 'Austin', phone: '(864) 555-0100' }),
      existing: [listing({ email: 'other@example.com', city: 'Dallas', phones: ['+1 864-555-0100'], firstName: 'Ada', lastName: 'Other' })],
      claimed: false,
      membership: true,
    })
    assert.deepEqual(byPhoneSameName, { action: 'attach', doctorId: 'doc-1', reason: 'phone' })
  })

  it('lets a brand-new doctor with a common surname go live', () => {
    const otherCity = planPathB({
      identity: identity({ email: 'new.smith@example.com', name: 'John Smith', city: 'Greenville', state: 'SC', phone: '+18645559999', customerId: 'cus_new' }),
      existing: [listing({ email: 'jane.smith@example.com', firstName: 'Jane', lastName: 'Smith', city: 'Charleston', state: 'SC', stripeCustomerId: 'cus_old', phones: ['+18435550000'] })],
      claimed: false,
      membership: true,
    })
    assert.deepEqual(otherCity, { action: 'create' })
    const otherState = planPathB({
      identity: identity({ email: 'new.smith@example.com', name: 'John Smith', city: '', state: 'TX', phone: null, customerId: 'cus_new' }),
      existing: [listing({ email: 'jane.smith@example.com', firstName: 'Jane', lastName: 'Smith', city: 'Greenville', state: 'SC', stripeCustomerId: 'cus_old' })],
      claimed: false,
      membership: true,
    })
    assert.deepEqual(otherState, { action: 'create' })
    const sameCityOtherState = planPathB({
      identity: identity({ email: 'new.smith@example.com', name: 'John Smith', city: 'Greenville', state: 'NC', phone: null, customerId: 'cus_new' }),
      existing: [listing({ email: 'jane.smith@example.com', firstName: 'Jane', lastName: 'Smith', city: 'Greenville', state: 'SC', stripeCustomerId: 'cus_old' })],
      claimed: false,
      membership: true,
    })
    assert.deepEqual(sameCityOtherState, { action: 'create' })
    const sameCity = planPathB({
      identity: identity({ email: 'new.smith@example.com', name: 'John Smith', city: 'Greenville', state: 'SC', phone: null, customerId: 'cus_new' }),
      existing: [listing({ email: 'jane.smith@example.com', firstName: 'Jane', lastName: 'Smith', city: 'Greenville', state: 'SC', stripeCustomerId: 'cus_old' })],
      claimed: false,
      membership: true,
    })
    assert.equal(sameCity.action, 'flag_duplicate')
  })

  it('does not report a reconcile link-only result as missing', () => {
    assert.deepEqual(reconcileIntakeReport('linked'), { missing: false, failed: false })
    assert.deepEqual(reconcileIntakeReport('flagged'), { missing: false, failed: false })
    assert.deepEqual(reconcileIntakeReport('review'), { missing: false, failed: false })
    assert.deepEqual(reconcileIntakeReport('ignored'), { missing: false, failed: false })
    assert.deepEqual(reconcileIntakeReport('go_live'), { missing: false, failed: false })
    assert.deepEqual(reconcileIntakeReport('created'), { missing: true, failed: false })
    assert.deepEqual(reconcileIntakeReport('failed'), { missing: true, failed: true })
  })

  it('does not alert on a signature failure once a later event was accepted', () => {
    const followed = decideWebhookHealth({
      now: '2026-11-16T12:00:00.000Z',
      lastEventAt: '2026-11-16T11:00:00.000Z',
      lastSignatureFailureAt: '2026-11-16T10:00:00.000Z',
      lastAlertAt: null,
      paidCheckoutsInWindow: 0,
    })
    assert.equal(followed.alert, false)
    assert.equal(followed.kind, null)
    const onlyFailure = decideWebhookHealth({
      now: '2026-11-16T12:00:00.000Z',
      lastEventAt: '2026-11-16T09:00:00.000Z',
      lastSignatureFailureAt: '2026-11-16T10:00:00.000Z',
      lastAlertAt: null,
      paidCheckoutsInWindow: 0,
    })
    assert.equal(onlyFailure.alert, true)
    assert.equal(onlyFailure.kind, 'signature')
    const html = webhookHealthEmailHtml({ reason: onlyFailure.reason || '', failedAt: '2026-11-16T10:00:00.000Z' })
    assert.match(html, /Failure time: 2026-11-16T10:00:00.000Z UTC/)
    assert.match(html, /https:\/\/www\.neurochiro\.co\/api\/webhooks\/stripe/)
    assert.equal(html.includes('https://neurochiro.co/'), false)
    assert.equal(html.toLowerCase().includes('patient'), false)
  })
})

describe('go-live concurrency and retries', () => {
  it('waits instead of creating a second doctor when a claim is not linked yet', () => {
    assert.deepEqual(resumeClaimPlan({ doctorId: null, claimExists: true, listings: [] }), { action: 'wait' })
    assert.deepEqual(resumeClaimPlan({ doctorId: 'doc-1', claimExists: true, listings: [] }), { action: 'use', doctorId: 'doc-1' })
    assert.deepEqual(resumeClaimPlan({ doctorId: null, claimExists: true, listings: [{ id: 'doc-2' }] }), { action: 'use', doctorId: 'doc-2' })
  })

  it('holds the welcome until the profile is ok, then flags it if retries are used up', () => {
    assert.equal(welcomeSendDecision({ profileOk: false, profileFailures: 1, welcomeOk: false }), 'wait_for_profile')
    assert.equal(welcomeSendDecision({ profileOk: true, profileFailures: 1, welcomeOk: false }), 'send')
    assert.equal(welcomeSendDecision({ profileOk: false, profileFailures: 3, welcomeOk: false }), 'send_and_flag')
    assert.equal(welcomeSendDecision({ profileOk: false, profileFailures: 4, welcomeOk: true }), 'skip_welcome_done')
  })

  it('retries failed steps and skips a welcome that already succeeded', () => {
    assert.deepEqual(retryPlanForDoctor([
      { step: 'profile', status: 'failed' },
      { step: 'welcome', status: 'ok' },
    ]), ['profile'])
    assert.deepEqual(retryPlanForDoctor([
      { step: 'profile', status: 'ok' },
      { step: 'welcome', status: 'failed' },
    ]), ['welcome'])
    assert.equal(retryPlanForDoctor([
      { step: 'profile', status: 'failed' },
      { step: 'welcome', status: 'skipped' },
    ])?.includes('welcome'), false)
  })

  it('records a webhook at the start and lets a failed event run again', () => {
    assert.equal(processedWebhookAction(null), 'run')
    assert.equal(processedWebhookAction({ status: 'processing' }), 'skip')
    assert.equal(processedWebhookAction({ status: 'completed' }), 'skip')
    assert.equal(processedWebhookAction({ status: null }), 'skip')
    assert.equal(processedWebhookAction({ status: 'failed' }), 'run')
  })

  it('does not treat an unsigned webhook as a signature failure', () => {
    assert.equal(signatureFailureIsActionable(null), false)
    assert.equal(signatureFailureIsActionable(''), false)
    assert.equal(signatureFailureIsActionable('t=1,v1=abc'), true)
  })

  it('emails Raymond only when reconciliation found a gap', () => {
    assert.equal(reconciliationLetter({ missing: [], failed: [] }), null)
    const letter = reconciliationLetter({ missing: ['ada@example.com'], failed: ['invoice failed'] })
    assert.equal(letter?.subject, 'Go-live reconciliation')
    assert.match(letter?.html || '', /https:\/\/neurochiro\.co\/admin\/go-live/)
    assert.equal((letter?.html || '').toLowerCase().includes('patient'), false)
  })
})

describe('setup nudges after go-live', () => {
  it('keeps Spotlight and IG Live off the day 1-4 nudges until the onboarding call', () => {
    const done = {
      ...emptyDone,
      activate_login: true,
      finish_profile: true,
      add_text_number: true,
    }
    assert.equal(nextNudge({ daysSinceLive: 2, done, sentKeys: [] }), null)
    assert.equal(nextBookingNudge({
      daysSinceLive: 2,
      onboardingCallCompleted: true,
      done: emptyDone,
      sentKeys: [],
    }), null)
    const after = nextBookingNudge({
      daysSinceLive: 7,
      onboardingCallCompleted: true,
      done: emptyDone,
      sentKeys: [],
    })
    assert.equal(after?.step, 'book_spotlight')
    assert.equal(nextBookingNudge({
      daysSinceLive: 8,
      onboardingCallCompleted: false,
      done: emptyDone,
      sentKeys: [],
    }), null)
    for (const step of ['activate_login', 'finish_profile', 'add_text_number'] as const) {
      const copy = nudgeCopy({ kind: 'setup', day: 1, step, key: 'setup:1:' + step }, {
        name: 'Lovelace',
        requestCount: 0,
        activateUrl: 'https://neurochiro.co/login',
      })
      assert.equal(copy.body.includes('calendly.com'), false)
      assert.equal(copy.body.toLowerCase().includes('patient'), false)
      assert.match(copy.body, /neurochiro\.co/)
    }
  })

  it('asks for a password when none is set and for a profile when the listing is minimum', () => {
    assert.equal(portalPasswordIsSet(null, false), false)
    assert.equal(portalPasswordIsSet({ encrypted_password: '' }), false)
    assert.equal(portalPasswordIsSet({ encrypted_password: 'hash' }), true)
    const progress = nudgeProgress({
      passwordSet: false,
      profilePublishMode: 'minimum',
      profilePercent: 90,
      hasPhoto: true,
      spotlightBooked: false,
      igLiveBooked: false,
      textNumber: true,
    })
    assert.equal(progress.activate_login, false)
    assert.equal(progress.finish_profile, false)
    const plan = nextNudge({ daysSinceLive: 1, done: progress, sentKeys: [] })
    assert.equal(plan?.step, 'activate_login')

    assert.equal(loginPasswordState(null), 'unknown')
    assert.equal(loginPasswordState({ data: null, error: { message: 'permission denied' } }), 'unknown')
    assert.equal(loginPasswordState({ data: false, error: null }), 'unset')
    assert.equal(loginPasswordState({ data: true, error: null }), 'set')
    const unknown = nudgeProgress({
      passwordSet: 'unknown',
      profilePublishMode: null,
      profilePercent: 0,
      hasPhoto: false,
      spotlightBooked: false,
      igLiveBooked: false,
      textNumber: true,
    })
    assert.equal(unknown.activate_login, true)
    assert.equal(nextNudge({ daysSinceLive: 1, done: unknown, sentKeys: [] })?.step, 'finish_profile')
  })

  it('builds the welcome from the listing after the profile step', () => {
    const mail = welcomeInputFromListing({
      email: 'ada@example.com',
      first_name: 'Ada',
      last_name: 'Lovelace',
      clinic_name: 'Harbor Nervous System',
      city: 'Greenville',
      county: '',
      paid_at: '2026-11-16T22:00:00.000Z',
    }, 'https://neurochiro.co/directory/ada-lovelace')
    assert.equal(mail.practiceName, 'Harbor Nervous System')
    assert.equal(mail.city, 'Greenville')
    assert.equal(WELCOME_REPLY_TO, 'drray@neurochirodirectory.com')
  })
})

describe('portal login from the go-live log', () => {
  it('shows create-portal whenever that step is not ok, and leaves other steps alone', () => {
    assert.equal(goLiveStepRetry('portal', undefined), 'portal')
    assert.equal(goLiveStepRetry('portal', 'skipped'), 'portal')
    assert.equal(goLiveStepRetry('portal', 'failed'), 'portal')
    assert.equal(goLiveStepRetry('portal', 'pending'), 'portal')
    assert.equal(goLiveStepRetry('portal', 'ok'), null)
    assert.equal(goLiveStepRetry('welcome', 'ok'), 'welcome')
    assert.equal(goLiveStepRetry('welcome', 'failed'), 'welcome')
    assert.equal(goLiveStepRetry('profile', 'failed'), 'force')
    assert.equal(goLiveStepRetry('profile', undefined), null)
    assert.equal(goLiveStepRetry('profile', 'skipped'), null)
    assert.equal(goLiveStepRetry('waitlist', 'ok'), null)
  })

  it('mints a recovery link for a full run and skips it for a portal-only retry', () => {
    assert.equal(portalRecoveryLinkWanted({ source: 'retry', only: ['portal'] }), false)
    assert.equal(portalRecoveryLinkWanted({ source: 'stripe' }), true)
    assert.equal(portalRecoveryLinkWanted({ source: 'admin' }), true)
    assert.equal(portalRecoveryLinkWanted({ source: 'retry', only: ['portal', 'welcome'] }), true)
    assert.equal(portalRecoveryLinkWanted({ source: 'retry', only: ['profile'] }), true)
    assert.equal(portalRecoveryLinkWanted({
      source: 'stripe',
      only: ['checkout', 'profile', 'portal', 'welcome', 'waitlist', 'instagram', 'summary'],
    }), true)
  })

  it('gives a new portal profile the same pro tier paid doctors already have', () => {
    assert.equal(profileTierForDoctor({ membershipTier: 'pro' }), 'pro')
    assert.equal(profileTierForDoctor({ membershipTier: 'growth' }), 'pro')
    assert.equal(profileTierForDoctor({ membershipTier: 'neuros' }), 'pro')
    assert.equal(profileTierForDoctor({ membershipTier: 'free', isFoundingMember: true }), 'pro')
    assert.equal(profileTierForDoctor({ membershipTier: 'free', neurosTier: 'neuros_founding' }), 'pro')
    assert.equal(profileTierForDoctor({ membershipTier: 'free', paidAt: '2026-11-15T00:00:00.000Z' }), 'pro')
    assert.equal(profileTierForDoctor({ membershipTier: 'free' }), 'free')
    assert.equal(profileTierForDoctor({ membershipTier: 'basic' }), 'basic')
    assert.equal(profileTierForDoctor({}), 'free')
  })
})
