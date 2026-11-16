import 'server-only'

import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase-admin'
import { doctorPriceIds, studentPriceIds } from '@/lib/member-referrals/catalog'
import { isStudentProduct, type ProductHint } from './products.ts'
import { goLiveStepAlreadyOk } from './log.ts'
import {
  checkoutApplicationContact,
  countryFromCurrency,
  invoiceIsRenewal,
  invoiceLineProduct,
  isDoctorMembershipCheckout,
  phoneFromCheckout,
  planCheckoutIntake,
  planInvoiceIntake,
  planLoggedInCheckout,
  planPathB,
  promotionPlan,
  readCheckoutContact,
  splitName,
  subscriptionIdFromInvoice,
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
    city: contact.city,
    state: contact.state,
    country: null,
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

async function existingListings(email: string, customerId: string | null): Promise<Array<ExistingListing & { verificationStatus: string | null; isApproved: boolean | null }>> {
  const rows: Array<ExistingListing & { verificationStatus: string | null; isApproved: boolean | null }> = []
  if (email) {
    const { data } = await db().from('doctors').select('id, email, first_name, last_name, city, user_id, stripe_customer_id, verification_status, is_approved').ilike('email', email).limit(5)
    for (const row of data || []) rows.push(asListing(row))
  }
  if (customerId) {
    const { data } = await db().from('doctors').select('id, email, first_name, last_name, city, user_id, stripe_customer_id, verification_status, is_approved').eq('stripe_customer_id', customerId).limit(5)
    for (const row of data || []) rows.push(asListing(row))
  }
  return rows
}

function asListing(row: Record<string, unknown>): ExistingListing & { verificationStatus: string | null; isApproved: boolean | null } {
  return {
    id: text(row.id),
    email: text(row.email) || null,
    firstName: text(row.first_name),
    lastName: text(row.last_name),
    city: text(row.city),
    userId: text(row.user_id) || null,
    stripeCustomerId: text(row.stripe_customer_id) || null,
    verificationStatus: text(row.verification_status) || null,
    isApproved: row.is_approved === true,
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
  const bySession = identity.sessionId
    ? await db().from('doctor_checkout_claims').select('doctor_id, status').eq('stripe_session_id', identity.sessionId).maybeSingle()
    : { data: null }
  const byCustomer = !bySession.data && identity.customerId
    ? await db().from('doctor_checkout_claims').select('doctor_id, status').eq('stripe_customer_id', identity.customerId).maybeSingle()
    : bySession
  let doctorId = text(byCustomer.data?.doctor_id)
  if (!doctorId) {
    const listings = await existingListings(identity.email, identity.customerId)
    const live = listings.find((row) => row.verificationStatus === 'verified' || row.isApproved)
    if (live) {
      if (!(await priorCheckoutOk(live.id))) await startPaidGoLive(live.id, true)
      return
    }
    doctorId = listings[0]?.id || ''
    if (!doctorId) doctorId = (await createPendingDoctor(identity)) || ''
    if (doctorId && identity.customerId) {
      await db().from('doctor_checkout_claims').update({ doctor_id: doctorId, status: 'create_pending' }).eq('stripe_customer_id', identity.customerId)
    }
  }
  if (!doctorId) return
  const doctor = await db().from('doctors').select('verification_status').eq('id', doctorId).maybeSingle()
  if (doctor.data?.verification_status === 'verified' && await priorCheckoutOk(doctorId)) return
  await startPaidGoLive(doctorId, true)
}

async function priorCheckoutOk(doctorId: string): Promise<boolean> {
  return goLiveStepAlreadyOk(doctorId, 'checkout')
}

export async function ingestMembershipCheckout(session: Record<string, any>): Promise<void> {
  try {
    const priceId = await priceFromSession(session)
    const product = await productFromPriceId(priceId)
    const identity = identityFromSession(session, priceId)
    const membership = isDoctorMembershipCheckout(identity, {
      priceIds: doctorPriceIds(),
      studentPriceIds: studentPriceIds(),
    }, product)
    if (!membership || !identity.email || isStudentProduct(product)) return
    const paid = checkoutIsPaid(session) || text(session.id).startsWith('invoice-')
    if (identity.userId) {
      await ingestLoggedIn(identity, paid)
      return
    }
    const claimed = await claim(identity)
    if (claimed === 'duplicate') {
      await resumeClaim(identity, paid)
      return
    }
    if (claimed === 'unavailable') return
    const existing = await existingListings(identity.email, identity.customerId)
    let hasOk = false
    for (const row of existing) {
      if (await priorCheckoutOk(row.id)) hasOk = true
    }
    const intake = planCheckoutIntake({ membership: true, listings: existing, hasOkGoLive: hasOk })
    if (intake.action === 'ignore') return
    if (intake.action === 'link_live') {
      await linkStripeOnly(intake.doctorId, identity)
      await db().from('doctor_checkout_claims').update({ status: 'link_live', doctor_id: intake.doctorId }).eq('stripe_customer_id', identity.customerId)
      return
    }
    if (intake.action === 'go_live') {
      const live = existing.find((row) => row.id === intake.doctorId)
      if (live && (live.verificationStatus === 'verified' || live.isApproved)) await linkStripeOnly(intake.doctorId, identity)
      else await markPaymentReceived(intake.doctorId, identity)
      await db().from('doctor_checkout_claims').update({ status: 'go_live', doctor_id: intake.doctorId }).eq('stripe_customer_id', identity.customerId)
      await startPaidGoLive(intake.doctorId, paid)
      return
    }
    const duplicate = planPathB({ identity, existing, claimed: false, membership: true })
    if (duplicate.action === 'flag_duplicate') {
      await db().from('doctors').update({ listing_exception: 'duplicate_name_city', needs_review: true }).eq('id', duplicate.doctorId)
      await db().from('doctor_checkout_claims').update({ status: 'duplicate', doctor_id: duplicate.doctorId, detail: identity.email }).eq('stripe_customer_id', identity.customerId)
      return
    }
    const doctorId = await createPendingDoctor(identity)
    if (!doctorId) return
    await db().from('doctor_checkout_claims').update({ status: 'create_pending', doctor_id: doctorId }).eq('stripe_customer_id', identity.customerId)
    await startPaidGoLive(doctorId, paid)
  } catch (error) {
    console.error('[go-live] payment-link intake failed', error instanceof Error ? error.name : 'error')
    throw error
  }
}

async function ingestLoggedIn(identity: CheckoutIdentity, paid: boolean): Promise<void> {
  const userId = identity.userId || ''
  const { data: profile } = await db().from('profiles').select('id, role').eq('id', userId).maybeSingle()
  const role = text(profile?.role) || text(identity.metadataRole) || null
  const { data: doctor } = await db().from('doctors').select('id').eq('user_id', userId).maybeSingle()
  const doctorId = text(doctor?.id) || null
  const hasOk = doctorId ? await priorCheckoutOk(doctorId) : false
  const plan = planLoggedInCheckout({ membership: true, role, doctorId, hasOkGoLive: hasOk })
  if (plan.action === 'ignore') {
    if (plan.reason === 'student' && userId) {
      await db().from('profiles').update({ tier: 'student_paid' }).eq('id', userId)
    }
    return
  }
  if (plan.action === 'store_ids' && plan.doctorId) {
    await linkStripeOnly(plan.doctorId, identity)
    return
  }
  const target = plan.action === 'go_live' && plan.doctorId
    ? plan.doctorId
    : await createPendingDoctor({ ...identity, userId })
  if (!target) return
  await linkStripeOnly(target, identity)
  await startPaidGoLive(target, paid)
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
    status: 'under_review',
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
    status: 'under_review',
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
}): Promise<void> {
  try {
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : ''
    const subscriptionId = subscriptionIdFromInvoice(invoice) || ''
    const amountPaid = Number(invoice.amount_paid || 0)
    if (!customerId || amountPaid <= 0) return
    if (invoiceIsRenewal(invoice.billing_reason || null, Boolean(subscriptionId))) return
    const product = await invoiceProduct(invoice)
    if (isStudentProduct(product)) return
    const customer = await stripe.customers.retrieve(customerId)
    if (customer.deleted) return
    const identity = identityFromSession({
      id: `invoice-${text(invoice.id) || customerId}`,
      customer: customerId,
      subscription: subscriptionId,
      customer_details: { email: customer.email, name: customer.name, phone: customer.phone },
      customer_email: customer.email,
      mode: subscriptionId ? 'subscription' : 'payment',
      currency: invoice.currency || null,
      amount_total: amountPaid,
      allow_amount_fallback: !product,
      metadata: {},
    }, null)
    const membership = isDoctorMembershipCheckout(identity, {
      priceIds: doctorPriceIds(),
      studentPriceIds: studentPriceIds(),
    }, product)
    if (!membership) return
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
    const listings = await existingListings(text(customer.email), customerId)
    let hasOk = false
    for (const row of listings) {
      if (await priorCheckoutOk(row.id)) hasOk = true
    }
    const intake = planInvoiceIntake({
      billingReason: invoice.billing_reason || null,
      amountPaid,
      membership: true,
      hasSubscription: Boolean(subscriptionId),
      hasOkGoLive: hasOk,
      applications,
      listings,
    })
    if (intake.action === 'ignore' && intake.reason === 'already_live') {
      const live = listings[0]
      if (live) await linkStripeOnly(live.id, identity)
      return
    }
    if (intake.action === 'ignore') return
    if (intake.action === 'go_live' || intake.action === 'create_and_go_live') {
      await ingestMembershipCheckout({
        id: `invoice-${text(invoice.id) || customerId}`,
        customer: customerId,
        subscription: subscriptionId,
        customer_details: { email: customer.email, name: customer.name, phone: customer.phone },
        customer_email: customer.email,
        mode: subscriptionId ? 'subscription' : 'payment',
        payment_status: 'paid',
        currency: invoice.currency || null,
        amount_total: amountPaid,
        allow_amount_fallback: !product,
        metadata: product ? {} : {},
      })
      return
    }
    if (intake.action === 'complete_bank') {
      await ingestMembershipCheckout({
        id: `invoice-${text(invoice.id) || customerId}`,
        customer: customerId,
        subscription: subscriptionId,
        customer_details: { email: customer.email, name: customer.name, phone: customer.phone },
        customer_email: customer.email,
        mode: subscriptionId ? 'subscription' : 'payment',
        payment_status: 'paid',
        currency: invoice.currency || null,
        amount_total: amountPaid,
        allow_amount_fallback: !product,
        metadata: {},
      })
    }
  } catch (error) {
    console.error('[go-live] invoice intake failed', error instanceof Error ? error.name : 'error')
  }
}
