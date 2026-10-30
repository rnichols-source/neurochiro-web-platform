import { explainDoctorTimezone, getLocalHour, isQuietHours } from '@/lib/doctor-timezone'
import {
  DEFAULT_LEAD_FOLLOWUP,
  overlayLegacyConfig,
  parseLeadFollowupConfig,
  siteUrl,
  type LeadFollowupConfig,
} from './config'
import {
  sendAdminAlert,
  sendAdminCopy,
  sendAdminEscalation,
  sendDoctorInitial,
  sendDoctorReminder,
  sendPatientCheckin,
  type LeadMail,
} from './deliver'
import { postDiscord } from './discord'
import { nextLeadAction, type LeadNotificationSnapshot, type NextLeadAction } from './escalation'
import { getDoctorRecipients } from './recipients'
import { isMissingColumn, isMissingTable, updateContactRequest } from './schema'
import { parseLegacyNote } from './validate'

const DONE = new Set(['sent', 'delivered', 'opened', 'clicked'])
const PAGE = 200

const EXTENDED = [
  'id', 'name', 'phone', 'note', 'email', 'preferred_time', 'message', 'doctor_id', 'created_at',
  'acknowledge_token', 'withdrawal_token', 'status', 'contact_outcome', 'acknowledged_at',
  'will_call_deadline', 'withdrawn_at', 'reminder_count', 'escalated_to_admin_at',
  'patient_checkin_sent_at', 'patient_checkin_response', 'patient_checkin_token',
  'outcome_detail', 'source', 'attention_reason', 'doctor_first_notified_at',
].join(', ')

const BASE = [
  'id', 'name', 'phone', 'note', 'doctor_id', 'created_at', 'acknowledge_token', 'withdrawal_token',
  'status', 'contact_outcome', 'acknowledged_at', 'will_call_deadline', 'withdrawn_at', 'source',
].join(', ')

type SendKind = 'doctor_initial' | 'doctor_reminder_1' | 'doctor_reminder_2' | 'admin_copy' | 'admin_escalation' | 'admin_alert' | 'patient_checkin'

const STEP: Record<SendKind, number> = {
  doctor_initial: 1,
  doctor_reminder_1: 2,
  doctor_reminder_2: 3,
  admin_escalation: 4,
  patient_checkin: 5,
  admin_copy: 6,
  admin_alert: 7,
}

export type EscalationRunResult = {
  processed: number
  dry_run: boolean
  skipped?: boolean
  reason?: string
  results: Array<Record<string, unknown>>
}

async function loadConfig(db: any): Promise<{ config: LeadFollowupConfig; explicitDisabled: boolean }> {
  const lead = await db.from('platform_settings').select('value').eq('key', 'lead_followup').maybeSingle()
  if (lead.error) console.error('[LEADS] lead_followup settings read failed:', lead.error.message)
  if (lead.data?.value) {
    const config = parseLeadFollowupConfig(lead.data.value)
    return { config, explicitDisabled: config.enabled === false }
  }
  const legacy = await db.from('platform_settings').select('value').eq('key', 'contact_escalation').maybeSingle()
  if (legacy.error) console.error('[LEADS] contact_escalation settings read failed:', legacy.error.message)
  return {
    config: overlayLegacyConfig({ ...DEFAULT_LEAD_FOLLOWUP }, legacy.data?.value),
    explicitDisabled: false,
  }
}

async function selectPage(db: any, status: string, from: number): Promise<any[]> {
  const extended = await db.from('contact_requests').select(EXTENDED).eq('status', status).order('created_at', { ascending: true }).range(from, from + PAGE - 1)
  if (!extended.error) return extended.data || []
  if (!isMissingColumn(extended.error)) throw new Error(extended.error.message)
  console.error('[LEADS] contact_requests follow-up columns are missing. Cron is using the original columns. Apply migration 20261030000000_lead_followup.sql.', extended.error.message)
  const base = await db.from('contact_requests').select(BASE).eq('status', status).order('created_at', { ascending: true }).range(from, from + PAGE - 1)
  if (base.error) throw new Error(base.error.message)
  return base.data || []
}

async function loadNotifications(db: any, requestId: string): Promise<any[]> {
  const { data, error } = await db
    .from('lead_notifications')
    .select('id, kind, status, attempt, recipient, channel, created_at')
    .eq('contact_request_id', requestId)
    .order('created_at', { ascending: true })
  if (error) {
    if (isMissingTable(error)) return []
    throw new Error(error.message)
  }
  return data || []
}

function snapshots(rows: any[]): LeadNotificationSnapshot[] {
  return rows.map((row) => ({ id: row.id, kind: row.kind, status: row.status, attempt: row.attempt || 1 }))
}

async function logRun(db: any, row: Record<string, unknown>): Promise<void> {
  const { error } = await db.from('escalation_run_log').insert(row)
  if (error) console.error('[LEADS] escalation_run_log insert failed:', error.message)
}

function hoursWaiting(createdAt: string, now: Date): number {
  return Math.max(0, Math.round((now.getTime() - new Date(createdAt).getTime()) / 3_600_000))
}

async function loadDoctor(db: any, doctorId: string): Promise<any | null> {
  const full = await db.from('doctors').select('id, first_name, last_name, clinic_name, email, phone, city, state, country, user_id, lead_notification_emails').eq('id', doctorId).maybeSingle()
  if (!full.error) return full.data
  if (!isMissingColumn(full.error)) throw new Error(full.error.message)
  const base = await db.from('doctors').select('id, first_name, last_name, clinic_name, email, phone, city, state, country, user_id').eq('id', doctorId).maybeSingle()
  if (base.error) throw new Error(base.error.message)
  return base.data
}

function actionKind(action: NextLeadAction, rows: any[]): SendKind | null {
  if (action.type === 'doctor_reminder_1' || action.type === 'doctor_reminder_2' || action.type === 'admin_escalation' || action.type === 'patient_checkin') {
    return action.type
  }
  if (action.type !== 'retry') return null
  const row = rows.find((item) => item.id === action.notificationId)
  const kind = row?.kind
  if (kind === 'doctor_initial' || kind === 'doctor_reminder_1' || kind === 'doctor_reminder_2' || kind === 'admin_copy' || kind === 'admin_escalation' || kind === 'admin_alert' || kind === 'patient_checkin') {
    return kind
  }
  return null
}

async function sendKind(mail: LeadMail, kind: SendKind): Promise<{ ok: boolean; error?: string }> {
  if (kind === 'doctor_initial') return sendDoctorInitial(mail)
  if (kind === 'doctor_reminder_1') return sendDoctorReminder(mail, 1)
  if (kind === 'doctor_reminder_2') return sendDoctorReminder(mail, 2)
  if (kind === 'admin_copy') return sendAdminCopy(mail)
  if (kind === 'admin_escalation') return sendAdminEscalation(mail)
  if (kind === 'admin_alert') return sendAdminAlert(mail, mail.reason || 'failed send retry')
  return sendPatientCheckin(mail)
}

async function afterSuccess(db: any, request: any, mail: LeadMail, kind: SendKind, now: Date): Promise<void> {
  const stamp = now.toISOString()
  if (kind === 'doctor_initial') {
    await updateContactRequest(db, request.id, { doctor_first_notified_at: request.doctor_first_notified_at || stamp })
    const existing = await db.from('contact_request_escalations').select('id').eq('contact_request_id', request.id).eq('step', 1).limit(1)
    if (!existing.error && !(existing.data || []).length) {
      const inserted = await db.from('contact_request_escalations').insert({ contact_request_id: request.id, step: 1, channel: 'email' })
      if (inserted.error) console.error('[LEADS] step-1 log failed:', inserted.error.message)
    }
  }
  if (kind === 'doctor_reminder_1' || kind === 'doctor_reminder_2') {
    const current = request.reminder_count || 0
    const count = kind === 'doctor_reminder_1' ? Math.max(current, 0) + 1 : Math.max(current, 1) + 1
    await updateContactRequest(db, request.id, { reminder_count: count, last_reminder_at: stamp })
  }
  if (kind === 'admin_escalation') {
    await updateContactRequest(db, request.id, {
      escalated_to_admin_at: stamp,
      needs_admin_attention: true,
      attention_reason: request.attention_reason || 'no doctor response',
    })
    await postDiscord(
      `🚨 **Lead escalation**\n**Patient:** ${mail.patientName}\n**Phone:** ${mail.patientPhone || 'none'}\n**Doctor:** ${mail.doctorName} (${mail.doctorPhone || 'no phone'}, ${mail.doctorEmail || 'no email'})\n**Waiting:** ${mail.hoursWaiting}h\n→ ${siteUrl()}/admin/contact-requests?focus=${request.id}`,
    )
  }
  if (kind === 'patient_checkin') {
    await updateContactRequest(db, request.id, { patient_checkin_sent_at: stamp })
  }
}

function snapshotOf(request: any, legacyEmail: string) {
  return {
    id: request.id,
    status: request.status,
    contact_outcome: request.contact_outcome || null,
    created_at: request.created_at,
    withdrawn_at: request.withdrawn_at || null,
    will_call_deadline: request.will_call_deadline || null,
    acknowledged_at: request.acknowledged_at || null,
    outcome_detail: request.outcome_detail || null,
    escalated_to_admin_at: request.escalated_to_admin_at || null,
    reminder_count: request.reminder_count ?? 0,
    patient_email: request.email || legacyEmail || null,
    patient_checkin_sent_at: request.patient_checkin_sent_at || null,
    patient_checkin_response: request.patient_checkin_response || null,
  }
}

async function handleRequest(db: any, request: any, config: LeadFollowupConfig, now: Date, dryRun: boolean): Promise<Record<string, unknown>> {
  if (request.status === 'withdrawn' || request.withdrawn_at) {
    return { id: request.id, action: 'none', reason: 'withdrawn' }
  }

  const doctor = await loadDoctor(db, request.doctor_id)
  if (!doctor) {
    await logRun(db, { contact_request_id: request.id, step: 0, action: 'error', reason: 'Doctor not found', dry_run: dryRun })
    return { id: request.id, action: 'error', reason: 'Doctor not found' }
  }

  const tz = explainDoctorTimezone(doctor.state, doctor.country, config.default_timezone)
  const timezone = tz.timezone || config.default_timezone
  const quiet = isQuietHours(timezone, config.quiet_hours.start, config.quiet_hours.end, now)
  const rows = await loadNotifications(db, request.id)
  const legacy = parseLegacyNote(request.note)
  const action = nextLeadAction(snapshotOf(request, legacy.email), snapshots(rows), config, now, { inQuietHours: quiet })
  const base = {
    id: request.id,
    age_hours: hoursWaiting(request.created_at, now),
    action: action.type,
    reason: action.type === 'none' ? action.reason : action.type === 'retry' ? `retry ${action.kind}` : undefined,
    timezone,
    tz_fallback: tz.usedFallback,
    quiet,
  }
  if (action.type === 'none') return base

  const kind = actionKind(action, rows)
  if (!kind) return { ...base, action: 'error', reason: 'Unknown action' }

  const recipients = await getDoctorRecipients(doctor)
  const doctorSend = kind === 'doctor_initial' || kind === 'doctor_reminder_1' || kind === 'doctor_reminder_2'
  if (doctorSend && recipients.length === 0) {
    await updateContactRequest(db, request.id, { needs_admin_attention: true, attention_reason: 'doctor has no email' })
    if (!dryRun) {
      const mail = await mailFor(db, request, doctor, recipients, rows, now)
      await sendAdminAlert(mail, 'doctor has no email')
    }
    await logRun(db, { contact_request_id: request.id, step: STEP[kind], action: 'error', reason: `doctor has no email${tz.usedFallback ? ' tz_fallback' : ''}`, doctor_timezone: timezone, doctor_local_hour: getLocalHour(timezone, now), dry_run: dryRun })
    return { ...base, action: 'error', reason: 'doctor has no email' }
  }

  if (rows.some((row) => row.kind === kind && DONE.has(row.status)) && action.type !== 'retry') {
    return { ...base, action: 'none', reason: 'already_sent' }
  }

  const fallbackNote = tz.usedFallback ? ' tz_fallback' : ''
  if (dryRun) {
    await logRun(db, { contact_request_id: request.id, step: STEP[kind], action: 'would_send', reason: `${kind}${fallbackNote}`, doctor_timezone: timezone, doctor_local_hour: getLocalHour(timezone, now), dry_run: true })
    return { ...base, would_send: kind }
  }

  const mail = await mailFor(db, request, doctor, recipients, rows, now)
  if (kind === 'patient_checkin') {
    if (!mail.checkinToken) {
      const crypto = await import('crypto')
      const token = crypto.randomBytes(32).toString('hex')
      const saved = await updateContactRequest(db, request.id, { patient_checkin_token: token })
      if (!saved.ok || saved.missingColumn) {
        console.error('[LEADS] patient_checkin_token column is missing. Check-in skipped. Apply migration 20261030000000_lead_followup.sql.')
        return { ...base, action: 'error', reason: 'check-in token unavailable' }
      }
      mail.checkinToken = token
    }
  }

  const prior = action.type === 'retry'
    ? rows.find((row) => row.id === action.notificationId)
    : rows.find((row) => row.kind === kind && row.status === 'failed' && (row.attempt || 1) < 5)
  if (prior) {
    mail.existingId = prior.id
    mail.attempt = (prior.attempt || 1) + 1
  }

  const sent = await sendKind(mail, kind)
  if (!sent.ok) {
    await logRun(db, { contact_request_id: request.id, step: STEP[kind], action: 'error', reason: `${kind} failed: ${sent.error || 'unknown'}${fallbackNote}`.slice(0, 500), doctor_timezone: timezone, doctor_local_hour: getLocalHour(timezone, now), dry_run: false })
    return { ...base, action: 'error', reason: sent.error || 'send failed' }
  }

  await afterSuccess(db, request, mail, kind, now)
  await logRun(db, { contact_request_id: request.id, step: STEP[kind], action: 'sent', reason: `${kind}${fallbackNote}`, doctor_timezone: timezone, doctor_local_hour: getLocalHour(timezone, now), dry_run: false })
  return { ...base, sent: kind }
}

async function mailFor(db: any, request: any, doctor: any, recipients: string[], rows: any[], now: Date): Promise<LeadMail> {
  const legacy = parseLegacyNote(request.note)
  const name = `Dr. ${doctor.first_name || ''} ${doctor.last_name || ''}`.trim()
  return {
    requestId: request.id,
    patientName: request.name || '',
    patientPhone: request.phone || '',
    patientEmail: request.email || legacy.email || '',
    preferredTime: request.preferred_time || legacy.preferredTime || '',
    message: request.message || request.note || '',
    source: request.source || '',
    doctorName: name,
    practiceName: doctor.clinic_name || name,
    doctorPhone: doctor.phone || '',
    doctorEmail: recipients[0] || doctor.email || '',
    doctorRecipients: recipients,
    acknowledgeToken: request.acknowledge_token || '',
    withdrawalToken: request.withdrawal_token || '',
    checkinToken: request.patient_checkin_token || '',
    hoursWaiting: hoursWaiting(request.created_at, now),
    history: rows.map((row) => ({
      kind: row.kind,
      channel: row.channel,
      status: row.status,
      recipient: row.recipient,
      at: row.created_at,
    })),
    reason: request.attention_reason || undefined,
  }
}

function keepResult(status: string, outcome: Record<string, unknown>): boolean {
  if (status === 'new') return true
  return outcome.action === 'patient_checkin'
    || outcome.sent === 'patient_checkin'
    || outcome.would_send === 'patient_checkin'
    || outcome.action === 'error'
}

async function migrationReady(db: any): Promise<boolean> {
  const column = await db.from('contact_requests').select('reminder_count').limit(1)
  if (column.error && isMissingColumn(column.error)) return false
  const table = await db.from('lead_notifications').select('id').limit(1)
  if (table.error && isMissingTable(table.error)) return false
  return true
}

export async function runLeadEscalation(db: any, dryRun: boolean, now = new Date()): Promise<EscalationRunResult> {
  const ready = await migrationReady(db)
  if (!ready) {
    console.error('[LEADS] Escalation cron is not sending. Apply migration 20261030000000_lead_followup.sql first.')
    return {
      processed: 0,
      dry_run: dryRun,
      skipped: true,
      reason: 'migration 20261030000000_lead_followup.sql is not applied',
      results: [],
    }
  }

  const { config, explicitDisabled } = await loadConfig(db)
  if (explicitDisabled && !dryRun) {
    return { processed: 0, dry_run: dryRun, skipped: true, reason: 'lead_followup disabled', results: [] }
  }

  const results: Array<Record<string, unknown>> = []
  let seen = 0
  for (const status of ['new', 'acknowledged', 'doctor_unreachable']) {
    let from = 0
    for (;;) {
      let rows: any[]
      try {
        rows = await selectPage(db, status, from)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'page failed'
        console.error('[LEADS] escalation page failed:', message)
        results.push({ action: 'error', reason: message, status })
        break
      }
      for (const request of rows) {
        seen += 1
        try {
          const outcome = await handleRequest(db, request, config, now, dryRun)
          if (keepResult(status, outcome)) results.push(outcome)
        } catch (err) {
          const message = err instanceof Error ? err.message : 'row failed'
          console.error(`[LEADS] escalation row ${request.id} failed:`, message)
          await logRun(db, { contact_request_id: request.id, step: 0, action: 'error', reason: message.slice(0, 500), dry_run: dryRun })
          results.push({ id: request.id, action: 'error', reason: message })
        }
      }
      if (rows.length < PAGE) break
      from += PAGE
    }
  }

  return { processed: seen, dry_run: dryRun, results }
}
