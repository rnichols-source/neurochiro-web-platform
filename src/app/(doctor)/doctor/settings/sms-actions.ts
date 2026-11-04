'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { isMissingColumn, isMissingTable } from '@/lib/leads/schema'
import { DOCTOR_SMS_CONSENT_V1 } from '@/lib/sms/consent'
import { toE164 } from '@/lib/sms/phone'

const LABELS = ['Your mobile', 'Office manager or second phone', 'Another mobile'] as const

type DbError = { message?: string; code?: string; details?: string } | null
type DoctorRow = {
  id?: string
  lead_alert_phones?: unknown
  sms_alerts_enabled?: boolean | null
  sms_alerts_consent_at?: string | null
}
interface DoctorChain extends PromiseLike<{ data: DoctorRow | null; error: DbError }> {
  select(columns: string): DoctorChain
  update(patch: Record<string, unknown>): DoctorChain
  eq(column: string, value: string): DoctorChain
  maybeSingle(): Promise<{ data: DoctorRow | null; error: DbError }>
}

export type LeadTextSettings =
  | { ready: false }
  | { ready: true; phones: string[]; enabled: boolean; consented: boolean }

function doctorDb(): { from: (table: string) => DoctorChain } {
  return createAdminClient() as unknown as { from: (table: string) => DoctorChain }
}

async function ownedDoctorId(): Promise<{ id: string } | { error: string }> {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in again.' }
  const admin = doctorDb()
  const { data, error } = await admin.from('doctors').select('id').eq('user_id', user.id).maybeSingle()
  if (error || !data?.id) return { error: 'Doctor profile not found.' }
  return { id: String(data.id) }
}

function missing(error: { message?: string; code?: string; details?: string } | null): boolean {
  return isMissingColumn(error) || isMissingTable(error)
}

export async function loadLeadTextAlerts(): Promise<LeadTextSettings | { error: string }> {
  const owned = await ownedDoctorId()
  if ('error' in owned) return owned
  const admin = doctorDb()
  const { data, error } = await admin
    .from('doctors')
    .select('lead_alert_phones, sms_alerts_enabled, sms_alerts_consent_at')
    .eq('id', owned.id)
    .maybeSingle()
  if (error) {
    if (missing(error)) return { ready: false }
    return { error: 'Text alerts could not be loaded.' }
  }
  const phones = Array.isArray(data?.lead_alert_phones)
    ? data.lead_alert_phones.filter((value: unknown) => typeof value === 'string').slice(0, 3)
    : []
  return {
    ready: true,
    phones,
    enabled: data?.sms_alerts_enabled !== false,
    consented: Boolean(data?.sms_alerts_consent_at),
  }
}

export async function saveLeadTextAlerts(input: {
  phones: string[]
  enabled: boolean
  consent: boolean
}): Promise<{ ok: true } | { ok: false; error: string; comingSoon?: boolean }> {
  const owned = await ownedDoctorId()
  if ('error' in owned) return { ok: false, error: owned.error }

  const raw = Array.isArray(input.phones) ? input.phones.slice(0, 3) : []
  if (Array.isArray(input.phones) && input.phones.length > 3) {
    return { ok: false, error: 'Save up to 3 mobile numbers.' }
  }
  const phones: string[] = []
  for (let index = 0; index < raw.length; index += 1) {
    const value = typeof raw[index] === 'string' ? raw[index].trim() : ''
    if (!value) continue
    const e164 = toE164(value)
    if (!e164) {
      return { ok: false, error: `Enter a US or Canadian mobile for ${LABELS[index] || 'that number'}.` }
    }
    if (!phones.includes(e164)) phones.push(e164)
  }

  const consent = input.consent === true
  const patch = {
    lead_alert_phones: phones,
    sms_alerts_enabled: input.enabled === true,
    sms_alerts_consent_at: consent ? new Date().toISOString() : null,
    sms_alerts_consent_text: consent ? DOCTOR_SMS_CONSENT_V1 : null,
  }
  const admin = doctorDb()
  const { error } = await admin.from('doctors').update(patch).eq('id', owned.id)
  if (error) {
    if (missing(error)) return { ok: false, error: 'Text alerts are coming soon', comingSoon: true }
    return { ok: false, error: 'Text alerts could not be saved.' }
  }
  revalidatePath('/doctor/settings')
  return { ok: true }
}
