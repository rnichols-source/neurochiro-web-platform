import 'server-only'

import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { paymentIntentIdFromInvoicePayment } from '@/lib/go-live/plan'
import { chargeApprovalCopy } from './charge-copy.ts'
import { setupIntentConfirmsCard } from './status.ts'
import { formatStripeAmount } from './prices.ts'
import type { BillingPort, ChargeResult } from './decide.ts'

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://neurochiro.co').replace(/\/$/, '')
}

function invoiceOf(sub: Stripe.Subscription): Stripe.Invoice | null {
  const invoice = sub.latest_invoice
  if (!invoice || typeof invoice === 'string') return null
  return invoice
}

function chargeMoney(invoice: Stripe.Invoice | null): { amountLabel: string | null; receiptUrl: string | null } {
  if (!invoice) return { amountLabel: null, receiptUrl: null }
  const minor = invoice.amount_paid || invoice.total || invoice.amount_due || null
  return {
    amountLabel: minor == null ? null : formatStripeAmount(minor, invoice.currency || 'usd'),
    receiptUrl: invoice.hosted_invoice_url || invoice.invoice_pdf || null,
  }
}

async function classify(sub: Stripe.Subscription): Promise<ChargeResult> {
  const invoice = invoiceOf(sub)
  const hosted = invoice?.hosted_invoice_url || null
  const money = chargeMoney(invoice)
  if (sub.status === 'active' || sub.status === 'trialing') {
    return { subscriptionId: sub.id, status: sub.status, hostedInvoiceUrl: hosted, paymentState: 'paid', ...money }
  }

  const payments = invoice?.payments?.data || []
  for (const payment of payments) {
    if (payment.status === 'paid') {
      return { subscriptionId: sub.id, status: sub.status, hostedInvoiceUrl: hosted, paymentState: 'paid', ...money }
    }
    let intent = payment.payment?.payment_intent
    if (typeof intent === 'string') {
      intent = await stripe.paymentIntents.retrieve(intent)
    }
    if (intent && typeof intent !== 'string') {
      if (intent.status === 'succeeded' || intent.status === 'processing') {
        return { subscriptionId: sub.id, status: sub.status, hostedInvoiceUrl: hosted, paymentState: 'paid', ...money }
      }
      if (intent.status === 'requires_action' || intent.status === 'requires_confirmation') {
        return { subscriptionId: sub.id, status: sub.status, hostedInvoiceUrl: hosted, paymentState: 'requires_action', ...money }
      }
    }
  }

  if (sub.status === 'incomplete' && hosted) {
    const open = payments.length === 0
    if (open) {
      return { subscriptionId: sub.id, status: sub.status, hostedInvoiceUrl: hosted, paymentState: 'requires_action', ...money }
    }
  }

  return {
    subscriptionId: sub.id,
    status: sub.status,
    hostedInvoiceUrl: hosted,
    paymentState: 'failed',
    errorMessage: 'The card was declined. Nothing was published.',
    ...money,
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
        return { ...result, hostedInvoiceUrl: null }
      }
      return result
    },
    async cancelAndRefund(subscriptionId: string): Promise<void> {
      const invoices = await stripe.invoices.list({
        subscription: subscriptionId,
        status: 'paid',
        limit: 3,
        expand: ['data.payments'],
      })
      const intentIds: string[] = []
      for (const invoice of invoices.data) {
        for (const payment of invoice.payments?.data || []) {
          const intentId = paymentIntentIdFromInvoicePayment(payment)
          if (intentId && !intentIds.includes(intentId)) intentIds.push(intentId)
        }
      }
      if (intentIds.length === 0) throw new Error('No payment was refunded.')
      let refunded = 0
      for (const intentId of intentIds) {
        try {
          await stripe.refunds.create({ payment_intent: intentId }, { idempotencyKey: `doctor-deny-refund-${intentId}` })
          refunded += 1
        } catch (error) {
          const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : ''
          if (code === 'charge_already_refunded') refunded += 1
          else throw error
        }
      }
      if (refunded === 0) throw new Error('No payment was refunded.')
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      if (subscription.status !== 'canceled') {
        await stripe.subscriptions.cancel(subscriptionId, {}, { idempotencyKey: `doctor-deny-cancel-${subscriptionId}` })
      }
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

export function cardElementsEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return (env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '').trim().startsWith('pk_')
}

async function ensureCustomer(input: {
  customerId: string | null
  email: string
  name: string
  userId: string
  doctorId: string
  applicationId: string
}): Promise<string> {
  if (input.customerId) return input.customerId
  const customer = await stripe.customers.create({
    email: input.email,
    name: input.name,
    metadata: {
      userId: input.userId,
      doctorId: input.doctorId,
      applicationId: input.applicationId,
    },
  })
  return customer.id
}

export async function createCardSetupIntent(input: {
  customerId: string | null
  email: string
  name: string
  priceId: string
  applicationId: string
  doctorId: string
  userId: string
  plan: 'monthly' | 'annual'
}): Promise<{ clientSecret: string; customerId: string; setupIntentId: string }> {
  const customerId = await ensureCustomer(input)
  const intent = await stripe.setupIntents.create({
    customer: customerId,
    usage: 'off_session',
    automatic_payment_methods: { enabled: true },
    metadata: {
      type: 'doctor_application_setup',
      applicationId: input.applicationId,
      doctorId: input.doctorId,
      userId: input.userId,
      plan: input.plan,
      priceId: input.priceId,
    },
  })
  if (!intent.client_secret) throw new Error('Stripe did not return a card form.')
  return { clientSecret: intent.client_secret, customerId, setupIntentId: intent.id }
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
  chargeCopy: string
}): Promise<{ url: string; customerId: string }> {
  const price = await stripe.prices.retrieve(input.priceId)
  if (price.currency !== input.currency.toLowerCase()) {
    throw new Error('That Stripe price is in a different currency than this country.')
  }

  const customerId = await ensureCustomer(input)
  const message = input.chargeCopy || chargeApprovalCopy('the membership price', input.plan === 'annual' ? 'year' : 'month')

  const session = await stripe.checkout.sessions.create({
    mode: 'setup',
    customer: customerId,
    currency: input.currency.toLowerCase(),
    success_url: `${siteUrl()}/doctor/apply/complete?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl()}/doctor/apply?canceled=1&step=3`,
    client_reference_id: input.applicationId,
    custom_text: {
      submit: { message },
    },
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
  if (!setupIntent || typeof setupIntent === 'string' || !setupIntentConfirmsCard(setupIntent.status)) return null
  const paymentMethod = setupIntent.payment_method
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

export async function paymentMethodFromSetupIntent(setupIntentId: string): Promise<{
  customerId: string
  paymentMethodId: string
  applicationId: string
  userId: string
  doctorId: string
} | null> {
  if (!setupIntentId.startsWith('seti_')) return null
  const intent = await stripe.setupIntents.retrieve(setupIntentId)
  if (!setupIntentConfirmsCard(intent.status)) return null
  if (intent.metadata?.type !== 'doctor_application_setup') return null
  const customerId = typeof intent.customer === 'string' ? intent.customer : intent.customer?.id
  const paymentMethodId = typeof intent.payment_method === 'string' ? intent.payment_method : intent.payment_method?.id
  const applicationId = intent.metadata.applicationId || ''
  const userId = intent.metadata.userId || ''
  const doctorId = intent.metadata.doctorId || ''
  if (!customerId || !paymentMethodId || !applicationId) return null
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  })
  return { customerId, paymentMethodId, applicationId, userId, doctorId }
}

export function applicationReturnUrl(): string {
  return `${siteUrl()}/doctor/apply/complete`
}

/** Cancels an incomplete subscription left by a failed approval. Leaves an active membership alone. */
export async function cancelUnpaidSubscription(subscriptionId: string): Promise<void> {
  if (!subscriptionId) return
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    if (subscription.status === 'active' || subscription.status === 'trialing' || subscription.status === 'canceled') return
    await stripe.subscriptions.cancel(subscriptionId, {}, { idempotencyKey: `doctor-card-replace-${subscriptionId}` })
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : ''
    if (code === 'resource_missing') return
    console.error('[application] could not cancel an unpaid subscription', error instanceof Error ? error.name : 'error')
  }
}
