import { revalidateTag, unstable_cache } from 'next/cache'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'
import { pickMembershipSubscription, type RawSubscription } from './membership-subscription.ts'

type StripeBilling = {
  subscription: {
    id: string
    status: string
    price: number
    currency: string
    interval: string
    intervalCount: number
    nextBilling: string
    cancelAtPeriodEnd: boolean
    paymentMethod: string | null
  } | null
  invoices: {
    id: string
    date: string
    amount: number
    status: Stripe.Invoice.Status | null
    url: string | null
    number: string | null
  }[]
}

export function doctorStripeTag(customerId: string) {
  return `doctor-stripe-${customerId}`
}

export function invalidateDoctorStripe(customerId: string | null | undefined) {
  if (!customerId) return
  revalidateTag(doctorStripeTag(customerId), { expire: 0 })
}

async function fetchStripeBilling(customerId: string): Promise<StripeBilling> {
  const [subscriptions, invoices] = await Promise.all([
    stripe.subscriptions.list({
      customer: customerId,
      limit: 20,
      status: 'all',
      expand: ['data.default_payment_method'],
    }),
    stripe.invoices.list({
      customer: customerId,
      limit: 10,
    }),
  ])
  const raw = subscriptions.data as unknown as (RawSubscription & {
    default_payment_method?: { card?: { last4?: string } } | string | null
  })[]
  const picked = pickMembershipSubscription(raw)
  const method = picked ? raw.find((sub) => sub.id === picked.id)?.default_payment_method : null
  const last4 = method && typeof method === 'object' ? method.card?.last4 || null : null
  return {
    subscription: picked ? {
      id: picked.id,
      status: picked.status,
      price: picked.price,
      currency: picked.currency,
      interval: picked.interval,
      intervalCount: picked.intervalCount,
      nextBilling: picked.periodEnd
        ? new Date(picked.periodEnd * 1000).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
          })
        : '---',
      cancelAtPeriodEnd: picked.cancelAtPeriodEnd,
      paymentMethod: last4,
    } : null,
    invoices: invoices.data.map((inv) => ({
      id: inv.id,
      date: new Date(inv.created * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }),
      amount: inv.amount_paid / 100,
      status: inv.status,
      url: inv.hosted_invoice_url ?? null,
      number: inv.number,
    })),
  }
}

export function loadStripeBilling(customerId: string) {
  return unstable_cache(fetchStripeBilling, ['doctor-stripe-billing-v2', customerId], {
    revalidate: 60,
    tags: [doctorStripeTag(customerId)],
  })(customerId)
}
