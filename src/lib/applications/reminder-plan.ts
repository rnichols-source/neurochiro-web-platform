import { toE164 } from '../sms/phone.ts'
import { escapeHtml } from '../students/html.ts'
import { contactFromApplicationRow } from './contact.ts'
import { reminderInQuietHours } from './quiet.ts'

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
  resumeUrl?: string
  /** Path only, such as /doctor/apply?step=3&resume=1. Magic links reject a full URL. */
  resumePath?: string
  /** IANA zone for 9 PM–8 AM quiet hours. Office state or phone area code. */
  timezone?: string
  /** Approved, paid, or an existing public member. */
  existingMember?: boolean
  /** Replied STOP. Do not text. */
  smsOptedOut?: boolean
}

export type ReminderSendLog = {
  applicationId: string
  channel: 'email' | 'sms'
  kind: ReminderKind
  timezone: string
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
  existingMember?: boolean
}): ReminderKind | null {
  if (input.existingMember) return null
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
  optedOut?: boolean
}): string | null {
  if (!input.enabled || input.consent !== true || input.optedOut === true) return null
  return toE164(input.phone, 'US')
}

/** Names the unfinished step. Never says they have not started. */
export function reminderStepPhrase(resumeUrl?: string): string {
  const value = decodeURIComponent(resumeUrl || '')
  if (value.includes('step=3')) return "You're on step 4 of 4: Plan and card"
  if (value.includes('part=2')) return "You're on step 3 of 4: Your office"
  if (value.includes('step=2') || value.includes('step=1')) return "You're on step 2 of 4: How you practice"
  return "You're on step 2 of 4: How you practice"
}

export function consentFromApplicationRow(row: Record<string, unknown>): { consent: boolean; phone: string } {
  const contact = contactFromApplicationRow(row)
  return { consent: contact.smsConsent === true, phone: contact.mobileE164 }
}

export function reminderMail(kind: ReminderKind, firstName: string, resumeUrl = APPLY_URL): { subject: string; html: string } {
  const name = escapeHtml((firstName || '').trim() || 'there')
  const href = escapeHtml(resumeUrl.startsWith('https://neurochiro.co/') ? resumeUrl : APPLY_URL)
  const where = escapeHtml(reminderStepPhrase(resumeUrl))
  const link = `<p><a href="${href}">Finish your application</a></p>`
  const close = `
    <p>It takes about 5 minutes. You'll save a card at the end, and your card isn't charged unless you're approved.</p>
    ${link}
    <p>Dr. Ray, NeuroChiro</p>
  `
  if (kind === '24h') {
    return {
      subject: 'Your NeuroChiro application is still waiting',
      html: `<p>Hi Dr. ${name},</p><p>${where}. It is still unfinished. When you have a few minutes, I would like to read it.</p>${close}`,
    }
  }
  return {
    subject: 'Your NeuroChiro application is still open',
    html: `<p>Hi Dr. ${name},</p><p>${where}. I saved your place, so you can pick it up when you are ready.</p>${close}`,
  }
}

export function reminderText(kind: ReminderKind, firstName: string, resumeUrl = APPLY_URL): string {
  const name = (firstName || 'there').replace(/\s+/g, ' ').trim() || 'there'
  const link = resumeUrl.startsWith('https://neurochiro.co/') ? resumeUrl : APPLY_URL
  const where = reminderStepPhrase(resumeUrl)
  const lead = kind === '24h'
    ? `Hi Dr. ${name}, it's Dr. Ray. ${where}.`
    : `Hi Dr. ${name}, it's Dr. Ray at NeuroChiro. ${where}.`
  return `${lead} It takes about 5 minutes, and your card isn't charged unless you're approved. ${link} Reply STOP to opt out.`
}

export async function deliverReminders(input: {
  now: Date
  rows: ReminderCandidate[]
  smsEnabled: boolean
  claim: (id: string, kind: ReminderKind) => Promise<'claimed' | 'taken' | 'unavailable'>
  release: (id: string, kind: ReminderKind) => Promise<void>
  sendEmail: (mail: { to: string; subject: string; html: string }) => Promise<boolean>
  sendSms: (message: { to: string; content: string }) => Promise<boolean>
  /** One-time sign-in link for this row. Called only when a send is about to happen. */
  resumeLink?: (row: ReminderCandidate) => Promise<string>
  logSend?: (entry: ReminderSendLog) => Promise<void>
}): Promise<{ emailed: number; texted: number; skipped: number; unavailable: boolean }> {
  let emailed = 0
  let texted = 0
  let skipped = 0
  const sentKeys = new Set<string>()
  for (const row of input.rows) {
    const kind = dueEmailReminder({ ...row, now: input.now })
    const sendKey = `${row.id}:${kind}`
    if (!kind || !row.email.includes('@') || sentKeys.has(sendKey)) {
      skipped += 1
      continue
    }
    const zone = row.timezone || 'America/New_York'
    if (reminderInQuietHours(zone, input.now)) {
      skipped += 1
      continue
    }
    const claim = await input.claim(row.id, kind)
    if (claim === 'unavailable') return { emailed, texted, skipped, unavailable: true }
    if (claim !== 'claimed') {
      skipped += 1
      continue
    }
    let resumeUrl = row.resumeUrl || APPLY_URL
    if (input.resumeLink) {
      try {
        const linked = await input.resumeLink(row)
        if (linked.startsWith('https://neurochiro.co/')) resumeUrl = linked
      } catch {
        resumeUrl = row.resumeUrl || APPLY_URL
      }
    }
    let sent = false
    try {
      const mail = reminderMail(kind, row.firstName, resumeUrl)
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
    sentKeys.add(sendKey)
    if (input.logSend) {
      try {
        await input.logSend({ applicationId: row.id, channel: 'email', kind, timezone: zone })
      } catch {
        // The note already went out. A failed log does not undo it.
      }
    }
    const to = reminderSmsTo({
      enabled: input.smsEnabled,
      consent: row.smsConsent,
      phone: row.mobile,
      optedOut: row.smsOptedOut === true,
    })
    if (!to) continue
    try {
      const ok = await input.sendSms({ to, content: reminderText(kind, row.firstName, resumeUrl) })
      if (ok) {
        texted += 1
        if (input.logSend) {
          try {
            await input.logSend({ applicationId: row.id, channel: 'sms', kind, timezone: zone })
          } catch {
            // The text already went out.
          }
        }
      }
    } catch {
      // The email already went out. A failed text does not undo it.
    }
  }
  return { emailed, texted, skipped, unavailable: false }
}
