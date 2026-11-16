import 'server-only'

import { approvalSmsFor } from '@/lib/applications/approval-sms'
import { goLiveWelcomeEmail, welcomeHasOtherBookingLink, welcomeInputFromListing } from '@/lib/go-live/welcome-email'
import { enqueueDoctorNotification } from '@/lib/doctor-joined-notify'
import { queueInstagramBatch } from '@/lib/instagram/queue'
import { buildDoctorProfileNow } from '@/lib/profile-build/run'
import { readSmsConfig } from '@/lib/sms/config'
import { quoSend } from '@/lib/sms/quo'
import { createAdminClient } from '@/lib/supabase-admin'
import { adminGoLiveSummary, minimumProfileGaps, PORTAL_LOGIN_URL, smsPromptRequired, welcomeSendDecision } from './plan.ts'
import {
  acquireGoLiveLock,
  claimWelcomeStep,
  countGoLiveStep,
  goLiveStepAlreadyOk,
  openGoLiveRun,
  releaseGoLiveLock,
  saveGoLiveStep,
} from './log.ts'
import type { GoLiveStep, GoLiveStepResult } from './steps.ts'

const ADMIN_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'drray@neurochirodirectory.com'

export type GoLiveSource = 'stripe' | 'admin' | 'rebuild' | 'retry' | 'reconcile'

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
  /** Sends the welcome again only when this is true. An ok welcome step, including a hand-entered one, stays put. */
  resendWelcome?: boolean
}): Promise<GoLiveStepResult[]> {
  let doctor = await loadDoctor(input.doctorId)
  if (!doctor) return [{ step: 'checkout', status: 'failed', reason: 'Doctor listing was not found.' }]
  const locked = await acquireGoLiveLock(input.doctorId)
  if (!locked) {
    return [{ step: 'checkout', status: 'skipped', reason: 'Another go-live run is already handling this doctor.' }]
  }
  try {
    const live = sendsAreLive(doctor.is_test === true)
    const wanted = new Set(input.only || ['checkout', 'profile', 'portal', 'welcome', 'waitlist', 'instagram', 'summary'])
    await db().from('doctors').update({ go_live_flow_at: new Date().toISOString() }).eq('id', input.doctorId).is('go_live_flow_at', null)
    const runId = await openGoLiveRun(input.doctorId, input.source, !live)
    const results: GoLiveStepResult[] = []

    async function keep(result: GoLiveStepResult): Promise<void> {
      results.push(result)
      await saveGoLiveStep(runId, input.doctorId, result)
    }

    async function done(step: GoLiveStep): Promise<boolean> {
      if (input.force) return false
      return goLiveStepAlreadyOk(input.doctorId, step)
    }

    if (wanted.has('checkout')) {
      if (await done('checkout')) {
        await keep({ step: 'checkout', status: 'skipped', reason: 'Checkout was already recorded for this doctor.' })
      } else {
        await keep({
          step: 'checkout',
          status: 'ok',
          reason: input.source === 'stripe'
            ? 'Payment recorded. A successful membership payment counts as approval.'
            : input.source === 'reconcile'
              ? 'Reconciliation found a paid membership with no completed go-live.'
              : 'Manual approval. This run did not depend on a new Stripe event.',
        })
      }
    }

    if (wanted.has('profile')) {
      if (await done('profile')) {
        await keep({ step: 'profile', status: 'skipped', reason: 'Profile step already completed for this doctor.' })
      } else {
        const built = await buildDoctorProfileNow(input.doctorId)
        await publishListing(doctor, input.source)
        const fresh = await loadDoctor(input.doctorId)
        const missing = minimumProfileGaps({
          website: text(fresh?.website_url),
          photo: text(fresh?.photo_url),
          bio: text(fresh?.bio),
        })
        const minimum = missing.length > 0 || fresh?.needs_ai_enrich === true
        await db().from('doctors').update({
          profile_publish_mode: minimum ? 'minimum' : 'full',
          ...(minimum ? { needs_ai_enrich: true } : {}),
        }).eq('id', input.doctorId)
        const reason = minimum
          ? `${built.reason} Profile went live in basic form: needs website/photo/write-up. Missing: ${missing.join(', ') || 'write-up'}.`
          : built.reason
        await keep({
          step: 'profile',
          status: built.ok ? 'ok' : 'failed',
          reason,
        })
      }
    }

    doctor = await loadDoctor(input.doctorId) || doctor

    if (wanted.has('portal')) {
      if (await done('portal')) {
        await keep({ step: 'portal', status: 'skipped', reason: 'Portal step already completed for this doctor.' })
      } else {
        const portal = await ensurePortal(doctor, live)
        await keep(portal)
      }
    }

    if (wanted.has('welcome')) {
      const profileOk = await goLiveStepAlreadyOk(input.doctorId, 'profile')
      const profileFailures = await countGoLiveStep(input.doctorId, 'profile', 'failed')
      const welcomeOk = input.resendWelcome === true ? false : await goLiveStepAlreadyOk(input.doctorId, 'welcome')
      const decision = welcomeSendDecision({ profileOk, profileFailures, welcomeOk })
      if (decision === 'skip_welcome_done' || decision === 'wait_for_profile') {
        await keep({
          step: 'welcome',
          status: 'skipped',
          reason: decision === 'skip_welcome_done'
            ? 'Welcome email and text were already sent for this doctor.'
            : 'Welcome is waiting until the profile step succeeds.',
        })
      } else {
        const claim = await claimWelcomeStep(runId, input.doctorId)
        if (claim === 'lost' && input.resendWelcome !== true) {
          await keep({ step: 'welcome', status: 'skipped', reason: 'Another run already claimed the welcome email for this doctor.' })
        } else {
          const listing = await loadDoctor(input.doctorId) || doctor
          const sent = await sendWelcome(listing, live)
          if (decision === 'send_and_flag') {
            sent.reason = `${sent.reason} Profile is still failing, so this welcome was sent anyway.`
            sent.detail = { ...(sent.detail || {}), profileFailed: true }
          }
          await keep(sent)
        }
      }
    }

    if (wanted.has('waitlist')) {
      if (await done('waitlist')) {
        await keep({ step: 'waitlist', status: 'skipped', reason: 'Waitlist step already completed for this doctor.' })
      } else {
        await keep(await sendWaitlist(input.doctorId, live))
      }
    }

    if (wanted.has('instagram')) {
      if (await done('instagram')) {
        await keep({ step: 'instagram', status: 'skipped', reason: 'Instagram step already completed for this doctor.' })
      } else {
        await keep(await queueInstagram(input.doctorId, text(doctor.last_name) || text(doctor.first_name), live))
      }
    }

    if (wanted.has('summary')) {
      const welcomeJustSent = results.some((step) => step.step === 'welcome' && step.status !== 'skipped')
      if (await done('summary') && !welcomeJustSent) {
        await keep({ step: 'summary', status: 'skipped', reason: 'Summary was already sent for this doctor.' })
      } else {
        await keep(await sendSummary(doctor, results, live))
      }
    }

    return results
  } finally {
    await releaseGoLiveLock(input.doctorId)
  }
}

async function sendWelcome(doctor: Record<string, unknown>, live: boolean): Promise<GoLiveStepResult> {
  const email = text(doctor.email)
  const lastName = text(doctor.last_name) || text(doctor.first_name) || 'there'
  const url = profileUrl(text(doctor.slug))
  const mail = goLiveWelcomeEmail(welcomeInputFromListing(doctor, url))
  const mobile = firstAlert(doctor.lead_alert_phones)
  const prompt = smsPromptRequired({ phone: mobile, consent: Boolean(mobile) })
  if (prompt) {
    await db().from('doctors').update({ sms_prompt_required: true }).eq('id', doctor.id)
  }
  const sms = approvalSmsFor({
    smsConsent: Boolean(mobile),
    mobileE164: mobile,
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

async function sendPlainWelcome(mail: { to: string; subject: string; html: string; replyTo?: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY || ''
  if (!key) return false
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(key)
    const result = await resend.emails.send({
      from: 'Dr. Ray <ray@neurochirodirectory.com>',
      to: mail.to,
      replyTo: mail.replyTo,
      subject: mail.subject,
      html: mail.html,
    })
    return !result.error
  } catch (error) {
    console.error('[go-live] welcome email failed', error instanceof Error ? error.name : 'error')
    return false
  }
}

function summaryReason(lines: string[]): string {
  const notable = lines.filter((line) => line.startsWith('Profile went live') || line.startsWith('Missing:') || line.startsWith('No text sent') || line.startsWith('Welcome was sent even though'))
  return [`Emailed ${ADMIN_EMAIL}.`, ...notable].join(' ')
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
  const fresh = await loadDoctor(text(doctor.id)) || doctor
  const missing = minimumProfileGaps({
    website: text(fresh.website_url),
    photo: text(fresh.photo_url),
    bio: text(fresh.bio),
  })
  const minimum = missing.length > 0 || fresh.needs_ai_enrich === true || fresh.profile_publish_mode === 'minimum'
  const mobile = firstAlert(fresh.lead_alert_phones)
  const textSent = !smsPromptRequired({ phone: mobile, consent: Boolean(mobile) })
  const note = adminGoLiveSummary({
    doctorName: `Dr. ${name}`,
    email: text(fresh.email),
    profileUrl: profileUrl(text(fresh.slug)),
    city: text(fresh.city),
    source: 'go-live',
    missing: minimum ? (missing.length ? missing : ['website', 'photo', 'write-up']) : [],
    textSent,
  })
  const flagged = steps.some((step) => step.detail?.profileFailed === true)
  const lines = [
    ...steps.map((step) => `${step.step}: ${step.status} — ${step.reason}`),
    ...note.text.split('\n').filter((line) => line.startsWith('Profile went live') || line.startsWith('Missing:') || line.startsWith('No text sent')),
    ...(flagged ? ['Welcome was sent even though the profile step is still failing.'] : []),
  ]
  const subject = `Dr ${name} is live`
  if (!live) {
    return { step: 'summary', status: 'ok', reason: `Would email ${ADMIN_EMAIL}: ${subject}. ${summaryReason(lines)} Nothing was sent.`, detail: { lines } }
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
    return { step: 'summary', status: 'ok', reason: summaryReason(lines) }
  } catch {
    return { step: 'summary', status: 'failed', reason: 'Summary email failed.' }
  }
}
