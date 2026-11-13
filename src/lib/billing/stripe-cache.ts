import { revalidateTag, unstable_cache } from 'next/cache'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'

type StripeBilling = {
  subscription: {
    id: string
    status: string
    price: number
    interval: string
    nextBilling: string
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
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    }),
    stripe.invoices.list({
      customer: customerId,
      limit: 10,
    }),
  ])
  const activeSubscription = subscriptions.data[0] as {
    id: string
    status: string
    current_period_end?: number
    items?: { data?: { price?: { unit_amount?: number | null } ; plan?: { interval?: string } }[] }
    default_payment_method?: { card?: { last4?: string } } | string | null
  }
  const method = activeSubscription?.default_payment_method
  const last4 = method && typeof method === 'object' ? method.card?.last4 || null : null
  return {
    subscription: activeSubscription ? {
      id: activeSubscription.id,
      status: activeSubscription.status,
      price: activeSubscription.items?.data?.[0]?.price?.unit_amount ? activeSubscription.items.data[0].price.unit_amount / 100 : 0,
      interval: activeSubscription.items?.data?.[0]?.plan?.interval || 'month',
      nextBilling: activeSubscription.current_period_end
        ? new Date(activeSubscription.current_period_end * 1000).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
          })
        : '---',
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
  return unstable_cache(fetchStripeBilling, ['doctor-stripe-billing-v1', customerId], {
    revalidate: 60,
    tags: [doctorStripeTag(customerId)],
  })(customerId)
}
