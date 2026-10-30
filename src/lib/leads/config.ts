export type LeadFollowupConfig = {
  enabled: boolean
  reminder_1_hours: number
  reminder_2_hours: number
  admin_escalation_hours: number
  patient_checkin_hours: number
  quiet_hours: { start: number; end: number }
  default_timezone: string
}

export const DEFAULT_LEAD_FOLLOWUP: LeadFollowupConfig = {
  enabled: true,
  reminder_1_hours: 2,
  reminder_2_hours: 24,
  admin_escalation_hours: 48,
  patient_checkin_hours: 72,
  quiet_hours: { start: 20, end: 8 },
  default_timezone: 'America/New_York',
}

export const FROM_ADDRESS = 'NeuroChiro <support@neurochirodirectory.com>'
export const REPLY_TO = 'support@neurochirodirectory.com'
export const FALLBACK_ADMIN_EMAIL = 'drray@neurochirodirectory.com'
export const ACK_TOKEN_DAYS = 90

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

let warnedMissingAdmin = false

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://neurochiro.co').replace(/\/$/, '')
}

export function adminLeadEmails(): string[] {
  const raw = process.env.ADMIN_LEAD_EMAIL
  if (!raw?.trim()) {
    if (!warnedMissingAdmin) {
      warnedMissingAdmin = true
      console.error('[LEADS] ADMIN_LEAD_EMAIL is not set. Using drray@neurochirodirectory.com.')
    }
    return [FALLBACK_ADMIN_EMAIL]
  }
  const emails = raw.split(',').map((part) => part.trim().toLowerCase()).filter((part) => EMAIL_RE.test(part))
  return emails.length ? emails : [FALLBACK_ADMIN_EMAIL]
}

function num(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

export function parseLeadFollowupConfig(value: unknown): LeadFollowupConfig {
  const row = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const quiet = row.quiet_hours && typeof row.quiet_hours === 'object'
    ? row.quiet_hours as Record<string, unknown>
    : {}
  return {
    enabled: row.enabled !== false,
    reminder_1_hours: num(row.reminder_1_hours, DEFAULT_LEAD_FOLLOWUP.reminder_1_hours),
    reminder_2_hours: num(row.reminder_2_hours, DEFAULT_LEAD_FOLLOWUP.reminder_2_hours),
    admin_escalation_hours: num(row.admin_escalation_hours, DEFAULT_LEAD_FOLLOWUP.admin_escalation_hours),
    patient_checkin_hours: num(row.patient_checkin_hours, DEFAULT_LEAD_FOLLOWUP.patient_checkin_hours),
    quiet_hours: {
      start: num(quiet.start, DEFAULT_LEAD_FOLLOWUP.quiet_hours.start),
      end: num(quiet.end, DEFAULT_LEAD_FOLLOWUP.quiet_hours.end),
    },
    default_timezone: typeof row.default_timezone === 'string' && row.default_timezone.trim()
      ? row.default_timezone.trim()
      : DEFAULT_LEAD_FOLLOWUP.default_timezone,
  }
}

/** Old contact_escalation row. Its enabled:false flag does not turn the new pipeline off. */
export function overlayLegacyConfig(config: LeadFollowupConfig, legacy: unknown): LeadFollowupConfig {
  if (!legacy || typeof legacy !== 'object') return config
  const row = legacy as Record<string, unknown>
  const quiet = row.quiet_hours && typeof row.quiet_hours === 'object'
    ? row.quiet_hours as Record<string, unknown>
    : null
  const fallbackTz = typeof row.fallback_timezone === 'string' ? row.fallback_timezone.trim() : ''
  return {
    ...config,
    quiet_hours: quiet
      ? { start: num(quiet.start, config.quiet_hours.start), end: num(quiet.end, config.quiet_hours.end) }
      : config.quiet_hours,
    default_timezone: fallbackTz || config.default_timezone,
  }
}
