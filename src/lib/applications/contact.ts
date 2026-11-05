import { APPLICATION_SMS_CONSENT } from './consent.ts'

export const CONTACT_MARKER = '\n[[nc-application-sms]]'

const E164 = /^\+[1-9]\d{7,14}$/

export type StoredSmsConsent = {
  mobileE164: string
  smsConsent: boolean
  smsConsentAt: string | null
}

export function applicationContactPatch(input: {
  mobileE164: string
  smsConsent: boolean
  now: string
}): {
  mobile_e164: string
  sms_consent: boolean
  sms_consent_at: string | null
  sms_consent_text: string | null
} {
  const smsConsent = input.smsConsent === true
  return {
    mobile_e164: input.mobileE164,
    sms_consent: smsConsent,
    sms_consent_at: smsConsent ? input.now : null,
    sms_consent_text: smsConsent ? APPLICATION_SMS_CONSENT : null,
  }
}

function phoneKey(value: string): string {
  return value.trim()
}

/** Keep the new number, drop duplicates, and never store more than 3. */
export function mergeLeadAlertPhones(existing: unknown, phone: string): string[] {
  const current = Array.isArray(existing)
    ? existing.filter((value): value is string => typeof value === 'string')
    : []
  const merged: string[] = []
  for (const value of [phone, ...current]) {
    const next = phoneKey(value)
    if (!next || merged.includes(next)) continue
    merged.push(next)
    if (merged.length === 3) break
  }
  return merged
}

/**
 * Doctor text-alert write. sms_alerts_enabled is true only when they checked consent.
 * Returns null when they did not consent, so a caller does not turn alerts on.
 */
export function doctorAlertPatch(input: {
  existingPhones: unknown
  phone: string
  consent: boolean
  now: string
}): {
  lead_alert_phones: string[]
  sms_alerts_enabled: boolean
  sms_alerts_consent_at: string
  sms_alerts_consent_text: string
} | null {
  if (input.consent !== true || !input.phone) return null
  return {
    lead_alert_phones: mergeLeadAlertPhones(input.existingPhones, input.phone),
    sms_alerts_enabled: true,
    sms_alerts_consent_at: input.now,
    sms_alerts_consent_text: APPLICATION_SMS_CONSENT,
  }
}

export function humanAdminNotes(notes: string | null | undefined): string {
  const raw = typeof notes === 'string' ? notes : ''
  const index = raw.indexOf(CONTACT_MARKER)
  return (index === -1 ? raw : raw.slice(0, index)).trim()
}

export function contactFromAdminNotes(notes: string | null | undefined): StoredSmsConsent | null {
  const raw = typeof notes === 'string' ? notes : ''
  const index = raw.indexOf(CONTACT_MARKER)
  if (index === -1) return null
  try {
    const parsed = JSON.parse(raw.slice(index + CONTACT_MARKER.length).trim()) as Record<string, unknown>
    const mobileE164 = typeof parsed.mobileE164 === 'string' ? parsed.mobileE164 : ''
    if (!E164.test(mobileE164)) return null
    return {
      mobileE164,
      smsConsent: parsed.smsConsent === true,
      smsConsentAt: typeof parsed.smsConsentAt === 'string' ? parsed.smsConsentAt : null,
    }
  } catch {
    return null
  }
}

export function packAdminNotes(notes: string | null | undefined, contact: StoredSmsConsent | null): string | null {
  const human = humanAdminNotes(notes)
  if (!contact?.mobileE164 || !E164.test(contact.mobileE164)) return human || null
  const payload = JSON.stringify({
    mobileE164: contact.mobileE164,
    smsConsent: contact.smsConsent === true,
    smsConsentAt: contact.smsConsentAt,
  })
  return `${human}${CONTACT_MARKER}${payload}`
}

/** Prefer the real columns. If they are empty, read the notes fallback. */
export function contactFromApplicationRow(row: Record<string, unknown>): StoredSmsConsent {
  const columnPhone = typeof row.mobile_e164 === 'string' ? row.mobile_e164.trim() : ''
  if (columnPhone) {
    return {
      mobileE164: columnPhone,
      smsConsent: row.sms_consent === true,
      smsConsentAt: typeof row.sms_consent_at === 'string' ? row.sms_consent_at : null,
    }
  }
  return contactFromAdminNotes(typeof row.admin_notes === 'string' ? row.admin_notes : null) || {
    mobileE164: '',
    smsConsent: false,
    smsConsentAt: null,
  }
}

export function consentStatusLabel(consent: boolean, at: string | null): string {
  if (!consent) return 'No'
  if (!at) return 'Yes'
  const day = at.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? `Yes, ${day}` : 'Yes'
}
