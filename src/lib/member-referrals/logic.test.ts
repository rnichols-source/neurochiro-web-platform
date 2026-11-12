import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  FOUNDING_RATE_ENDS_AT,
  MONTH_EXTENSION_SECONDS,
  bannerCopy,
  chooseReferral,
  cleanReferrerName,
  foundingRateOpen,
  inviteMessage,
  isPublishedActiveMember,
  isStudentMembership,
  memberInviteUrl,
  normalizeRefSlug,
  persistedRef,
  planMemberReward,
  referralBlock,
  referredMembershipQualifies,
  rewardIdempotencyKey,
  selectMembershipSubscription,
  toSubscriptionSnapshot,
  withReferralQuery,
  type MemberSnapshot,
  type SubscriptionSnapshot,
} from './logic.ts'

function member(overrides: Partial<MemberSnapshot> = {}): MemberSnapshot {
  return {
    id: 'doc-1',
    userId: 'user-1',
    email: 'tyler@example.com',
    slug: 'dr-tyler-white',
    firstName: 'Tyler',
    lastName: 'White',
    clinicName: 'White Nervous System',
    phone: '8645550100',
    address: '10 Main Street',
    verificationStatus: 'verified',
    isApproved: true,
    isFoundingMember: true,
    membershipTier: 'pro',
    paidAt: '2026-01-01T00:00:00.000Z',
    stripeCustomerId: 'cus_tyler',
    ...overrides,
  }
}

function subscription(overrides: Partial<SubscriptionSnapshot> = {}): SubscriptionSnapshot {
  return {
    id: 'sub_1',
    status: 'active',
    metadataType: 'doctor_membership',
    metadataRole: 'doctor',
    priceId: 'price_usd_monthly',
    unitAmount: 9900,
    currency: 'usd',
    interval: 'month',
    quantity: 1,
    currentPeriodEnd: 1_800_000_000,
    trialEnd: null,
    ...overrides,
  }
}

describe('referral slug', () => {
  it('keeps a profile slug and pulls ref out of a pasted link', () => {
    assert.equal(normalizeRefSlug(' dr-tyler-white '), 'dr-tyler-white')
    assert.equal(normalizeRefSlug('https://neurochiro.co/get-started?ref=dr-tyler-white'), 'dr-tyler-white')
    assert.equal(normalizeRefSlug('/doctor/apply?step=2&ref=dr-tyler-white'), 'dr-tyler-white')
  })

  it('ignores empty, numeric, and oversized values', () => {
    assert.equal(normalizeRefSlug(''), null)
    assert.equal(normalizeRefSlug('12345'), null)
    assert.equal(normalizeRefSlug('no spaces'), null)
    assert.equal(normalizeRefSlug('a'.repeat(81)), null)
    assert.equal(normalizeRefSlug(null), null)
  })

  it('keeps the ref from the link, the cookie, or the saved draft', () => {
    assert.equal(persistedRef({ query: 'dr-tyler-white', cookie: 'other', stored: 'saved' }), 'dr-tyler-white')
    assert.equal(persistedRef({ query: '', cookie: 'dr-tyler-white', stored: null }), 'dr-tyler-white')
    assert.equal(persistedRef({ query: '!!!', cookie: '', stored: 'dr-ada' }), 'dr-ada')
    assert.equal(persistedRef({ query: null, cookie: null, stored: null }), null)
  })

  it('builds the public invite link and keeps an existing ref on a path', () => {
    assert.equal(memberInviteUrl('dr-tyler-white'), 'https://neurochiro.co/get-started?ref=dr-tyler-white')
    assert.equal(withReferralQuery('/doctor/apply?step=2', 'dr-tyler-white'), '/doctor/apply?step=2&ref=dr-tyler-white')
    assert.equal(withReferralQuery('/doctor/apply?ref=kept', 'other'), '/doctor/apply?ref=kept')
    assert.equal(withReferralQuery('/get-started', ''), '/get-started')
  })
})

describe('who the link belongs to', () => {
  it('accepts a published member and ignores a hidden or unclaimed listing', () => {
    assert.equal(isPublishedActiveMember(member()), true)
    assert.equal(isPublishedActiveMember(member({ userId: null, isApproved: true })), false)
    assert.equal(isPublishedActiveMember(member({
      verificationStatus: 'hidden',
      isApproved: false,
      isFoundingMember: false,
      membershipTier: 'free',
      paidAt: null,
    })), false)
  })

  it('prefers a resolved link over a typed name and keeps a saved member when the new link is unknown', () => {
    assert.deepEqual(chooseReferral({
      linkMemberId: 'doc-link',
      linkSlug: 'dr-tyler-white',
      storedMemberId: 'doc-stored',
      storedSlug: 'dr-stored',
      typedName: 'Dr. Someone Else',
      nameMemberId: 'doc-name',
    }), {
      doctorId: 'doc-link',
      slug: 'dr-tyler-white',
      name: 'Dr. Someone Else',
      source: 'link',
    })
    assert.equal(chooseReferral({
      linkMemberId: null,
      linkSlug: null,
      storedMemberId: 'doc-stored',
      storedSlug: 'dr-stored',
      typedName: '',
      nameMemberId: null,
    }).doctorId, 'doc-stored')
    assert.equal(chooseReferral({
      linkMemberId: null,
      linkSlug: null,
      storedMemberId: null,
      storedSlug: null,
      typedName: 'Ada Lovelace',
      nameMemberId: 'doc-ada',
    }).source, 'name')
  })

  it('does not treat a blank save as clearing the referral', () => {
    const choice = chooseReferral({
      linkMemberId: null,
      linkSlug: null,
      storedMemberId: 'doc-stored',
      storedSlug: 'dr-stored',
      typedName: null,
      nameMemberId: null,
    })
    assert.equal(choice.doctorId, 'doc-stored')
    assert.equal(choice.slug, 'dr-stored')
  })

  it('keeps an unmatched name without inventing a member', () => {
    const choice = chooseReferral({
      linkMemberId: null,
      linkSlug: null,
      storedMemberId: null,
      storedSlug: null,
      typedName: '  Pat  ',
      nameMemberId: null,
    })
    assert.equal(choice.doctorId, null)
    assert.equal(choice.name, 'Pat')
    assert.equal(cleanReferrerName('  '), null)
  })
})

describe('who does not earn a month', () => {
  it('blocks a doctor from referring themselves or another office of the same practice', () => {
    const referrer = member()
    assert.equal(referralBlock(referrer, member()), 'self')
    assert.equal(referralBlock(referrer, member({
      id: 'office-2',
      userId: 'user-2',
      email: 'other@example.com',
      clinicName: 'Other Clinic',
      phone: '2125550199',
      address: '500 Broadway',
      stripeCustomerId: 'cus_other',
    })), null)
    assert.equal(referralBlock(referrer, member({
      id: 'office-2',
      userId: 'user-2',
      email: 'front@example.com',
      slug: 'white-west',
    })), 'same_practice')
    assert.equal(referralBlock(referrer, member({
      id: 'office-2',
      userId: 'user-2',
      email: 'front@example.com',
      phone: '111',
      address: '99 Other Road',
      stripeCustomerId: 'cus_other',
    })), null)
    assert.equal(referralBlock(referrer, member({
      id: 'office-2',
      userId: 'user-1',
      email: 'other@example.com',
      clinicName: 'Different',
      phone: '111',
      address: '99 Other Road',
      stripeCustomerId: 'cus_other',
    })), 'self')
  })

  it('does not reward a student price or an unpaid application', () => {
    assert.equal(isStudentMembership({ currency: 'usd', unitAmount: 3300 }), true)
    assert.equal(isStudentMembership({ currency: 'usd', unitAmount: 33300 }), true)
    assert.equal(isStudentMembership({ currency: 'usd', unitAmount: 9900 }), false)
    assert.equal(isStudentMembership({ currency: 'cad', unitAmount: 13900 }), false)
    assert.equal(isStudentMembership({ priceId: 'price_student', studentPriceIds: ['price_student'] }), true)
    assert.deepEqual(referredMembershipQualifies({
      applicationStatus: 'under_review',
      subscriptionStatus: null,
      invoicePaid: false,
      role: 'doctor',
      studentPrice: false,
    }), { ok: false, reason: 'not_approved' })
    assert.deepEqual(referredMembershipQualifies({
      applicationStatus: 'needs_action',
      subscriptionStatus: 'incomplete',
      invoicePaid: false,
      role: 'doctor',
      studentPrice: false,
    }), { ok: false, reason: 'not_paid' })
    assert.deepEqual(referredMembershipQualifies({
      applicationStatus: 'approved',
      subscriptionStatus: 'active',
      invoicePaid: true,
      role: 'student',
      studentPrice: false,
    }), { ok: false, reason: 'student' })
    assert.equal(referredMembershipQualifies({
      applicationStatus: 'needs_action',
      subscriptionStatus: 'active',
      invoicePaid: true,
      role: 'doctor',
      studentPrice: false,
    }).ok, true)
  })
})

describe('the free month matches the referrer price', () => {
  const now = 1_700_000_000

  it('credits one month at the subscription price, including a founding rate', () => {
    assert.deepEqual(planMemberReward(subscription({ unitAmount: 4900, currency: 'usd' }), now), {
      ok: true,
      action: 'credit',
      amount: 4900,
      currency: 'usd',
      subscriptionId: 'sub_1',
    })
    assert.deepEqual(planMemberReward(subscription({ unitAmount: 13900, currency: 'cad' }), now), {
      ok: true,
      action: 'credit',
      amount: 13900,
      currency: 'cad',
      subscriptionId: 'sub_1',
    })
  })

  it('moves an annual renewal out 30 days and stacks on a later trial end', () => {
    const annual = planMemberReward(subscription({
      interval: 'year',
      unitAmount: 99000,
      currentPeriodEnd: now + 1000,
      trialEnd: null,
    }), now)
    assert.equal(annual.ok, true)
    if (annual.ok && annual.action === 'extend') {
      assert.equal(annual.from, now + 1000)
      assert.equal(annual.trialEnd, now + 1000 + MONTH_EXTENSION_SECONDS)
    }
    const stacked = planMemberReward(subscription({
      interval: 'year',
      unitAmount: 29700,
      currentPeriodEnd: now + 1000,
      trialEnd: now + 5000,
    }), now)
    assert.equal(stacked.ok, true)
    if (stacked.ok && stacked.action === 'extend') {
      assert.equal(stacked.from, now + 5000)
      assert.equal(stacked.trialEnd - stacked.from, MONTH_EXTENSION_SECONDS)
    }
  })

  it('picks the membership subscription and ignores a student or synapse add-on', () => {
    const chosen = selectMembershipSubscription([
      subscription({ id: 'sub_synapse', metadataType: 'synapse_seat', priceId: 'price_synapse', unitAmount: 29700 }),
      subscription({ id: 'sub_member', metadataType: null, metadataRole: null, priceId: 'price_cad', unitAmount: 13900, currency: 'cad' }),
    ], null, ['price_cad'])
    assert.equal(chosen?.id, 'sub_member')
    assert.equal(selectMembershipSubscription([
      subscription({ id: 'sub_student', metadataRole: 'student', priceId: 'price_student', unitAmount: 3300 }),
    ], null, []), null)
  })

  it('reads the price and period end from the subscription item', () => {
    const snapshot = toSubscriptionSnapshot({
      id: 'sub_annual',
      status: 'active',
      metadata: { type: 'doctor_membership', role: 'doctor' },
      trial_end: null,
      items: {
        data: [{
          quantity: 1,
          current_period_end: 1_900_000_000,
          price: { id: 'price_gbp', unit_amount: 79000, currency: 'gbp', recurring: { interval: 'year' } },
        }],
      },
    })
    assert.equal(snapshot?.unitAmount, 79000)
    assert.equal(snapshot?.currency, 'gbp')
    assert.equal(snapshot?.interval, 'year')
    assert.equal(snapshot?.currentPeriodEnd, 1_900_000_000)
  })

  it('uses one idempotency key per referrer and referred doctor', () => {
    assert.equal(rewardIdempotencyKey('a', 'b'), rewardIdempotencyKey('a', 'b'))
    assert.notEqual(rewardIdempotencyKey('a', 'b'), rewardIdempotencyKey('a', 'c'))
  })
})

describe('invite copy', () => {
  it('mentions the founding rate only before December 1', () => {
    const before = new Date(Date.parse(FOUNDING_RATE_ENDS_AT) - 1000)
    const after = new Date(Date.parse(FOUNDING_RATE_ENDS_AT) + 1000)
    assert.equal(foundingRateOpen(before), true)
    assert.equal(foundingRateOpen(after), false)
    assert.match(inviteMessage('https://neurochiro.co/get-started?ref=dr-tyler-white', before), /December 1/)
    assert.equal(inviteMessage('https://neurochiro.co/get-started?ref=dr-tyler-white', after).includes('December 1'), false)
    assert.match(bannerCopy(before).body, /\$199\/month/)
    assert.match(bannerCopy(after).body, /\$199\/month/)
    assert.equal(bannerCopy(after).body.includes('December 1'), false)
  })
})
