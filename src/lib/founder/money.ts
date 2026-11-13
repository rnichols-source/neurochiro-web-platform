import 'server-only'

import { unstable_cache } from 'next/cache'
import { cache } from 'react'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { formatMoney } from './format'
import { isNeuroChiroProduct, type ProductBits } from './mrr-calc'
import { loadMrrBaselineInputs, loadNeuroChiroMrr, type MrrSnapshot } from './mrr'

export type PlanRow = { label: string; n: number }
export type CurrencyAmount = { currency: string; amount: number }
export type DoctorBilling = {
  stripeOk: boolean
  mrrUsd: number | null
  mrrOther: CurrencyAmount[]
  paying: number | null
  payingCustomers: number | null
  plans: PlanRow[]
  segments: MrrSnapshot['segments']
  rateDate: string | null
  churn30: number | null
  pastDue: number | null
  pastDueUsd: number | null
  trialing: number | null
  trialingUsd: number | null
  scheduled: number | null
  scheduledUsd: number | null
  refunds30: number | null
  disputesOpen: number | null
  disputeAmount: string | null
}

function isNeuroChiroSubscription(sub: Stripe.Subscription, catalog: Record<string, ProductBits>): boolean {
  const recurring = (sub.items?.data || []).filter((item) => item.price?.recurring?.interval)
  if (!recurring.length) return false
  return recurring.some((item) => {
    const product = item.price?.product
    const id = typeof product === 'string' ? product : product?.id || ''
    const known = id ? catalog[id] : undefined
    const embedded = product && typeof product === 'object' && !('deleted' in product && product.deleted) ? product : null
    return isNeuroChiroProduct({
      id,
      name: embedded?.name || known?.name || '',
      metadata: embedded?.metadata || known?.metadata || {},
    })
  })
}

async function listSubscriptions(status: Stripe.SubscriptionListParams['status']): Promise<Stripe.Subscription[]> {
  const out: Stripe.Subscription[] = []
  for await (const sub of stripe.subscriptions.list({ status, limit: 100 })) out.push(sub)
  return out
}

function emptyBilling(): DoctorBilling {
  return {
    stripeOk: false,
    mrrUsd: null,
    mrrOther: [],
    paying: null,
    payingCustomers: null,
    plans: [],
    segments: [],
    rateDate: null,
    churn30: null,
    pastDue: null,
    pastDueUsd: null,
    trialing: null,
    trialingUsd: null,
    scheduled: null,
    scheduledUsd: null,
    refunds30: null,
    disputesOpen: null,
    disputeAmount: null,
  }
}

async function loadDoctorBillingFresh(): Promise<DoctorBilling> {
  const empty = emptyBilling()
  try {
    const since = Math.floor((Date.now() - 30 * 86_400_000) / 1000)
    const [snap, canceled, inputs] = await Promise.all([
      loadNeuroChiroMrr(),
      listSubscriptions('canceled'),
      loadMrrBaselineInputs(),
    ])
    let churn = 0
    for (const sub of canceled) {
      if ((sub.canceled_at || 0) >= since && isNeuroChiroSubscription(sub, inputs.catalog)) churn += 1
    }
    let refunds = 0
    for await (const refund of stripe.refunds.list({ created: { gte: since }, limit: 100 })) {
      if (refund.status !== 'failed') refunds += 1
    }
    let disputes = 0
    let disputeMinor = 0
    let disputeCurrency = 'usd'
    for await (const dispute of stripe.disputes.list({ limit: 100 })) {
      const open = ['needs_response', 'warning_needs_response', 'under_review', 'warning_under_review'].includes(dispute.status)
      if (!open) continue
      disputes += 1
      disputeMinor += dispute.amount || 0
      disputeCurrency = dispute.currency || disputeCurrency
    }
    return {
      stripeOk: snap.ok,
      mrrUsd: snap.ok ? snap.mrrUsd : null,
      mrrOther: [],
      paying: snap.ok ? snap.payingSubscriptions : null,
      payingCustomers: snap.ok ? snap.payingCustomers : null,
      plans: snap.ok ? snap.segments.map((segment) => ({ label: segment.label, n: segment.subscriptions })) : [],
      segments: snap.ok ? snap.segments : [],
      rateDate: snap.rateDate,
      churn30: churn,
      pastDue: snap.ok ? snap.pastDue.count : null,
      pastDueUsd: snap.ok ? snap.pastDue.amountUsd : null,
      trialing: snap.ok ? snap.trialing.count : null,
      trialingUsd: snap.ok ? snap.trialing.amountUsd : null,
      scheduled: snap.ok ? snap.scheduled.count : null,
      scheduledUsd: snap.ok ? snap.scheduled.amountUsd : null,
      refunds30: refunds,
      disputesOpen: disputes,
      disputeAmount: disputes ? formatMoney(disputeMinor / 100, disputeCurrency.toUpperCase()) : null,
    }
  } catch (err) {
    console.error('founder money', err instanceof Error ? err.name : 'error')
    return empty
  }
}

const loadDoctorBillingCached = unstable_cache(loadDoctorBillingFresh, ['founder-doctor-billing-v2'], { revalidate: 180 })

/** Stripe membership totals. Cached 3 minutes so a page click never waits on Stripe after the first read. */
export const loadDoctorBilling = cache(loadDoctorBillingCached)
