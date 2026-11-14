import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { daysSince, nextNudge, profileCompleteness } from '@/lib/go-live/plan'
import { nudgeCopy } from '@/lib/go-live/messages'
import { canTextNumber } from '@/lib/go-live/plan'
import { sendApplicationEmail } from '@/lib/applications/notify'
import { readSmsConfig } from '@/lib/sms/config'
import { quoSend } from '@/lib/sms/quo'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const admin = createAdminClient() as any
  const since = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await admin
    .from('doctors')
    .select('id, user_id, email, first_name, last_name, clinic_name, bio, photo_url, specialties, hours, phone, address, city, booking_url, latitude, longitude, sms_alerts_enabled, lead_alert_phones, spotlight_status, live_feature_status, verified_at')
    .eq('verification_status', 'verified')
    .gte('verified_at', since)
    .limit(80)
  if (error) return NextResponse.json({ ok: true, sent: 0, detail: 'Nudge table or columns are not ready.' })
  const now = new Date().toISOString()
  let sent = 0
  for (const row of data || []) {
    const { data: prior } = await admin.from('member_setup_nudges').select('nudge_key').eq('doctor_id', row.id)
    const sentKeys = (prior || []).map((item: { nudge_key: string }) => item.nudge_key)
    const specialties = Array.isArray(row.specialties) ? row.specialties : []
    const phones = Array.isArray(row.lead_alert_phones) ? row.lead_alert_phones.filter((item: unknown) => typeof item === 'string') : []
    const score = profileCompleteness({
      clinicName: row.clinic_name || '',
      bio: row.bio || '',
      photo: row.photo_url || '',
      specialties,
      hours: row.hours || '',
      phone: row.phone || '',
      address: row.address || '',
      city: row.city || '',
      bookingUrl: row.booking_url || '',
      latitude: row.latitude == null ? null : Number(row.latitude),
      longitude: row.longitude == null ? null : Number(row.longitude),
      textNumber: row.sms_alerts_enabled === true && phones.length > 0,
    })
    let loginActivated = false
    if (row.user_id) {
      const user = await admin.auth.admin.getUserById(row.user_id).catch(() => null)
      loginActivated = Boolean(user?.data?.user?.last_sign_in_at)
    }
    const plan = nextNudge({
      daysSinceLive: daysSince(row.verified_at, now),
      done: {
        activate_login: loginActivated,
        finish_profile: score.percent >= 70 && Boolean(row.photo_url),
        book_spotlight: Boolean(row.spotlight_status && !['not_scheduled', 'not_booked'].includes(row.spotlight_status)),
        book_ig_live: Boolean(row.live_feature_status && !['not_scheduled', 'not_booked'].includes(row.live_feature_status)),
        add_text_number: row.sms_alerts_enabled === true && phones.length > 0,
      },
      sentKeys,
    })
    if (!plan || !row.email) continue
    const { count } = await admin.from('contact_requests').select('id', { count: 'exact', head: true }).eq('doctor_id', row.id)
    const copy = nudgeCopy(plan, { name: row.last_name || row.first_name || '', requestCount: count || 0, activateUrl: 'https://neurochiro.co/login?next=%2Fdoctor%2Fdashboard' })
    const mailed = await sendApplicationEmail({ to: row.email, subject: copy.subject, html: `<p>${copy.body}</p>` })
    if (!mailed) continue
    await admin.from('member_setup_nudges').insert({
      doctor_id: row.id,
      nudge_key: plan.key,
      channel: 'email',
      kind: plan.kind,
      day_number: plan.day,
      step: plan.step,
    })
    const phone = phones.find((item: string) => canTextNumber(item))
    if (phone && row.sms_alerts_enabled === true && readSmsConfig().enabled) {
      const text = await quoSend({ to: phone, content: copy.sms })
      if (text.ok) {
        await admin.from('member_setup_nudges').insert({
          doctor_id: row.id,
          nudge_key: plan.key,
          channel: 'sms',
          kind: plan.kind,
          day_number: plan.day,
          step: plan.step,
        })
      }
    }
    sent += 1
  }
  return NextResponse.json({ ok: true, sent })
}
