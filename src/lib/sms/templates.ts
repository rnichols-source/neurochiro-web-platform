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
}): string {
  const first = clip(input.patientFirst, 20)
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
