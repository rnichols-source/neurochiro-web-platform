import 'server-only'

import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase-admin'
import { doctorPriceIds, studentPriceIds } from '@/lib/member-referrals/catalog'
import { isDoctorMembershipProduct, isStudentProduct, type ProductHint } from './products.ts'
import {
  invoiceLineProduct,
  isDoctorMembershipCheckout,
  reconciliationLetter,
  subscriptionIdFromInvoice,
  type CheckoutIdentity,
} from './plan.ts'
import { goLiveStepAlreadyOk } from './log.ts'
import { adoptStaleCheckoutClaims } from './checkout.ts'

const ADMIN_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'drray@neurochirodirectory.com'
const WINDOW_SECONDS = 48 * 60 * 60

function db() {
  return createAdminClient() as any
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

async function findDoctor(customerId: string | null, email: string | null): Promise<{ id: string; email: string | null } | null> {
  if (customerId) {
    const { data } = await db().from('doctors').select('id, email').eq('stripe_customer_id', customerId).limit(1)
    if (data?.[0]?.id) return { id: String(data[0].id), email: text(data[0].email) || null }
  }
  if (email) {
    const { data } = await db().from('doctors').select('id, email').ilike('email', email).limit(1)
    if (data?.[0]?.id) return { id: String(data[0].id), email: text(data[0].email) || null }
  }
  return null
}

async function coverage(doctorId: string): Promise<'ok' | 'legacy' | 'missing'> {
  const welcome = await goLiveStepAlreadyOk(doctorId, 'welcome')
  const checkout = await goLiveStepAlreadyOk(doctorId, 'checkout')
  if (welcome && checkout) return 'ok'
  const doctor = await db().from('doctors').select('verification_status, is_approved, go_live_flow_at').eq('id', doctorId).maybeSingle()
  const live = doctor.data?.verification_status === 'verified' || doctor.data?.is_approved === true
  const runs = await db().from('doctor_go_live_runs').select('id').eq('doctor_id', doctorId).limit(1)
  const hasRun = Array.isArray(runs.data) && runs.data.length > 0
  if (live && !text(doctor.data?.go_live_flow_at) && !hasRun && !welcome) return 'legacy'
  return 'missing'
}

function productFromPrice(price: { id?: string | null; product?: unknown } | null | undefined): { priceId: string | null; product: ProductHint | null } {
  const raw = price?.product
  if (raw && typeof raw === 'object') {
    const product = raw as { id?: string; name?: string | null; metadata?: Record<string, string> }
    return { priceId: price?.id || null, product: { id: product.id || null, name: product.name || null, metadata: product.metadata } }
  }
  if (typeof raw === 'string') return { priceId: price?.id || null, product: { id: raw, name: null } }
  return { priceId: price?.id || null, product: null }
}

async function sessionIsMembership(session: Record<string, any>): Promise<boolean> {
  let priceId: string | null = null
  let product: ProductHint | null = null
  try {
    const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1, expand: ['data.price.product'] })
    const read = productFromPrice(items.data[0]?.price)
    priceId = read.priceId
    product = read.product
  } catch {
    product = null
  }
  if (isStudentProduct(product)) return false
  const identity: CheckoutIdentity = {
    sessionId: text(session.id),
    customerId: text(session.customer) || null,
    subscriptionId: text(session.subscription) || null,
    email: text(session.customer_details?.email) || text(session.customer_email),
    name: text(session.customer_details?.name),
    phone: null,
    smsConsent: null,
    city: null,
    state: null,
    country: null,
    clinicName: null,
    amountTotal: typeof session.amount_total === 'number' ? session.amount_total : null,
    currency: text(session.currency) || null,
    priceId,
    metadataType: text(session.metadata?.type) || null,
    metadataRole: text(session.metadata?.role) || null,
    userId: text(session.metadata?.userId) || null,
    mode: text(session.mode) || null,
    paymentLinkPresent: Boolean(session.payment_link),
    allowAmountFallback: !product,
  }
  return isDoctorMembershipCheckout(identity, { priceIds: doctorPriceIds(), studentPriceIds: studentPriceIds() }, product)
}

function invoiceIsMembership(invoice: Record<string, any>): boolean {
  const line = invoice.lines?.data?.[0]
  if (!line) return false
  const ids = invoiceLineProduct(line)
  if (ids.priceId && studentPriceIds().includes(ids.priceId)) return false
  const product: ProductHint = { id: ids.productId, name: text(line.description) || null }
  if (isStudentProduct(product)) return false
  if (isDoctorMembershipProduct(product)) return true
  if (ids.priceId && doctorPriceIds().includes(ids.priceId)) return true
  return false
}

async function emailRaymond(html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY || ''
  if (!key || process.env.GO_LIVE_DRY_RUN === '1' || process.env.GO_LIVE_DRY_RUN === 'true') return false
  const { Resend } = await import('resend')
  const resend = new Resend(key)
  const result = await resend.emails.send({
    from: 'NeuroChiro <support@neurochirodirectory.com>',
    to: [ADMIN_EMAIL],
    replyTo: ADMIN_EMAIL,
    subject: 'Go-live reconciliation',
    html,
  })
  return !result.error
}

export async function reconcileDoctorGoLive(): Promise<{ checked: number; missing: number; failed: number; emailed: boolean }> {
  const since = Math.floor(Date.now() / 1000) - WINDOW_SECONDS
  const missing: string[] = []
  const failed: string[] = []
  let checked = 0
  await adoptStaleCheckoutClaims().catch((error) => {
    console.error('[go-live] stale claim adopt failed', error instanceof Error ? error.name : 'error')
  })

  const sessions = await stripe.checkout.sessions.list({ limit: 100, created: { gte: since } })
  for (const session of sessions.data) {
    if (session.payment_status !== 'paid') continue
    if (!(await sessionIsMembership(session as unknown as Record<string, any>))) continue
    checked += 1
    const customerId = typeof session.customer === 'string' ? session.customer : null
    const email = session.customer_details?.email || session.customer_email || null
    const label = email || session.id
    try {
      const doctor = await findDoctor(customerId, email)
      if (!doctor) {
        missing.push(label)
        const { ingestMembershipCheckout } = await import('./checkout')
        await ingestMembershipCheckout(session as unknown as Record<string, any>)
        continue
      }
      const state = await coverage(doctor.id)
      if (state === 'ok' || state === 'legacy') {
        if (state === 'legacy' && customerId) {
          await db().from('doctors').update({
            stripe_customer_id: customerId,
            stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : null,
          }).eq('id', doctor.id)
        }
        continue
      }
      missing.push(label)
      const { runDoctorGoLive } = await import('./orchestrator')
      const results = await runDoctorGoLive({ doctorId: doctor.id, source: 'reconcile' })
      if (results.some((step) => step.status === 'failed')) failed.push(label)
    } catch (error) {
      failed.push(label)
      console.error('[go-live] reconcile session failed', error instanceof Error ? error.name : 'error')
    }
  }

  const invoices = await stripe.invoices.list({ status: 'paid', created: { gte: since }, limit: 100 })
  for (const invoice of invoices.data) {
    if (Number(invoice.amount_paid || 0) <= 0) continue
    let record = invoice as unknown as Record<string, any>
    if (!invoiceIsMembership(record) && invoice.id) {
      try {
        const full = await stripe.invoices.retrieve(invoice.id, { expand: ['lines.data.price.product'] })
        record = full as unknown as Record<string, any>
      } catch {
        continue
      }
    }
    if (!invoiceIsMembership(record)) continue
    checked += 1
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : null
    const label = customerId || invoice.id || 'invoice'
    try {
      const doctor = await findDoctor(customerId, null)
      if (!doctor) {
        missing.push(label)
        const { noteMembershipInvoicePaid } = await import('./checkout')
        await noteMembershipInvoicePaid(invoice as unknown as Record<string, any>)
        continue
      }
      const state = await coverage(doctor.id)
      if (state === 'ok' || state === 'legacy') {
        if (state === 'legacy' && customerId) {
          await db().from('doctors').update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionIdFromInvoice(invoice) || null,
          }).eq('id', doctor.id)
        }
        continue
      }
      missing.push(label)
      const { runDoctorGoLive } = await import('./orchestrator')
      const results = await runDoctorGoLive({ doctorId: doctor.id, source: 'reconcile' })
      if (results.some((step) => step.status === 'failed')) failed.push(label)
    } catch (error) {
      failed.push(label)
      console.error('[go-live] reconcile invoice failed', error instanceof Error ? error.name : 'error')
    }
  }

  const letter = reconciliationLetter({ missing, failed })
  const emailed = letter ? await emailRaymond(letter.html) : false
  return { checked, missing: missing.length, failed: failed.length, emailed }
}
