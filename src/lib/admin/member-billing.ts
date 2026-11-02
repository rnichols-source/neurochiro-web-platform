import 'server-only'

import { unstable_cache } from 'next/cache'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { formatMoney } from '@/lib/admin/member-search'

export type MemberBillingSnapshot = {
  ok: boolean
  active: string[]
  trialing: string[]
  pastDue: string[]
}

export type StripeCustomerSummary = {
  status: string | null
  plan: string | null
  amountLabel: string | null
  renewsAt: string | null
  lastInvoice: string | null
  failedPayments: number
}

type StripeSubView = {
  status?: string
  current_period_end?: number
  items?: {
    data?: Array<{
      current_period_end?: number
      price?: {
        nickname?: string | null
        unit_amount?: number | null
        currency?: string | null
        product?: string | { name?: string | null; deleted?: boolean } | null
        recurring?: { interval?: string | null } | null
      } | null
    }>
  }
}

type StripeInvoiceView = {
  created?: number
  amount_paid?: number | null
  amount_due?: number | null
  currency?: string | null
  status?: string | null
  number?: string | null
  id?: string
  attempt_count?: number | null
}

function customerId(customer: Stripe.Subscription['customer']): string | null {
  if (typeof customer === 'string') return customer
  if (customer && typeof customer === 'object' && 'id' in customer) {
    if ('deleted' in customer && customer.deleted) return null
    return customer.id
  }
  return null
}

async function listCustomerIds(status: Stripe.SubscriptionListParams['status']): Promise<string[]> {
  const ids = new Set<string>()
  for await (const sub of stripe.subscriptions.list({ status, limit: 100 })) {
    const id = customerId(sub.customer)
    if (id) ids.add(id)
  }
  return [...ids]
}

async function loadMemberBillingUncached(): Promise<MemberBillingSnapshot> {
  const [active, trialing, pastDue, unpaid] = await Promise.all([
    listCustomerIds('active'),
    listCustomerIds('trialing'),
    listCustomerIds('past_due'),
    listCustomerIds('unpaid'),
  ])
  return {
    ok: true,
    active,
    trialing,
    pastDue: [...new Set([...pastDue, ...unpaid])],
  }
}

const getCachedMemberBilling = unstable_cache(loadMemberBillingUncached, ['admin-member-billing-v1'], {
  revalidate: 600,
  tags: ['admin-member-billing'],
})

export async function memberBillingSnapshot(): Promise<MemberBillingSnapshot> {
  try {
    const cached = await getCachedMemberBilling()
    return {
      ok: cached.ok,
      active: [...cached.active],
      trialing: [...cached.trialing],
      pastDue: [...cached.pastDue],
    }
  } catch (err) {
    console.error('admin member billing', err instanceof Error ? err.name : 'error')
    return { ok: false, active: [], trialing: [], pastDue: [] }
  }
}

function asSub(value: unknown): StripeSubView | null {
  if (!value || typeof value !== 'object') return null
  return value as StripeSubView
}

function asInvoice(value: unknown): StripeInvoiceView | null {
  if (!value || typeof value !== 'object') return null
  return value as StripeInvoiceView
}

function formatWhen(unixSeconds: number | null | undefined): string | null {
  if (!unixSeconds) return null
  const date = new Date(unixSeconds * 1000)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date)
}

function periodEnd(sub: StripeSubView): number | null {
  if (typeof sub.current_period_end === 'number') return sub.current_period_end
  const itemEnd = sub.items?.data?.[0]?.current_period_end
  return typeof itemEnd === 'number' ? itemEnd : null
}

const LIVE_RANK = ['active', 'trialing', 'past_due']

function planName(sub: StripeSubView): string | null {
  const price = sub.items?.data?.[0]?.price
  if (!price) return null
  if (price.nickname) return price.nickname
  const product = price.product
  if (product && typeof product === 'object' && !product.deleted && product.name) return product.name
  return 'Subscription'
}

export async function stripeCustomerSummary(customerId: string): Promise<StripeCustomerSummary | null> {
  try {
    const [subscriptions, invoices] = await Promise.all([
      stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 10 }),
      stripe.invoices.list({ customer: customerId, limit: 20 }),
    ])
    const chosen = [...subscriptions.data].sort((left, right) => {
      const rank = (status: string) => {
        const index = LIVE_RANK.indexOf(status)
        return index === -1 ? LIVE_RANK.length : index
      }
      return rank(left.status) - rank(right.status)
    })[0]
    let sub = asSub(chosen)
    if (chosen?.id) {
      const expanded = await stripe.subscriptions.retrieve(chosen.id, { expand: ['items.data.price.product'] })
      sub = asSub(expanded) || sub
    }
    const price = sub?.items?.data?.[0]?.price
    const minor = price?.unit_amount
    const currency = price?.currency || 'usd'
    const interval = price?.recurring?.interval
    let amountLabel: string | null = null
    if (typeof minor === 'number') {
      const money = formatMoney(minor, currency)
      amountLabel = interval ? `${money}/${interval}` : money
    }
    const latest = asInvoice(invoices.data[0])
    let lastInvoice: string | null = null
    if (latest) {
      const when = formatWhen(latest.created) || 'Unknown date'
      const amount = formatMoney(latest.amount_paid ?? latest.amount_due ?? 0, latest.currency || currency)
      const status = latest.status || 'unknown'
      const number = latest.number || latest.id || ''
      lastInvoice = number ? `${when} · ${amount} · ${status} · ${number}` : `${when} · ${amount} · ${status}`
    }
    let failedPayments = 0
    for (const invoice of invoices.data) {
      const row = asInvoice(invoice)
      if (!row) continue
      const attempts = row.attempt_count || 0
      if (row.status === 'uncollectible' || (row.status === 'open' && attempts > 0)) failedPayments += 1
    }
    return {
      status: sub?.status || null,
      plan: sub ? planName(sub) : null,
      amountLabel,
      renewsAt: sub ? formatWhen(periodEnd(sub)) : null,
      lastInvoice,
      failedPayments,
    }
  } catch (err) {
    console.error('admin member stripe', err instanceof Error ? err.name : 'error')
    return null
  }
}
