import 'server-only'

import { deliverApprovalNotices } from '@/lib/applications/approval-sms'
import type { StoredApplication } from '@/lib/applications/store'
import { persistDecision, saveDoctorAlertPhone } from '@/lib/applications/store'
import { sendApplicationEmail } from '@/lib/applications/notify'
import type { Decision } from '@/lib/applications/decide'
import { isMissingColumn } from '@/lib/leads/schema'
import { settleMemberReferral } from '@/lib/member-referrals/settle'
import { readSmsConfig } from '@/lib/sms/config'
import { quoSend } from '@/lib/sms/quo'
import { createAdminClient } from '@/lib/supabase-admin'
import { enqueueDoctorNotification } from '@/lib/doctor-joined-notify'
import { approvedWelcomeEmail } from '@/lib/applications/emails'
import {
  canTextNumber,
  duplicateKey,
  listingContentPatch,
  needsProfileFinish,
  PORTAL_LOGIN_URL,
  profileCompleteness,
  techniquesToSpecialties,
  type ListingSource,
} from './plan.ts'
import { pinDoctor } from './pin.ts'

function admin() {
  return createAdminClient() as any
}

function sourceFrom(application: StoredApplication, currentPhone = ''): ListingSource {
  return {
    firstName: application.firstName,
    lastName: application.lastName,
    practiceApproach: application.answers.practiceApproach,
    techniques: application.answers.techniques,
    officeAddress: application.answers.officeAddress,
    city: application.answers.city,
    state: application.answers.state,
    country: application.answers.country,
    website: application.answers.website,
    instagram: application.answers.instagram,
    phone: application.mobileE164 || '',
    officePhone: application.answers.officePhone || '',
    currentPhone,
    clinicName: '',
  }
}

async function writeDroppingMissing(table: string, idColumn: string, id: string, patch: Record<string, unknown>): Promise<void> {
  const current = { ...patch }
  const client = admin()
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const result = await client.from(table).update(current).eq(idColumn, id)
    if (!result.error) return
    if (!isMissingColumn(result.error)) {
      console.error('[go-live] update failed', result.error.code || 'error')
      return
    }
    const message = String(result.error.message || '')
    const named = message.match(/'([a-z0-9_]+)'/i)?.[1] || message.match(/column "([a-z0-9_]+)"/i)?.[1]
    if (!named || !(named in current)) return
    delete current[named]
    if (Object.keys(current).length === 0) return
  }
}

export async function findNameCityDuplicate(doctorId: string, firstName: string, lastName: string, city: string): Promise<string | null> {
  if (!firstName.trim() || !lastName.trim() || !city.trim()) return null
  const key = duplicateKey(firstName, lastName, city)
  const { data, error } = await admin().from('doctors').select('id, first_name, last_name, city').ilike('city', city.trim()).limit(30)
  if (error || !Array.isArray(data)) return null
  const twin = data.find((row: { id?: string; first_name?: string; last_name?: string; city?: string }) => {
    if (!row.id || row.id === doctorId) return false
    return duplicateKey(row.first_name || '', row.last_name || '', row.city || '') === key
  })
  return twin?.id || null
}

async function syncPaidPlan(userId: string | null, customerId: string | null): Promise<void> {
  if (!userId) return
  await writeDroppingMissing('profiles', 'id', userId, {
    tier: 'pro',
    stripe_customer_id: customerId,
    subscription_status: 'active',
  })
}

async function rememberText(doctorId: string, phone: string | null, consent: boolean, now: string): Promise<void> {
  if (!phone) return
  if (!canTextNumber(phone)) {
    await writeDroppingMissing('doctors', 'id', doctorId, {
      sms_alerts_enabled: false,
      sms_region_note: 'outside_us_canada',
      sms_prompt_required: false,
    })
    return
  }
  if (!consent) {
    await writeDroppingMissing('doctors', 'id', doctorId, { sms_prompt_required: true })
    return
  }
  await saveDoctorAlertPhone(doctorId, phone, true, now)
  await writeDroppingMissing('doctors', 'id', doctorId, { sms_region_note: null, sms_prompt_required: false })
}

async function activateUrlFor(email: string): Promise<string> {
  if (!email.includes('@')) return PORTAL_LOGIN_URL
  try {
    const link = await admin().auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: 'https://neurochiro.co/auth/activate?next=/doctor/dashboard' },
    })
    const token = link.data?.properties?.hashed_token
    if (typeof token === 'string' && token) {
      return `https://neurochiro.co/auth/activate?token_hash=${encodeURIComponent(token)}&type=magiclink&next=${encodeURIComponent('/doctor/dashboard')}`
    }
    const action = link.data?.properties?.action_link
    if (typeof action === 'string' && action.startsWith('https://')) return action
  } catch (error) {
    console.error('[go-live] activate link failed', error instanceof Error ? error.name : 'error')
  }
  return PORTAL_LOGIN_URL
}

async function flagProfile(doctorId: string, source: ListingSource, pinned: boolean): Promise<void> {
  const score = profileCompleteness({
    clinicName: source.clinicName || '',
    bio: source.practiceApproach,
    photo: source.photoUrl || '',
    specialties: techniquesToSpecialties(source.techniques),
    hours: source.hours || '',
    phone: (source.currentPhone || '').trim() || (source.officePhone || '').trim(),
    address: source.officeAddress,
    city: source.city,
    bookingUrl: source.bookingUrl || '',
    latitude: pinned ? 1 : null,
    longitude: pinned ? 1 : null,
    textNumber: canTextNumber(source.phone),
  })
  await writeDroppingMissing('doctors', 'id', doctorId, {
    needs_profile_finish: needsProfileFinish(score.missing),
    profile_missing: score.missing.map((field) => field.key),
    needs_review: needsProfileFinish(score.missing),
  })
}

export async function publishDoctorListing(application: StoredApplication, now: string): Promise<void> {
  const listed = await admin().from('doctors').select('phone').eq('id', application.doctorId).maybeSingle()
  const currentPhone = !listed.error && typeof listed.data?.phone === 'string' ? listed.data.phone : ''
  const source = sourceFrom(application, currentPhone)
  const patch = listingContentPatch(source)
  if (Object.keys(patch).length) await writeDroppingMissing('doctors', 'id', application.doctorId, patch)
  const pinned = await pinDoctor(application.doctorId, source.officeAddress, source.city, source.state, source.country)
  await flagProfile(application.doctorId, source, pinned)
  await rememberText(application.doctorId, application.mobileE164, application.smsConsent, now)
  await writeDroppingMissing('doctors', 'id', application.doctorId, { go_live_flow_at: now })
  await syncPaidPlan(application.userId, application.stripeCustomerId)
  const { enqueueProfileBuild } = await import('@/lib/profile-build/enqueue')
  await enqueueProfileBuild({
    doctorId: application.doctorId,
    applicationId: application.id,
    websiteUrl: application.answers.website || '',
  })
  const { runDoctorGoLive } = await import('./orchestrator')
  await runDoctorGoLive({
    doctorId: application.doctorId,
    source: 'admin',
    only: ['profile', 'portal', 'welcome', 'waitlist', 'instagram', 'summary'],
  })
}

export async function notifyDoctorLive(doctorId: string): Promise<void> {
  try {
    const queued = await enqueueDoctorNotification(doctorId, false, { immediate: true })
    if (!queued.queued) return
    const secret = process.env.CRON_SECRET
    const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://neurochiro.co').replace(/\/$/, '')
    if (!secret) return
    await fetch(`${site}/api/cron/doctor-joined-send?doctor=${encodeURIComponent(doctorId)}`, {
      headers: { authorization: `Bearer ${secret}` },
    }).catch(() => undefined)
  } catch (error) {
    console.error('[go-live] waitlist notify failed', error instanceof Error ? error.name : 'error')
  }
}

function holdCopy(firstName: string, city: string): { subject: string; html: string } {
  const name = firstName || 'there'
  return {
    subject: 'We received your NeuroChiro payment',
    html: `
      <h1>Dr. ${name}, we have your payment.</h1>
      <p>Another listing in ${city || 'that city'} uses the same name, so we did not publish a second one.</p>
      <p>Your portal is open while we connect the two: <a href="https://neurochiro.co/doctor/dashboard">Open your portal</a>.</p>
      <p>Dr. Ray</p>
    `,
  }
}

export async function finishDecision(input: {
  application: StoredApplication
  decision: Decision
  reviewerId: string | null
}): Promise<Decision> {
  const decision = input.decision
  const paid = decision.application?.status === 'approved' && decision.charged
  let duplicateId: string | null = null
  if (paid && decision.doctor?.verification_status === 'verified') {
    duplicateId = await findNameCityDuplicate(
      input.application.doctorId,
      input.application.firstName,
      input.application.lastName,
      input.application.answers.city,
    )
    if (duplicateId && decision.doctor) {
      decision.doctor.verification_status = 'hidden'
      decision.doctor.is_approved = true
      const mail = holdCopy(input.application.firstName, input.application.answers.city)
      decision.email = { to: input.application.email, subject: mail.subject, html: mail.html }
      decision.sms = null
      decision.message = 'Paid, but another listing has the same name and city. This one stays off the directory until that is reviewed.'
    }
  }

  if (decision.application || decision.doctor) {
    await persistDecision({
      applicationId: input.application.id,
      doctorId: input.application.doctorId,
      reviewerId: input.reviewerId || input.application.userId || input.application.doctorId,
      application: decision.application,
      doctor: decision.doctor,
    })
  }

  const now = new Date().toISOString()
  if (duplicateId) {
    await writeDroppingMissing('doctors', 'id', input.application.doctorId, {
      listing_exception: 'duplicate_name_city',
      duplicate_of: duplicateId,
      needs_review: true,
    })
  } else if (decision.doctor?.verification_status === 'verified') {
    await publishDoctorListing(input.application, now)
    if (decision.email && decision.application?.status === 'approved') {
      const activate = await activateUrlFor(input.application.email)
      decision.email = approvedWelcomeEmail({
        to: input.application.email,
        lastName: input.application.lastName || input.application.firstName,
        profileUrl: input.application.profileUrl,
        plan: input.application.plan,
        priceLabel: input.application.priceLabel,
        amountLabel: null,
        receiptUrl: null,
        activateUrl: activate,
      })
    }
  }

  if (decision.application?.status === 'needs_action') {
    await writeDroppingMissing('doctor_applications', 'id', input.application.id, { payment_link_sent_at: now })
    if (input.application.smsConsent && input.application.mobileE164 && canTextNumber(input.application.mobileE164)) {
      await saveDoctorAlertPhone(input.application.doctorId, input.application.mobileE164, true, now)
    }
  }

  const sentByGoLive = !duplicateId && decision.doctor?.verification_status === 'verified' && decision.application?.status === 'approved'
  if ((decision.email || decision.sms) && !sentByGoLive) {
    await deliverApprovalNotices({
      email: decision.email,
      sms: decision.sms,
      runtime: readSmsConfig(),
      sendEmail: sendApplicationEmail,
      sendSms: (message) => quoSend(message),
    })
  }

  if (paid) {
    await syncPaidPlan(input.application.userId, input.application.stripeCustomerId)
    await settleMemberReferral({ applicationId: input.application.id, invoicePaid: true })
  }
  return decision
}
