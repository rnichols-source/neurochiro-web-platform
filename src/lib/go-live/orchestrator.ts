import 'server-only'

import { approvalSmsFor } from '@/lib/applications/approval-sms'
import { goLiveWelcomeEmail, welcomeHasOtherBookingLink } from '@/lib/go-live/welcome-email'
import { enqueueDoctorNotification } from '@/lib/doctor-joined-notify'
import { queueInstagramBatch } from '@/lib/instagram/queue'
import { buildDoctorProfileNow } from '@/lib/profile-build/run'
import { readSmsConfig } from '@/lib/sms/config'
import { quoSend } from '@/lib/sms/quo'
import { createAdminClient } from '@/lib/supabase-admin'
import { PORTAL_LOGIN_URL } from './plan.ts'
import {
  goLiveStepAlreadyOk,
  openGoLiveRun,
  saveGoLiveStep,
} from './log.ts'
import type { GoLiveStep, GoLiveStepResult } from './steps.ts'

const ADMIN_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'drray@neurochirodirectory.com'

export type GoLiveSource = 'stripe' | 'admin' | 'rebuild' | 'retry'

function db() {
  return createAdminClient() as any
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function sendsAreLive(isTest: boolean, env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.GO_LIVE_DRY_RUN === '1' || env.GO_LIVE_DRY_RUN === 'true') return false
  if (isTest) return false
  return true
}

function profileUrl(slug: string): string {
  const clean = slug.trim().toLowerCase()
  if (!/^[a-z0-9-]{1,80}$/.test(clean)) return 'https://neurochiro.co/directory'
  return `https://neurochiro.co/directory/${clean}`
}

async function activateUrl(email: string): Promise<string> {
  try {
    const link = await db().auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: 'https://neurochiro.co/auth/activate?next=/doctor/dashboard' },
    })
    const action = link.data?.properties?.action_link
    if (typeof action === 'string' && action.startsWith('https://')) return action
  } catch (error) {
    console.error('[go-live] set-password link failed', error instanceof Error ? error.name : 'error')
  }
  return PORTAL_LOGIN_URL
}

async function loadDoctor(doctorId: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await db().from('doctors').select('*').eq('id', doctorId).maybeSingle()
  if (error || !data) return null
  return data as Record<string, unknown>
}

async function publishListing(doctor: Record<string, unknown>, source: GoLiveSource): Promise<void> {
  const paid = Boolean(doctor.paid_at) || source === 'stripe'
  const approved = doctor.is_approved === true || paid || source === 'admin'
  if (!approved) return
  const now = new Date().toISOString()
  await db().from('doctors').update({
    is_approved: true,
    verification_status: 'verified',
    membership_tier: 'pro',
    verified_at: text(doctor.verified_at) || now,
    ...(paid ? { paid_at: text(doctor.paid_at) || now } : {}),
  }).eq('id', doctor.id)
}

async function ensurePortal(doctor: Record<string, unknown>, live: boolean): Promise<GoLiveStepResult & { activateUrl: string }> {
  const email = text(doctor.email)
  if (!email.includes('@')) {
    return { step: 'portal', status: 'failed', reason: 'The listing has no email, so no portal account was created.', activateUrl: PORTAL_LOGIN_URL }
  }
  if (!live) {
    return {
      step: 'portal',
      status: 'ok',
      reason: `Would confirm a portal account for ${email}. The welcome email explains the reset code. No account was created.`,
      activateUrl: PORTAL_LOGIN_URL,
    }
  }
  let userId = text(doctor.user_id)
  if (!userId) {
    const created = await db().auth.admin.createUser({
      email,
      email_confirm: true,
      app_metadata: { role: 'doctor' },
      user_metadata: { full_name: `${text(doctor.first_name)} ${text(doctor.last_name)}`.trim() },
    })
    userId = text(created.data?.user?.id)
    if (!userId) {
      const existing = await db().from('profiles').select('id').ilike('email', email).maybeSingle()
      userId = text(existing.data?.id)
    }
    if (userId) await db().from('doctors').update({ user_id: userId }).eq('id', doctor.id)
  }
  if (!userId) {
    return { step: 'portal', status: 'failed', reason: 'The portal account was not created.', activateUrl: PORTAL_LOGIN_URL }
  }
  const url = await activateUrl(email)
  return {
    step: 'portal',
    status: 'ok',
    reason: 'Portal account is ready. The welcome email explains how to set a password with the reset code.',
    activateUrl: url,
  }
}

export async function runDoctorGoLive(input: {
  doctorId: string
  source: GoLiveSource
  only?: GoLiveStep[]
  force?: boolean
}): Promise<GoLiveStepResult[]> {
  const doctor = await loadDoctor(input.doctorId)
  if (!doctor) return [{ step: 'checkout', status: 'failed', reason: 'Doctor listing was not found.' }]
  const live = sendsAreLive(doctor.is_test === true)
  const wanted = new Set(input.only || ['checkout', 'profile', 'portal', 'welcome', 'waitlist', 'instagram', 'summary'])
  const runId = await openGoLiveRun(input.doctorId, input.source, !live)
  const results: GoLiveStepResult[] = []

  async function keep(result: GoLiveStepResult): Promise<void> {
    results.push(result)
    await saveGoLiveStep(runId, input.doctorId, result)
  }

  if (wanted.has('checkout')) {
    await keep({
      step: 'checkout',
      status: 'ok',
      reason: input.source === 'stripe'
        ? 'Payment recorded. A successful membership payment counts as approval.'
        : 'Manual approval. This run did not depend on a new Stripe event.',
    })
  }

  if (wanted.has('profile')) {
    const built = await buildDoctorProfileNow(input.doctorId)
    await publishListing(doctor, input.source)
    await keep({
      step: 'profile',
      status: built.ok ? 'ok' : 'failed',
      reason: built.reason,
    })
  }

  if (wanted.has('portal')) {
    const portal = await ensurePortal(doctor, live)
    await keep(portal)
  }

  if (wanted.has('welcome')) {
    const already = !input.force && await goLiveStepAlreadyOk(input.doctorId, 'welcome')
    if (already) {
      await keep({ step: 'welcome', status: 'skipped', reason: 'Welcome email and text were already sent for this doctor.' })
    } else {
      await keep(await sendWelcome(doctor, live))
    }
  }

  if (wanted.has('waitlist')) {
    await keep(await sendWaitlist(input.doctorId, live))
  }

  if (wanted.has('instagram')) {
    await keep(await queueInstagram(input.doctorId, text(doctor.last_name) || text(doctor.first_name), live))
  }

  if (wanted.has('summary')) {
    await keep(await sendSummary(doctor, results, live))
  }

  return results
}

async function sendWelcome(doctor: Record<string, unknown>, live: boolean): Promise<GoLiveStepResult> {
  const email = text(doctor.email)
  const lastName = text(doctor.last_name) || text(doctor.first_name) || 'there'
  const url = profileUrl(text(doctor.slug))
  const paidAt = text(doctor.paid_at)
  const at = paidAt ? new Date(paidAt) : new Date()
  const mail = goLiveWelcomeEmail({
    to: email,
    firstName: text(doctor.first_name),
    lastName: text(doctor.last_name),
    practiceName: text(doctor.clinic_name),
    city: text(doctor.city),
    area: text(doctor.county),
    profileUrl: url,
    at: Number.isNaN(at.getTime()) ? new Date() : at,
  })
  const sms = approvalSmsFor({
    smsConsent: true,
    mobileE164: firstAlert(doctor.lead_alert_phones),
    lastName,
    profileUrl: url,
  })
  if (welcomeHasOtherBookingLink(mail.html)) {
    return { step: 'welcome', status: 'failed', reason: 'Welcome copy includes a booking link other than the onboarding call.' }
  }
  if (!live) {
    return {
      step: 'welcome',
      status: 'ok',
      reason: `Would email ${email || 'the doctor'} the personal welcome and text the onboarding link. Nothing was sent.`,
      detail: { subject: mail.subject, sms: sms?.body || null, profileUrl: url },
    }
  }
  let emailOk = false
  let smsReason = sms ? 'not sent' : 'No text consent or mobile on file.'
  if (email.includes('@')) emailOk = await sendPlainWelcome(mail)
  if (sms) {
    const runtime = readSmsConfig()
    if (!runtime.enabled) smsReason = 'SMS is switched off.'
    else {
      const sent = await quoSend({ to: sms.to, content: sms.body })
      smsReason = sent.ok ? 'Text sent.' : 'Text failed.'
    }
  }
  const ok = emailOk || smsReason === 'Text sent.'
  return {
    step: 'welcome',
    status: ok ? 'ok' : 'failed',
    reason: `${emailOk ? 'Welcome email sent.' : 'Welcome email failed.'} ${smsReason} Onboarding call link only.`,
  }
}

async function sendPlainWelcome(mail: { to: string; subject: string; html: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY || ''
  if (!key) return false
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(key)
    const result = await resend.emails.send({
      from: 'Dr. Ray <ray@neurochirodirectory.com>',
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
    })
    return !result.error
  } catch (error) {
    console.error('[go-live] welcome email failed', error instanceof Error ? error.name : 'error')
    return false
  }
}

function firstAlert(value: unknown): string | null {
  if (!Array.isArray(value)) return null
  const phone = value.find((item) => typeof item === 'string' && item.trim())
  return typeof phone === 'string' ? phone : null
}

async function sendWaitlist(doctorId: string, live: boolean): Promise<GoLiveStepResult> {
  try {
    const queued = await enqueueDoctorNotification(doctorId, !live, { immediate: true })
    if (!live) {
      return { step: 'waitlist', status: 'ok', reason: `Would email and text ${queued.matchedCount} nearby community members. Nothing was sent.` }
    }
    if (queued.exclusionReason === 'already_queued') {
      return { step: 'waitlist', status: 'ok', reason: 'Waitlist alerts were already queued for this doctor. Nobody is alerted twice.' }
    }
    if (!queued.queued && queued.matchedCount === 0) {
      return { step: 'waitlist', status: 'ok', reason: queued.exclusionReason || 'No community members are waiting nearby.' }
    }
    const secret = process.env.CRON_SECRET
    const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://neurochiro.co').replace(/\/$/, '')
    if (secret && queued.queued) {
      await fetch(`${site}/api/cron/doctor-joined-send?doctor=${encodeURIComponent(doctorId)}`, {
        headers: { authorization: `Bearer ${secret}` },
      }).catch(() => undefined)
    }
    return {
      step: 'waitlist',
      status: 'ok',
      reason: queued.held
        ? `Matched ${queued.matchedCount}, held for review. ${queued.heldReason || ''}`.trim()
        : `Queued email and text for ${queued.matchedCount} nearby community members.`,
    }
  } catch (error) {
    return { step: 'waitlist', status: 'failed', reason: error instanceof Error ? error.message.slice(0, 300) : 'Waitlist alerts failed.' }
  }
}

async function queueInstagram(doctorId: string, name: string, live: boolean): Promise<GoLiveStepResult> {
  if (!live) {
    return { step: 'instagram', status: 'ok', reason: `Would queue a public comment tagging Dr. ${name || 'the doctor'} and DMs for nearby Instagram requests. Nothing was posted.` }
  }
  try {
    const queued = await queueInstagramBatch(doctorId)
    if (!queued) return { step: 'instagram', status: 'ok', reason: 'No new Instagram comments or DMs to queue.' }
    return { step: 'instagram', status: 'ok', reason: `Queued ${queued.count} Instagram comment and DM drafts. Nothing was posted.` }
  } catch (error) {
    return { step: 'instagram', status: 'failed', reason: error instanceof Error ? error.message.slice(0, 300) : 'Instagram queue failed.' }
  }
}

async function sendSummary(doctor: Record<string, unknown>, steps: GoLiveStepResult[], live: boolean): Promise<GoLiveStepResult> {
  const name = text(doctor.last_name) || text(doctor.first_name) || 'Doctor'
  const lines = steps.map((step) => `${step.step}: ${step.status} — ${step.reason}`)
  const subject = `Dr ${name} is live`
  if (!live) {
    return { step: 'summary', status: 'ok', reason: `Would email ${ADMIN_EMAIL}: ${subject}. Nothing was sent.`, detail: { lines } }
  }
  const key = process.env.RESEND_API_KEY || ''
  if (!key) return { step: 'summary', status: 'failed', reason: 'RESEND_API_KEY is not set, so the summary email was not sent.' }
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(key)
    const html = `<h1>${subject}</h1><ul>${lines.map((line) => `<li>${line.replace(/</g, '')}</li>`).join('')}</ul>`
    const result = await resend.emails.send({
      from: 'NeuroChiro <support@neurochirodirectory.com>',
      to: [ADMIN_EMAIL],
      subject,
      html,
    })
    if (result.error) return { step: 'summary', status: 'failed', reason: 'Summary email was rejected.' }
    return { step: 'summary', status: 'ok', reason: `Emailed ${ADMIN_EMAIL}.` }
  } catch {
    return { step: 'summary', status: 'failed', reason: 'Summary email failed.' }
  }
}
