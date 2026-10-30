import { createAdminClient } from '@/lib/supabase-admin'
import { isMissingColumn } from './schema'
import { normalizeEmail } from './validate'

export type DoctorRecipientSource = {
  id?: string
  email?: string | null
  user_id?: string | null
  lead_notification_emails?: string[] | null
  profile_email?: string | null
}

/** doctors.email + profiles.email + lead_notification_emails, deduped and validated. */
export function collectRecipientEmails(doctor: DoctorRecipientSource): string[] {
  const values: Array<string | null | undefined> = [
    doctor.email,
    doctor.profile_email,
    ...(Array.isArray(doctor.lead_notification_emails) ? doctor.lead_notification_emails : []),
  ]
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    const email = normalizeEmail(value)
    if (!email || seen.has(email)) continue
    seen.add(email)
    out.push(email)
  }
  return out
}

export async function getDoctorRecipients(doctor: DoctorRecipientSource): Promise<string[]> {
  let profileEmail = doctor.profile_email ?? null
  if (!profileEmail && doctor.user_id) {
    try {
      const db = createAdminClient() as any
      const { data, error } = await db.from('profiles').select('email').eq('id', doctor.user_id).maybeSingle()
      if (error) console.error('[LEADS] profiles.email lookup failed:', error.message)
      else profileEmail = data?.email ?? null
    } catch (err) {
      console.error('[LEADS] profiles.email lookup threw:', err instanceof Error ? err.message : err)
    }
  }

  let extras = doctor.lead_notification_emails
  if (extras === undefined && doctor.id) {
    try {
      const db = createAdminClient() as any
      const { data, error } = await db
        .from('doctors')
        .select('lead_notification_emails')
        .eq('id', doctor.id)
        .maybeSingle()
      if (error && isMissingColumn(error)) {
        console.error('[LEADS] doctors.lead_notification_emails is missing. Apply migration 20261030000000_lead_followup.sql.', error.message)
        extras = []
      } else if (error) {
        console.error('[LEADS] lead_notification_emails lookup failed:', error.message)
        extras = []
      } else {
        extras = data?.lead_notification_emails || []
      }
    } catch (err) {
      console.error('[LEADS] lead_notification_emails lookup threw:', err instanceof Error ? err.message : err)
      extras = []
    }
  }

  return collectRecipientEmails({ ...doctor, profile_email: profileEmail, lead_notification_emails: extras || [] })
}
