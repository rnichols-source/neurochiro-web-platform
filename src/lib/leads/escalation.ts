import type { LeadFollowupConfig } from './config'

export type LeadNotificationSnapshot = {
  id: string
  kind: string
  status: string
  attempt: number
}

export type LeadRequestSnapshot = {
  id: string
  status: string
  contact_outcome: string | null
  created_at: string
  withdrawn_at?: string | null
  will_call_deadline?: string | null
  acknowledged_at?: string | null
  outcome_detail?: string | null
  escalated_to_admin_at?: string | null
  reminder_count?: number | null
  patient_email?: string | null
  patient_checkin_sent_at?: string | null
  patient_checkin_response?: string | null
}

export type NextLeadAction =
  | { type: 'retry'; notificationId: string; kind: string }
  | { type: 'doctor_reminder_1' }
  | { type: 'doctor_reminder_2' }
  | { type: 'admin_escalation' }
  | { type: 'patient_checkin' }
  | { type: 'none'; reason: string }

/** Failed rows the cron retries before it sends the next new kind. */
const RETRY_KINDS = new Set([
  'doctor_initial',
  'admin_copy',
  'admin_escalation',
  'admin_alert',
])

const DONE_STATUSES = new Set(['sent', 'delivered', 'opened', 'clicked'])

function succeeded(notifications: LeadNotificationSnapshot[], kind: string): boolean {
  return notifications.some((row) => row.kind === kind && DONE_STATUSES.has(row.status))
}

function exhausted(notifications: LeadNotificationSnapshot[], kind: string): boolean {
  return !succeeded(notifications, kind)
    && notifications.some((row) => row.kind === kind && row.status === 'failed' && row.attempt >= 5)
}

function pickRetry(notifications: LeadNotificationSnapshot[]): LeadNotificationSnapshot | null {
  const failed = notifications.filter((row) =>
    RETRY_KINDS.has(row.kind) && row.status === 'failed' && row.attempt < 5,
  )
  return failed[0] || null
}

function ageHours(createdAt: string, now: Date): number {
  const created = new Date(createdAt).getTime()
  if (Number.isNaN(created)) return 0
  return (now.getTime() - created) / 3_600_000
}

function checkinDue(
  request: LeadRequestSnapshot,
  notifications: LeadNotificationSnapshot[],
  config: LeadFollowupConfig,
  now: Date,
): boolean {
  if (!request.patient_email) return false
  if (request.patient_checkin_sent_at) return false
  if (request.patient_checkin_response) return false
  if (succeeded(notifications, 'patient_checkin')) return false
  if (exhausted(notifications, 'patient_checkin')) return false

  if (ageHours(request.created_at, now) >= config.patient_checkin_hours) return true

  const detail = request.outcome_detail
  const calledOrVoicemail = detail === 'called'
    || detail === 'voicemail'
    || detail === 'booked'
    || request.contact_outcome === 'patient_contacted_confirmed'
  if (calledOrVoicemail && request.acknowledged_at) {
    const sinceAck = (now.getTime() - new Date(request.acknowledged_at).getTime()) / 3_600_000
    if (sinceAck >= 24) return true
  }
  return false
}

/**
 * The single next thing to do for one lead.
 * Reminders wait for quiet hours. The initial-email retry and admin escalation do not.
 * One step at a time: a 48h-old lead with reminder_count 0 gets reminder 1, not the escalation.
 */
export function nextLeadAction(
  request: LeadRequestSnapshot,
  notifications: LeadNotificationSnapshot[],
  config: LeadFollowupConfig,
  now: Date,
  ctx: { inQuietHours: boolean },
): NextLeadAction {
  if (request.status === 'withdrawn' || request.withdrawn_at) {
    return { type: 'none', reason: 'withdrawn' }
  }

  const doctorClosed = request.contact_outcome === 'patient_contacted_confirmed'
    || request.status === 'acknowledged'
    || request.status === 'doctor_unreachable'

  if (!doctorClosed) {
    const waitingOnPromise = request.contact_outcome === 'will_call_today'
      && !!request.will_call_deadline
      && new Date(request.will_call_deadline).getTime() > now.getTime()
    if (waitingOnPromise) return { type: 'none', reason: 'will_call_today' }

    const retry = pickRetry(notifications)
    if (retry) return { type: 'retry', notificationId: retry.id, kind: retry.kind }

    const count = request.reminder_count ?? 0
    const age = ageHours(request.created_at, now)

    const reminder1Open = count < 1
      && !succeeded(notifications, 'doctor_reminder_1')
      && !exhausted(notifications, 'doctor_reminder_1')
    if (reminder1Open) {
      if (age < config.reminder_1_hours) return { type: 'none', reason: 'not_due' }
      if (ctx.inQuietHours) return { type: 'none', reason: 'quiet_hours' }
      return { type: 'doctor_reminder_1' }
    }

    const reminder2Open = count < 2
      && !succeeded(notifications, 'doctor_reminder_2')
      && !exhausted(notifications, 'doctor_reminder_2')
    if (reminder2Open) {
      if (age < config.reminder_2_hours) return { type: 'none', reason: 'not_due' }
      if (ctx.inQuietHours) return { type: 'none', reason: 'quiet_hours' }
      return { type: 'doctor_reminder_2' }
    }

    const escalationOpen = !request.escalated_to_admin_at
      && !succeeded(notifications, 'admin_escalation')
      && !exhausted(notifications, 'admin_escalation')
    if (escalationOpen) {
      if (age < config.admin_escalation_hours) return { type: 'none', reason: 'not_due' }
      return { type: 'admin_escalation' }
    }
  }

  if (checkinDue(request, notifications, config, now)) {
    return { type: 'patient_checkin' }
  }

  if (!request.patient_email && !request.patient_checkin_sent_at) {
    const age = ageHours(request.created_at, now)
    const checkinWindow = age >= config.patient_checkin_hours
      || (!!request.acknowledged_at && (now.getTime() - new Date(request.acknowledged_at).getTime()) / 3_600_000 >= 24)
    if (checkinWindow && (doctorClosed || request.escalated_to_admin_at || succeeded(notifications, 'admin_escalation'))) {
      return { type: 'none', reason: 'no_patient_email' }
    }
  }

  if (doctorClosed) return { type: 'none', reason: 'acknowledged' }
  return { type: 'none', reason: 'not_due' }
}

export type AttentionInput = {
  needsAdminAttention: boolean
  status: string
  contactOutcome: string | null
  ageHours: number
  willCallDeadline?: string | null
  checkinResponse?: string | null
  doctorRecipientCount: number
  hasFailedOrBouncedSend: boolean
  now?: Date
}

/** Same rule the admin "Needs attention" tab and the sidebar badge use. */
export function requestNeedsAttention(input: AttentionInput): boolean {
  if (input.status === 'withdrawn') return false
  if (input.needsAdminAttention) return true
  if (input.checkinResponse === 'not_yet') return true
  if (input.hasFailedOrBouncedSend) return true
  if (input.doctorRecipientCount === 0 && input.status === 'new' && input.contactOutcome !== 'patient_contacted_confirmed') {
    return true
  }
  const open = input.status === 'new' && input.contactOutcome !== 'patient_contacted_confirmed'
  if (!open) return false
  if (input.contactOutcome === 'will_call_today' && input.willCallDeadline) {
    const deadline = new Date(input.willCallDeadline).getTime()
    const now = (input.now || new Date()).getTime()
    return deadline <= now
  }
  return input.ageHours >= 2
}
