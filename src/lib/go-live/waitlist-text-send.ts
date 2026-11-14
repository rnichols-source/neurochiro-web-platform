import 'server-only'

import { createAdminClient } from '@/lib/supabase-admin'
import { sendWaitlistDoctorJoinedText } from '@/lib/sms/waitlist-alert'
import { waitlistDoctorJoinedText } from '@/lib/sms/templates'
import { waitlistTextGate } from '@/lib/sms/waitlist-text'

export async function textWaitlistOnce(input: {
  doctorId: string
  subscriberId: string
  phone: string | null
  consent: boolean
  optedOut: boolean
  doctorName: string
  city: string
  profileUrl: string
}): Promise<string> {
  const gate = waitlistTextGate({
    phone: input.phone,
    consent: input.consent,
    optedOut: input.optedOut,
    alreadySent: false,
  })
  if (gate !== 'send' || !input.phone) return gate
  const admin = createAdminClient() as any
  const claimed = await admin.from('waitlist_alert_sends').insert({
    doctor_id: input.doctorId,
    subscriber_id: input.subscriberId,
    channel: 'sms',
    status: 'sending',
  }).select('id')
  if (claimed.error) return claimed.error.code === '23505' ? 'already_sent' : 'not_logged'
  const body = waitlistDoctorJoinedText(input.doctorName, input.city, input.profileUrl)
  const result = await sendWaitlistDoctorJoinedText(input.phone, body)
  await admin.from('waitlist_alert_sends').update({ status: result }).eq('id', claimed.data?.[0]?.id)
  return result
}
