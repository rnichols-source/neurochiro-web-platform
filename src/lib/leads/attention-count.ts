import { createAdminClient } from '@/lib/supabase-admin'
import { requestNeedsAttention } from '@/lib/leads/escalation'
import { isMissingColumn, isMissingTable } from '@/lib/leads/schema'
import { looseFrom } from '@/lib/admin/loose-query'

const REQUEST_COLUMNS = `
  id, name, phone, email, preferred_time, message, note, status, source, created_at,
  acknowledged_at, acknowledged_by, acknowledged_via, admin_note, contact_outcome,
  outcome_detail, withdrawn_at, doctor_id, needs_admin_attention, attention_reason,
  patient_checkin_response, patient_checkin_sent_at, reminder_count, escalated_to_admin_at,
  will_call_deadline
`
const REQUEST_COLUMNS_BASE = `
  id, name, phone, note, status, source, created_at, acknowledged_at, acknowledged_by,
  acknowledged_via, admin_note, contact_outcome, withdrawn_at, doctor_id, will_call_deadline
`

type RequestRow = {
  id: string
  status: string
  created_at: string
  doctor_id: string | null
  needs_admin_attention?: boolean | null
  contact_outcome?: string | null
  will_call_deadline?: string | null
  patient_checkin_response?: string | null
}

/**
 * Same count as the Leads badge. No auth check: callers that run during a
 * request must call checkAdminAuth first. The Today cache calls this with the
 * admin client and must not read cookies.
 */
function asRows<T>(data: Record<string, unknown>[] | null): T[] {
  return (data || []) as T[]
}

export async function countAttention(): Promise<number> {
  const db = createAdminClient()
  const extended = await looseFrom(db, 'contact_requests').select(REQUEST_COLUMNS).order('created_at', { ascending: false }).limit(300)
  let rows: RequestRow[] = []
  if (!extended.error) {
    rows = asRows<RequestRow>(extended.data)
  } else if (isMissingColumn(extended.error)) {
    const basic = await looseFrom(db, 'contact_requests').select(REQUEST_COLUMNS_BASE).order('created_at', { ascending: false }).limit(300)
    if (basic.error) throw new Error(basic.error.message)
    rows = asRows<RequestRow>(basic.data)
  } else {
    throw new Error(extended.error.message)
  }

  const doctorIds = [...new Set(rows.map((row) => row.doctor_id).filter((id): id is string => Boolean(id)))]
  let doctors: { id: string; email?: string | null; user_id?: string | null; lead_notification_emails?: string[] | null }[] = []
  if (doctorIds.length) {
    const full = await looseFrom(db, 'doctors').select('id, email, user_id, lead_notification_emails').in('id', doctorIds)
    if (full.error && isMissingColumn(full.error)) {
      const basic = await looseFrom(db, 'doctors').select('id, email, user_id').in('id', doctorIds)
      doctors = asRows(basic.data)
    } else if (full.error) {
      throw new Error(full.error.message)
    } else {
      doctors = asRows(full.data)
    }
  }

  const userIds = doctors.map((doctor) => doctor.user_id).filter((id): id is string => Boolean(id))
  let profiles: { id: string; email?: string | null }[] = []
  if (userIds.length) {
    const profileRes = await looseFrom(db, 'profiles').select('id, email').in('id', userIds)
    if (profileRes.error) throw new Error(profileRes.error.message)
    profiles = asRows(profileRes.data)
  }
  const profileEmail = new Map(profiles.map((profile) => [profile.id, profile.email]))
  const doctorMap = new Map(doctors.map((doctor) => [doctor.id, doctor]))

  let notifications: { contact_request_id: string; status?: string | null }[] = []
  const ids = rows.map((row) => row.id)
  if (ids.length) {
    const notes = await looseFrom(db, 'lead_notifications').select('contact_request_id, status').in('contact_request_id', ids)
    if (notes.error && !isMissingTable(notes.error)) throw new Error(notes.error.message)
    if (!notes.error) notifications = asRows(notes.data)
  }
  const failedIds = new Set(
    notifications.filter((note) => note.status === 'failed' || note.status === 'bounced').map((note) => note.contact_request_id),
  )

  let waiting = 0
  for (const row of rows) {
    const doctor = row.doctor_id ? doctorMap.get(row.doctor_id) : undefined
    const recipients = doctor
      ? [doctor.email, doctor.user_id ? profileEmail.get(doctor.user_id) : null, ...(Array.isArray(doctor.lead_notification_emails) ? doctor.lead_notification_emails : [])]
      : []
    const uniqueRecipients = [...new Set(recipients.filter((email): email is string => typeof email === 'string' && email.includes('@')).map((email) => email.toLowerCase()))]
    const ageHours = Math.round((Date.now() - new Date(row.created_at).getTime()) / 3_600_000)
    const needs = requestNeedsAttention({
      needsAdminAttention: !!row.needs_admin_attention,
      status: row.status,
      contactOutcome: row.contact_outcome || null,
      ageHours,
      willCallDeadline: row.will_call_deadline || null,
      checkinResponse: row.patient_checkin_response || null,
      doctorRecipientCount: uniqueRecipients.length,
      hasFailedOrBouncedSend: failedIds.has(row.id),
    })
    if (needs) waiting += 1
  }
  return waiting
}
