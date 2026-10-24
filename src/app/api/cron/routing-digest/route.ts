import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, fetchAllRows } from '@/lib/supabase-admin'
import { wrapEmail } from '@/lib/email-template'
import { Resend } from 'resend'

export const maxDuration = 300

/**
 * ROUTING DIGEST — Daily at 8am EST
 * Sends each doctor a summary of patients routed to them yesterday.
 *
 * Gates:
 *   ROUTING_DIGEST_ENABLED (default OFF)
 *   ROUTING_DIGEST_DRY_RUN (default ON)
 *
 * Hard exclusions:
 *   - no user_id (unclaimed profiles)
 *   - is_test = true
 *   - membership_tier != 'pro'
 *   - zero routings = zero email
 *
 * Dedupe: automation_queue with date key per doctor.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Kill switch
  if (process.env.ROUTING_DIGEST_ENABLED !== 'true') {
    console.log('[ROUTING_DIGEST] Disabled (ROUTING_DIGEST_ENABLED != true)')
    return NextResponse.json({ skipped: true, reason: 'Routing digest disabled' })
  }

  const dryRun = process.env.ROUTING_DIGEST_DRY_RUN === 'true'
  const supabase = createAdminClient()
  const resend = new Resend(process.env.RESEND_API_KEY || '')

  // Yesterday window (EST — doctor timezone not stored yet)
  const now = new Date()
  const estOffset = -5 * 60 // EST = UTC-5
  const nowEST = new Date(now.getTime() + estOffset * 60 * 1000)
  const yesterdayEST = new Date(nowEST)
  yesterdayEST.setDate(yesterdayEST.getDate() - 1)
  yesterdayEST.setHours(0, 0, 0, 0)
  const todayEST = new Date(nowEST)
  todayEST.setHours(0, 0, 0, 0)

  // Convert back to UTC for DB queries
  const windowStart = new Date(yesterdayEST.getTime() - estOffset * 60 * 1000).toISOString()
  const windowEnd = new Date(todayEST.getTime() - estOffset * 60 * 1000).toISOString()
  const dateKey = yesterdayEST.toISOString().slice(0, 10) // e.g. "2026-10-22"

  console.log(`[ROUTING_DIGEST] Window: ${windowStart} to ${windowEnd} (${dateKey})${dryRun ? ' [DRY RUN]' : ''}`)

  // 1. Get yesterday's routings (exclude waitlist)
  const yesterdayLogs = await fetchAllRows(
    supabase,
    'reply_logs',
    'id, doctor_id, searched_city, searched_state, template_id, created_at',
    (q: any) => q
      .gte('created_at', windowStart)
      .lt('created_at', windowEnd)
      .not('template_id', 'in', '("waitlist_comment","waitlist_dm")'),
  )

  if (yesterdayLogs.length === 0) {
    console.log('[ROUTING_DIGEST] No routings yesterday. No emails.')
    return NextResponse.json({ success: true, routings: 0, emails: 0, dryRun })
  }

  // 2. Group by doctor
  const byDoctor = new Map<string, typeof yesterdayLogs>()
  for (const log of yesterdayLogs) {
    if (!log.doctor_id) continue
    const existing = byDoctor.get(log.doctor_id) || []
    existing.push(log)
    byDoctor.set(log.doctor_id, existing)
  }

  // 3. Get click data for these logs
  const logIds = yesterdayLogs.map((l: any) => l.id).filter(Boolean)
  let clicksByLog = new Map<string, number>()
  if (logIds.length > 0) {
    const clicks = await fetchAllRows(
      supabase,
      'link_clicks',
      'reply_log_id',
      (q: any) => q.eq('destination', 'profile').in('reply_log_id', logIds),
    )
    for (const c of clicks) {
      if (c.reply_log_id) {
        clicksByLog.set(c.reply_log_id, (clicksByLog.get(c.reply_log_id) || 0) + 1)
      }
    }
  }

  // 4. Get eligible doctors (pro, has user_id, not test)
  const doctorIds = [...byDoctor.keys()]
  const { data: doctors } = await (supabase as any)
    .from('doctors')
    .select('id, first_name, last_name, user_id, membership_tier, is_test, email')
    .in('id', doctorIds)

  const doctorMap = new Map<string, any>()
  for (const d of (doctors || [])) {
    doctorMap.set(d.id, d)
  }

  // 5. Get emails from profiles
  const userIds = (doctors || []).filter((d: any) => d.user_id).map((d: any) => d.user_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
    .in('id', userIds.length > 0 ? userIds : ['__none__'])
  const emailMap = new Map<string, string>()
  for (const p of (profiles || [])) {
    emailMap.set(p.id, p.email)
  }

  // 6. Get month and all-time counts per doctor
  const monthStart = new Date(nowEST.getFullYear(), nowEST.getMonth(), 1)
  const monthStartUTC = new Date(monthStart.getTime() - estOffset * 60 * 1000).toISOString()

  const monthLogs = await fetchAllRows(
    supabase,
    'reply_logs',
    'doctor_id',
    (q: any) => q
      .gte('created_at', monthStartUTC)
      .not('template_id', 'in', '("waitlist_comment","waitlist_dm")')
      .in('doctor_id', doctorIds),
  )
  const monthCounts = new Map<string, number>()
  for (const l of monthLogs) {
    if (l.doctor_id) monthCounts.set(l.doctor_id, (monthCounts.get(l.doctor_id) || 0) + 1)
  }

  const allTimeLogs = await fetchAllRows(
    supabase,
    'reply_logs',
    'doctor_id',
    (q: any) => q
      .not('template_id', 'in', '("waitlist_comment","waitlist_dm")')
      .in('doctor_id', doctorIds),
  )
  const allTimeCounts = new Map<string, number>()
  for (const l of allTimeLogs) {
    if (l.doctor_id) allTimeCounts.set(l.doctor_id, (allTimeCounts.get(l.doctor_id) || 0) + 1)
  }

  // 7. Check dedupe
  const { data: existingDigests } = await (supabase as any)
    .from('automation_queue')
    .select('payload')
    .eq('event_type', 'routing_digest')
    .gte('created_at', windowStart)

  const alreadySent = new Set<string>()
  for (const d of (existingDigests || [])) {
    if (d.payload?.doctorId && d.payload?.dateKey === dateKey) {
      alreadySent.add(d.payload.doctorId)
    }
  }

  // 8. Send digests
  let emailsSent = 0
  const results: any[] = []

  for (const [doctorId, logs] of byDoctor) {
    const doc = doctorMap.get(doctorId)
    if (!doc) { results.push({ doctorId, skipped: 'not_found' }); continue }
    if (!doc.user_id) { results.push({ doctorId, name: `${doc.first_name} ${doc.last_name}`, skipped: 'no_user_id' }); continue }
    if (doc.is_test) { results.push({ doctorId, skipped: 'test' }); continue }
    if (doc.membership_tier !== 'pro') { results.push({ doctorId, name: `${doc.first_name} ${doc.last_name}`, skipped: 'not_pro' }); continue }
    if (alreadySent.has(doctorId)) { results.push({ doctorId, name: `${doc.first_name} ${doc.last_name}`, skipped: 'already_sent' }); continue }

    const email = emailMap.get(doc.user_id) || doc.email
    if (!email) { results.push({ doctorId, name: `${doc.first_name} ${doc.last_name}`, skipped: 'no_email' }); continue }

    const n = logs.length
    const firstName = doc.first_name || 'Doctor'
    const monthCount = monthCounts.get(doctorId) || 0
    const allTimeCount = allTimeCounts.get(doctorId) || 0

    // Build city list
    const cityLines = logs.map((l: any) => {
      const city = l.searched_city || 'an unknown area'
      const state = l.searched_state ? `, ${l.searched_state.toUpperCase()}` : ''
      return `Someone in ${city}${state}`
    })

    // Count clicks
    const totalClicks = logs.reduce((sum: number, l: any) => sum + (clicksByLog.get(l.id) || 0), 0)

    // Grammar
    const plural = n === 1
    const subject = `${n} ${plural ? 'person was' : 'people were'} sent your way yesterday`
    const sentLine = plural
      ? `Yesterday I sent 1 person to your profile:`
      : `Yesterday I sent ${n} people to your profile:`

    let bodyHtml = `<p>Dr. ${firstName},</p>`
    bodyHtml += `<p>${sentLine}</p>`
    bodyHtml += `<ul style="color:#4B5563;margin:16px 0;">`
    for (const line of cityLines) {
      bodyHtml += `<li style="margin-bottom:4px;">${line}</li>`
    }
    bodyHtml += `</ul>`

    if (totalClicks > 0) {
      const clickPlural = totalClicks === 1
      bodyHtml += `<p>${totalClicks} of them clicked through to see your profile.</p>`
    }

    bodyHtml += `<p>That's ${monthCount} this month and ${allTimeCount} since you joined.</p>`
    bodyHtml += `<p>Worth giving your front desk a heads up that calls may come in from Instagram. People usually mention they found you through me.</p>`
    bodyHtml += `<p><strong>Dr. Ray</strong></p>`

    const result = {
      doctorId,
      name: `Dr. ${doc.first_name} ${doc.last_name}`,
      email,
      routings: n,
      clicks: totalClicks,
      monthCount,
      allTimeCount,
      subject,
    }

    if (dryRun) {
      results.push({ ...result, dryRun: true, wouldSend: bodyHtml })
      continue
    }

    try {
      await resend.emails.send({
        from: 'Dr. Ray <support@neurochirodirectory.com>',
        to: email,
        subject,
        html: wrapEmail(bodyHtml),
      })

      // Log to prevent double send
      await (supabase as any).from('automation_queue').insert({
        event_type: 'routing_digest',
        payload: { doctorId, dateKey, email, routings: n },
        status: 'completed',
      })

      emailsSent++
      results.push({ ...result, sent: true })
    } catch (err: any) {
      console.error(`[ROUTING_DIGEST] Failed for ${email}:`, err.message)
      results.push({ ...result, error: err.message })
    }
  }

  console.log(`[ROUTING_DIGEST] ${dryRun ? 'DRY RUN' : 'SENT'}: ${emailsSent} emails for ${dateKey}. ${yesterdayLogs.length} total routings across ${byDoctor.size} doctors.`)

  return NextResponse.json({
    success: true,
    dateKey,
    totalRoutings: yesterdayLogs.length,
    doctorsWithRoutings: byDoctor.size,
    emailsSent,
    dryRun,
    results,
    note: 'Send time uses EST. Doctor timezone field not yet stored.',
  })
}
