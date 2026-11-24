'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { isMissingColumn } from '@/lib/leads/schema'
import { selectedDoctorIdFor } from '@/lib/portal/selected-doctor'

export type AlertChannel = 'email' | 'text' | 'both'

export type OfficeAlertSettings =
  | { ready: false; note: string }
  | { ready: true; channel: AlertChannel; frontDeskEmails: string[] }

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error }
}

async function doctorId(): Promise<{ id: string } | { error: string }> {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Your session ended. Sign in again, then save these choices.' }
  const doctorId = await selectedDoctorIdFor(user.id)
  if (!doctorId) return { error: 'A doctor profile is required before these choices can be saved.' }
  return { id: doctorId }
}

function emailsOf(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.includes('@')) : []
}

export async function loadOfficeAlerts(): Promise<OfficeAlertSettings | { error: string }> {
  const owned = await doctorId()
  if ('error' in owned) return owned
  const admin = createAdminClient() as any
  const row = await admin.from('doctors').select('lead_notification_emails, lead_alert_channel').eq('id', owned.id).maybeSingle()
  if (row.error) {
    if (isMissingColumn(row.error)) {
      return { ready: false, note: 'Email and text choices save after the latest database update. New requests still show in People.' }
    }
    return { error: 'Alert choices could not be loaded. Refresh this page and try again.' }
  }
  const channel = row.data?.lead_alert_channel === 'email' || row.data?.lead_alert_channel === 'text' ? row.data.lead_alert_channel : 'both'
  return { ready: true, channel, frontDeskEmails: emailsOf(row.data?.lead_notification_emails) }
}

export async function saveOfficeAlerts(input: { channel: AlertChannel; frontDeskEmails: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  const owned = await doctorId()
  if ('error' in owned) return fail(owned.error)
  const channel: AlertChannel = input.channel === 'email' || input.channel === 'text' ? input.channel : 'both'
  const parsed = input.frontDeskEmails.split(/[,;\s]+/).map((item) => item.trim().toLowerCase()).filter(Boolean)
  if (parsed.some((item) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item))) {
    return fail('Check the front desk email. Use a full address, then save again.')
  }
  const admin = createAdminClient() as any
  const saved = await admin.from('doctors').update({
    lead_alert_channel: channel,
    lead_notification_emails: parsed,
  }).eq('id', owned.id).select('id').maybeSingle()
  if (saved.error || !saved.data?.id) {
    if (isMissingColumn(saved.error)) {
      return fail('These choices save after the latest database update. New requests still show in People.')
    }
    return fail('The choices were not saved. Try again.')
  }
  revalidatePath('/doctor/settings')
  return { ok: true }
}
