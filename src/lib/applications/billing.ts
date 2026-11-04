import 'server-only'

import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import type { BillingPort, ChargeResult } from './decide.ts'

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://neurochiro.co').replace(/\/$/, '')
}

function invoiceOf(sub: Stripe.Subscription): Stripe.Invoice | null {
  const invoice = sub.latest_invoice
  if (!invoice || typeof invoice === 'string') return null
  return invoice
}

async function classify(sub: Stripe.Subscription): Promise<ChargeResult> {
  const invoice = invoiceOf(sub)
  const hosted = invoice?.hosted_invoice_url || null
  if (sub.status === 'active' || sub.status === 'trialing') {
    return { subscriptionId: sub.id, status: sub.status, hostedInvoiceUrl: hosted, paymentState: 'paid' }
  }

  const payments = invoice?.payments?.data || []
  for (const payment of payments) {
    if (payment.status === 'paid') {
      return { subscriptionId: sub.id, status: sub.status, hostedInvoiceUrl: hosted, paymentState: 'paid' }
    }
    let intent = payment.payment?.payment_intent
    if (typeof intent === 'string') {
      intent = await stripe.paymentIntents.retrieve(intent)
    }
    if (intent && typeof intent !== 'string') {
      if (intent.status === 'succeeded' || intent.status === 'processing') {
        return { subscriptionId: sub.id, status: sub.status, hostedInvoiceUrl: hosted, paymentState: 'paid' }
      }
      if (intent.status === 'requires_action' || intent.status === 'requires_confirmation') {
        return { subscriptionId: sub.id, status: sub.status, hostedInvoiceUrl: hosted, paymentState: 'requires_action' }
      }
    }
  }

  if (sub.status === 'incomplete' && hosted) {
    const open = payments.length === 0
    if (open) {
      return { subscriptionId: sub.id, status: sub.status, hostedInvoiceUrl: hosted, paymentState: 'requires_action' }
    }
  }

  return {
    subscriptionId: sub.id,
    status: sub.status,
    hostedInvoiceUrl: hosted,
    paymentState: 'failed',
    errorMessage: 'The card was declined. Nothing was published.',
  }
}

export function stripeBilling(): BillingPort {
  return {
    async createSubscription(input): Promise<ChargeResult> {
      const subscription = await stripe.subscriptions.create({
        customer: input.customerId,
        items: [{ price: input.priceId }],
        default_payment_method: input.paymentMethodId,
        payment_behavior: 'allow_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        metadata: input.metadata,
        expand: ['latest_invoice.payments'],
      }, { idempotencyKey: input.idempotencyKey })
      const result = await classify(subscription)
      if (result.paymentState === 'failed') {
        try {
          await stripe.subscriptions.cancel(subscription.id)
        } catch (error) {
          console.error('[application] could not cancel a declined subscription', error instanceof Error ? error.name : 'error')
        }
      }
      return result
    },
    async detachPaymentMethod(paymentMethodId: string): Promise<void> {
      try {
        await stripe.paymentMethods.detach(paymentMethodId)
      } catch (error) {
        const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : ''
        if (code === 'resource_missing') return
        throw error
      }
    },
  }
}

export async function readPriceAmount(priceId: string): Promise<{ currency: string; unitAmount: number | null } | null> {
  try {
    const price = await stripe.prices.retrieve(priceId)
    return { currency: price.currency, unitAmount: price.unit_amount }
  } catch {
    return null
  }
}

export async function createSetupCheckout(input: {
  customerId: string | null
  email: string
  name: string
  currency: string
  priceId: string
  applicationId: string
  doctorId: string
  userId: string
  plan: 'monthly' | 'annual'
}): Promise<{ url: string; customerId: string }> {
  const price = await stripe.prices.retrieve(input.priceId)
  if (price.currency !== input.currency.toLowerCase()) {
    throw new Error('That Stripe price is in a different currency than this country.')
  }

  let customerId = input.customerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: input.email,
      name: input.name,
      metadata: {
        userId: input.userId,
        doctorId: input.doctorId,
        applicationId: input.applicationId,
      },
    })
    customerId = customer.id
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'setup',
    customer: customerId,
    currency: input.currency.toLowerCase(),
    success_url: `${siteUrl()}/doctor/apply/complete?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl()}/doctor/apply?canceled=1`,
    client_reference_id: input.applicationId,
    metadata: {
      type: 'doctor_application_setup',
      applicationId: input.applicationId,
      doctorId: input.doctorId,
      userId: input.userId,
      plan: input.plan,
      priceId: input.priceId,
    },
    setup_intent_data: {
      metadata: {
        type: 'doctor_application_setup',
        applicationId: input.applicationId,
      },
    },
  })

  if (!session.url) throw new Error('Stripe did not return a checkout link.')
  return { url: session.url, customerId }
}

export async function paymentMethodFromSetupSession(sessionId: string): Promise<{
  customerId: string
  paymentMethodId: string
  applicationId: string
  userId: string
  doctorId: string
} | null> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['setup_intent'] })
  if (session.mode !== 'setup' || session.status !== 'complete') return null
  if (session.metadata?.type !== 'doctor_application_setup') return null
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
  const setupIntent = session.setup_intent
  const paymentMethod = setupIntent && typeof setupIntent !== 'string' ? setupIntent.payment_method : null
  const paymentMethodId = typeof paymentMethod === 'string' ? paymentMethod : paymentMethod?.id
  const applicationId = session.metadata.applicationId || ''
  const userId = session.metadata.userId || ''
  const doctorId = session.metadata.doctorId || ''
  if (!customerId || !paymentMethodId || !applicationId) return null
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  })
  return { customerId, paymentMethodId, applicationId, userId, doctorId }
}
