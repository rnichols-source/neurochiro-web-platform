import 'server-only'

import crypto from 'crypto'
import { Resend } from 'resend'
import { wrapEmail } from '@/lib/email-template'
import { siteUrl } from '@/lib/leads/config'
import { isMissingTable } from '@/lib/leads/schema'
import { readSmsConfig } from '@/lib/sms/config'
import { quoSend } from '@/lib/sms/quo'
import { createAdminClient } from '@/lib/supabase-admin'
import { resolveSearchPoint } from '@/lib/admin/nearby'
import { canReceive, reachable, resolveAudience, type AudienceFilters, type AudienceKey, type Channel, type Recipient } from './audience'
import { writeAudit } from './audit'
import { demandNear, doctorsNear, openRequests, waitingRequests } from './model'
import { loadFounderRoster } from './roster'
import { loadFounderSettings, saveDigestStamp } from './settings'

const FROM = 'NeuroChiro <support@neurochirodirectory.com>'
const DIGEST_TO = 'drray@neurochirodirectory.com'
const MAX_SEND = 400

type SendResult = { ok: true; count: number; detail: string } | { ok: false; error: string }

function mailer(): Resend | null {
  const key = process.env.RESEND_API_KEY || ''
  if (!key) return null
  return new Resend(key)
}

async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  const resend = mailer()
  if (!resend) return false
  const sent = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html: wrapEmail(`<p>${text.replace(/\n/g, '<br>')}</p>`),
  })
  return !sent.error
}

export async function deliverBroadcast(input: {
  actorId: string
  audience: AudienceKey
  filters: AudienceFilters
  channels: Channel[]
  subject: string
  body: string
  href: string | null
  startsAt: string | null
  endsAt: string | null
  expected: number
  scheduledFor: string | null
}): Promise<SendResult> {
  const subject = input.subject.trim().slice(0, 140)
  const body = input.body.trim().slice(0, 2000)
  if (!subject || !body) return { ok: false, error: 'Add a subject and a message first.' }
  if (!input.channels.length) return { ok: false, error: 'Pick at least one way to send it.' }
  const roster = await loadFounderRoster()
  const recipients = reachable(resolveAudience(roster, input.audience, input.filters), input.channels)
  if (recipients.length !== input.expected) {
    return { ok: false, error: `That audience is ${recipients.length} now. Look again, then confirm the new count.` }
  }
  if (recipients.length > MAX_SEND) return { ok: false, error: `That is ${recipients.length} people. Narrow it below ${MAX_SEND} before sending.` }
  const admin = createAdminClient() as any
  const probe = await admin.from('founder_broadcasts').select('id').limit(1)
  if (probe.error && isMissingTable(probe.error)) {
    return { ok: false, error: 'Nothing was sent. Apply the founder command center migration so the send is logged first.' }
  }
  if (probe.error) return { ok: false, error: 'The broadcast log could not be opened. Nothing was sent.' }

  const record = await admin.from('founder_broadcasts').insert({
    created_by: input.actorId,
    audience_key: input.audience,
    audience: input.filters,
    channels: input.channels,
    subject,
    body,
    status: input.scheduledFor ? 'scheduled' : 'sending',
    recipient_count: recipients.length,
    scheduled_for: input.scheduledFor,
  }).select('id').single()
  if (record.error || !record.data?.id) return { ok: false, error: 'Could not open a broadcast log. Nothing was sent.' }
  if (input.scheduledFor) {
    await writeAudit({ actorId: input.actorId, action: 'broadcast_scheduled', summary: `Scheduled “${subject}” for ${recipients.length}`, targetType: 'broadcast', targetId: record.data.id })
    return { ok: true, count: recipients.length, detail: 'Scheduled. It sends to whoever matches then.' }
  }

  const result = await pushBroadcast(recipients, input.channels, subject, body, input.href, input.startsAt, input.endsAt, input.actorId, input.audience)
  await admin.from('founder_broadcasts').update({
    status: 'sent',
    sent_at: new Date().toISOString(),
    result,
  }).eq('id', record.data.id)
  await writeAudit({
    actorId: input.actorId,
    action: 'broadcast_sent',
    summary: `Sent “${subject}” to ${recipients.length} via ${input.channels.join(', ')}`,
    targetType: 'broadcast',
    targetId: record.data.id,
    detail: result,
  })
  return { ok: true, count: recipients.length, detail: result.note }
}

async function pushBroadcast(
  recipients: Recipient[],
  channels: Channel[],
  subject: string,
  body: string,
  href: string | null,
  startsAt: string | null,
  endsAt: string | null,
  actorId: string,
  audience: string,
): Promise<{ emailed: number; notified: number; texted: number; banner: boolean; note: string }> {
  const admin = createAdminClient() as any
  let emailed = 0
  let notified = 0
  let texted = 0
  let banner = false
  const sms = readSmsConfig()
  if (channels.includes('banner')) {
    const saved = await admin.from('founder_banners').insert({
      created_by: actorId,
      audience_key: audience,
      title: subject,
      body,
      href,
      starts_at: startsAt,
      ends_at: endsAt,
      active: true,
    })
    banner = !saved.error
  }
  for (const person of recipients) {
    if (channels.includes('email') && person.email && canReceive(person, 'email')) {
      if (await sendEmail(person.email, subject, body)) emailed += 1
    }
    if (channels.includes('inapp') && person.userId) {
      const note = await admin.from('notifications').insert({
        user_id: person.userId,
        title: subject,
        body: body.slice(0, 240),
        type: 'broadcast',
        priority: 'info',
        link: href || (person.key.startsWith('member') ? '/portal' : '/doctor/dashboard'),
      })
      if (!note.error) notified += 1
    }
    if (channels.includes('text') && person.textOk && person.phone && sms.enabled && sms.apiKey) {
      const text = await quoSend({ to: person.phone, content: `${subject}\n${body}`.slice(0, 480) })
      if (text.ok) texted += 1
    }
  }
  const notes = [`${emailed} emailed`, `${notified} in-app`, `${texted} texted`]
  if (channels.includes('banner')) notes.push(banner ? 'banner saved' : 'banner could not be saved')
  if (channels.includes('text') && !sms.enabled) notes.push('texting is switched off')
  if (channels.includes('banner') && audience !== 'members' && audience !== 'everyone') {
    notes.push('doctor-portal banners are stored and previewed here')
  }
  return { emailed, notified, texted, banner, note: notes.join(' · ') }
}

export async function nudgeWaitingDoctors(actorId: string, expected: number, limitTo?: string[] | null): Promise<SendResult> {
  const roster = await loadFounderRoster()
  const waiting = waitingRequests(roster)
  const byDoctor = new Map<string, typeof waiting>()
  const allowed = limitTo ? new Set(limitTo) : null
  for (const row of waiting) {
    if (!row.doctorId) continue
    if (allowed && !allowed.has(row.doctorId)) continue
    const list = byDoctor.get(row.doctorId) || []
    list.push(row)
    byDoctor.set(row.doctorId, list)
  }
  if (byDoctor.size !== expected) return { ok: false, error: `${byDoctor.size} doctors are waiting now. Confirm that count.` }
  const admin = createAdminClient() as any
  let emailed = 0
  let notified = 0
  for (const [doctorId, rows] of byDoctor) {
    const doctor = roster.doctors.find((item) => item.id === doctorId)
    if (!doctor) continue
    const message = `You have ${rows.length} community member request${rows.length === 1 ? '' : 's'} waiting more than 48 hours. Reply in NeuroChiro: ${siteUrl()}/doctor`
    if (doctor.email && await sendEmail(doctor.email, 'A community member is waiting', message)) emailed += 1
    if (doctor.userId) {
      const note = await admin.from('notifications').insert({
        user_id: doctor.userId,
        title: 'A community member is waiting',
        body: message,
        type: 'lead',
        priority: 'important',
        link: '/doctor/leads',
      })
      if (!note.error) notified += 1
    }
    await admin.from('founder_nudges').insert({
      actor_id: actorId,
      doctor_id: doctorId,
      kind: 'nudge',
      request_ids: rows.map((row) => row.id),
      detail: { emailed: Boolean(doctor.email), notified: Boolean(doctor.userId) },
    })
  }
  await writeAudit({ actorId, action: 'nudge_waiting', summary: `Nudged ${byDoctor.size} doctors about ${waiting.length} waiting requests`, detail: { emailed, notified } })
  return { ok: true, count: byDoctor.size, detail: `${emailed} emailed · ${notified} in-app` }
}

export async function rerouteWaiting(actorId: string, doctorId: string, expected: number): Promise<SendResult> {
  const roster = await loadFounderRoster()
  const doctor = roster.doctors.find((item) => item.id === doctorId)
  if (!doctor) return { ok: false, error: 'That doctor is not on the list.' }
  const waiting = waitingRequests(roster).filter((row) => row.doctorId === doctorId)
  const admin = createAdminClient() as any
  const subscriberIds = [...new Set(waiting.map((row) => row.subscriberId).filter(Boolean))] as string[]
  const places = new Map<string, { lat: number; lng: number }>()
  if (subscriberIds.length) {
    const subs = await admin.from('subscribers').select('id, latitude, longitude, zip, city, state').in('id', subscriberIds)
    for (const row of subs.data || []) {
      const lat = Number(row.latitude)
      const lng = Number(row.longitude)
      if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0) places.set(String(row.id), { lat, lng })
    }
  }
  const movable: { id: string; lat: number; lng: number }[] = []
  for (const row of waiting) {
    const known = row.subscriberId ? places.get(row.subscriberId) : null
    if (known) {
      movable.push({ id: row.id, ...known })
      continue
    }
  }
  if (waiting.length !== expected) {
    return { ok: false, error: `${waiting.length} requests are waiting now. Confirm that count.` }
  }
  if (!movable.length) {
    return { ok: false, error: 'None of these requests have a saved place, so the next doctor cannot be chosen.' }
  }
  let moved = 0
  for (const row of movable) {
    const next = doctorsNear(roster, row.lat, row.lng, 8).find((hit) => !hit.href.endsWith(doctorId))
    if (!next) continue
    const nextId = next.href.split('id=')[1]
    const updated = await admin.from('contact_requests').update({ doctor_id: nextId, admin_note: 'Rerouted after 48 hours without a reply.' }).eq('id', row.id).eq('doctor_id', doctorId)
    if (updated.error) continue
    moved += 1
    const target = roster.doctors.find((item) => item.id === nextId)
    if (target?.userId) {
      await admin.from('notifications').insert({
        user_id: target.userId,
        title: 'A visit request was moved to you',
        body: 'The first office had not replied in 48 hours. Open your requests in NeuroChiro.',
        type: 'lead',
        priority: 'important',
        link: '/doctor/leads',
      })
    }
    if (target?.email) await sendEmail(target.email, 'A visit request was moved to you', `The first office had not replied in 48 hours. Open your requests: ${siteUrl()}/doctor`)
    await admin.from('founder_nudges').insert({
      actor_id: actorId,
      doctor_id: doctorId,
      kind: 'reroute',
      request_ids: [row.id],
      detail: { to: nextId, miles: next.miles },
    })
  }
  await writeAudit({ actorId, action: 'reroute_waiting', summary: `Rerouted ${moved} request${moved === 1 ? '' : 's'} away from ${doctor.name}`, targetType: 'doctor', targetId: doctorId })
  return { ok: true, count: moved, detail: `${moved} moved to the next live doctor` }
}

export async function sendMondayDigest(reason: 'cron' | 'manual'): Promise<SendResult> {
  const settings = await loadFounderSettings()
  if (reason === 'cron' && !settings.automations.mondayDigest) return { ok: true, count: 0, detail: 'Monday digest is off.' }
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date())
  const { loadDigestStamp } = await import('./settings')
  if (reason === 'cron') {
    const last = await loadDigestStamp()
    if (last === today) return { ok: true, count: 0, detail: 'Already sent today.' }
  }
  const roster = await loadFounderRoster()
  const { buildNeeds, buildFunnel } = await import('./model')
  const { adminToday } = await import('@/lib/admin/metrics')
  const todayStats = await adminToday().catch(() => null)
  const needs = buildNeeds(roster)
  const lines = [
    'Pulse for this Monday.',
    '',
    `Asks for a doctor: ${roster.demandCount}`,
    `Visit requests still open: ${openRequests(roster).length}`,
    `Doctors live: ${roster.doctors.filter((doctor) => doctor.verified).length}`,
    `Paying doctors: ${todayStats?.paying ?? 'unavailable'}`,
    `MRR: ${todayStats?.mrrUsd == null ? 'unavailable' : `$${Math.round(todayStats.mrrUsd)}`}`,
    '',
    'Needs you:',
    ...(needs.length ? needs.map((item) => `- ${item.title}`) : ['- Nothing in this list.']),
    '',
    'Funnel:',
    ...buildFunnel(roster).map((step) => `- ${step.label}: ${step.value}`),
    '',
    `Open Pulse: ${siteUrl()}/admin`,
  ]
  const sent = await sendEmail(DIGEST_TO, 'NeuroChiro Pulse', lines.join('\n'))
  if (!sent) return { ok: false, error: 'The digest email could not be sent.' }
  await saveDigestStamp(today)
  await writeAudit({ actorId: null, action: 'monday_digest', summary: `Pulse digest emailed to ${DIGEST_TO}`, detail: { reason } })
  return { ok: true, count: 1, detail: `Emailed ${DIGEST_TO}` }
}

export async function runOfficeFollowup(): Promise<SendResult> {
  const settings = await loadFounderSettings()
  if (!settings.automations.didYouGetIn) return { ok: true, count: 0, detail: 'Did you get in? is off.' }
  const admin = createAdminClient() as any
  const cutoff = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const rows = await admin.from('contact_requests')
    .select('id, email, phone, sms_consent, sms_phone, doctor_id, office_visit_sent_at, status')
    .is('office_visit_sent_at', null)
    .neq('status', 'withdrawn')
    .lt('created_at', cutoff)
    .limit(40)
  if (rows.error && isMissingTable(rows.error)) return { ok: true, count: 0, detail: 'Office-visit columns are not in the database yet.' }
  if (rows.error) {
    const missing = /column|schema cache/i.test(rows.error.message || '')
    if (missing) return { ok: true, count: 0, detail: 'Office-visit columns are not in the database yet. Nothing was sent.' }
    return { ok: false, error: 'Could not read visit requests.' }
  }
  let sent = 0
  for (const row of rows.data || []) {
    const token = crypto.randomBytes(32).toString('hex')
    const yes = `${siteUrl()}/contact-request/visit?token=${token}&answer=yes`
    const no = `${siteUrl()}/contact-request/visit?token=${token}&answer=no`
    const message = `Did you get in to see the NeuroChiro doctor?\nYes: ${yes}\nNot yet: ${no}`
    let delivered = false
    if (row.email) delivered = await sendEmail(row.email, 'Did you get in?', message)
    const sms = readSmsConfig()
    if (!delivered && row.sms_consent && row.sms_phone && sms.enabled) {
      const text = await quoSend({ to: row.sms_phone, content: message.slice(0, 480) })
      delivered = text.ok
    }
    if (!delivered) continue
    const saved = await admin.from('contact_requests').update({
      office_visit_token: token,
      office_visit_sent_at: new Date().toISOString(),
    }).eq('id', row.id).is('office_visit_sent_at', null)
    if (!saved.error) sent += 1
  }
  await writeAudit({ actorId: null, action: 'office_followup', summary: `Did you get in? sent to ${sent}` })
  return { ok: true, count: sent, detail: `${sent} follow-ups sent` }
}

export async function runScheduledBroadcasts(): Promise<SendResult> {
  const admin = createAdminClient() as any
  const due = await admin.from('founder_broadcasts').select('id, audience_key, audience, channels, subject, body, created_by').eq('status', 'scheduled').lte('scheduled_for', new Date().toISOString()).limit(10)
  if (due.error) return { ok: true, count: 0, detail: isMissingTable(due.error) ? 'Broadcast table is not applied yet.' : 'No scheduled broadcasts read.' }
  let sent = 0
  for (const row of due.data || []) {
    const claimed = await admin.from('founder_broadcasts').update({ status: 'sending' }).eq('id', row.id).eq('status', 'scheduled').select('id')
    if (!claimed.data?.length) continue
    const roster = await loadFounderRoster()
    const filters = row.audience && typeof row.audience === 'object' ? row.audience as AudienceFilters : {}
    const channels = (Array.isArray(row.channels) ? row.channels : []).filter((item: string): item is Channel => item === 'banner' || item === 'email' || item === 'inapp' || item === 'text')
    const recipients = reachable(resolveAudience(roster, row.audience_key as AudienceKey, filters), channels).slice(0, MAX_SEND)
    const result = await pushBroadcast(recipients, channels, row.subject, row.body, null, null, null, row.created_by, row.audience_key)
    await admin.from('founder_broadcasts').update({ status: 'sent', sent_at: new Date().toISOString(), recipient_count: recipients.length, result }).eq('id', row.id)
    sent += 1
  }
  return { ok: true, count: sent, detail: `${sent} scheduled broadcasts sent` }
}

export async function runAutoNudge(): Promise<SendResult> {
  const settings = await loadFounderSettings()
  if (!settings.automations.autoNudge) return { ok: true, count: 0, detail: 'Auto-nudge is off.' }
  const admin = createAdminClient() as any
  const probe = await admin.from('founder_nudges').select('id').limit(1)
  if (probe.error) return { ok: true, count: 0, detail: 'Auto-nudge stays off until the nudge log table exists.' }
  const roster = await loadFounderRoster()
  const waiting = waitingRequests(roster)
  const recent = await admin.from('founder_nudges').select('doctor_id, created_at').gte('created_at', new Date(Date.now() - 20 * 3_600_000).toISOString()).eq('kind', 'nudge')
  const recentIds = new Set((recent.data || []).map((row: { doctor_id: string }) => row.doctor_id))
  const doctorIds = [...new Set(waiting.map((row) => row.doctorId).filter((id): id is string => Boolean(id) && !recentIds.has(id)))]
  if (!doctorIds.length) return { ok: true, count: 0, detail: 'Nobody new to nudge.' }
  return nudgeWaitingDoctors('automation', doctorIds.length, doctorIds)
}

export function demandAround(roster: Awaited<ReturnType<typeof loadFounderRoster>>, lat: number, lng: number) {
  return {
    within25: demandNear(roster, lat, lng, 25),
    within50: demandNear(roster, lat, lng, 50),
    nearest: doctorsNear(roster, lat, lng, 5),
  }
}

export { resolveSearchPoint }
