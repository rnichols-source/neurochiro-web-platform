import 'server-only'

import type Stripe from 'stripe'
import { adminToday } from '@/lib/admin/metrics'
import { stripe } from '@/lib/stripe'
import { formatMoney } from './format'

export type PlanRow = { label: string; n: number }
export type MoneyExtras = {
  stripeOk: boolean
  plans: PlanRow[]
  churn30: number | null
  refunds30: number | null
  disputesOpen: number | null
  disputeAmount: string | null
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

export async function loadMoneyExtras(): Promise<MoneyExtras> {
  const empty: MoneyExtras = { stripeOk: false, plans: [], churn30: null, refunds30: null, disputesOpen: null, disputeAmount: null }
  try {
    const since = Math.floor((Date.now() - 30 * 86_400_000) / 1000)
    const plans = new Map<string, number>()
    let churn = 0
    for await (const sub of stripe.subscriptions.list({ status: 'active', limit: 100 })) {
      const label = planLabel(sub)
      plans.set(label, (plans.get(label) || 0) + 1)
    }
    for await (const sub of stripe.subscriptions.list({ status: 'canceled', limit: 100 })) {
      if ((sub.canceled_at || 0) >= since) churn += 1
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
      stripeOk: true,
      plans: [...plans.entries()].sort((a, b) => b[1] - a[1]).map(([label, n]) => ({ label, n })),
      churn30: churn,
      refunds30: refunds,
      disputesOpen: disputes,
      disputeAmount: disputes ? formatMoney(disputeMinor / 100, disputeCurrency.toUpperCase()) : null,
    }
  } catch (err) {
    console.error('founder money', err instanceof Error ? err.name : 'error')
    return empty
  }
}

export async function loadToday() {
  return adminToday()
}
