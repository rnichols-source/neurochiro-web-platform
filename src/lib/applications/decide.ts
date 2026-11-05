import { approvalSmsFor, type ApprovalSms } from './approval-sms.ts'
import { approvedEmail, declinedEmail, type Mail } from './emails.ts'

export type ApplicationStatus = 'draft' | 'under_review' | 'approved' | 'declined' | 'needs_action'
export type BillingCycle = 'monthly' | 'annual'

export type ApplicationRecord = {
  id: string
  doctorId: string
  userId: string | null
  status: ApplicationStatus
  plan: BillingCycle | null
  stripePriceId: string | null
  stripeCustomerId: string | null
  stripePaymentMethodId: string | null
  stripeSubscriptionId: string | null
  cardOnFile: boolean
  chargeAttempt: number
  email: string
  firstName: string
  lastName: string
  profileUrl: string
  mobileE164: string | null
  smsConsent: boolean
  priceLabel: string | null
}

export type ChargeResult = {
  subscriptionId: string
  status: string
  hostedInvoiceUrl: string | null
  paymentState: 'paid' | 'requires_action' | 'failed'
  errorMessage?: string
  amountLabel?: string | null
  receiptUrl?: string | null
}

export type BillingPort = {
  createSubscription(input: {
    customerId: string
    priceId: string
    paymentMethodId: string
    idempotencyKey: string
    metadata: Record<string, string>
  }): Promise<ChargeResult>
  detachPaymentMethod(paymentMethodId: string): Promise<void>
}

export type DoctorWrite = {
  is_approved: boolean
  verification_status: 'verified' | 'hidden'
  membership_tier?: 'pro'
  paid_at?: string
  verified_at?: string
  stripe_subscription_id?: string
}

export type ApplicationWrite = {
  status: ApplicationStatus
  stripe_subscription_id?: string | null
  stripe_payment_method_id?: string | null
  card_on_file?: boolean
  admin_notes?: string | null
  reviewed_at?: string
  charge_attempt?: number
}

export type Decision = {
  ok: boolean
  message: string
  doctor: DoctorWrite | null
  application: ApplicationWrite | null
  email: Mail | null
  sms: ApprovalSms | null
  charged: boolean
  detached: boolean
}

function notesOrNull(notes: string): string | null {
  const trimmed = notes.trim()
  return trimmed ? trimmed.slice(0, 2000) : null
}

function missingCard(app: ApplicationRecord): string | null {
  if (!app.cardOnFile || !app.stripeCustomerId || !app.stripePaymentMethodId) return 'There is no card on file yet.'
  if (!app.stripePriceId || !app.plan) return 'This application has no plan selected.'
  if (!app.email.includes('@')) return 'This application has no email address.'
  return null
}

export async function approveApplication(
  app: ApplicationRecord,
  billing: BillingPort,
  now: string,
  notes: string,
): Promise<Decision> {
  if (app.status === 'approved' && app.stripeSubscriptionId) {
    return {
      ok: true,
      message: 'Already approved. No second charge.',
      doctor: null,
      application: null,
      email: null,
      sms: null,
      charged: false,
      detached: false,
    }
  }
  if (app.status === 'declined') {
    return {
      ok: false,
      message: 'This application was declined. It cannot be approved from here.',
      doctor: null,
      application: null,
      email: null,
      sms: null,
      charged: false,
      detached: false,
    }
  }
  const blocked = missingCard(app)
  if (blocked || !app.stripeCustomerId || !app.stripePaymentMethodId || !app.stripePriceId) {
    return { ok: false, message: blocked || 'There is no card on file yet.', doctor: null, application: null, email: null, sms: null, charged: false, detached: false }
  }

  let charge: ChargeResult
  try {
    charge = await billing.createSubscription({
      customerId: app.stripeCustomerId,
      priceId: app.stripePriceId,
      paymentMethodId: app.stripePaymentMethodId,
      idempotencyKey: `doctor-app-sub-${app.id}-${app.chargeAttempt}`,
      metadata: {
        type: 'doctor_membership',
        role: 'doctor',
        userId: app.userId || '',
        doctorId: app.doctorId,
        applicationId: app.id,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Stripe could not start the membership.'
    return {
      ok: false,
      message,
      doctor: null,
      application: { status: app.status, charge_attempt: app.chargeAttempt + 1, admin_notes: notesOrNull(notes) },
      email: null,
      sms: null,
      charged: false,
      detached: false,
    }
  }

  if (charge.paymentState === 'failed') {
    return {
      ok: false,
      message: charge.errorMessage || 'The card was declined. Nothing was published.',
      doctor: null,
      application: { status: app.status, charge_attempt: app.chargeAttempt + 1, admin_notes: notesOrNull(notes) },
      email: null,
      sms: null,
      charged: false,
      detached: false,
    }
  }

  const needsAction = charge.paymentState === 'requires_action'
  const doctor: DoctorWrite = {
    is_approved: true,
    verification_status: 'verified',
    verified_at: now,
    stripe_subscription_id: charge.subscriptionId,
  }
  if (!needsAction) {
    doctor.membership_tier = 'pro'
    doctor.paid_at = now
  }

  return {
    ok: true,
    message: needsAction
      ? 'Approved. Their bank still needs a confirmation. The email includes a Stripe link.'
      : 'Approved. Their membership is active and the listing is public.',
    doctor,
    application: {
      status: needsAction ? 'needs_action' : 'approved',
      stripe_subscription_id: charge.subscriptionId,
      admin_notes: notesOrNull(notes),
      reviewed_at: now,
    },
    email: approvedEmail(
      app.email,
      app.firstName,
      needsAction ? charge.hostedInvoiceUrl : null,
      needsAction ? null : {
        lastName: app.lastName || app.firstName,
        profileUrl: app.profileUrl,
        plan: app.plan,
        priceLabel: app.priceLabel,
        amountLabel: charge.amountLabel || null,
        receiptUrl: charge.receiptUrl || null,
      },
    ),
    sms: needsAction ? null : approvalSmsFor(app),
    charged: !needsAction,
    detached: false,
  }
}

export async function declineApplication(
  app: ApplicationRecord,
  billing: BillingPort,
  now: string,
  notes: string,
): Promise<Decision> {
  if (app.status === 'declined') {
    return {
      ok: true,
      message: 'Already declined.',
      doctor: null,
      application: null,
      email: null,
      sms: null,
      charged: false,
      detached: false,
    }
  }

  let detached = false
  if (app.stripePaymentMethodId) {
    try {
      await billing.detachPaymentMethod(app.stripePaymentMethodId)
      detached = true
    } catch {
      detached = false
    }
  }

  return {
    ok: true,
    message: 'Declined. The listing stays hidden and the card was removed. Nothing was charged.',
    doctor: {
      is_approved: false,
      verification_status: 'hidden',
    },
    application: {
      status: 'declined',
      stripe_payment_method_id: null,
      card_on_file: false,
      admin_notes: notesOrNull(notes),
      reviewed_at: now,
    },
    email: app.email.includes('@') ? declinedEmail(app.email, app.firstName) : null,
    sms: null,
    charged: false,
    detached,
  }
}
