import 'server-only'
import { createAdminClient } from '@/lib/supabase-admin'
import { getDoctorRecipients } from '@/lib/leads/recipients'
import { sendTracked } from '@/lib/leads/send'
import { planLeadTexts } from '@/lib/sms/plan'
import { readSmsConfig } from '@/lib/sms/config'
import { sendLeadTexts } from '@/lib/sms/send-lead-texts'
import type { DoctorAlertTarget } from '@/lib/sms/types'
import { buildVisitOfficeAlert } from '@/lib/community/visit-alert'

type Share = {
  sharedFirstName: string | null
  forFirstName: string | null
  sharedEmail: string | null
  callbackPhone: string | null
  sharedFamilyNames: string | null
  note: string | null
  preferredWindow: string | null
}

export type OfficeAlertResult = { emailed: boolean; texted: boolean; textHeld: boolean }

/**
 * Email and, when the office already opted into lead texts, text the office.
 * Does not text the community member. Does not create a contact_requests row.
 */
export async function deliverVisitOfficeAlert(input: {
  visitId: string
  doctorId: string
  share: Share
}): Promise<OfficeAlertResult> {
  const result: OfficeAlertResult = { emailed: false, texted: false, textHeld: false }
  try {
    const admin = createAdminClient() as any
    const doctor = await admin
      .from('doctors')
      .select('id, email, user_id, lead_notification_emails, clinic_name, last_name, state, country')
      .eq('id', input.doctorId)
      .maybeSingle()
    if (doctor.error || !doctor.data?.id) return result

    const practice = (doctor.data.clinic_name || '').trim() || (doctor.data.last_name ? `Dr. ${doctor.data.last_name}` : 'your office')
    const built = buildVisitOfficeAlert({ ...input.share, practiceName: practice })
    const recipients = await getDoctorRecipients({
      id: doctor.data.id,
      email: doctor.data.email,
      user_id: doctor.data.user_id,
      lead_notification_emails: doctor.data.lead_notification_emails,
    })
    if (recipients.length > 0) {
      const sent = await sendTracked({
        requestId: null,
        kind: 'community_visit',
        channel: 'email',
        to: recipients,
        subject: built.subject,
        html: built.html,
        text: built.text,
      })
      result.emailed = sent.ok
    }

    const smsRow = await admin
      .from('doctors')
      .select('lead_alert_phones, sms_alerts_enabled, sms_alerts_consent_at')
      .eq('id', input.doctorId)
      .maybeSingle()
    if (smsRow.error || !smsRow.data) return result
    const phones = Array.isArray(smsRow.data.lead_alert_phones)
      ? smsRow.data.lead_alert_phones.filter((value: unknown) => typeof value === 'string')
      : []
    const target: DoctorAlertTarget = {
      id: doctor.data.id,
      state: doctor.data.state ?? null,
      country: doctor.data.country ?? null,
      lastName: doctor.data.last_name || '',
      practice: doctor.data.clinic_name || '',
      leadAlertPhones: phones,
      smsAlertsEnabled: smsRow.data.sms_alerts_enabled === true,
      smsAlertsConsentAt: smsRow.data.sms_alerts_consent_at || null,
    }
    const runtime = readSmsConfig()
    const plans = planLeadTexts({
      requestId: input.visitId,
      smsConsentSaved: false,
      officeBody: built.sms,
      doctor: target,
      patient: {
        name: input.share.sharedFirstName || 'A community member',
        phone: input.share.callbackPhone,
        email: input.share.sharedEmail,
        smsPhone: null,
        bestTime: input.share.preferredWindow,
        message: input.share.note,
      },
      runtime,
    })
    const willText = plans.some((plan) => plan.status === 'queued' || plan.status === 'held_quiet_hours')
    if (!willText) return result
    result.textHeld = plans.some((plan) => plan.status === 'held_quiet_hours')
    result.texted = plans.some((plan) => plan.status === 'queued')
    await sendLeadTexts({
      requestId: input.visitId,
      smsConsentSaved: false,
      officeBody: built.sms,
      doctor: target,
      patient: {
        name: input.share.sharedFirstName || 'A community member',
        phone: input.share.callbackPhone,
        email: input.share.sharedEmail,
        smsPhone: null,
        bestTime: input.share.preferredWindow,
        message: input.share.note,
      },
    })
    result.texted = true
  } catch (error) {
    console.error('[community] visit office alert failed:', error instanceof Error ? error.message : 'unknown')
  }
  return result
}
