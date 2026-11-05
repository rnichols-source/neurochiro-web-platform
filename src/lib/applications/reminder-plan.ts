import { toE164 } from '../sms/phone.ts'
import { escapeHtml } from '../students/html.ts'
import { contactFromApplicationRow } from './contact.ts'

export const APPLY_URL = 'https://neurochiro.co/doctor/apply'
const HOUR_MS = 60 * 60 * 1000

export type ReminderKind = '1h' | '24h'

export type ReminderCandidate = {
  id: string
  email: string
  firstName: string
  status: string
  cardOnFile: boolean
  createdAt: string
  reminder1hSentAt: string | null
  reminder24hSentAt: string | null
  smsConsent: boolean
  mobile: string | null
}

export function applicationReminderSmsEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.APPLICATION_REMINDER_SMS_ENABLED === 'true'
}

export function dueEmailReminder(input: {
  status: string
  cardOnFile: boolean
  createdAt: string
  reminder1hSentAt: string | null
  reminder24hSentAt: string | null
  now: Date
}): ReminderKind | null {
  if (input.status !== 'draft' || input.cardOnFile) return null
  const created = Date.parse(input.createdAt)
  if (!Number.isFinite(created)) return null
  const age = input.now.getTime() - created
  if (age < HOUR_MS) return null
  if (age >= 24 * HOUR_MS) return input.reminder24hSentAt ? null : '24h'
  return input.reminder1hSentAt ? null : '1h'
}

export function reminderWindows(now: Date): { hourAgo: string; dayAgo: string } {
  return {
    hourAgo: new Date(now.getTime() - HOUR_MS).toISOString(),
    dayAgo: new Date(now.getTime() - 24 * HOUR_MS).toISOString(),
  }
}

export function reminderSmsTo(input: {
  enabled: boolean
  consent: boolean
  phone: string | null | undefined
}): string | null {
  if (!input.enabled || input.consent !== true) return null
  return toE164(input.phone, 'US')
}

export function consentFromApplicationRow(row: Record<string, unknown>): { consent: boolean; phone: string } {
  const contact = contactFromApplicationRow(row)
  return { consent: contact.smsConsent === true, phone: contact.mobileE164 }
}

export function reminderMail(kind: ReminderKind, firstName: string): { subject: string; html: string } {
  const name = escapeHtml((firstName || '').trim() || 'there')
  const link = `<p><a href="${APPLY_URL}">Finish your application</a></p>`
  const close = `
    <p>It takes about 5 minutes. You'll save a card at the end, and your card isn't charged unless you're approved.</p>
    ${link}
    <p>Dr. Ray, NeuroChiro</p>
  `
  if (kind === '24h') {
    return {
      subject: 'Your NeuroChiro application is still waiting',
      html: `<p>Hi Dr. ${name},</p><p>I still have your NeuroChiro application, and it is unfinished. When you have a few minutes, I would like to read it.</p>${close}`,
    }
  }
  return {
    subject: 'Your NeuroChiro application is still open',
    html: `<p>Hi Dr. ${name},</p><p>You started an application to join NeuroChiro. I saved your place, so you can pick it up when you are ready.</p>${close}`,
  }
}

export function reminderText(kind: ReminderKind, firstName: string): string {
  const name = (firstName || 'there').replace(/\s+/g, ' ').trim() || 'there'
  const lead = kind === '24h'
    ? `Hi Dr. ${name}, it's Dr. Ray. Your NeuroChiro application is still open.`
    : `Hi Dr. ${name}, it's Dr. Ray at NeuroChiro. Your application is still open.`
  return `${lead} It takes about 5 minutes, and your card isn't charged unless you're approved. ${APPLY_URL} Reply STOP to opt out.`
}

export async function deliverReminders(input: {
  now: Date
  rows: ReminderCandidate[]
  smsEnabled: boolean
  claim: (id: string, kind: ReminderKind) => Promise<'claimed' | 'taken' | 'unavailable'>
  release: (id: string, kind: ReminderKind) => Promise<void>
  sendEmail: (mail: { to: string; subject: string; html: string }) => Promise<boolean>
  sendSms: (message: { to: string; content: string }) => Promise<boolean>
}): Promise<{ emailed: number; texted: number; skipped: number; unavailable: boolean }> {
  let emailed = 0
  let texted = 0
  let skipped = 0
  for (const row of input.rows) {
    const kind = dueEmailReminder({ ...row, now: input.now })
    if (!kind || !row.email.includes('@')) {
      skipped += 1
      continue
    }
    const claim = await input.claim(row.id, kind)
    if (claim === 'unavailable') return { emailed, texted, skipped, unavailable: true }
    if (claim !== 'claimed') {
      skipped += 1
      continue
    }
    let sent = false
    try {
      const mail = reminderMail(kind, row.firstName)
      sent = await input.sendEmail({ to: row.email, subject: mail.subject, html: mail.html })
    } catch {
      sent = false
    }
    if (!sent) {
      await input.release(row.id, kind)
      skipped += 1
      continue
    }
    emailed += 1
    const to = reminderSmsTo({ enabled: input.smsEnabled, consent: row.smsConsent, phone: row.mobile })
    if (!to) continue
    try {
      const ok = await input.sendSms({ to, content: reminderText(kind, row.firstName) })
      if (ok) texted += 1
    } catch {
      // The email already went out. A failed text does not undo it.
    }
  }
  return { emailed, texted, skipped, unavailable: false }
}
