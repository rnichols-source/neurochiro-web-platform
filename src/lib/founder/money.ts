import 'server-only'

import { unstable_cache } from 'next/cache'
import { cache } from 'react'
import type Stripe from 'stripe'
import { subscriptionMonthlyByCurrency } from '@/lib/admin/metrics'
import { stripe } from '@/lib/stripe'
import { formatMoney } from './format'
import { isDoctorMembershipPrice, type MembershipPrice } from './membership-price'

export type PlanRow = { label: string; n: number }
export type CurrencyAmount = { currency: string; amount: number }
export type DoctorBilling = {
  stripeOk: boolean
  mrrUsd: number | null
  mrrOther: CurrencyAmount[]
  paying: number | null
  plans: PlanRow[]
  churn30: number | null
  pastDue: number | null
  refunds30: number | null
  disputesOpen: number | null
  disputeAmount: string | null
}

const ZERO_DECIMAL = new Set(['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf'])

function majorUnits(minor: number, currency: string): number {
  const divisor = ZERO_DECIMAL.has(currency.toLowerCase()) ? 1 : 100
  return Math.round(minor) / divisor
}

function priceShape(price: Stripe.Price | null | undefined): MembershipPrice | null {
  if (!price) return null
  return {
    id: price.id,
    currency: price.currency || null,
    unitAmount: price.unit_amount,
    interval: price.recurring?.interval || null,
  }
}

function isDoctorSubscription(sub: Stripe.Subscription): boolean {
  const recurring = (sub.items?.data || []).filter((item) => item.price?.recurring?.interval)
  if (!recurring.length) return false
  return recurring.every((item) => {
    const shape = priceShape(item.price)
    return shape ? isDoctorMembershipPrice(shape) : false
  })
}

function customerId(customer: Stripe.Subscription['customer']): string | null {
  if (typeof customer === 'string') return customer
  if (customer && typeof customer === 'object' && 'id' in customer && !('deleted' in customer && customer.deleted)) return customer.id
  return null
}

async function listSubscriptions(status: Stripe.SubscriptionListParams['status']): Promise<Stripe.Subscription[]> {
  const out: Stripe.Subscription[] = []
  for await (const sub of stripe.subscriptions.list({ status, limit: 100 })) out.push(sub)
  return out
}

function planLabel(sub: Stripe.Subscription): string {
  const item = sub.items?.data?.[0]
  const price = item?.price
  const recurring = price?.recurring
  if (!price || !recurring?.interval) return 'Other'
  const major = ((price.unit_amount || 0) / 100)
  const money = formatMoney(major, (price.currency || 'usd').toUpperCase())
  const count = recurring.interval_count || 1
  const every = count === 1 ? recurring.interval : `${count} ${recurring.interval}s`
  return `${money} / ${every}`
}

async function loadDoctorBillingFresh(): Promise<DoctorBilling> {
  const empty: DoctorBilling = {
    stripeOk: false,
    mrrUsd: null,
    mrrOther: [],
    paying: null,
    plans: [],
    churn30: null,
    pastDue: null,
    refunds30: null,
    disputesOpen: null,
    disputeAmount: null,
  }
  try {
    const since = Math.floor((Date.now() - 30 * 86_400_000) / 1000)
    const [active, pastDue, unpaid, canceled] = await Promise.all([
      listSubscriptions('active'),
      listSubscriptions('past_due'),
      listSubscriptions('unpaid'),
      listSubscriptions('canceled'),
    ])
    const memberships = active.filter(isDoctorSubscription)
    const plans = new Map<string, number>()
    const byCurrency = new Map<string, number>()
    const customers = new Set<string>()
    for (const sub of memberships) {
      const id = customerId(sub.customer)
      if (id) customers.add(id)
      plans.set(planLabel(sub), (plans.get(planLabel(sub)) || 0) + 1)
      for (const [currency, minor] of subscriptionMonthlyByCurrency(sub)) {
        byCurrency.set(currency, (byCurrency.get(currency) || 0) + minor)
      }
    }
    let churn = 0
    for (const sub of canceled) {
      if ((sub.canceled_at || 0) >= since && isDoctorSubscription(sub)) churn += 1
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
    const late = [...pastDue, ...unpaid].filter(isDoctorSubscription)
    return {
      stripeOk: true,
      mrrUsd: majorUnits(byCurrency.get('usd') || 0, 'usd'),
      mrrOther: [...byCurrency.entries()]
        .filter(([currency]) => currency !== 'usd')
        .map(([currency, minor]) => ({ currency: currency.toUpperCase(), amount: majorUnits(minor, currency) })),
      paying: customers.size,
      plans: [...plans.entries()].sort((a, b) => b[1] - a[1]).map(([label, n]) => ({ label, n })),
      churn30: churn,
      pastDue: late.length,
      refunds30: refunds,
      disputesOpen: disputes,
      disputeAmount: disputes ? formatMoney(disputeMinor / 100, disputeCurrency.toUpperCase()) : null,
    }
  } catch (err) {
    console.error('founder money', err instanceof Error ? err.name : 'error')
    return empty
  }
}

const loadDoctorBillingCached = unstable_cache(loadDoctorBillingFresh, ['founder-doctor-billing-v1'], { revalidate: 180 })

/** Stripe membership totals. Cached 3 minutes so a page click never waits on Stripe after the first read. */
export const loadDoctorBilling = cache(loadDoctorBillingCached)
