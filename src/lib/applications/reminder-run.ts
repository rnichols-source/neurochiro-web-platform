import 'server-only'

import { createAdminClient } from '@/lib/supabase-admin'
import { isMissingColumn, isMissingTable } from '@/lib/leads/schema'
import { applicationResumeUrl } from './answers.ts'
import { magicResumeUrl } from './magic-link.ts'
import { applicationTimezone } from './quiet.ts'
import {
  consentFromApplicationRow,
  reminderWindows,
  type ReminderCandidate,
  type ReminderKind,
  type ReminderSendLog,
} from './reminder-plan.ts'

type Row = Record<string, unknown>
type DbError = { code?: string; message?: string } | null
type Result = { data: Row | Row[] | null; error?: DbError }

type Chain = {
  select: (columns: string) => Chain
  insert: (values: Record<string, unknown>) => Promise<Result>
  update: (values: Record<string, unknown>) => Chain
  eq: (column: string, value: unknown) => Chain
  in: (column: string, values: string[]) => Chain
  lt: (column: string, value: string) => Chain
  gt: (column: string, value: string) => Chain
  lte: (column: string, value: string) => Chain
  is: (column: string, value: null) => Chain
  order: (column: string, options?: { ascending?: boolean }) => Chain
  limit: (count: number) => Chain
  then: Promise<Result>['then']
}

function db() {
  return createAdminClient() as unknown as { from: (table: string) => Chain }
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function rowsOf(result: Result): Row[] {
  if (!result.data) return []
  return Array.isArray(result.data) ? result.data : [result.data]
}

function columnFor(kind: ReminderKind): 'reminder_1h_sent_at' | 'reminder_24h_sent_at' {
  return kind === '1h' ? 'reminder_1h_sent_at' : 'reminder_24h_sent_at'
}

function missingSchema(error: DbError): boolean {
  return isMissingColumn(error) || isMissingTable(error)
}

function answersForResume(row: Row, mobile: string): Record<string, unknown> {
  return {
    practiceApproach: text(row.practice_approach),
    heardAbout: text(row.heard_about),
    whyJoin: text(row.why_join),
    techniques: text(row.techniques),
    usesNervousSystemScans: row.uses_nervous_system_scans,
    scanTypes: text(row.scan_types),
    yearsInPractice: typeof row.years_in_practice === 'number' ? row.years_in_practice : text(row.years_in_practice),
    officeAddress: text(row.office_address),
    city: text(row.city),
    state: text(row.state),
    country: text(row.country),
    website: text(row.website),
    instagram: text(row.instagram),
    mobile,
    smsConsent: row.sms_consent === true,
  }
}

export async function loadReminderCandidates(now: Date): Promise<{ rows: ReminderCandidate[]; unavailable: boolean }> {
  const windows = reminderWindows(now)
  const client = db()
  const [hour, day] = await Promise.all([
    client.from('doctor_applications').select('*').eq('status', 'draft').eq('card_on_file', false)
      .lt('created_at', windows.hourAgo).gt('created_at', windows.dayAgo).is('reminder_1h_sent_at', null)
      .order('created_at', { ascending: true }).limit(40),
    client.from('doctor_applications').select('*').eq('status', 'draft').eq('card_on_file', false)
      .lte('created_at', windows.dayAgo).is('reminder_24h_sent_at', null)
      .order('created_at', { ascending: true }).limit(40),
  ])
  if (hour.error || day.error) {
    const error = hour.error || day.error
    if (error && missingSchema(error)) return { rows: [], unavailable: true }
    console.error('[application-reminder] lookup failed', error?.code || 'error')
    return { rows: [], unavailable: true }
  }
  const seen = new Set<string>()
  const applications = [...rowsOf(hour), ...rowsOf(day)].filter((row) => {
    const id = text(row.id)
    if (!id || seen.has(id)) return false
    seen.add(id)
    return true
  })
  const doctorIds = applications.map((row) => text(row.doctor_id)).filter(Boolean)
  const userIds = applications.map((row) => text(row.user_id)).filter(Boolean)
  const [doctors, profiles] = await Promise.all([
    doctorIds.length
      ? db().from('doctors').select('id, first_name, email').in('id', doctorIds)
      : Promise.resolve({ data: [] as Row[] }),
    userIds.length
      ? db().from('profiles').select('id, full_name, email').in('id', userIds)
      : Promise.resolve({ data: [] as Row[] }),
  ])
  const doctorMap = new Map(rowsOf(doctors).map((row) => [text(row.id), row]))
  const profileMap = new Map(rowsOf(profiles).map((row) => [text(row.id), row]))
  return {
    unavailable: false,
    rows: applications.map((row) => {
      const doctor = doctorMap.get(text(row.doctor_id))
      const profile = profileMap.get(text(row.user_id))
      const contact = consentFromApplicationRow(row)
      const fullName = text(profile?.full_name)
      return {
        id: text(row.id),
        email: text(profile?.email) || text(doctor?.email),
        firstName: text(doctor?.first_name) || fullName.split(' ')[0] || 'there',
        status: text(row.status) || 'draft',
        cardOnFile: row.card_on_file === true,
        createdAt: text(row.created_at),
        reminder1hSentAt: text(row.reminder_1h_sent_at) || null,
        reminder24hSentAt: text(row.reminder_24h_sent_at) || null,
        smsConsent: contact.consent,
        mobile: contact.phone || null,
        resumeUrl: applicationResumeUrl(answersForResume(row, contact.phone)),
        timezone: applicationTimezone({
          state: text(row.state),
          country: text(row.country),
          phone: contact.phone,
        }),
      }
    }).filter((row) => row.id),
  }
}

export async function claimReminder(id: string, kind: ReminderKind, now = new Date()): Promise<'claimed' | 'taken' | 'unavailable'> {
  const column = columnFor(kind)
  const result = await db()
    .from('doctor_applications')
    .update({ [column]: now.toISOString(), updated_at: now.toISOString() })
    .eq('id', id)
    .eq('status', 'draft')
    .eq('card_on_file', false)
    .is(column, null)
    .select('id')
  if (result.error) {
    if (missingSchema(result.error)) return 'unavailable'
    console.error('[application-reminder] claim failed', result.error.code || 'error')
    return 'taken'
  }
  return rowsOf(result).length > 0 ? 'claimed' : 'taken'
}

const REMINDER_LOG_SQL = 'supabase/migrations/proposed/20261117170000_application_reminder_log.sql'

/** Builds a one-time magic link. Does not send email. */
export async function resumeMagicLink(email: string, nextPath: string): Promise<string> {
  const fallback = `https://neurochiro.co/login?next=${encodeURIComponent(nextPath.startsWith('/doctor/apply') ? nextPath : '/doctor/apply?step=2&resume=1')}`
  if (!email.includes('@')) return fallback
  try {
    const admin = createAdminClient()
    const link = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `https://neurochiro.co/auth/activate?next=${encodeURIComponent(nextPath)}` },
    })
    const token = link.data?.properties?.hashed_token
    if (typeof token === 'string' && token) return magicResumeUrl(token, nextPath)
  } catch (error) {
    console.error('[application-reminder] magic link failed', error instanceof Error ? error.name : 'error')
  }
  return fallback
}

export async function logReminderSend(entry: ReminderSendLog): Promise<void> {
  const result = await db().from('application_reminder_sends').insert({
    application_id: entry.applicationId,
    channel: entry.channel,
    kind: entry.kind,
    timezone: entry.timezone,
    sent_at: new Date().toISOString(),
  })
  if (result.error) {
    if (missingSchema(result.error)) {
      console.error(`[application-reminder] send log is not ready. Apply ${REMINDER_LOG_SQL}`)
      return
    }
    console.error('[application-reminder] send log failed', result.error.code || 'error')
  }
}

export async function releaseReminder(id: string, kind: ReminderKind): Promise<void> {
  const column = columnFor(kind)
  const result = await db()
    .from('doctor_applications')
    .update({ [column]: null })
    .eq('id', id)
    .eq('status', 'draft')
    .eq('card_on_file', false)
  if (result.error && !missingSchema(result.error)) {
    console.error('[application-reminder] release failed', result.error.code || 'error')
  }
}
