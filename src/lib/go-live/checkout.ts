import 'server-only'

import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase-admin'
import { SUPABASE_URL } from '@/lib/supabase-env'
import { resolveSupabaseAdminEnv } from '@/lib/supabase-runtime-env'
import { doctorPriceIds, studentPriceIds } from '@/lib/member-referrals/catalog'
import { isStudentProduct, type ProductHint } from './products.ts'
import { goLiveStepAlreadyOk } from './log.ts'
import { PAID_CHECKOUT_APPLICATION_STATUS } from '@/lib/applications/status'
import {
  blocksNewDoctor,
  checkoutApplicationContact,
  countryFromCurrency,
  invoiceLineProduct,
  isDoctorMembershipCheckout,
  isPublicLiveListing,
  listingNeverGoneLive,
  listingSearchFromIdentity,
  phoneMatchKey,
  phoneFromCheckout,
  planCheckoutIntake,
  planDuplicateGuard,
  planInvoiceIntake,
  planLoggedInCheckout,
  promotionPlan,
  resumeClaimPlan,
  readCheckoutContact,
  splitName,
  subscriptionIdFromInvoice,
  unmatchedPaymentLine,
  type CheckoutIdentity,
  type ExistingListing,
} from './plan.ts'

function db() {
  return createAdminClient() as any
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function identityFromSession(session: Record<string, any>, priceId: string | null): CheckoutIdentity {
  const contact = readCheckoutContact(session.custom_fields)
  const details = session.customer_details || {}
  return {
    sessionId: text(session.id),
    customerId: text(session.customer) || null,
    subscriptionId: text(session.subscription) || null,
    email: text(details.email) || text(session.customer_email),
    name: text(details.name) || text(session.metadata?.name),
    phone: phoneFromCheckout(session.custom_fields, text(details.phone)),
    smsConsent: contact.smsConsent,
    city: contact.city || text(details.address?.city),
    state: contact.state || text(details.address?.state),
    country: text(details.address?.country) || null,
    clinicName: contact.clinicName,
    amountTotal: typeof session.amount_total === 'number' ? session.amount_total : null,
    currency: text(session.currency) || null,
    priceId,
    metadataType: text(session.metadata?.type) || null,
    metadataRole: text(session.metadata?.role) || null,
    userId: text(session.metadata?.userId) || null,
    mode: text(session.mode) || null,
    paymentLinkPresent: Boolean(session.payment_link),
    allowAmountFallback: session.allow_amount_fallback === true,
  }
}

function productHint(product: { id?: string; name?: string; metadata?: Record<string, string> | null; deleted?: boolean } | string | null, priceMetadata: Record<string, string> | null): ProductHint | null {
  if (!product || typeof product === 'string') return product ? { id: product, name: null, priceMetadata } : null
  if (product.deleted) return null
  return { id: product.id || null, name: product.name || null, metadata: product.metadata || null, priceMetadata }
}

async function productFromPriceId(priceId: string | null): Promise<ProductHint | null> {
  if (!priceId) return null
  try {
    const price = await stripe.prices.retrieve(priceId, { expand: ['product'] })
    return productHint(
      price.product as { id?: string; name?: string; metadata?: Record<string, string>; deleted?: boolean } | string,
      price.metadata && typeof price.metadata === 'object' ? price.metadata : null,
    )
  } catch {
    return null
  }
}

async function priceFromSubscription(subscriptionId: string | null): Promise<string | null> {
  if (!subscriptionId) return null
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    return subscription.items.data[0]?.price?.id || null
  } catch {
    return null
  }
}

async function priceFromSession(session: Record<string, any>): Promise<string | null> {
  const fromSub = await priceFromSubscription(text(session.subscription) || null)
  if (fromSub) return fromSub
  const sessionId = text(session.id)
  if (!sessionId || sessionId.startsWith('invoice-')) return null
  try {
    const items = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 5 })
    return items.data[0]?.price?.id || null
  } catch {
    return null
  }
}

type ListedDoctor = ExistingListing & {
  verificationStatus: string | null
  isApproved: boolean | null
  goLiveFlowAt: string | null
}

export type MembershipIntakeResult = {
  outcome: 'created' | 'linked' | 'flagged' | 'ignored' | 'review' | 'go_live' | 'failed'
  doctorId: string | null
  reviewLine: string | null
}

function intake(outcome: MembershipIntakeResult['outcome'], doctorId: string | null = null, reviewLine: string | null = null): MembershipIntakeResult {
  return { outcome, doctorId, reviewLine }
}

const DOCTOR_COLUMNS = 'id, email, first_name, last_name, city, state, user_id, stripe_customer_id, verification_status, is_approved, go_live_flow_at, phone, lead_notification_emails, lead_alert_phones'
const DOCTOR_BASIC = 'id, email, first_name, last_name, city, state, user_id, stripe_customer_id, verification_status, is_approved, go_live_flow_at, phone'

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string')
  if (typeof value === 'string' && value.trim()) return [value.trim()]
  return []
}

type DoctorLookup = {
  ilike: (column: string, value: string) => DoctorLookup
  eq: (column: string, value: string) => DoctorLookup
  in: (column: string, values: string[]) => DoctorLookup
  contains: (column: string, value: string[]) => DoctorLookup
  limit: (count: number) => Promise<{ data?: Record<string, unknown>[] | null; error?: { code?: string } | null }>
}

async function doctorQuery(
  apply: (query: DoctorLookup) => Promise<{ data?: Record<string, unknown>[] | null; error?: { code?: string } | null }>,
  columns = DOCTOR_COLUMNS,
): Promise<Record<string, unknown>[]> {
  try {
    const result = await apply(db().from('doctors').select(columns))
    if (!result?.error) return result?.data || []
    if (columns === DOCTOR_COLUMNS) return doctorQuery(apply, DOCTOR_BASIC)
    return []
  } catch {
    return []
  }
}

async function existingListings(email: string, customerId: string | null): Promise<ListedDoctor[]> {
  const rows: ListedDoctor[] = []
  if (email) {
    for (const row of await doctorQuery((query) => query.ilike('email', email).limit(5))) rows.push(asListing(row))
  }
  if (customerId) {
    for (const row of await doctorQuery((query) => query.eq('stripe_customer_id', customerId).limit(5))) rows.push(asListing(row))
  }
  return rows
}

function asListing(row: Record<string, unknown>): ListedDoctor {
  return {
    id: text(row.id),
    email: text(row.email) || null,
    firstName: text(row.first_name),
    lastName: text(row.last_name),
    city: text(row.city),
    state: text(row.state) || null,
    userId: text(row.user_id) || null,
    stripeCustomerId: text(row.stripe_customer_id) || null,
    emails: [
      text(row.email),
      text(row.practice_email),
      text(row.contact_email),
      text(row.public_email),
      text(row.private_email),
      ...stringList(row.lead_notification_emails),
    ].filter(Boolean),
    phones: [
      text(row.phone),
      text(row.office_phone),
      text(row.public_phone),
      ...stringList(row.lead_alert_phones),
    ].filter(Boolean),
    verificationStatus: text(row.verification_status) || null,
    isApproved: row.is_approved === true,
    goLiveFlowAt: text(row.go_live_flow_at) || null,
  }
}

function rememberListing(map: Map<string, ListedDoctor>, row: Record<string, unknown>, extraEmail?: string, extraPhone?: string): void {
  const listing = asListing(row)
  if (!listing.id) return
  if (extraEmail) listing.emails = [...(listing.emails || []), extraEmail]
  if (extraPhone) listing.phones = [...(listing.phones || []), extraPhone]
  const prior = map.get(listing.id)
  if (!prior) {
    map.set(listing.id, listing)
    return
  }
  prior.emails = [...(prior.emails || []), ...(listing.emails || [])]
  prior.phones = [...(prior.phones || []), ...(listing.phones || [])]
  if (!prior.state && listing.state) prior.state = listing.state
}

async function authUserIdByEmail(email: string): Promise<string | null> {
  const env = resolveSupabaseAdminEnv(process.env, SUPABASE_URL || '')
  if (!env) return null
  try {
    const url = new URL('/auth/v1/admin/users', env.url)
    url.searchParams.set('filter', email)
    url.searchParams.set('page', '1')
    url.searchParams.set('per_page', '5')
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${env.key}`, apikey: env.key },
    })
    if (!response.ok) return null
    const body = await response.json() as { users?: Array<{ id?: string; email?: string }> } | Array<{ id?: string; email?: string }>
    const users = Array.isArray(body) ? body : body.users || []
    const wanted = email.trim().toLowerCase()
    const match = users.find((user) => (user.email || '').trim().toLowerCase() === wanted)
    return match?.id ? String(match.id) : null
  } catch {
    return null
  }
}

async function findCandidateListings(identity: CheckoutIdentity): Promise<ListedDoctor[]> {
  const map = new Map<string, ListedDoctor>()
  const { email, customerId, phoneKey, surname, city, state } = listingSearchFromIdentity(identity)
  if (email) {
    for (const row of await doctorQuery((query) => query.ilike('email', email).limit(8))) rememberListing(map, row, email)
    for (const row of await doctorQuery((query) => query.contains('lead_notification_emails', [email]).limit(8))) rememberListing(map, row, email)
    for (const column of ['practice_email', 'contact_email', 'public_email', 'private_email']) {
      for (const row of await doctorQuery((query) => query.ilike(column, email).limit(8), `${DOCTOR_BASIC}, ${column}`)) {
        rememberListing(map, row, email)
      }
    }
    let profileIds: string[] = []
    try {
      const profiles = await db().from('profiles').select('id, email').ilike('email', email).limit(5)
      profileIds = (profiles.data || []).map((row: { id?: string }) => text(row.id)).filter(Boolean)
    } catch {
      profileIds = []
    }
    if (profileIds.length) {
      for (const row of await doctorQuery((query) => query.in('user_id', profileIds).limit(8))) rememberListing(map, row, email)
    }
    const authId = await authUserIdByEmail(email)
    if (authId && !profileIds.includes(authId)) {
      for (const row of await doctorQuery((query) => query.eq('user_id', authId).limit(5))) rememberListing(map, row, email)
    }
  }
  if (customerId) {
    for (const row of await doctorQuery((query) => query.eq('stripe_customer_id', customerId).limit(5))) rememberListing(map, row)
  }
  if (phoneKey) {
    const alertVariants = [`+1${phoneKey}`, phoneKey, (identity.phone || '').trim()].filter(Boolean)
    for (const variant of alertVariants) {
      for (const row of await doctorQuery((query) => query.contains('lead_alert_phones', [variant]).limit(8))) {
        rememberListing(map, row, undefined, identity.phone || undefined)
      }
    }
    for (const column of ['phone', 'office_phone', 'public_phone']) {
      const columns = column === 'phone' ? DOCTOR_COLUMNS : `${DOCTOR_BASIC}, ${column}`
      for (const row of await doctorQuery((query) => query.ilike(column, `%${phoneKey}%`).limit(8), columns)) {
        const matched = [row.phone, row.office_phone, row.public_phone, ...stringList(row.lead_alert_phones)]
          .some((value) => phoneMatchKey(typeof value === 'string' ? value : null) === phoneKey)
        if (matched) rememberListing(map, row, undefined, identity.phone || undefined)
      }
    }
    const apps = await db().from('doctor_applications').select('doctor_id, mobile_e164').ilike('mobile_e164', `%${phoneKey}%`).limit(8)
    const doctorIds = (apps.data || [])
      .filter((row: { mobile_e164?: string }) => phoneMatchKey(text(row.mobile_e164)) === phoneKey)
      .map((row: { doctor_id?: string }) => text(row.doctor_id))
      .filter(Boolean)
    if (doctorIds.length) {
      for (const row of await doctorQuery((query) => query.in('id', doctorIds).limit(8))) rememberListing(map, row, undefined, identity.phone || undefined)
    }
  }
  if (surname) {
    if (city) {
      for (const row of await doctorQuery((query) => query.ilike('last_name', surname).ilike('city', city).limit(8))) rememberListing(map, row)
    }
    if (state) {
      for (const row of await doctorQuery((query) => query.ilike('last_name', surname).eq('state', state).limit(8))) rememberListing(map, row)
    }
  }
  return [...map.values()]
}

async function protectListings(listings: ListedDoctor[]): Promise<{
  welcomeOk: boolean
  preAutomation: boolean
  neverGoneLive: boolean
  doctorId: string | null
}> {
  let welcomeOk = false
  for (const row of listings) {
    if (await goLiveStepAlreadyOk(row.id, 'welcome')) welcomeOk = true
  }
  const legacy = listings.find((row) => isPublicLiveListing(row) && !row.goLiveFlowAt)
  let legacyHasRun = false
  if (legacy) {
    const runs = await db().from('doctor_go_live_runs').select('id').eq('doctor_id', legacy.id).limit(1)
    legacyHasRun = !runs.error && Array.isArray(runs.data) && runs.data.length > 0
  }
  const preAutomation = Boolean(legacy) && !legacyHasRun && !welcomeOk
  const doctorId = legacy?.id || listings.find((row) => isPublicLiveListing(row))?.id || listings[0]?.id || null
  return {
    welcomeOk,
    preAutomation,
    neverGoneLive: listingNeverGoneLive({ listingCount: listings.length, welcomeOk }),
    doctorId,
  }
}

function checkoutIsPaid(session: Record<string, any>): boolean {
  return session.payment_status === 'paid'
}

async function claim(identity: CheckoutIdentity): Promise<'new' | 'duplicate' | 'unavailable'> {
  const inserted = await db().from('doctor_checkout_claims').insert({
    stripe_session_id: identity.sessionId || null,
    stripe_customer_id: identity.customerId,
    stripe_subscription_id: identity.subscriptionId,
    email: identity.email,
    status: 'pending',
  })
  if (!inserted.error) return 'new'
  if (inserted.error.code === '23505') return 'duplicate'
  return 'unavailable'
}

async function startPaidGoLive(doctorId: string | null, paid: boolean): Promise<void> {
  if (!doctorId || !paid) return
  const { runDoctorGoLive } = await import('./orchestrator')
  try {
    await runDoctorGoLive({ doctorId, source: 'stripe' })
  } catch (error) {
    console.error('[go-live] follow-up failed', error instanceof Error ? error.name : 'error')
    throw error
  }
}

async function resumeClaim(identity: CheckoutIdentity, paid: boolean): Promise<void> {
  if (!paid) return
  let doctorId = ''
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const bySession = identity.sessionId
      ? await db().from('doctor_checkout_claims').select('doctor_id, status').eq('stripe_session_id', identity.sessionId).maybeSingle()
      : { data: null }
    const byCustomer = !bySession.data && identity.customerId
      ? await db().from('doctor_checkout_claims').select('doctor_id, status').eq('stripe_customer_id', identity.customerId).maybeSingle()
      : bySession
    const claimExists = Boolean(bySession.data || byCustomer.data)
    const listings = await existingListings(identity.email, identity.customerId)
    const plan = resumeClaimPlan({
      doctorId: text(byCustomer.data?.doctor_id) || null,
      claimExists,
      listings: listings.map((row) => ({ id: row.id })),
    })
    if (plan.action === 'wait') {
      await new Promise((resolve) => setTimeout(resolve, 400))
      continue
    }
    doctorId = plan.doctorId
    const guard = await protectListings(listings.filter((row) => row.id === doctorId).concat(listings))
    if (guard.welcomeOk || guard.preAutomation) {
      if (guard.doctorId) await linkStripeOnly(guard.doctorId, identity)
      if (identity.customerId) {
        await db().from('doctor_checkout_claims').update({ status: 'link_live', doctor_id: guard.doctorId || doctorId }).eq('stripe_customer_id', identity.customerId)
      }
      return
    }
    break
  }
  if (!doctorId) return
  if (identity.customerId) {
    await db().from('doctor_checkout_claims').update({ doctor_id: doctorId, status: 'go_live' }).eq('stripe_customer_id', identity.customerId).is('doctor_id', null)
  }
  const doctor = await db().from('doctors').select('verification_status, go_live_flow_at').eq('id', doctorId).maybeSingle()
  const welcomeOk = await priorWelcomeOk(doctorId)
  const preAutomation = doctor.data?.verification_status === 'verified' && !text(doctor.data?.go_live_flow_at) && !welcomeOk
  if (welcomeOk || preAutomation) {
    await linkStripeOnly(doctorId, identity)
    return
  }
  if (doctor.data?.verification_status === 'verified' && await priorCheckoutOk(doctorId) && welcomeOk) return
  await startPaidGoLive(doctorId, true)
}

async function priorCheckoutOk(doctorId: string): Promise<boolean> {
  return goLiveStepAlreadyOk(doctorId, 'checkout')
}

async function priorWelcomeOk(doctorId: string): Promise<boolean> {
  return goLiveStepAlreadyOk(doctorId, 'welcome')
}

type BeforeCreate =
  | { action: 'create' }
  | { action: 'use'; doctorId: string; goLive: boolean }
  | { action: 'flagged'; doctorId: string }

async function flagDuplicate(doctorId: string, identity: CheckoutIdentity): Promise<void> {
  await db().from('doctors').update({ listing_exception: 'duplicate_name_city', needs_review: true }).eq('id', doctorId)
  if (!identity.customerId) return
  await db().from('doctor_checkout_claims').update({
    status: 'duplicate',
    doctor_id: doctorId,
    detail: identity.email,
  }).eq('stripe_customer_id', identity.customerId)
}

/** Wider match shared by payment links, invoices, logged-in checkout, and reconcile. */
async function beforeCreate(identity: CheckoutIdentity): Promise<BeforeCreate> {
  const candidates = await findCandidateListings(identity)
  const decision = planDuplicateGuard({ identity, existing: candidates })
  if (decision.action === 'attach') {
    await linkStripeOnly(decision.doctorId, identity)
    const row = candidates.find((item) => item.id === decision.doctorId)
    const guard = await protectListings(row ? [row] : [])
    const sameBillingEmail = (row?.email || '').trim().toLowerCase() === identity.email.trim().toLowerCase()
    const sameCustomer = Boolean(identity.customerId && row?.stripeCustomerId && row.stripeCustomerId === identity.customerId)
    const goLive = (sameBillingEmail || sameCustomer) && !guard.welcomeOk && !guard.preAutomation
    return { action: 'use', doctorId: decision.doctorId, goLive }
  }
  if (decision.action === 'flag_duplicate') {
    await flagDuplicate(decision.doctorId, identity)
    return { action: 'flagged', doctorId: decision.doctorId }
  }
  return { action: 'create' }
}

async function recordUnmatchedPayment(identity: CheckoutIdentity, line: string): Promise<void> {
  const detail = line.slice(0, 500)
  const inserted = await db().from('doctor_checkout_claims').insert({
    stripe_session_id: identity.sessionId || null,
    stripe_customer_id: identity.customerId,
    stripe_subscription_id: identity.subscriptionId,
    email: identity.email || null,
    status: 'needs_review',
    detail,
  })
  if (!inserted.error) return
  if (inserted.error.code !== '23505') {
    console.error('[go-live] unmatched payment was not recorded', inserted.error.code || 'error')
    return
  }
  if (!identity.customerId) return
  await db().from('doctor_checkout_claims').update({ status: 'needs_review', detail }).eq('stripe_customer_id', identity.customerId).is('doctor_id', null)
}

/** A renewal that matches nothing is recorded for Raymond. It does not create a doctor. */
async function reviewInsteadOfCreate(identity: CheckoutIdentity): Promise<MembershipIntakeResult> {
  const before = await beforeCreate(identity)
  if (before.action === 'use') return intake('linked', before.doctorId)
  if (before.action === 'flagged') return intake('flagged', before.doctorId)
  const line = unmatchedPaymentLine(identity.name, identity.email)
  await recordUnmatchedPayment(identity, line)
  return intake('review', null, line)
}

async function hasEarlierPaidInvoice(subscriptionId: string, invoiceId: string): Promise<boolean> {
  if (!subscriptionId) return false
  try {
    const list = await stripe.invoices.list({ subscription: subscriptionId, limit: 24 })
    return list.data.some((row) => {
      if (invoiceId && row.id === invoiceId) return false
      return row.status === 'paid' && Number(row.amount_paid || 0) > 0
    })
  } catch (error) {
    console.error('[go-live] earlier invoice lookup failed', error instanceof Error ? error.name : 'error')
    return false
  }
}

export async function ingestMembershipCheckout(session: Record<string, any>): Promise<MembershipIntakeResult> {
  try {
    const priceId = await priceFromSession(session)
    const product = await productFromPriceId(priceId)
    const identity = identityFromSession(session, priceId)
    const membership = isDoctorMembershipCheckout(identity, {
      priceIds: doctorPriceIds(),
      studentPriceIds: studentPriceIds(),
    }, product)
    if (!membership || !identity.email || isStudentProduct(product)) return intake('ignored')
    const paid = checkoutIsPaid(session) || text(session.id).startsWith('invoice-')
    if (identity.userId) return ingestLoggedIn(identity, paid)
    const claimed = await claim(identity)
    if (claimed === 'duplicate') {
      await resumeClaim(identity, paid)
      return intake('ignored')
    }
    if (claimed === 'unavailable') return intake('ignored')
    const existing = await existingListings(identity.email, identity.customerId)
    const guard = await protectListings(existing)
    let hasOk = false
    for (const row of existing) {
      if (await priorCheckoutOk(row.id)) hasOk = true
    }
    const plan = planCheckoutIntake({
      membership: true,
      listings: existing,
      hasOkGoLive: hasOk,
      welcomeOk: guard.welcomeOk,
      preAutomation: guard.preAutomation,
    })
    if (plan.action === 'ignore') return intake('ignored')
    if (plan.action === 'link_live') {
      await linkStripeOnly(plan.doctorId, identity)
      await db().from('doctor_checkout_claims').update({ status: 'link_live', doctor_id: plan.doctorId }).eq('stripe_customer_id', identity.customerId)
      return intake('linked', plan.doctorId)
    }
    if (plan.action === 'go_live') {
      const live = existing.find((row) => row.id === plan.doctorId)
      if (live && (live.verificationStatus === 'verified' || live.isApproved)) await linkStripeOnly(plan.doctorId, identity)
      else await markPaymentReceived(plan.doctorId, identity)
      await db().from('doctor_checkout_claims').update({ status: 'go_live', doctor_id: plan.doctorId }).eq('stripe_customer_id', identity.customerId)
      await startPaidGoLive(plan.doctorId, paid)
      return intake('go_live', plan.doctorId)
    }
    const before = await beforeCreate(identity)
    if (before.action === 'flagged') return intake('flagged', before.doctorId)
    if (before.action === 'use') {
      await db().from('doctor_checkout_claims').update({
        status: before.goLive ? 'go_live' : 'link_live',
        doctor_id: before.doctorId,
      }).eq('stripe_customer_id', identity.customerId)
      if (!before.goLive) return intake('linked', before.doctorId)
      await startPaidGoLive(before.doctorId, paid)
      return intake('go_live', before.doctorId)
    }
    const doctorId = await createPendingDoctor(identity)
    if (!doctorId) return intake('ignored')
    await db().from('doctor_checkout_claims').update({ status: 'create_pending', doctor_id: doctorId }).eq('stripe_customer_id', identity.customerId)
    await startPaidGoLive(doctorId, paid)
    return intake('created', doctorId)
  } catch (error) {
    console.error('[go-live] payment-link intake failed', error instanceof Error ? error.name : 'error')
    throw error
  }
}

async function ingestLoggedIn(identity: CheckoutIdentity, paid: boolean): Promise<MembershipIntakeResult> {
  const userId = identity.userId || ''
  const { data: profile } = await db().from('profiles').select('id, role').eq('id', userId).maybeSingle()
  const role = text(profile?.role) || text(identity.metadataRole) || null
  const { data: doctor } = await db().from('doctors').select('id').eq('user_id', userId).maybeSingle()
  const doctorId = text(doctor?.id) || null
  const loaded = doctorId
    ? await db().from('doctors').select('id, email, first_name, last_name, city, user_id, stripe_customer_id, verification_status, is_approved, go_live_flow_at').eq('id', doctorId).maybeSingle()
    : { data: null }
  const guard = loaded.data
    ? await protectListings([asListing(loaded.data)])
    : { welcomeOk: false, preAutomation: false, neverGoneLive: false, doctorId }
  const hasOk = doctorId ? await priorCheckoutOk(doctorId) : false
  const plan = planLoggedInCheckout({
    membership: true,
    role,
    doctorId,
    hasOkGoLive: hasOk,
    welcomeOk: guard.welcomeOk,
    preAutomation: guard.preAutomation,
  })
  if (plan.action === 'ignore') {
    if (plan.reason === 'student' && userId) {
      await db().from('profiles').update({ tier: 'student_paid' }).eq('id', userId)
    }
    return intake('ignored')
  }
  if (plan.action === 'store_ids' && plan.doctorId) {
    await linkStripeOnly(plan.doctorId, identity)
    return intake('linked', plan.doctorId)
  }
  if (plan.action === 'go_live' && plan.doctorId) {
    await linkStripeOnly(plan.doctorId, identity)
    await startPaidGoLive(plan.doctorId, paid)
    return intake('go_live', plan.doctorId)
  }
  const before = await beforeCreate(identity)
  if (before.action === 'flagged') return intake('flagged', before.doctorId)
  if (before.action === 'use') {
    if (!before.goLive) return intake('linked', before.doctorId)
    await startPaidGoLive(before.doctorId, paid)
    return intake('go_live', before.doctorId)
  }
  const target = await createPendingDoctor({ ...identity, userId })
  if (!target) return intake('ignored')
  await linkStripeOnly(target, identity)
  await startPaidGoLive(target, paid)
  return intake('created', target)
}

async function createPendingDoctor(identity: CheckoutIdentity): Promise<string | null> {
  const existingProfile = identity.userId
    ? await db().from('profiles').select('id, role').eq('id', identity.userId).maybeSingle()
    : await db().from('profiles').select('id, role').ilike('email', identity.email).maybeSingle()
  if (existingProfile.data?.id) {
    const userId = String(existingProfile.data.id)
    const doctor = await db().from('doctors').select('id').eq('user_id', userId).maybeSingle()
    const promo = promotionPlan({
      hasAccount: true,
      hasDoctor: Boolean(doctor.data?.id),
      role: text(existingProfile.data.role) || null,
    })
    if (promo.action === 'exclude') return null
    if (promo.action === 'link_existing') {
      if (promo.promoteRole) {
        await db().from('profiles').update({ role: 'doctor', tier: 'pro' }).eq('id', userId)
        try {
          const current = await db().auth.admin.getUserById(userId)
          const meta = current.data?.user?.app_metadata
          const appMetadata = meta && typeof meta === 'object' ? { ...meta, role: 'doctor' } : { role: 'doctor' }
          await db().auth.admin.updateUserById(userId, { app_metadata: appMetadata })
        } catch (error) {
          console.error('[go-live] role update failed', error instanceof Error ? error.name : 'error')
        }
      }
      if (doctor.data?.id) {
        await markPaymentReceived(String(doctor.data.id), identity, userId)
        return String(doctor.data.id)
      }
      return insertDoctorForUser(userId, identity)
    }
  }
  const created = await db().auth.admin.createUser({
    email: identity.email,
    email_confirm: true,
    app_metadata: { role: 'doctor' },
    user_metadata: { full_name: identity.name },
  })
  const userId = created.data?.user?.id
  if (!userId) {
    const { data: profile } = await db().from('profiles').select('id').ilike('email', identity.email).maybeSingle()
    if (!profile?.id) return null
    return createPendingDoctor({ ...identity, userId: String(profile.id) })
  }
  return insertDoctorForUser(String(userId), identity)
}

async function insertDoctorForUser(userId: string, identity: CheckoutIdentity): Promise<string | null> {
  const { firstName, lastName } = splitName(identity.name || identity.email)
  const country = countryFromCurrency(identity.currency, identity.country)
  const now = new Date().toISOString()
  const contact = checkoutApplicationContact({
    phone: identity.phone,
    smsConsent: identity.smsConsent,
    country,
    now,
  })
  await db().from('profiles').upsert({
    id: userId,
    email: identity.email,
    full_name: identity.name || identity.email,
    role: 'doctor',
    tier: 'pro',
    stripe_customer_id: identity.customerId,
  })
  const slug = `${(identity.name || identity.email).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString(36)}`
  const doctor = await db().from('doctors').insert({
    user_id: userId,
    first_name: firstName,
    last_name: lastName,
    email: identity.email,
    slug,
    clinic_name: identity.clinicName || '',
    city: identity.city || '',
    state: identity.state || '',
    country,
    address: '',
    bio: '',
    phone: contact.listingPhone,
    specialties: [],
    verification_status: 'hidden',
    membership_tier: 'free',
    is_approved: false,
    paid_at: now,
    stripe_customer_id: identity.customerId,
    stripe_subscription_id: identity.subscriptionId,
    region_code: country === 'US' ? 'US' : country,
  }).select('id').single()
  if (!doctor.data?.id) return null
  await db().from('doctor_applications').insert({
    doctor_id: doctor.data.id,
    user_id: userId,
    status: PAID_CHECKOUT_APPLICATION_STATUS,
    stripe_customer_id: identity.customerId,
    stripe_subscription_id: identity.subscriptionId,
    payment_received_at: now,
    city: identity.city,
    state: identity.state,
    country,
    plan: (identity.amountTotal || 0) >= 50000 ? 'annual' : 'monthly',
    ...(contact.application || {}),
  })
  if (contact.alertPhone) {
    const { saveDoctorAlertPhone } = await import('@/lib/applications/store')
    await saveDoctorAlertPhone(doctor.data.id, contact.alertPhone, true, now)
  } else {
    await db().from('doctors').update({
      sms_prompt_required: true,
      ...(identity.smsConsent === true && (identity.phone || '').trim() ? { sms_region_note: 'outside_us_canada' } : {}),
    }).eq('id', doctor.data.id)
  }
  return String(doctor.data.id)
}

async function attachExistingUser(userId: string, identity: CheckoutIdentity, country: string): Promise<string | null> {
  const { data } = await db().from('doctors').select('id').eq('user_id', userId).maybeSingle()
  if (!data?.id) return null
  await markPaymentReceived(String(data.id), identity, userId, country)
  return String(data.id)
}

async function linkStripeOnly(doctorId: string, identity: CheckoutIdentity): Promise<void> {
  await db().from('doctors').update({
    stripe_customer_id: identity.customerId,
    stripe_subscription_id: identity.subscriptionId,
  }).eq('id', doctorId)
}

async function markPaymentReceived(doctorId: string, identity: CheckoutIdentity, userId?: string, country?: string): Promise<void> {
  const { data } = await db().from('doctors').select('verification_status, is_approved').eq('id', doctorId).maybeSingle()
  if (data?.verification_status === 'verified' || data?.is_approved === true) {
    await linkStripeOnly(doctorId, identity)
    return
  }
  const now = new Date().toISOString()
  const resolvedCountry = country || countryFromCurrency(identity.currency, identity.country)
  const contact = checkoutApplicationContact({
    phone: identity.phone,
    smsConsent: identity.smsConsent,
    country: resolvedCountry,
    now,
  })
  await db().from('doctors').update({
    paid_at: now,
    stripe_customer_id: identity.customerId,
    stripe_subscription_id: identity.subscriptionId,
    verification_status: 'hidden',
    is_approved: false,
  }).eq('id', doctorId).neq('verification_status', 'verified')
  const existing = await db().from('doctor_applications').select('id').eq('doctor_id', doctorId).maybeSingle()
  const patch = {
    status: PAID_CHECKOUT_APPLICATION_STATUS,
    stripe_customer_id: identity.customerId,
    stripe_subscription_id: identity.subscriptionId,
    payment_received_at: now,
    city: identity.city,
    state: identity.state,
    country: resolvedCountry,
    user_id: userId,
    ...(contact.application || {}),
  }
  if (existing.data?.id) await db().from('doctor_applications').update(patch).eq('id', existing.data.id)
  else await db().from('doctor_applications').insert({ ...patch, doctor_id: doctorId })
  if (contact.alertPhone) {
    const { saveDoctorAlertPhone } = await import('@/lib/applications/store')
    await saveDoctorAlertPhone(doctorId, contact.alertPhone, true, now)
  }
}

async function invoiceProduct(invoice: {
  id?: string
  lines?: { data?: Array<Record<string, unknown>> } | null
}): Promise<ProductHint | null> {
  const first = invoice.lines?.data?.[0]
  let priceId = first ? invoiceLineProduct(first).priceId : null
  if (!priceId && invoice.id) {
    try {
      const full = await stripe.invoices.retrieve(invoice.id, { expand: ['lines.data.price.product'] })
      const line = full.lines?.data?.[0]
      if (line) {
        priceId = invoiceLineProduct(line as unknown as Parameters<typeof invoiceLineProduct>[0]).priceId
      }
    } catch {
      priceId = null
    }
  }
  return productFromPriceId(priceId)
}

export async function noteMembershipInvoicePaid(invoice: {
  id?: string
  customer?: unknown
  subscription?: unknown
  amount_paid?: number | null
  currency?: string | null
  billing_reason?: string | null
  lines?: { data?: Array<Record<string, unknown>> } | null
  parent?: { subscription_details?: { subscription?: unknown } | null } | null
}): Promise<MembershipIntakeResult> {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : ''
  try {
    const subscriptionId = subscriptionIdFromInvoice(invoice) || ''
    const amountPaid = Number(invoice.amount_paid || 0)
    if (!customerId || amountPaid <= 0) return intake('ignored')
    const product = await invoiceProduct(invoice)
    if (isStudentProduct(product)) return intake('ignored')
    const customer = await stripe.customers.retrieve(customerId)
    if (customer.deleted) return intake('ignored')
    const session = {
      id: `invoice-${text(invoice.id) || customerId}`,
      customer: customerId,
      subscription: subscriptionId,
      customer_details: {
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        address: customer.address || null,
      },
      customer_email: customer.email,
      mode: subscriptionId ? 'subscription' : 'payment',
      payment_status: 'paid',
      currency: invoice.currency || null,
      amount_total: amountPaid,
      allow_amount_fallback: !product,
      metadata: {},
    }
    const identity = identityFromSession(session, null)
    const membership = isDoctorMembershipCheckout(identity, {
      priceIds: doctorPriceIds(),
      studentPriceIds: studentPriceIds(),
    }, product)
    if (!membership) return intake('ignored')
    const earlierPaidInvoice = await hasEarlierPaidInvoice(subscriptionId, text(invoice.id))
    const blocked = blocksNewDoctor({ billingReason: invoice.billing_reason || null, earlierPaidInvoice })
    const listings = await existingListings(text(customer.email), customerId)
    const guard = await protectListings(listings)
    const { data: applicationRows } = await db()
      .from('doctor_applications')
      .select('id, status, reviewed_at, doctor_id, created_at')
      .eq('stripe_customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(20)
    const applications = (applicationRows || []).map((row: Record<string, unknown>) => ({
      id: text(row.id),
      status: text(row.status),
      reviewedAt: text(row.reviewed_at) || null,
      createdAt: text(row.created_at),
    }))
    const decision = planInvoiceIntake({
      billingReason: invoice.billing_reason || null,
      amountPaid,
      membership: true,
      hasSubscription: Boolean(subscriptionId),
      welcomeOk: guard.welcomeOk,
      preAutomation: guard.preAutomation,
      neverGoneLive: guard.neverGoneLive,
      earlierPaidInvoice,
      applications,
      listings,
    })
    if (decision.action === 'needs_review' || (blocked && (decision.action === 'go_live' || decision.action === 'create_and_go_live' || decision.action === 'complete_bank'))) {
      return reviewInsteadOfCreate(identity)
    }
    if (decision.action === 'link_live') {
      await linkStripeOnly(decision.doctorId, identity)
      return intake('linked', decision.doctorId)
    }
    if (decision.action === 'ignore' && (decision.reason === 'already_live' || decision.reason === 'renewal')) {
      const live = listings[0]
      if (!live) return intake('ignored')
      await linkStripeOnly(live.id, identity)
      return intake('linked', live.id)
    }
    if (decision.action === 'ignore') return intake('ignored')
    if (decision.action === 'go_live' || decision.action === 'create_and_go_live' || decision.action === 'complete_bank') {
      return ingestMembershipCheckout(session)
    }
    return intake('ignored')
  } catch (error) {
    console.error('[go-live] invoice intake failed', error instanceof Error ? error.name : 'error')
    await recordInvoiceFailure(customerId, error)
    return intake('failed')
  }
}

async function recordInvoiceFailure(customerId: string, error: unknown): Promise<void> {
  if (!customerId) return
  try {
    const listings = await existingListings('', customerId)
    const doctorId = listings[0]?.id
    if (!doctorId) return
    const { openGoLiveRun, saveGoLiveStep } = await import('./log')
    const runId = await openGoLiveRun(doctorId, 'stripe', false)
    const message = error instanceof Error ? error.message : 'Invoice intake failed'
    await saveGoLiveStep(runId, doctorId, {
      step: 'checkout',
      status: 'failed',
      reason: `Invoice intake failed. ${message}`.slice(0, 500),
    })
  } catch (nested) {
    console.error('[go-live] invoice failure log failed', nested instanceof Error ? nested.name : 'error')
  }
}

export async function adoptStaleCheckoutClaims(): Promise<number> {
  const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString()
  const { data } = await db()
    .from('doctor_checkout_claims')
    .select('id, stripe_customer_id, stripe_subscription_id, email, doctor_id, created_at')
    .is('doctor_id', null)
    .lt('created_at', cutoff)
    .limit(20)
  let adopted = 0
  for (const row of data || []) {
    const email = text(row.email)
    if (!email.includes('@')) continue
    const taken = await db()
      .from('doctor_checkout_claims')
      .update({ status: 'creating' })
      .eq('id', row.id)
      .is('doctor_id', null)
      .select('id')
    if (!taken.data?.length) continue
    const listings = await existingListings(email, text(row.stripe_customer_id) || null)
    const guard = await protectListings(listings)
    if ((guard.welcomeOk || guard.preAutomation) && guard.doctorId) {
      await db().from('doctor_checkout_claims').update({ doctor_id: guard.doctorId, status: 'link_live' }).eq('id', row.id)
      continue
    }
    const identity: CheckoutIdentity = {
      sessionId: '',
      customerId: text(row.stripe_customer_id) || null,
      subscriptionId: text(row.stripe_subscription_id) || null,
      email,
      name: email,
      phone: null,
      smsConsent: null,
      city: null,
      state: null,
      country: null,
      clinicName: null,
      amountTotal: null,
      currency: null,
      priceId: null,
      metadataType: 'doctor_membership',
      metadataRole: 'doctor',
      userId: null,
      mode: 'subscription',
      paymentLinkPresent: true,
    }
    const before = await beforeCreate(identity)
    if (before.action === 'flagged') {
      await db().from('doctor_checkout_claims').update({ doctor_id: before.doctorId, status: 'duplicate' }).eq('id', row.id)
      continue
    }
    if (before.action === 'use') {
      await db().from('doctor_checkout_claims').update({
        doctor_id: before.doctorId,
        status: before.goLive ? 'go_live' : 'link_live',
      }).eq('id', row.id)
      if (!before.goLive) continue
      await startPaidGoLive(before.doctorId, true)
      adopted += 1
      continue
    }
    const doctorId = await createPendingDoctor(identity)
    if (!doctorId) continue
    await db().from('doctor_checkout_claims').update({ doctor_id: doctorId, status: 'create_pending' }).eq('id', row.id)
    await startPaidGoLive(doctorId, true)
    adopted += 1
  }
  return adopted
}
