import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { fulfillMemberReferral, type ReferralCase, type RewardRow, type RewardStore, type StripeRewardPort } from './reward.ts'
import type { MemberSnapshot } from './logic.ts'

function person(overrides: Partial<MemberSnapshot> = {}): MemberSnapshot {
  return {
    id: 'referred',
    userId: 'user-referred',
    email: 'ada@example.com',
    slug: 'dr-ada-lovelace',
    firstName: 'Ada',
    lastName: 'Lovelace',
    clinicName: 'Ada Chiropractic',
    phone: '8645550199',
    address: '2 Office Road',
    verificationStatus: 'verified',
    isApproved: true,
    isFoundingMember: false,
    membershipTier: 'pro',
    paidAt: '2026-11-12T00:00:00.000Z',
    stripeCustomerId: 'cus_ada',
    ...overrides,
  }
}

function referralCase(overrides: Partial<ReferralCase> = {}): ReferralCase {
  return {
    applicationId: 'app-1',
    applicationStatus: 'approved',
    referred: person(),
    referrer: person({
      id: 'referrer',
      userId: 'user-referrer',
      email: 'tyler@example.com',
      slug: 'dr-tyler-white',
      firstName: 'Tyler',
      lastName: 'White',
      clinicName: 'White Nervous System',
      phone: '8645550100',
      address: '10 Main Street',
      stripeCustomerId: 'cus_tyler',
    }),
    referredRole: 'doctor',
    referredPriceId: 'price_usd_monthly',
    referredUnitAmount: 9900,
    referredCurrency: 'usd',
    referrerSubscriptionId: 'sub_tyler',
    ...overrides,
  }
}

function harness(plan: { unitAmount: number; currency: string; interval: 'month' | 'year'; periodEnd?: number; trialEnd?: number | null }) {
  const credits: string[] = []
  const extensions: string[] = []
  let failCredit = false
  const rows = new Map<string, RewardRow>()
  const store: RewardStore = {
    async findByReferred(id) {
      return rows.get(id) || null
    },
    async insertPending(row) {
      const existing = rows.get(row.referredDoctorId)
      if (existing) return existing
      const saved: RewardRow = {
        id: `reward-${row.referredDoctorId}`,
        referrerDoctorId: row.referrerDoctorId,
        referredDoctorId: row.referredDoctorId,
        applicationId: row.applicationId,
        status: 'pending',
        stripeReference: null,
        error: null,
      }
      rows.set(row.referredDoctorId, saved)
      return saved
    },
    async markGranted(id, patch) {
      for (const row of rows.values()) {
        if (row.id !== id) continue
        row.status = 'granted'
        row.stripeReference = patch.stripeReference
        row.error = null
      }
    },
    async markFailed(id, error) {
      for (const row of rows.values()) {
        if (row.id !== id) continue
        row.status = 'failed'
        row.error = error
      }
    },
    async markSkipped(row) {
      rows.set(row.referredDoctorId, {
        id: `reward-${row.referredDoctorId}`,
        referrerDoctorId: row.referrerDoctorId,
        referredDoctorId: row.referredDoctorId,
        applicationId: row.applicationId,
        status: 'skipped',
        stripeReference: null,
        error: row.reason,
      })
    },
  }
  const stripe: StripeRewardPort = {
    async listSubscriptions() {
      return [{
        id: 'sub_tyler',
        status: 'active',
        metadataType: 'doctor_membership',
        metadataRole: 'doctor',
        priceId: 'price_member',
        unitAmount: plan.unitAmount,
        currency: plan.currency,
        interval: plan.interval,
        quantity: 1,
        currentPeriodEnd: plan.periodEnd ?? 1_800_000_000,
        trialEnd: plan.trialEnd ?? null,
      }]
    },
    async credit(input) {
      credits.push(`${input.idempotencyKey}:${input.amount}:${input.currency}`)
      if (failCredit) throw new Error('stripe down')
      return 'cbtx_1'
    },
    async extend(input) {
      extensions.push(`${input.idempotencyKey}:${input.trialEnd}`)
      return 'sub_tyler'
    },
  }
  return {
    credits,
    extensions,
    rows,
    store,
    stripe,
    setFailCredit(value: boolean) { failCredit = value },
  }
}

describe('referral reward fulfillment', () => {
  it('credits the referrer once at their own monthly price', async () => {
    const tools = harness({ unitAmount: 4900, currency: 'usd', interval: 'month' })
    const first = await fulfillMemberReferral({
      referralCase: referralCase(),
      invoicePaid: true,
      subscriptionStatus: 'active',
      studentPriceIds: ['price_student'],
      doctorPriceIds: ['price_member'],
      nowUnix: 1_700_000_000,
      stripe: tools.stripe,
      store: tools.store,
    })
    const second = await fulfillMemberReferral({
      referralCase: referralCase(),
      invoicePaid: true,
      subscriptionStatus: 'active',
      studentPriceIds: ['price_student'],
      doctorPriceIds: ['price_member'],
      nowUnix: 1_700_000_000,
      stripe: tools.stripe,
      store: tools.store,
    })
    assert.equal(first.status, 'granted')
    assert.equal(second.status, 'already_granted')
    assert.deepEqual(tools.credits, ['member-referral:referrer:referred:4900:usd'])
    assert.equal(tools.rows.get('referred')?.status, 'granted')
  })

  it('records a Stripe failure and can retry it', async () => {
    const tools = harness({ unitAmount: 9900, currency: 'usd', interval: 'month' })
    tools.setFailCredit(true)
    const failed = await fulfillMemberReferral({
      referralCase: referralCase(),
      invoicePaid: true,
      subscriptionStatus: 'active',
      studentPriceIds: [],
      doctorPriceIds: ['price_member'],
      nowUnix: 1_700_000_000,
      stripe: tools.stripe,
      store: tools.store,
    })
    assert.equal(failed.status, 'failed')
    assert.equal(tools.rows.get('referred')?.status, 'failed')
    tools.setFailCredit(false)
    const retried = await fulfillMemberReferral({
      referralCase: referralCase(),
      invoicePaid: true,
      subscriptionStatus: 'active',
      studentPriceIds: [],
      doctorPriceIds: ['price_member'],
      nowUnix: 1_700_000_000,
      stripe: tools.stripe,
      store: tools.store,
    })
    assert.equal(retried.status, 'granted')
    assert.equal(tools.credits.length, 2)
  })

  it('does not pay a self-referral or a student membership', async () => {
    const tools = harness({ unitAmount: 9900, currency: 'usd', interval: 'month' })
    const self = await fulfillMemberReferral({
      referralCase: referralCase({
        referred: person({ id: 'referrer', userId: 'user-referrer', email: 'tyler@example.com' }),
      }),
      invoicePaid: true,
      subscriptionStatus: 'active',
      studentPriceIds: [],
      doctorPriceIds: ['price_member'],
      nowUnix: 1_700_000_000,
      stripe: tools.stripe,
      store: tools.store,
    })
    assert.equal(self.status, 'skipped')
    assert.equal(self.reason, 'self')
    const student = await fulfillMemberReferral({
      referralCase: referralCase({
        referred: person({ id: 'student-doc' }),
        referredRole: 'student',
        referredPriceId: 'price_student',
        referredUnitAmount: 3300,
      }),
      invoicePaid: true,
      subscriptionStatus: 'active',
      studentPriceIds: ['price_student'],
      doctorPriceIds: ['price_member'],
      nowUnix: 1_700_000_000,
      stripe: tools.stripe,
      store: tools.store,
    })
    assert.equal(student.status, 'skipped')
    assert.equal(tools.credits.length, 0)
  })

  it('waits until the referred doctor is approved and paid', async () => {
    const tools = harness({ unitAmount: 9900, currency: 'usd', interval: 'month' })
    const waiting = await fulfillMemberReferral({
      referralCase: referralCase({ applicationStatus: 'under_review' }),
      invoicePaid: false,
      subscriptionStatus: null,
      studentPriceIds: [],
      doctorPriceIds: ['price_member'],
      nowUnix: 1_700_000_000,
      stripe: tools.stripe,
      store: tools.store,
    })
    assert.equal(waiting.status, 'waiting')
    assert.equal(waiting.reason, 'not_approved')
    assert.equal(tools.rows.size, 0)
    assert.equal(tools.credits.length, 0)
  })

  it('extends an annual membership by 30 days without a second call', async () => {
    const tools = harness({ unitAmount: 139000, currency: 'cad', interval: 'year', periodEnd: 1_800_000_000 })
    const result = await fulfillMemberReferral({
      referralCase: referralCase(),
      invoicePaid: true,
      subscriptionStatus: 'active',
      studentPriceIds: [],
      doctorPriceIds: ['price_member'],
      nowUnix: 1_700_000_000,
      stripe: tools.stripe,
      store: tools.store,
    })
    await fulfillMemberReferral({
      referralCase: referralCase(),
      invoicePaid: true,
      subscriptionStatus: 'active',
      studentPriceIds: [],
      doctorPriceIds: ['price_member'],
      nowUnix: 1_700_000_000,
      stripe: tools.stripe,
      store: tools.store,
    })
    assert.equal(result.status, 'granted')
    assert.equal(tools.extensions.length, 1)
    assert.match(tools.extensions[0], /^member-referral:referrer:referred:/)
    assert.equal(tools.credits.length, 0)
  })
})
