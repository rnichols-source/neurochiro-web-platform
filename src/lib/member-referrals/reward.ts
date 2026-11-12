import {
  isStudentMembership,
  planMemberReward,
  referralBlock,
  referredMembershipQualifies,
  rewardIdempotencyKey,
  selectMembershipSubscription,
  type MemberSnapshot,
  type SubscriptionSnapshot,
} from './logic.ts'

export type RewardStatus = 'pending' | 'granted' | 'failed' | 'skipped'

export type RewardRow = {
  id: string
  referrerDoctorId: string
  referredDoctorId: string
  applicationId: string | null
  status: RewardStatus
  stripeReference: string | null
  error: string | null
}

export type ReferralCase = {
  applicationId: string
  applicationStatus: string
  referred: MemberSnapshot
  referrer: MemberSnapshot | null
  referredRole: string | null
  referredPriceId: string | null
  referredUnitAmount: number | null
  referredCurrency: string | null
  referrerSubscriptionId: string | null
}

export type StripeRewardPort = {
  listSubscriptions(customerId: string): Promise<SubscriptionSnapshot[]>
  credit(input: {
    customerId: string
    amount: number
    currency: string
    idempotencyKey: string
    referredDoctorId: string
  }): Promise<string>
  extend(input: {
    subscriptionId: string
    trialEnd: number
    idempotencyKey: string
    referredDoctorId: string
  }): Promise<string>
}

export type RewardStore = {
  findByReferred(referredDoctorId: string): Promise<RewardRow | null>
  insertPending(row: {
    referrerDoctorId: string
    referredDoctorId: string
    applicationId: string
    idempotencyKey: string
  }): Promise<RewardRow>
  markGranted(id: string, patch: {
    stripeAction: 'customer_balance' | 'period_extend'
    amount: number | null
    currency: string | null
    stripeCustomerId: string | null
    stripeSubscriptionId: string
    stripeReference: string
    periodEndBefore: string | null
    periodEndAfter: string | null
  }): Promise<void>
  markFailed(id: string, error: string): Promise<void>
  markSkipped(row: {
    referrerDoctorId: string
    referredDoctorId: string
    applicationId: string
    reason: string
    idempotencyKey: string
  }): Promise<void>
}

export type RewardResult = {
  status: 'granted' | 'already_granted' | 'skipped' | 'failed' | 'waiting'
  reason?: string
}

const PERMANENT = new Set(['self', 'same_practice', 'student', 'no_referrer'])

function errorText(error: unknown): string {
  if (error instanceof Error) return error.message.slice(0, 500)
  return 'Stripe could not apply the free month.'
}

export async function fulfillMemberReferral(input: {
  referralCase: ReferralCase
  invoicePaid: boolean
  subscriptionStatus: string | null
  studentPriceIds: string[]
  doctorPriceIds: string[]
  nowUnix: number
  stripe: StripeRewardPort
  store: RewardStore
}): Promise<RewardResult> {
  const { referralCase } = input
  const existing = await input.store.findByReferred(referralCase.referred.id)
  if (existing?.status === 'granted') return { status: 'already_granted' }
  if (existing?.status === 'skipped' && existing.error && PERMANENT.has(existing.error)) {
    return { status: 'skipped', reason: existing.error }
  }
  if (existing?.stripeReference && (existing.status === 'pending' || existing.status === 'failed')) {
    await input.store.markGranted(existing.id, {
      stripeAction: 'customer_balance',
      amount: null,
      currency: null,
      stripeCustomerId: referralCase.referrer?.stripeCustomerId || null,
      stripeSubscriptionId: referralCase.referrerSubscriptionId || '',
      stripeReference: existing.stripeReference,
      periodEndBefore: null,
      periodEndAfter: null,
    })
    return { status: 'already_granted' }
  }

  if (!referralCase.referrer) return { status: 'waiting', reason: 'no_referrer' }

  const block = referralBlock(referralCase.referrer, referralCase.referred)
  if (block) {
    await input.store.markSkipped({
      referrerDoctorId: referralCase.referrer.id,
      referredDoctorId: referralCase.referred.id,
      applicationId: referralCase.applicationId,
      reason: block,
      idempotencyKey: rewardIdempotencyKey(referralCase.referrer.id, referralCase.referred.id),
    })
    return { status: 'skipped', reason: block }
  }

  const studentPrice = isStudentMembership({
    role: referralCase.referredRole,
    currency: referralCase.referredCurrency,
    unitAmount: referralCase.referredUnitAmount,
    priceId: referralCase.referredPriceId,
    studentPriceIds: input.studentPriceIds,
  })
  if (studentPrice) {
    await input.store.markSkipped({
      referrerDoctorId: referralCase.referrer.id,
      referredDoctorId: referralCase.referred.id,
      applicationId: referralCase.applicationId,
      reason: 'student',
      idempotencyKey: rewardIdempotencyKey(referralCase.referrer.id, referralCase.referred.id),
    })
    return { status: 'skipped', reason: 'student' }
  }

  const qualified = referredMembershipQualifies({
    applicationStatus: referralCase.applicationStatus,
    subscriptionStatus: input.subscriptionStatus,
    invoicePaid: input.invoicePaid,
    role: referralCase.referredRole,
    studentPrice: false,
  })
  if (!qualified.ok) return { status: 'waiting', reason: qualified.reason }

  const customerId = referralCase.referrer.stripeCustomerId
  if (!customerId) {
    return finishFailure(input, existing, 'referrer_has_no_subscription')
  }

  let subscriptions: SubscriptionSnapshot[]
  try {
    subscriptions = await input.stripe.listSubscriptions(customerId)
  } catch (error) {
    return finishFailure(input, existing, errorText(error))
  }
  const membership = selectMembershipSubscription(subscriptions, referralCase.referrerSubscriptionId, input.doctorPriceIds)
  if (!membership) return finishFailure(input, existing, 'referrer_subscription_missing')

  const plan = planMemberReward(membership, input.nowUnix)
  if (!plan.ok) return finishFailure(input, existing, plan.reason)

  const key = rewardIdempotencyKey(referralCase.referrer.id, referralCase.referred.id)
  const row = existing && existing.status !== 'skipped'
    ? existing
    : await input.store.insertPending({
      referrerDoctorId: referralCase.referrer.id,
      referredDoctorId: referralCase.referred.id,
      applicationId: referralCase.applicationId,
      idempotencyKey: key,
    })
  if (row.status === 'granted') return { status: 'already_granted' }

  try {
    if (plan.action === 'credit') {
      const reference = await input.stripe.credit({
        customerId,
        amount: plan.amount,
        currency: plan.currency,
        idempotencyKey: key,
        referredDoctorId: referralCase.referred.id,
      })
      await input.store.markGranted(row.id, {
        stripeAction: 'customer_balance',
        amount: plan.amount,
        currency: plan.currency,
        stripeCustomerId: customerId,
        stripeSubscriptionId: plan.subscriptionId,
        stripeReference: reference,
        periodEndBefore: null,
        periodEndAfter: null,
      })
      return { status: 'granted' }
    }
    const reference = await input.stripe.extend({
      subscriptionId: plan.subscriptionId,
      trialEnd: plan.trialEnd,
      idempotencyKey: key,
      referredDoctorId: referralCase.referred.id,
    })
    await input.store.markGranted(row.id, {
      stripeAction: 'period_extend',
      amount: null,
      currency: membership.currency,
      stripeCustomerId: customerId,
      stripeSubscriptionId: plan.subscriptionId,
      stripeReference: reference,
      periodEndBefore: new Date(plan.from * 1000).toISOString(),
      periodEndAfter: new Date(plan.trialEnd * 1000).toISOString(),
    })
    return { status: 'granted' }
  } catch (error) {
    await input.store.markFailed(row.id, errorText(error))
    return { status: 'failed', reason: errorText(error) }
  }
}

async function finishFailure(
  input: {
    referralCase: ReferralCase
    store: RewardStore
  },
  existing: RewardRow | null,
  reason: string,
): Promise<RewardResult> {
  const referrerId = input.referralCase.referrer?.id
  if (!referrerId) return { status: 'failed', reason }
  const key = rewardIdempotencyKey(referrerId, input.referralCase.referred.id)
  const row = existing && existing.status !== 'skipped'
    ? existing
    : await input.store.insertPending({
      referrerDoctorId: referrerId,
      referredDoctorId: input.referralCase.referred.id,
      applicationId: input.referralCase.applicationId,
      idempotencyKey: key,
    })
  await input.store.markFailed(row.id, reason)
  return { status: 'failed', reason }
}
