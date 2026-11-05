import { ONBOARDING_CALL_URL } from './emails.ts'
import { last4 } from '../sms/phone.ts'
import type { Mail } from './emails.ts'

const TEXT_LIMIT = 320
const E164 = /^\+[1-9]\d{7,14}$/

export type ApprovalSms = { to: string; body: string }

export type SmsGateRuntime = {
  enabled: boolean
  testPhone: string | null
  testRedirect: boolean
}

export type GatedApprovalSms = {
  send: boolean
  to: string
  body: string
  reason: 'queued' | 'disabled' | 'invalid_phone' | 'test_phone_invalid' | 'not_requested'
}

export function doctorProfileUrl(slug: string | null | undefined): string {
  const clean = (slug || '').trim().toLowerCase()
  if (!/^[a-z0-9-]{1,80}$/.test(clean)) return 'https://neurochiro.co/directory'
  return `https://neurochiro.co/directory/${clean}`
}

export function canonicalProfileUrl(value: string | null | undefined): string {
  const trimmed = (value || '').trim()
  if (!trimmed) return 'https://neurochiro.co/directory'
  if (!trimmed.startsWith('http')) return doctorProfileUrl(trimmed)
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'https:' || url.hostname !== 'neurochiro.co') return 'https://neurochiro.co/directory'
    if (url.pathname === '/directory') return 'https://neurochiro.co/directory'
    const slug = url.pathname.replace(/^\/directory\//, '').replace(/\/$/, '')
    if (slug.includes('/')) return 'https://neurochiro.co/directory'
    return doctorProfileUrl(slug)
  } catch {
    return 'https://neurochiro.co/directory'
  }
}

export function approvalText(lastName: string, profileUrl: string): string {
  const url = canonicalProfileUrl(profileUrl)
  const cleaned = (lastName || 'there').replace(/\s+/g, ' ').trim() || 'there'
  const build = (who: string) =>
    `Congrats Dr. ${who}! You're approved for NeuroChiro. Your profile is live: ${url}. Next step: book your onboarding call: ${ONBOARDING_CALL_URL} - Dr. Ray, NeuroChiro. Reply STOP to opt out.`
  let name = cleaned
  let body = build(name)
  while (body.length > TEXT_LIMIT && name.length > 1) {
    name = name.slice(0, -1).trim()
    body = build(name || 'there')
  }
  return body
}

export function approvalSmsFor(input: {
  smsConsent: boolean
  mobileE164: string | null
  lastName: string
  profileUrl: string
}): ApprovalSms | null {
  if (input.smsConsent !== true) return null
  const to = input.mobileE164 || ''
  if (!E164.test(to)) return null
  return { to, body: approvalText(input.lastName, input.profileUrl) }
}

/** Same SMS_ENABLED and SMS_TEST_PHONE rules as lead texts. Does not send. */
export function gateApprovalSms(input: {
  sms: ApprovalSms | null
  runtime: SmsGateRuntime
}): GatedApprovalSms {
  if (!input.sms) return { send: false, to: '', body: '', reason: 'not_requested' }
  if (!E164.test(input.sms.to)) return { send: false, to: '', body: input.sms.body, reason: 'invalid_phone' }
  let to = input.sms.to
  let body = input.sms.body
  if (input.runtime.testRedirect) {
    body = `[TEST for ...${last4(input.sms.to)}] ${body}`
    if (!input.runtime.testPhone) return { send: false, to: '', body, reason: 'test_phone_invalid' }
    to = input.runtime.testPhone
  }
  if (!input.runtime.enabled) return { send: false, to, body, reason: 'disabled' }
  return { send: true, to, body, reason: 'queued' }
}

export async function deliverApprovalNotices(input: {
  email: Mail | null
  sms: ApprovalSms | null
  runtime: SmsGateRuntime
  sendEmail: (mail: Mail) => Promise<boolean>
  sendSms: (message: { to: string; content: string }) => Promise<{ ok: boolean }>
}): Promise<{ warnings: string[]; smsReason: GatedApprovalSms['reason'] }> {
  const warnings: string[] = []
  if (input.email) {
    try {
      const sent = await input.sendEmail(input.email)
      if (!sent) warnings.push(`The approval email did not send. Send them this call link: ${ONBOARDING_CALL_URL}`)
    } catch {
      warnings.push(`The approval email did not send. Send them this call link: ${ONBOARDING_CALL_URL}`)
    }
  }
  const gated = gateApprovalSms({ sms: input.sms, runtime: input.runtime })
  if (gated.send) {
    try {
      const result = await input.sendSms({ to: gated.to, content: gated.body })
      if (!result.ok) warnings.push('The approval text did not send.')
    } catch {
      warnings.push('The approval text did not send.')
    }
  } else if (gated.reason === 'invalid_phone' || gated.reason === 'test_phone_invalid') {
    warnings.push('The approval text did not send.')
  }
  return { warnings, smsReason: gated.reason }
}
