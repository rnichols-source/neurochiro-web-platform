import { CARD_STEP_URL } from './apply-nav.ts'
import { approvalSmsFor, newCardSmsFor, paymentSmsFor, type ApprovalSms } from './approval-sms.ts'
import { applicationGaps, approveBlockMessage, type ChecklistInput } from './checklist.ts'
import { approvedEmail, declinedEmail, newCardEmail, unpaidEmail, type Mail } from './emails.ts'
import { safePayUrl } from '../go-live/plan.ts'

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
  /** Path B already paid on a Stripe link. Approve must not charge again. */
  paymentReceived?: boolean
  /** Practice answers used by the shared completeness checklist. */
  checklistAnswers?: ChecklistInput
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
  /** Cancel the membership and refund the latest paid invoice. Used when a paid signup is denied. */
  cancelAndRefund?(subscriptionId: string): Promise<void>
}

export type DoctorWrite = {
  is_approved: boolean
  verification_status: 'verified' | 'hidden'
  membership_tier?: 'pro'
  paid_at?: string
  verified_at?: string
  stripe_subscription_id?: string | null
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

function checklistFor(app: ApplicationRecord): ChecklistInput {
  const cardReady = app.cardOnFile === true && Boolean(app.stripeCustomerId) && Boolean(app.stripePaymentMethodId)
  return {
    ...(app.checklistAnswers || {}),
    plan: app.plan && app.stripePriceId ? app.plan : null,
    cardOnFile: cardReady,
    email: app.email,
    mobile: app.mobileE164 || app.checklistAnswers?.mobile || '',
    mobileE164: app.mobileE164 || '',
    country: app.checklistAnswers?.country || 'US',
  }
}

export async function approveApplication(
  app: ApplicationRecord,
  billing: BillingPort,
  now: string,
  notes: string,
  cardUpdateUrl = CARD_STEP_URL,
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
  if (app.paymentReceived && app.stripeSubscriptionId) {
    return {
      ok: true,
      message: 'Approved. Payment was already received, so nothing new was charged. The listing is public.',
      doctor: {
        is_approved: true,
        verification_status: 'verified',
        verified_at: now,
        stripe_subscription_id: app.stripeSubscriptionId,
        membership_tier: 'pro',
        paid_at: now,
      },
      application: {
        status: 'approved',
        stripe_subscription_id: app.stripeSubscriptionId,
        admin_notes: notesOrNull(notes),
        reviewed_at: now,
      },
      email: approvedEmail(app.email, app.firstName, null, {
        lastName: app.lastName || app.firstName,
        profileUrl: app.profileUrl,
        plan: app.plan,
        priceLabel: app.priceLabel,
        amountLabel: null,
        receiptUrl: null,
      }),
      sms: approvalSmsFor(app),
      charged: true,
      detached: false,
    }
  }

  const blocked = approveBlockMessage(applicationGaps(checklistFor(app)))
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

  if (charge.paymentState !== 'paid') {
    const bank = charge.paymentState === 'requires_action'
    const invoice = bank ? safePayUrl(charge.hostedInvoiceUrl) : null
    if (bank && invoice) {
      return {
        ok: true,
        message: 'Not published. Their bank still needs a confirmation. The email and text include a Stripe link.',
        doctor: {
          is_approved: false,
          verification_status: 'hidden',
          stripe_subscription_id: charge.subscriptionId,
        },
        application: {
          status: 'needs_action',
          stripe_subscription_id: charge.subscriptionId,
          admin_notes: notesOrNull(notes),
          reviewed_at: now,
          charge_attempt: app.chargeAttempt,
        },
        email: unpaidEmail(app.email, app.firstName, invoice, 'bank'),
        sms: paymentSmsFor({
          smsConsent: app.smsConsent,
          mobileE164: app.mobileE164,
          lastName: app.lastName,
          payUrl: invoice,
        }),
        charged: false,
        detached: false,
      }
    }
    return {
      ok: false,
      message: charge.errorMessage || 'The card was declined. Nothing was published. They can save a new card on the application.',
      doctor: {
        is_approved: false,
        verification_status: 'hidden',
        stripe_subscription_id: null,
      },
      application: {
        status: 'needs_action',
        stripe_subscription_id: null,
        admin_notes: notesOrNull(notes),
        reviewed_at: now,
        charge_attempt: app.chargeAttempt + 1,
      },
      email: newCardEmail(app.email, app.firstName, cardUpdateUrl),
      sms: newCardSmsFor({
        smsConsent: app.smsConsent,
        mobileE164: app.mobileE164,
        lastName: app.lastName,
        cardUrl: cardUpdateUrl,
      }),
      charged: false,
      detached: false,
    }
  }

  return {
    ok: true,
    message: 'Approved. Their membership is active and the listing is public.',
    doctor: {
      is_approved: true,
      verification_status: 'verified',
      verified_at: now,
      stripe_subscription_id: charge.subscriptionId,
      membership_tier: 'pro',
      paid_at: now,
    },
    application: {
      status: 'approved',
      stripe_subscription_id: charge.subscriptionId,
      admin_notes: notesOrNull(notes),
      reviewed_at: now,
    },
    email: approvedEmail(app.email, app.firstName, null, {
      lastName: app.lastName || app.firstName,
      profileUrl: app.profileUrl,
      plan: app.plan,
      priceLabel: app.priceLabel,
      amountLabel: charge.amountLabel || null,
      receiptUrl: charge.receiptUrl || null,
    }),
    sms: approvalSmsFor(app),
    charged: true,
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
  let refunded = false
  if (app.paymentReceived && app.stripeSubscriptionId && billing.cancelAndRefund) {
    try {
      await billing.cancelAndRefund(app.stripeSubscriptionId)
      refunded = true
    } catch {
      refunded = false
    }
  }

  return {
    ok: true,
    message: refunded
      ? 'Declined. The listing stays hidden, the membership was canceled, and the payment was refunded.'
      : app.paymentReceived
        ? 'Declined. The listing stays hidden. The refund did not complete, so check Stripe before telling them the money was returned.'
        : 'Declined. The listing stays hidden and the card was removed. Nothing was charged.',
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
    email: app.email.includes('@')
      ? declinedEmail(app.email, app.firstName, refunded ? 'refunded' : app.paymentReceived ? 'refund_failed' : 'none')
      : null,
    sms: null,
    charged: false,
    detached,
  }
}
