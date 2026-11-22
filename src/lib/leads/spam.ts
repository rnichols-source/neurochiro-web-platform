/**
 * Appointment and contact-request spam signals.
 * Quarantine on a strong combined score, or on a filled honeypot.
 * Timing alone is not enough, so a fast autofill does not get held.
 */

export const SPAM_ADMIN_NOTE_PREFIX = 'spam/bot'
export const MIN_FAST_FORM_MS = 800
export const MIN_INSTANT_FORM_MS = 400

export type SpamSignal =
  | 'honeypot'
  | 'too_fast'
  | 'instant_submit'
  | 'gibberish_name'
  | 'gibberish_message'
  | 'gibberish_preferred_time'
  | 'dotted_gmail'

export type SpamInput = {
  name?: string | null
  email?: string | null
  message?: string | null
  preferredTime?: string | null
  honeypot?: string | null
  startedAt?: number | string | null
  now?: number
}

export type SpamVerdict = {
  quarantine: boolean
  score: number
  signals: SpamSignal[]
  adminNote: string
}

const VOWELS = /[aeiouy]/i

const SIGNAL_POINTS: Record<SpamSignal, number> = {
  honeypot: 10,
  instant_submit: 2,
  too_fast: 1,
  gibberish_name: 1,
  gibberish_message: 2,
  gibberish_preferred_time: 2,
  dotted_gmail: 2,
}

export function isSpamAdminNote(note: string | null | undefined): boolean {
  if (!note) return false
  return /(^|\b)spam\/bot\b/i.test(note)
}

/** Hide from the doctor board and doctor-facing lead stats. Admin lists still show these. */
export function isHiddenSpamLead(row: {
  status?: string | null
  admin_note?: string | null
  withdrawn_at?: string | null
}): boolean {
  const status = (row.status || '').trim().toLowerCase()
  if (status === 'spam') return true
  if (status === 'withdrawn' && isSpamAdminNote(row.admin_note)) return true
  return false
}

function tokens(value: string | null | undefined): string[] {
  return String(value || '').match(/[A-Za-z]+/g) || []
}

function vowelRatio(token: string): number {
  if (!token) return 1
  const vowels = [...token].filter((ch) => VOWELS.test(ch)).length
  return vowels / token.length
}

/** Mixed-case mid-token, or a long consonant-heavy string like the Nov 22 bots. */
export function looksGibberishToken(token: string, minLength = 5): boolean {
  if (!token || !/^[A-Za-z]+$/.test(token) || token.length < minLength) return false
  // Mixed case in the middle, like YoSiasSOYrxBgHkDpme or eBpIiAKlZMgeRfktGPN.
  if (/[a-z][A-Z]/.test(token)) return true
  const rest = token.slice(1)
  if (token[0] === token[0].toUpperCase() && /[A-Z]/.test(rest) && token !== token.toUpperCase()) {
    return true
  }
  if (vowelRatio(token) === 0) return true
  if (token.length >= 10 && vowelRatio(token) < 0.25) return true
  if (token.length >= 5 && vowelRatio(token) < 0.2) return true
  return false
}

function looksGibberishName(name: string): boolean {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1 && looksGibberishToken(parts[0], 5)) return true
  return parts.some((part) => looksGibberishToken(part, 8))
}

function looksGibberishField(value: string | null | undefined): boolean {
  const text = String(value || '').trim()
  if (!text) return false
  if (/^[A-Za-z]{10,}$/.test(text) && looksGibberishToken(text, 10)) return true
  return tokens(text).some((token) => looksGibberishToken(token, 10))
}

/** Gmail locals with several dots, or a dot plus digits, like the Nov 22 bots. */
export function isDottedGmail(email: string | null | undefined): boolean {
  const value = String(email || '').trim().toLowerCase()
  if (!value.endsWith('@gmail.com')) return false
  const local = value.slice(0, -'@gmail.com'.length)
  if (!local) return false
  const dots = (local.match(/\./g) || []).length
  const digits = (local.match(/\d/g) || []).length
  if (dots >= 2) return true
  if (dots >= 1 && digits >= 2) return true
  return false
}

function elapsedMs(startedAt: number | string | null | undefined, now: number): number | null {
  if (startedAt == null || startedAt === '') return null
  const started = typeof startedAt === 'number' ? startedAt : Number(startedAt)
  if (!Number.isFinite(started) || started <= 0) return null
  return now - started
}

export function classifySpam(input: SpamInput): SpamVerdict {
  const signals: SpamSignal[] = []
  if (String(input.honeypot || '').trim()) signals.push('honeypot')

  const elapsed = elapsedMs(input.startedAt, input.now ?? Date.now())
  if (elapsed != null && elapsed >= 0 && elapsed < MIN_INSTANT_FORM_MS) signals.push('instant_submit')
  else if (elapsed != null && elapsed >= 0 && elapsed < MIN_FAST_FORM_MS) signals.push('too_fast')

  if (looksGibberishName(String(input.name || ''))) signals.push('gibberish_name')
  if (looksGibberishField(input.message)) signals.push('gibberish_message')
  if (looksGibberishField(input.preferredTime)) signals.push('gibberish_preferred_time')
  if (isDottedGmail(input.email)) signals.push('dotted_gmail')

  const score = signals.reduce((sum, signal) => sum + SIGNAL_POINTS[signal], 0)
  const quarantine = signals.includes('honeypot') || score >= 3
  const reason = signals.length ? signals.join(', ') : 'none'
  const adminNote = `${SPAM_ADMIN_NOTE_PREFIX}: ${reason}`
  return { quarantine, score, signals, adminNote }
}
