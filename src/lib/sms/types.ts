export type SmsKind = 'patient_request_confirm' | 'doctor_new_lead'
export type SmsAudience = 'patient' | 'doctor'

export type SmsStatus =
  | 'queued'
  | 'held_quiet_hours'
  | 'sending'
  | 'sent'
  | 'failed'
  | 'skipped_disabled'
  | 'skipped_no_consent'
  | 'skipped_invalid_phone'
  | 'canceled'

export type DoctorAlertTarget = {
  id: string
  state: string | null
  country: string | null
  lastName: string
  practice: string
  /** Set only for practice-first listings. Patient texts use this instead of the doctor name. */
  patientFacingName?: string | null
  leadAlertPhones: string[]
  smsAlertsEnabled: boolean
  smsAlertsConsentAt: string | null
}

export type PatientAlertTarget = {
  name: string
  phone: string | null
  email: string | null
  smsPhone: string | null
  bestTime: string | null
  message: string | null
}

export type SmsRuntime = {
  enabled: boolean
  apiKey: string
  from: string
  base: string
  testPhone: string | null
  testRedirect: boolean
}

export type PlannedText = {
  dedupeKey: string
  kind: SmsKind
  audience: SmsAudience
  requestId: string
  doctorId: string | null
  realPhone: string | null
  toPhone: string
  body: string
  status: SmsStatus
  sendAfter: string
  testMode: boolean
  error: string | null
}

export type SmsLogRow = {
  id: string
  dedupe_key: string
  kind: string
  audience: string
  contact_request_id: string | null
  doctor_id: string | null
  to_phone: string
  body: string
  status: string
  send_after: string
  attempt: number
  test_mode: boolean
  created_at: string
  quo_message_id?: string | null
  error?: string | null
  sent_at?: string | null
}

export type SmsInsert = {
  dedupe_key: string
  kind: string
  audience: string
  contact_request_id: string
  doctor_id: string | null
  to_phone: string
  body: string
  status: string
  send_after: string
  attempt: number
  test_mode: boolean
  created_at: string
  error: string | null
}

export type SmsNotify = {
  contact_request_id: string
  kind: string
  recipient: string
  status: string
  provider_message_id: string | null
  error: string | null
}

export type SmsStore = {
  insertLog(row: SmsInsert): Promise<{ id: string | null; duplicate: boolean; missing: boolean }>
  mark(id: string, patch: Record<string, unknown>, onlyStatus?: string): Promise<boolean>
  notify(row: SmsNotify): Promise<{ missing: boolean }>
  dueHeld(nowIso: string, limit: number): Promise<{ missing: boolean; rows: SmsLogRow[] }>
}
