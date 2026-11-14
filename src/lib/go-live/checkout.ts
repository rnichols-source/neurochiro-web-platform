import 'server-only'

import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase-admin'
import { doctorPriceIds, studentPriceIds } from '@/lib/member-referrals/catalog'
import { finishDecision } from './finish'
import { loadApplicationById } from '@/lib/applications/store'
import { approvalSmsFor } from '@/lib/applications/approval-sms'
import {
  countryFromCurrency,
  isDoctorMembershipCheckout,
  phoneFromCheckout,
  planCheckoutIntake,
  planInvoiceIntake,
  planPathB,
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

async function claim(identity: CheckoutIdentity): Promise<boolean> {
  const inserted = await db().from('doctor_checkout_claims').insert({
    stripe_session_id: identity.sessionId || null,
    stripe_customer_id: identity.customerId,
    stripe_subscription_id: identity.subscriptionId,
    email: identity.email,
    status: 'pending',
  })
  if (!inserted.error) return true
  return inserted.error.code !== '23505' && inserted.error.code !== '42P01'
}

export async function ingestMembershipCheckout(session: Record<string, any>): Promise<void> {
  try {
    if (text(session.metadata?.userId)) return
    const subscriptionId = text(session.subscription) || null
    const priceId = await priceFromSubscription(subscriptionId)
    const identity = identityFromSession(session, priceId)
    const membership = isDoctorMembershipCheckout(identity, {
      priceIds: doctorPriceIds(),
      studentPriceIds: studentPriceIds(),
    })
    if (!membership || !identity.email) return
    const claimed = await claim(identity)
    if (!claimed) return
    const existing = await existingListings(identity.email, identity.customerId)
    const intake = planCheckoutIntake({ membership: true, listings: existing })
    if (intake.action === 'ignore') return
    if (intake.action === 'link_live') {
      await linkStripeOnly(intake.doctorId, identity)
      await db().from('doctor_checkout_claims').update({ status: 'link_live', doctor_id: intake.doctorId }).eq('stripe_customer_id', identity.customerId)
      return
    }
    if (intake.action === 'attach_pending') {
      await markPaymentReceived(intake.doctorId, identity)
      await db().from('doctor_checkout_claims').update({ status: 'attach_pending', doctor_id: intake.doctorId }).eq('stripe_customer_id', identity.customerId)
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
  } catch (error) {
    console.error('[go-live] payment-link intake failed', error instanceof Error ? error.name : 'error')
  }
}

async function createPendingDoctor(identity: CheckoutIdentity): Promise<string | null> {
  const { firstName, lastName } = splitName(identity.name || identity.email)
  const country = countryFromCurrency(identity.currency, identity.country)
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
    return attachExistingUser(String(profile.id), identity, country)
  }
  await db().from('profiles').upsert({
    id: userId,
    email: identity.email,
    full_name: identity.name || identity.email,
    role: 'doctor',
    tier: 'standard',
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
    phone: identity.phone || '',
    specialties: [],
    verification_status: 'hidden',
    membership_tier: 'free',
    is_approved: false,
    paid_at: new Date().toISOString(),
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
    payment_received_at: new Date().toISOString(),
    city: identity.city,
    state: identity.state,
    country,
    plan: (identity.amountTotal || 0) >= 50000 ? 'annual' : 'monthly',
  })
  if (identity.phone && identity.smsConsent === true) {
    const { saveDoctorAlertPhone } = await import('@/lib/applications/store')
    const { canTextNumber } = await import('./plan')
    if (canTextNumber(identity.phone)) {
      await saveDoctorAlertPhone(doctor.data.id, identity.phone, true, new Date().toISOString())
    } else {
      await db().from('doctors').update({ sms_region_note: 'outside_us_canada', sms_prompt_required: false }).eq('id', doctor.data.id)
    }
  } else {
    await db().from('doctors').update({ sms_prompt_required: true }).eq('id', doctor.data.id)
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
  await db().from('doctors').update({
    paid_at: new Date().toISOString(),
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
    payment_received_at: new Date().toISOString(),
    city: identity.city,
    state: identity.state,
    country: country || countryFromCurrency(identity.currency, identity.country),
    user_id: userId,
  }
  if (existing.data?.id) await db().from('doctor_applications').update(patch).eq('id', existing.data.id)
  else await db().from('doctor_applications').insert({ ...patch, doctor_id: doctorId })
}

export async function noteMembershipInvoicePaid(invoice: {
  id?: string
  customer?: unknown
  subscription?: unknown
  amount_paid?: number | null
  billing_reason?: string | null
  parent?: { subscription_details?: { subscription?: unknown } | null } | null
}): Promise<void> {
  try {
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : ''
    const subscriptionId = subscriptionIdFromInvoice(invoice) || ''
    if (!customerId) return
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
    const listings = await existingListings('', customerId)
    const intake = planInvoiceIntake({
      billingReason: invoice.billing_reason || null,
      amountPaid: Number(invoice.amount_paid || 0),
      applications,
      listings,
    })
    if (intake.action === 'ignore') return
    if (intake.action === 'create_pending') {
      const customer = await stripe.customers.retrieve(customerId)
      if (customer.deleted) return
      await ingestMembershipCheckout({
        id: `invoice-${text(invoice.id) || customerId}`,
        customer: customerId,
        subscription: subscriptionId,
        customer_details: { email: customer.email, name: customer.name, phone: customer.phone },
        customer_email: customer.email,
        mode: 'subscription',
        payment_link: 'invoice',
        currency: null,
        amount_total: invoice.amount_paid,
        metadata: { type: 'doctor_membership' },
      })
      return
    }
    const application = applications.find((row: { id: string }) => row.id === intake.applicationId)
    if (!application) return
    if (application.status === 'needs_action' && application.reviewedAt) {
      const loaded = await loadApplicationById(String(application.id))
      if (!loaded) return
      await finishDecision({
        application: { ...loaded, paymentReceived: true, stripeSubscriptionId: loaded.stripeSubscriptionId || subscriptionId },
        decision: {
          ok: true,
          message: 'Payment confirmed after the bank step. The listing is public.',
          charged: true,
          detached: false,
          doctor: {
            is_approved: true,
            verification_status: 'verified',
            verified_at: new Date().toISOString(),
            stripe_subscription_id: subscriptionId || loaded.stripeSubscriptionId || undefined,
            membership_tier: 'pro',
            paid_at: new Date().toISOString(),
          },
          application: { status: 'approved', stripe_subscription_id: subscriptionId || loaded.stripeSubscriptionId, reviewed_at: new Date().toISOString() },
          email: { to: loaded.email, subject: 'Welcome', html: '<p>Welcome</p>' },
          sms: approvalSmsFor(loaded),
        },
        reviewerId: null,
      })
    }
  } catch (error) {
    console.error('[go-live] invoice intake failed', error instanceof Error ? error.name : 'error')
  }
}
