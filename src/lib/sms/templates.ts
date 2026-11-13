import { siteUrl } from '../leads/config.ts'
import { containsHealthWords } from '../leads/validate.ts'
import { DOCTOR_SMS_CONSENT_V1, PATIENT_SMS_CONSENT_V1, PATIENT_SMS_CONSENT_VERSION } from './consent.ts'

export { DOCTOR_SMS_CONSENT_V1, PATIENT_SMS_CONSENT_V1, PATIENT_SMS_CONSENT_VERSION }

function ascii(value: string | null | undefined): string {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function clip(value: string | null | undefined, max: number): string {
  const clean = ascii(value)
  return clean.length <= max ? clean : clean.slice(0, max)
}

function sameParty(practice: string | null | undefined, doctorLast: string | null | undefined): boolean {
  const place = ascii(practice).toLowerCase()
  const last = ascii(doctorLast).toLowerCase()
  if (!place) return true
  if (!last) return false
  return place === last || place === `dr. ${last}` || place === `dr ${last}`
}

export function patientRequestConfirm(input: {
  patientFirst: string
  doctorLast: string
  practice: string
  /** Practice-first listings pass the practice name. Lead listings omit this. */
  recipient?: string | null
}): string {
  const first = clip(input.patientFirst, 20)
  const recipient = clip(input.recipient, 60)
  if (recipient) {
    return `NeuroChiro: Hi ${first}, your request was sent to ${recipient}. Their office will reach out soon, usually within 1 business day. Reply STOP to opt out, HELP for help.`
  }
  const last = clip(input.doctorLast, 20)
  const atPractice = sameParty(input.practice, input.doctorLast) ? '' : ` at ${clip(input.practice, 30)}`
  return `NeuroChiro: Hi ${first}, your request was sent to Dr. ${last}${atPractice}. Their office will reach out soon, usually within 1 business day. Reply STOP to opt out, HELP for help.`
}

function noteLine(message: string | null | undefined): string {
  if (!message || !ascii(message)) return ''
  if (containsHealthWords(message)) return ''
  const clean = ascii(message)
  const note = clean.length <= 60 ? clean : `${clean.slice(0, 57)}...`
  return note
}

/** Office text for a Your NeuroChiro visit request. Community member, never patient. */
export function communityVisitOfficeText(input: {
  name: string | null
  phone: string | null
  email: string | null
  bestTime: string | null
  note: string | null
}): string {
  const name = ascii(input.name) || 'A community member'
  const contact = ascii(input.phone) || ascii(input.email)
  const who = contact ? `${name}, ${contact}` : name
  const parts = [`NeuroChiro: New community member visit request. ${who}.`]
  const when = ascii(input.bestTime)
  if (when) parts.push(`Best time: ${when}.`)
  const note = noteLine(input.note)
  if (note) parts.push(`Note: ${note}.`)
  parts.push('Please reach out within 24 hrs. Details: https://neurochiro.co/doctor/visit-requests Reply STOP to opt out.')
  return parts.join(' ')
}

export function doctorNewLead(input: {
  patientName: string
  patientPhone: string
  patientEmail: string
  bestTime: string
  note: string
}): string {
  const name = ascii(input.patientName)
  const contact = ascii(input.patientPhone) || ascii(input.patientEmail)
  const who = contact ? `${name}, ${contact}` : name
  const parts = [`NeuroChiro: New patient request. ${who}.`]
  const when = ascii(input.bestTime)
  if (when) parts.push(`Best time: ${when}.`)
  const note = noteLine(input.note)
  if (note) parts.push(`Note: ${note}.`)
  parts.push(`Please reach out within 24 hrs. Details: ${siteUrl()}/doctor/leads Reply STOP to opt out.`)
  return parts.join(' ')
}

/** Waitlist alert when a doctor joins nearby. The link is always neurochiro.co. */
export function waitlistDoctorJoinedText(doctorName: string, city: string, profileUrl: string): string {
  const name = ascii(doctorName).slice(0, 40) || 'A NeuroChiro doctor'
  const place = ascii(city).slice(0, 32) || 'your area'
  const link = profileUrl.startsWith('https://neurochiro.co/') ? profileUrl : 'https://neurochiro.co'
  return `NeuroChiro: Good news! A nervous system chiropractor just joined near you: ${name}, ${place}. See their profile: ${link}. Reply STOP to opt out.`
}
