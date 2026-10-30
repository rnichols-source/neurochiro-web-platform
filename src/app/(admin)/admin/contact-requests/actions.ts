"use server"

import { createAdminClient } from '@/lib/supabase-admin'
import { checkAdminAuth } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'
import { sendDoctorInitial, sendDoctorReminder, type LeadMail } from '@/lib/leads/deliver'
import { requestNeedsAttention } from '@/lib/leads/escalation'
import { outcomePatch } from '@/lib/leads/outcomes'
import { getDoctorRecipients } from '@/lib/leads/recipients'
import { isMissingColumn, isMissingTable, updateContactRequest } from '@/lib/leads/schema'
import { parseLegacyNote } from '@/lib/leads/validate'
import { logPortalEvent } from '@/lib/leads/send'

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

async function loadRequests(db: any) {
  const extended = await db.from('contact_requests').select(REQUEST_COLUMNS).order('created_at', { ascending: false }).limit(300)
  if (!extended.error) return { rows: extended.data || [], modern: true }
  if (!isMissingColumn(extended.error)) throw new Error(extended.error.message)
  console.error('[LEADS] admin contact requests is missing follow-up columns. Apply migration 20261030000000_lead_followup.sql.', extended.error.message)
  const basic = await db.from('contact_requests').select(REQUEST_COLUMNS_BASE).order('created_at', { ascending: false }).limit(300)
  if (basic.error) throw new Error(basic.error.message)
  return { rows: basic.data || [], modern: false }
}

async function decorate(db: any, rows: any[]) {
  const doctorIds = [...new Set(rows.map((row) => row.doctor_id).filter(Boolean))]
  let doctors: any[] = []
  if (doctorIds.length) {
    const full = await db.from('doctors').select('id, first_name, last_name, clinic_name, email, phone, city, state, user_id, lead_notification_emails').in('id', doctorIds)
    if (full.error && isMissingColumn(full.error)) {
      const basic = await db.from('doctors').select('id, first_name, last_name, clinic_name, email, phone, city, state, user_id').in('id', doctorIds)
      doctors = basic.data || []
    } else {
      doctors = full.data || []
    }
  }
  const userIds = doctors.map((doctor) => doctor.user_id).filter(Boolean)
  let profiles: any[] = []
  if (userIds.length) {
    const profileRes = await db.from('profiles').select('id, email').in('id', userIds)
    profiles = profileRes.data || []
  }
  const profileEmail = new Map(profiles.map((profile) => [profile.id, profile.email]))
  const doctorMap = new Map(doctors.map((doctor) => [doctor.id, doctor]))

  let notifications: any[] = []
  const ids = rows.map((row) => row.id)
  if (ids.length) {
    const notes = await db.from('lead_notifications').select('id, contact_request_id, kind, channel, recipient, status, error, created_at').in('contact_request_id', ids).order('created_at', { ascending: true })
    if (notes.error && !isMissingTable(notes.error)) console.error('[LEADS] timeline query failed:', notes.error.message)
    if (!notes.error) notifications = notes.data || []
  }
  const byRequest = new Map<string, any[]>()
  for (const note of notifications) {
    const list = byRequest.get(note.contact_request_id) || []
    list.push(note)
    byRequest.set(note.contact_request_id, list)
  }

  return rows.map((row) => {
    const doctor = doctorMap.get(row.doctor_id)
    const legacy = parseLegacyNote(row.note)
    const timeline = byRequest.get(row.id) || []
    const recipients = doctor
      ? [
          doctor.email,
          profileEmail.get(doctor.user_id),
          ...(Array.isArray(doctor.lead_notification_emails) ? doctor.lead_notification_emails : []),
        ].filter((email) => typeof email === 'string' && email.includes('@'))
      : []
    const uniqueRecipients = [...new Set(recipients.map((email: string) => email.toLowerCase()))]
    const failed = timeline.some((item) => item.status === 'failed' || item.status === 'bounced')
    const ageHours = Math.round((Date.now() - new Date(row.created_at).getTime()) / 3_600_000)
    const needsAttention = requestNeedsAttention({
      needsAdminAttention: !!row.needs_admin_attention,
      status: row.status,
      contactOutcome: row.contact_outcome || null,
      ageHours,
      willCallDeadline: row.will_call_deadline || null,
      checkinResponse: row.patient_checkin_response || null,
      doctorRecipientCount: uniqueRecipients.length,
      hasFailedOrBouncedSend: failed,
    })
    return {
      ...row,
      email: row.email || legacy.email || '',
      preferred_time: row.preferred_time || legacy.preferredTime || '',
      message: row.message || '',
      doctor_name: doctor ? `Dr. ${doctor.first_name || ''} ${doctor.last_name || ''}`.trim() : 'Unknown',
      doctor_clinic: doctor?.clinic_name || '',
      doctor_email: doctor?.email || '',
      doctor_phone: doctor?.phone || '',
      doctor_city: doctor?.city || '',
      doctor_state: doctor?.state || '',
      doctor_recipients: uniqueRecipients,
      hours_elapsed: ageHours,
      needsAttention,
      timeline,
    }
  })
}

export async function getContactRequests() {
  await checkAdminAuth()
  const db = createAdminClient() as any
  const { rows } = await loadRequests(db)
  return decorate(db, rows)
}

export async function getLeadAttentionCount(): Promise<number> {
  await checkAdminAuth()
  const rows = await getContactRequests()
  return rows.filter((row: any) => row.needsAttention).length
}

async function loadOne(db: any, requestId: string) {
  const { rows } = await loadRequests(db)
  const decorated = await decorate(db, rows.filter((row: any) => row.id === requestId))
  return decorated[0] || null
}

function toMail(row: any, recipients: string[]): LeadMail {
  return {
    requestId: row.id,
    patientName: row.name || '',
    patientPhone: row.phone || '',
    patientEmail: row.email || '',
    preferredTime: row.preferred_time || '',
    message: row.message || row.note || '',
    source: row.source || '',
    doctorName: row.doctor_name,
    practiceName: row.doctor_clinic || row.doctor_name,
    doctorPhone: row.doctor_phone || '',
    doctorEmail: recipients[0] || row.doctor_email || '',
    doctorRecipients: recipients,
    acknowledgeToken: '',
    withdrawalToken: '',
    checkinToken: '',
    hoursWaiting: row.hours_elapsed,
  }
}

async function withToken(db: any, row: any, mail: LeadMail) {
  const { data } = await db.from('contact_requests').select('acknowledge_token').eq('id', row.id).maybeSingle()
  mail.acknowledgeToken = data?.acknowledge_token || ''
  return mail
}

export async function resendLeadToDoctor(requestId: string) {
  const user = await checkAdminAuth()
  const db = createAdminClient() as any
  const row = await loadOne(db, requestId)
  if (!row) return { error: 'Request not found' }
  const { data: doctor } = await db.from('doctors').select('id, email, user_id, lead_notification_emails').eq('id', row.doctor_id).maybeSingle()
  const recipients = doctor ? await getDoctorRecipients(doctor) : row.doctor_recipients
  if (!recipients.length) return { error: 'This doctor has no email address.' }
  const mail = await withToken(db, row, toMail(row, recipients))
  const sent = await sendDoctorInitial(mail)
  if (!sent.ok) return { error: sent.error || 'Email failed' }
  await updateContactRequest(db, requestId, { doctor_first_notified_at: new Date().toISOString() })
  revalidatePath('/admin/contact-requests')
  return { success: true }
}

export async function sendLeadReminderNow(requestId: string) {
  await checkAdminAuth()
  const db = createAdminClient() as any
  const row = await loadOne(db, requestId)
  if (!row) return { error: 'Request not found' }
  const { data: doctor } = await db.from('doctors').select('id, email, user_id, lead_notification_emails').eq('id', row.doctor_id).maybeSingle()
  const recipients = doctor ? await getDoctorRecipients(doctor) : row.doctor_recipients
  if (!recipients.length) return { error: 'This doctor has no email address.' }
  const which: 1 | 2 = (row.reminder_count || 0) >= 1 ? 2 : 1
  const mail = await withToken(db, row, toMail(row, recipients))
  const sent = await sendDoctorReminder(mail, which)
  if (!sent.ok) return { error: sent.error || 'Reminder failed' }
  await updateContactRequest(db, requestId, {
    reminder_count: which === 1 ? Math.max(row.reminder_count || 0, 0) + 1 : Math.max(row.reminder_count || 0, 1) + 1,
    last_reminder_at: new Date().toISOString(),
  })
  revalidatePath('/admin/contact-requests')
  return { success: true }
}

export async function markLeadContacted(requestId: string, note?: string) {
  const user = await checkAdminAuth()
  const db = createAdminClient() as any
  const existing = await db.from('contact_requests').select('id, acknowledged_at').eq('id', requestId).maybeSingle()
  if (!existing.data) return { error: 'Request not found' }
  const patch = {
    ...outcomePatch('called', 'admin', existing.data.acknowledged_at || null),
    acknowledged_by: user.id,
    admin_note: note || null,
  }
  const updated = await updateContactRequest(db, requestId, patch)
  if (!updated.ok) return { error: updated.error || 'Request was not updated' }
  await logPortalEvent({ requestId, kind: 'doctor_ack', recipient: 'admin' })
  revalidatePath('/admin/contact-requests')
  return { success: true }
}

export async function markLeadUnreachable(requestId: string, note?: string) {
  const user = await checkAdminAuth()
  const db = createAdminClient() as any
  const existing = await db.from('contact_requests').select('id, acknowledged_at').eq('id', requestId).maybeSingle()
  if (!existing.data) return { error: 'Request not found' }
  const patch = {
    ...outcomePatch('unreachable', 'admin', existing.data.acknowledged_at || null),
    acknowledged_by: user.id,
    admin_note: note || null,
  }
  const updated = await updateContactRequest(db, requestId, patch)
  if (!updated.ok) return { error: updated.error || 'Request was not updated' }
  revalidatePath('/admin/contact-requests')
  return { success: true }
}

export async function clearLeadAttention(requestId: string, note?: string) {
  await checkAdminAuth()
  const db = createAdminClient() as any
  const existing = await db.from('contact_requests').select('admin_note').eq('id', requestId).maybeSingle()
  if (!existing.data) return { error: 'Request not found' }
  const adminNote = [existing.data.admin_note, note].filter(Boolean).join('\n') || null
  const updated = await updateContactRequest(db, requestId, {
    needs_admin_attention: false,
    attention_reason: null,
    admin_note: adminNote,
  })
  if (!updated.ok) return { error: updated.missingColumn ? 'Follow-up columns are not in the database yet.' : (updated.error || 'Could not clear the flag') }
  revalidatePath('/admin/contact-requests')
  return { success: true }
}
