import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { daysSince, loginPasswordState, nextBookingNudge, nextNudge, nudgeProgress, profileCompleteness } from '@/lib/go-live/plan'
import { nudgeCopy } from '@/lib/go-live/messages'
import { canTextNumber } from '@/lib/go-live/plan'
import { sendApplicationEmail } from '@/lib/applications/notify'
import { readSmsConfig } from '@/lib/sms/config'
import { quoSend } from '@/lib/sms/quo'
import { settle } from '@/lib/go-live/settle'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const admin = createAdminClient() as any
  const since = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()
  const columns = 'id, user_id, email, first_name, last_name, clinic_name, bio, photo_url, specialties, hours, phone, address, city, booking_url, latitude, longitude, sms_alerts_enabled, lead_alert_phones, spotlight_status, live_feature_status, go_live_flow_at, onboarding_call_status, profile_publish_mode'
  let listed = await admin
    .from('doctors')
    .select(columns)
    .eq('verification_status', 'verified')
    .not('go_live_flow_at', 'is', null)
    .gte('go_live_flow_at', since)
    .limit(80)
  if (listed.error) {
    listed = await admin
      .from('doctors')
      .select(columns.replace(', profile_publish_mode', ''))
      .eq('verification_status', 'verified')
      .not('go_live_flow_at', 'is', null)
      .gte('go_live_flow_at', since)
      .limit(80)
  }
  const { data, error } = listed
  if (error) return NextResponse.json({ ok: true, sent: 0, detail: 'Nudge table or columns are not ready.' })
  const now = new Date().toISOString()
  let sent = 0
  let failed = 0
  const rows = Array.isArray(data) ? data : []
  for (const row of rows) {
    if (!row?.id) continue
    try {
      if (await nudgeOne(admin, row, now)) sent += 1
    } catch (err) {
      failed += 1
      console.error('[member-setup-nudges] doctor', row.id, err)
    }
  }
  return NextResponse.json({ ok: true, sent, failed })
}

/** One doctor. A problem here is logged and skipped so it never stops everyone else's reminder. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- same untyped admin client and row the loop already used
async function nudgeOne(admin: any, row: any, now: string): Promise<boolean> {
  const { data: prior, error: priorError } = await admin.from('member_setup_nudges').select('nudge_key').eq('doctor_id', row.id)
  // Without the send history we could repeat a reminder, so skip this doctor today.
  if (priorError) throw new Error(`nudge history unavailable: ${priorError.message || priorError}`)
  const sentKeys = (Array.isArray(prior) ? prior : []).map((item: { nudge_key: string }) => item?.nudge_key).filter(Boolean)
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
  let passwordSet: boolean | 'unknown' = false
  if (row.user_id) {
    const rpc = await settle<{ data?: unknown; error?: unknown }>(() => admin.rpc('portal_password_is_set', { target: row.user_id }))
    const state = loginPasswordState(rpc)
    passwordSet = state === 'set' ? true : state === 'unset' ? false : 'unknown'
  }
  const days = daysSince(row.go_live_flow_at, now)
  const done = nudgeProgress({
    passwordSet,
    profilePublishMode: row.profile_publish_mode || null,
    profilePercent: score.percent,
    hasPhoto: Boolean(row.photo_url),
    spotlightBooked: Boolean(row.spotlight_status && !['not_scheduled', 'not_booked'].includes(row.spotlight_status)),
    igLiveBooked: Boolean(row.live_feature_status && !['not_scheduled', 'not_booked'].includes(row.live_feature_status)),
    textNumber: row.sms_alerts_enabled === true && phones.length > 0,
  })
  const plan = nextNudge({ daysSinceLive: days, done, sentKeys })
    || nextBookingNudge({
      daysSinceLive: days,
      onboardingCallCompleted: row.onboarding_call_status === 'completed',
      done,
      sentKeys,
    })
  if (!plan || !row.email) return false
  const { count } = await admin.from('contact_requests').select('id', { count: 'exact', head: true }).eq('doctor_id', row.id).neq('status', 'spam')
  const copy = nudgeCopy(plan, { name: row.last_name || row.first_name || '', requestCount: count || 0, activateUrl: 'https://neurochiro.co/login?next=%2Fdoctor%2Fdashboard' })
  const mailed = await sendApplicationEmail({ to: row.email, subject: copy.subject, html: `<p>${copy.body}</p>` })
  if (!mailed) return false
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
  return true
}
