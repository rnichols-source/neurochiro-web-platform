import { last4, toE164 } from './phone.ts'
import { doctorQuietWindow } from './quiet.ts'
import { doctorNewLead, patientRequestConfirm } from './templates.ts'
import type { DoctorAlertTarget, PatientAlertTarget, PlannedText, SmsRuntime } from './types.ts'

const MAX_DOCTOR_PHONES = 3

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || ''
}

function alertPhones(values: string[]): { raw: string; e164: string | null }[] {
  const seen = new Set<string>()
  const out: { raw: string; e164: string | null }[] = []
  for (const value of values || []) {
    const raw = String(value ?? '').trim()
    if (!raw) continue
    const e164 = toE164(raw)
    const key = e164 || `invalid:${raw}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ raw, e164 })
    if (out.length >= MAX_DOCTOR_PHONES) break
  }
  return out
}

type Draft = {
  dedupeKey: string
  kind: PlannedText['kind']
  audience: PlannedText['audience']
  e164: string | null
  body: string
}

function finish(draft: Draft, input: {
  requestId: string
  doctorId: string
  now: Date
  quietSendAfter: string
  doctorQuiet: boolean
  runtime: Pick<SmsRuntime, 'enabled' | 'testPhone' | 'testRedirect'>
}): PlannedText {
  let status: PlannedText['status'] = draft.e164 ? 'queued' : 'skipped_invalid_phone'
  let toPhone = draft.e164 || 'invalid'
  let body = draft.body
  let testMode = false
  let error: string | null = status === 'skipped_invalid_phone' ? 'invalid_phone' : null

  if (status === 'queued' && input.runtime.testRedirect) {
    testMode = true
    body = `[TEST for ...${last4(draft.e164)}] ${draft.body}`
    if (input.runtime.testPhone) {
      toPhone = input.runtime.testPhone
    } else {
      status = 'skipped_invalid_phone'
      toPhone = 'invalid'
      error = 'test_phone_invalid'
    }
  }

  if (status === 'queued' && !input.runtime.enabled) {
    status = 'skipped_disabled'
    error = null
  }

  let sendAfter = input.now.toISOString()
  if (status === 'queued' && draft.audience === 'doctor' && input.doctorQuiet) {
    status = 'held_quiet_hours'
    sendAfter = input.quietSendAfter
  }

  return {
    dedupeKey: draft.dedupeKey,
    kind: draft.kind,
    audience: draft.audience,
    requestId: input.requestId,
    doctorId: input.doctorId,
    realPhone: draft.e164,
    toPhone,
    body,
    status,
    sendAfter,
    testMode,
    error,
  }
}

export function planLeadTexts(input: {
  requestId: string
  smsConsentSaved: boolean
  doctor: DoctorAlertTarget
  patient: PatientAlertTarget
  now?: Date
  runtime: Pick<SmsRuntime, 'enabled' | 'testPhone' | 'testRedirect'>
}): PlannedText[] {
  const now = input.now ?? new Date()
  const quiet = doctorQuietWindow(input.doctor, now)
  const shared = {
    requestId: input.requestId,
    doctorId: input.doctor.id,
    now,
    quietSendAfter: quiet.sendAfter.toISOString(),
    doctorQuiet: quiet.quiet,
    runtime: input.runtime,
  }
  const drafts: Draft[] = []

  if (input.smsConsentSaved) {
    const e164 = toE164(input.patient.smsPhone)
    drafts.push({
      dedupeKey: `lead:${input.requestId}:patient_confirm`,
      kind: 'patient_request_confirm',
      audience: 'patient',
      e164,
      body: patientRequestConfirm({
        patientFirst: firstName(input.patient.name),
        doctorLast: input.doctor.lastName,
        practice: input.doctor.practice,
        recipient: input.doctor.patientFacingName,
      }),
    })
  }

  const doctorReady = input.doctor.smsAlertsEnabled === true && Boolean(input.doctor.smsAlertsConsentAt)
  if (doctorReady) {
    alertPhones(input.doctor.leadAlertPhones || []).forEach((phone, index) => {
      drafts.push({
        dedupeKey: phone.e164
          ? `lead:${input.requestId}:doctor:${phone.e164}`
          : `lead:${input.requestId}:doctor:invalid:${index}`,
        kind: 'doctor_new_lead',
        audience: 'doctor',
        e164: phone.e164,
        body: doctorNewLead({
          patientName: input.patient.name,
          patientPhone: input.patient.phone || '',
          patientEmail: input.patient.email || '',
          bestTime: input.patient.bestTime || '',
          note: input.patient.message || '',
        }),
      })
    })
  }

  return drafts.map((draft) => finish(draft, shared))
}
