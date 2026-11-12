import 'server-only'

import { stripe } from '@/lib/stripe'
import { doctorPriceIds, studentPriceIds } from './catalog.ts'
import { loadReferralCaseByApplication, loadReferralCaseByCustomer, rewardStore } from './db.ts'
import { isStudentMembership, toSubscriptionSnapshot, type SubscriptionSnapshot } from './logic.ts'
import { fulfillMemberReferral, type ReferralCase } from './reward.ts'

function readId(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'string' && id.length > 0 ? id : null
  }
  return null
}

async function referredPrice(referralCase: ReferralCase): Promise<{ status: string | null; student: boolean }> {
  const customerId = referralCase.referred.stripeCustomerId
  if (!customerId) {
    return {
      status: null,
      student: isStudentMembership({
        role: referralCase.referredRole,
        priceId: referralCase.referredPriceId,
        currency: referralCase.referredCurrency,
        unitAmount: referralCase.referredUnitAmount,
        studentPriceIds: studentPriceIds(),
      }),
    }
  }
  try {
    const listed = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 10 })
    const snapshots = listed.data
      .map((item) => toSubscriptionSnapshot(item as unknown as Parameters<typeof toSubscriptionSnapshot>[0]))
      .filter((item): item is SubscriptionSnapshot => !!item)
    const active = snapshots.find((item) => item.status === 'active')
      || snapshots.find((item) => item.metadataType === 'doctor_membership')
    if (!active) {
      return { status: snapshots[0]?.status || null, student: false }
    }
    referralCase.referredPriceId = active.priceId || referralCase.referredPriceId
    referralCase.referredUnitAmount = active.unitAmount
    referralCase.referredCurrency = active.currency
    referralCase.referredRole = active.metadataRole || referralCase.referredRole
    return {
      status: active.status,
      student: isStudentMembership({
        role: active.metadataRole,
        priceId: active.priceId,
        currency: active.currency,
        unitAmount: active.unitAmount,
        studentPriceIds: studentPriceIds(),
      }),
    }
  } catch (error) {
    console.error('[member-referral] referred subscription lookup failed', error instanceof Error ? error.name : 'error')
    return { status: null, student: false }
  }
}

export async function settleMemberReferral(input: {
  applicationId?: string
  customerId?: string
  invoicePaid: boolean
}): Promise<void> {
  try {
    const referralCase = input.applicationId
      ? await loadReferralCaseByApplication(input.applicationId)
      : input.customerId
        ? await loadReferralCaseByCustomer(input.customerId)
        : null
    if (!referralCase?.referrer) return
    const price = await referredPrice(referralCase)
    if (price.student) {
      referralCase.referredRole = 'student'
    }
    const result = await fulfillMemberReferral({
      referralCase,
      invoicePaid: input.invoicePaid || price.status === 'active',
      subscriptionStatus: price.status,
      studentPriceIds: studentPriceIds(),
      doctorPriceIds: doctorPriceIds(),
      nowUnix: Math.floor(Date.now() / 1000),
      store: rewardStore(),
      stripe: {
        async listSubscriptions(customerId) {
          const listed = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 20 })
          return listed.data
            .map((item) => toSubscriptionSnapshot(item as unknown as Parameters<typeof toSubscriptionSnapshot>[0]))
            .filter((item): item is SubscriptionSnapshot => !!item)
        },
        async credit(credit) {
          const existing = await stripe.customers.listBalanceTransactions(credit.customerId, { limit: 100 })
          const prior = existing.data.find((item) => item.metadata?.referred_doctor_id === credit.referredDoctorId && item.metadata?.source === 'member_referral')
          if (prior) return prior.id
          const transaction = await stripe.customers.createBalanceTransaction(credit.customerId, {
            amount: -Math.abs(credit.amount),
            currency: credit.currency,
            description: 'NeuroChiro referral: one free month',
            metadata: {
              source: 'member_referral',
              referred_doctor_id: credit.referredDoctorId,
            },
          }, { idempotencyKey: credit.idempotencyKey })
          return transaction.id
        },
        async extend(extension) {
          const current = await stripe.subscriptions.retrieve(extension.subscriptionId)
          const already = (current.metadata?.nc_referrals || '').split(',').includes(extension.referredDoctorId)
          if (already) return current.id
          const referrals = [current.metadata?.nc_referrals, extension.referredDoctorId].filter(Boolean).join(',').slice(0, 500)
          const updated = await stripe.subscriptions.update(extension.subscriptionId, {
            trial_end: extension.trialEnd,
            proration_behavior: 'none',
            metadata: {
              ...(current.metadata || {}),
              nc_referrals: referrals,
            },
          }, { idempotencyKey: extension.idempotencyKey })
          return updated.id
        },
      },
    })
    if (result.status === 'failed') {
      console.error('[member-referral] reward not applied', result.reason || 'failed')
    }
  } catch (error) {
    console.error('[member-referral] reward failed', error instanceof Error ? error.name : 'error')
  }
}

export function customerIdFromInvoice(invoice: { customer?: unknown }): string | null {
  return readId(invoice.customer)
}
