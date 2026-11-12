import crypto from 'crypto'
import { after } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { PATIENT_SMS_CONSENT_V1, PATIENT_SMS_CONSENT_VERSION } from '@/lib/sms/consent'
import { toE164 } from '@/lib/sms/phone'
import { sendLeadTexts } from '@/lib/sms/send-lead-texts'
import { ACK_TOKEN_DAYS, siteUrl } from './config'
import { postDiscord } from './discord'
import {
  sendAdminAlert,
  sendAdminCopy,
  sendDoctorInitial,
  sendPatientConfirmation,
  type LeadMail,
} from './deliver'
import { getDoctorRecipients } from './recipients'
import { isMissingColumn, isMissingTable, updateContactRequest } from './schema'
import { isPracticeListing, listingDisplayName } from '@/lib/listing-display'
import { containsHealthWords, isPlausibleEmail, isPlausiblePhone, normalizeEmail } from './validate'

export type CreateLeadInput = {
  doctorId: string
  name: string
  phone?: string | null
  email?: string | null
  preferredTime?: string | null
  message?: string | null
  consentText: string
  source: string
  ip?: string | null
  smsConsent?: boolean
  smsPhone?: string | null
}

export type CreateLeadResult = {
  ok: boolean
  savedForAdmin: boolean
  requestId: string | null
  doctorName: string
  practiceName: string
  /** Patient-facing name. Practice-first listings use the practice name. */
  displayName: string
  withdrawUrl: string
  officePhone: string | null
  message?: string
  error?: string
  healthWarning: boolean
}

const SAVED_FOR_ADMIN = "We've received your request and our team will make sure the office gets it"
const EMPTY: CreateLeadResult = {
  ok: false,
  savedForAdmin: false,
  requestId: null,
  doctorName: '',
  practiceName: '',
  displayName: '',
  withdrawUrl: '',
  officePhone: null,
  healthWarning: false,
}

const DOCTOR_COLUMNS = 'id, first_name, last_name, clinic_name, email, phone, city, state, country, user_id, verification_status, lead_notification_emails'
const DOCTOR_COLUMNS_BASE = 'id, first_name, last_name, clinic_name, email, phone, city, state, country, user_id, verification_status'

function doctorNameOf(doctor: { first_name?: string | null; last_name?: string | null }): string {
  return `Dr. ${doctor.first_name || ''} ${doctor.last_name || ''}`.trim()
}

function noteFor(input: { preferredTime: string; email: string; message: string }): string | null {
  const parts: string[] = []
  if (input.preferredTime) parts.push(`Best time to reach you: ${input.preferredTime}`)
  if (input.email) parts.push(`Email: ${input.email}`)
  if (input.message) parts.push(input.message)
  return parts.join('. ') || null
}

let warnedAlertColumns = false

type AlertRow = {
  lead_alert_phones?: unknown
  sms_alerts_enabled?: boolean | null
  sms_alerts_consent_at?: string | null
}
type AlertError = { message?: string; code?: string; details?: string } | null
type AlertQuery = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      maybeSingle: () => Promise<{ data: AlertRow | null; error: AlertError }>
    }
  }
}

async function loadDoctorAlerts(db: { from: (table: string) => AlertQuery }, doctorId: string): Promise<{
  lead_alert_phones: string[]
  sms_alerts_enabled: boolean
  sms_alerts_consent_at: string | null
} | null> {
  try {
    const result = await db.from('doctors')
      .select('lead_alert_phones, sms_alerts_enabled, sms_alerts_consent_at')
      .eq('id', doctorId)
      .maybeSingle()
    if (result.error) {
      if (isMissingColumn(result.error) || isMissingTable(result.error)) {
        if (!warnedAlertColumns) {
          warnedAlertColumns = true
          console.warn('[SMS] doctor text-alert columns are missing. Apply supabase/migrations/proposed/20261108000000_instant_lead_texts.sql')
        }
        return null
      }
      console.warn('[SMS] could not load doctor text alerts')
      return null
    }
    const row = result.data
    if (!row) return null
    return {
      lead_alert_phones: Array.isArray(row.lead_alert_phones) ? row.lead_alert_phones.filter((value): value is string => typeof value === 'string') : [],
      sms_alerts_enabled: row.sms_alerts_enabled === true,
      sms_alerts_consent_at: typeof row.sms_alerts_consent_at === 'string' ? row.sms_alerts_consent_at : null,
    }
  } catch {
    return null
  }
}

async function loadDoctor(db: any, doctorId: string): Promise<{ doctor: any | null; error?: string }> {
  const withListing = `${DOCTOR_COLUMNS}, listing_format`
  const first = await db.from('doctors').select(withListing).eq('id', doctorId).maybeSingle()
  if (!first.error) return { doctor: first.data }
  if (!isMissingColumn(first.error)) return { doctor: null, error: first.error.message }
  const second = await db.from('doctors').select(DOCTOR_COLUMNS).eq('id', doctorId).maybeSingle()
  if (!second.error) return { doctor: second.data }
  if (!isMissingColumn(second.error)) return { doctor: null, error: second.error.message }
  console.error('[LEADS] doctors.lead_notification_emails is missing. Apply migration 20261030000000_lead_followup.sql.', second.error.message)
  const third = await db.from('doctors').select(DOCTOR_COLUMNS_BASE).eq('id', doctorId).maybeSingle()
  if (third.error) return { doctor: null, error: third.error.message }
  return { doctor: third.data }
}

export async function createLead(input: CreateLeadInput): Promise<CreateLeadResult> {
  const name = input.name?.trim() || ''
  const phone = input.phone?.trim() || ''
  const email = normalizeEmail(input.email) || ''
  const preferredTime = input.preferredTime?.trim() || ''
  const message = input.message?.trim() || ''
  const phoneOk = isPlausiblePhone(phone)
  const emailOk = isPlausibleEmail(email)
  const healthWarning = containsHealthWords(message)
  const source = input.source || 'doctor_joined'

  if (!input.doctorId) return { ...EMPTY, error: 'Missing doctor.' }
  if (!name) return { ...EMPTY, error: 'Please enter your name.', healthWarning }
  if (!phoneOk && !emailOk) {
    return { ...EMPTY, error: 'A phone number or email is required.', healthWarning }
  }

  let db: any
  try {
    db = createAdminClient()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Database client unavailable'
    console.error('[LEADS] createLead has no admin client:', message)
    return { ...EMPTY, error: 'Something went wrong. Please try again.', healthWarning }
  }

  const loaded = await loadDoctor(db, input.doctorId)
  if (!loaded.doctor) {
    return { ...EMPTY, error: loaded.error ? 'Something went wrong. Please try again.' : 'Doctor not found.', healthWarning }
  }
  const doctor = loaded.doctor
  const alerts = await loadDoctorAlerts(db, doctor.id)
  const docName = doctorNameOf(doctor)
  const displayName = listingDisplayName(doctor)
  const practiceName = isPracticeListing(doctor) ? displayName : (doctor.clinic_name || docName)
  const officePhone = doctor.phone || null

  const withdrawalToken = crypto.randomBytes(32).toString('hex')
  const acknowledgeToken = crypto.randomBytes(32).toString('hex')
  const checkinToken = crypto.randomBytes(32).toString('hex')
  const withdrawUrl = `${siteUrl()}/api/contact-request/withdraw?token=${withdrawalToken}`
  const note = noteFor({ preferredTime, email, message })

  const baseRow = {
    doctor_id: input.doctorId,
    name,
    phone: phoneOk ? phone : '',
    note,
    consent_text: input.consentText,
    consented_at: new Date().toISOString(),
    ip: input.ip || null,
    status: 'new',
    withdrawal_token: withdrawalToken,
    acknowledge_token: acknowledgeToken,
    acknowledge_token_expires: new Date(Date.now() + ACK_TOKEN_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    source,
  }
  const extendedRow = {
    ...baseRow,
    email: email || null,
    preferred_time: preferredTime || null,
    message: message || null,
    patient_checkin_token: checkinToken,
  }

  let inserted = await db.from('contact_requests').insert(extendedRow).select('id').single()
  if (inserted.error && isMissingColumn(inserted.error)) {
    console.error('[LEADS] contact_requests follow-up columns are missing. Saving on the original columns. Apply migration 20261030000000_lead_followup.sql.', inserted.error.message)
    inserted = await db.from('contact_requests').insert(baseRow).select('id').single()
  }
  if (inserted.error) {
    console.error('[LEADS] contact_requests insert failed, retrying once:', inserted.error.message)
    inserted = await db.from('contact_requests').insert(baseRow).select('id').single()
  }

  const mailBase: LeadMail = {
    requestId: inserted.data?.id ?? null,
    patientName: name,
    patientPhone: phoneOk ? phone : '',
    patientEmail: email,
    preferredTime,
    message,
    source,
    doctorName: docName,
    practiceName,
    doctorPhone: officePhone || '',
    doctorEmail: doctor.email || '',
    doctorRecipients: [],
    acknowledgeToken,
    withdrawalToken,
    checkinToken,
  }

  if (inserted.error || !inserted.data?.id) {
    const reason = 'Lead could not be saved'
    const alert = await sendAdminAlert(mailBase, `${reason}. ${name}, ${phone || 'no phone'}, ${email || 'no email'}, doctor ${docName} (${input.doctorId}). ${message}`)
    const discord = await postDiscord(
      `🚨 **LEAD NOT SAVED**\n**Patient:** ${name}\n**Phone:** ${phone || 'none'}\n**Email:** ${email || 'none'}\n**Doctor:** ${docName} (${doctor.city || ''}, ${doctor.state || ''})\n**Source:** ${source}\n**Note:** ${message || 'none'}\n**DB:** ${inserted.error?.message || 'no id'}\n\nCall the patient yourself.`,
    )
    if (!alert.ok && !discord.ok) {
      const call = officePhone ? ` Please call the office at ${officePhone}.` : ' Please call the office directly.'
      return {
        ...EMPTY,
        doctorName: docName,
        practiceName,
        displayName,
        officePhone,
        healthWarning,
        error: `We could not save your request.${call}`,
      }
    }
    return {
      ok: true,
      savedForAdmin: true,
      requestId: null,
      doctorName: docName,
      practiceName,
      displayName,
      withdrawUrl: '',
      officePhone,
      healthWarning,
      message: SAVED_FOR_ADMIN,
    }
  }

  const requestId = inserted.data.id as string
  mailBase.requestId = requestId

  let smsConsentSaved = false
  const normalizedSms = input.smsConsent === true ? toE164(input.smsPhone || null) : null
  if (input.smsConsent === true && normalizedSms) {
    const savedConsent = await updateContactRequest(db, requestId, {
      sms_consent: true,
      sms_consent_at: new Date().toISOString(),
      sms_consent_version: PATIENT_SMS_CONSENT_VERSION,
      sms_consent_text: PATIENT_SMS_CONSENT_V1,
      sms_phone: normalizedSms,
    })
    smsConsentSaved = savedConsent.ok === true && !savedConsent.missingColumn
  }

  const recipients = await getDoctorRecipients({
    id: doctor.id,
    email: doctor.email,
    user_id: doctor.user_id,
    lead_notification_emails: doctor.lead_notification_emails,
  })
  mailBase.doctorRecipients = recipients
  mailBase.doctorEmail = recipients[0] || doctor.email || ''

  let doctorOk = false
  if (recipients.length > 0) {
    const sent = await sendDoctorInitial(mailBase)
    doctorOk = sent.ok
    if (!sent.ok) console.error('[LEADS] doctor initial email failed:', sent.error)
  } else {
    console.error(`[LEADS] doctor ${doctor.id} has no email recipients for lead ${requestId}`)
  }

  if (doctorOk) {
    await updateContactRequest(db, requestId, { doctor_first_notified_at: new Date().toISOString() })
    const step = await db.from('contact_request_escalations').insert({
      contact_request_id: requestId,
      step: 1,
      channel: 'email',
    })
    if (step.error) console.error('[LEADS] step-1 escalation log failed:', step.error.message)
  }

  if (doctor.user_id) {
    const notice = await db.from('notifications').insert({
      user_id: doctor.user_id,
      title: 'New patient request',
      body: `${name} wants your office to reach out.${phoneOk ? ` Phone: ${phone}` : ''}${emailOk ? ` Email: ${email}` : ''}`,
      type: 'system',
      priority: 'important',
      link: '/doctor/dashboard',
    })
    if (notice.error) console.error('[LEADS] portal notification failed:', notice.error.message)
  }

  if (emailOk) {
    const confirm = await sendPatientConfirmation(mailBase)
    if (!confirm.ok) console.error('[LEADS] patient confirmation failed:', confirm.error)
  }

  try {
    after(() => sendLeadTexts({
      requestId,
      smsConsentSaved,
      doctor: {
        id: String(doctor.id),
        state: doctor.state ?? null,
        country: doctor.country ?? null,
        lastName: doctor.last_name || '',
        practice: doctor.clinic_name || '',
        patientFacingName: isPracticeListing(doctor) ? displayName : null,
        leadAlertPhones: alerts?.lead_alert_phones || [],
        smsAlertsEnabled: alerts?.sms_alerts_enabled === true,
        smsAlertsConsentAt: alerts?.sms_alerts_consent_at || null,
      },
      patient: {
        name,
        phone: phoneOk ? phone : '',
        email,
        smsPhone: normalizedSms,
        bestTime: preferredTime,
        message,
      },
    }).catch(() => {
      console.warn('[SMS] lead texts failed')
    }))
  } catch {
    console.warn('[SMS] could not schedule lead texts')
  }

  const copy = await sendAdminCopy(mailBase)
  if (!copy.ok) console.error('[LEADS] admin copy failed:', copy.error)

  await postDiscord(
    `📱 **New Contact Request**\n**Patient:** ${name}\n**Phone:** ${phoneOk ? phone : 'not provided'}\n**Email:** ${emailOk ? email : 'not provided'}\n**Doctor:** ${docName} (${doctor.city || ''}, ${doctor.state || ''})\n**Source:** ${source}${message ? `\n**Note:** ${message}` : ''}\n\n→ ${siteUrl()}/admin/contact-requests?focus=${requestId}`,
  )

  const unverified = !!doctor.verification_status && doctor.verification_status !== 'verified'
  if (!doctorOk || unverified) {
    const parts = [
      !doctorOk ? (recipients.length === 0 ? 'doctor has no email' : 'doctor email failed') : '',
      unverified ? 'doctor is not verified' : '',
    ].filter(Boolean)
    const reason = parts.join('; ')
    await updateContactRequest(db, requestId, {
      needs_admin_attention: true,
      attention_reason: reason,
    })
    if (!doctorOk || unverified) {
      const alert = await sendAdminAlert(mailBase, reason)
      if (!alert.ok) console.error('[LEADS] admin alert failed:', alert.error)
    }
  }

  return {
    ok: true,
    savedForAdmin: false,
    requestId,
    doctorName: docName,
    practiceName,
    displayName,
    withdrawUrl,
    officePhone,
    healthWarning,
  }
}
