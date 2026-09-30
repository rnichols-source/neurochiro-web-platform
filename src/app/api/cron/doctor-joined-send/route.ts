import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import {
  getNotifySettings,
  logNotification,
  type MatchedSubscriber,
} from '@/lib/doctor-joined-notify'
import { getMarketingResend, getMarketingFrom, wrapMarketingEmail } from '@/lib/marketing-email'

/**
 * Cron: Process pending doctor-joined notification queue.
 *
 * Picks up queue entries where send_after has passed.
 * Sends Email 1 (announcement) to each matched subscriber.
 * Writes dedupe rows, audit log entries, and marks queue as sent.
 *
 * Also handles Email 2 (follow-up) for entries sent 4+ days ago
 * where the subscriber hasn't submitted a contact request.
 *
 * Kill switch: platform_settings.doctor_joined_notify.enabled
 * When OFF, does nothing.
 *
 * Schedule: 0 11,23 * * * (11am and 11pm UTC — 1hr after scan)
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const settings = await getNotifySettings()
  if (!settings.enabled) {
    return NextResponse.json({ processed: false, reason: 'kill_switch_off' })
  }

  const supabase = createAdminClient()
  const now = new Date()

  // ── Email 1: Process pending queue entries past hold window ──

  const { data: pendingEntries } = await (supabase as any)
    .from('doctor_notify_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('send_after', now.toISOString())
    .order('created_at', { ascending: true })

  let email1Sent = 0
  let email1Failed = 0
  let email1Suppressed = 0

  for (const entry of (pendingEntries || [])) {
    // Mark as processing
    await (supabase as any)
      .from('doctor_notify_queue')
      .update({ status: 'processing' })
      .eq('id', entry.id)

    // Load doctor info
    const { data: doctor } = await (supabase as any)
      .from('doctors')
      .select('first_name, last_name, clinic_name, city, state, slug, photo_url, verification_status')
      .eq('id', entry.doctor_id)
      .single()

    if (!doctor || doctor.verification_status !== 'verified') {
      // Doctor unverified since queuing — cancel the batch
      await (supabase as any)
        .from('doctor_notify_queue')
        .update({ status: 'cancelled', cancelled_at: now.toISOString(), cancelled_reason: 'doctor_no_longer_verified' })
        .eq('id', entry.id)

      for (const sub of (entry.matched_subscribers as MatchedSubscriber[])) {
        await logNotification({
          queue_id: entry.id,
          doctor_id: entry.doctor_id,
          subscriber_id: sub.id,
          email_number: 1,
          status: 'cancelled',
          suppression_reason: 'doctor_no_longer_verified',
          distance_miles: sub.distance_miles,
          subscriber_city: sub.city,
          subscriber_state: sub.state,
        })
      }
      continue
    }

    const doctorName = `Dr. ${doctor.first_name} ${doctor.last_name}`
    const profileUrl = `https://neurochiro.co/directory/${doctor.slug}`
    const contactUrl = `https://neurochiro.co/contact-request?doctor=${doctor.slug}&source=doctor_joined`

    // Batch multiple doctors near same subscriber: check if this subscriber
    // has other pending entries. For now, send per-doctor (batching is a future optimization).
    const subscribers = entry.matched_subscribers as MatchedSubscriber[]

    for (const sub of subscribers) {
      // Re-check subscriber status
      const { data: subRecord } = await (supabase as any)
        .from('subscribers')
        .select('status, unsubscribed_at')
        .eq('id', sub.id)
        .single()

      if (!subRecord || subRecord.status !== 'confirmed' || subRecord.unsubscribed_at) {
        await logNotification({
          queue_id: entry.id,
          doctor_id: entry.doctor_id,
          subscriber_id: sub.id,
          email_number: 1,
          status: 'suppressed',
          suppression_reason: !subRecord ? 'subscriber_not_found' : subRecord.unsubscribed_at ? 'unsubscribed' : 'not_confirmed',
          distance_miles: sub.distance_miles,
          subscriber_city: sub.city,
          subscriber_state: sub.state,
        })
        email1Suppressed++
        continue
      }

      // Dedupe: write row first
      const { error: dedupErr } = await (supabase as any)
        .from('doctor_notifications')
        .insert({ doctor_id: entry.doctor_id, subscriber_id: sub.id, email_number: 1, queue_id: entry.id })

      if (dedupErr) {
        await logNotification({
          queue_id: entry.id,
          doctor_id: entry.doctor_id,
          subscriber_id: sub.id,
          email_number: 1,
          status: 'suppressed',
          suppression_reason: 'already_notified',
          distance_miles: sub.distance_miles,
          subscriber_city: sub.city,
          subscriber_state: sub.state,
        })
        email1Suppressed++
        continue
      }

      try {
        const resend = getMarketingResend()
        const from = getMarketingFrom()
        const distLabel = sub.distance_miles < 1 ? 'less than a mile' : `${Math.round(sub.distance_miles)} miles`

        const bodyHtml = `
          <p style="font-size:15px;color:#333;line-height:1.7;">You signed up to be notified when a nervous system chiropractor listed near you. One just did.</p>
          <div style="background:#f8f6f2;border-radius:12px;padding:20px;margin:20px 0;text-align:center;">
            ${doctor.photo_url ? `<img src="${doctor.photo_url}" alt="" style="width:64px;height:64px;border-radius:50%;object-fit:cover;margin:0 auto 12px;display:block;" />` : ''}
            <p style="font-size:18px;font-weight:900;color:#1E2D3B;margin:0 0 4px;">${doctorName}</p>
            <p style="font-size:14px;color:#718096;margin:0;">${doctor.clinic_name ? `${doctor.clinic_name} · ` : ''}${doctor.city}, ${doctor.state}</p>
            <p style="font-size:13px;color:#718096;margin:4px 0 0;">${distLabel} from you</p>
          </div>
          <p style="font-size:15px;color:#333;line-height:1.7;">Want their office to call you? Tap the button below, leave your name and number, and I'll send your request straight to them.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${contactUrl}" style="display:inline-block;background:#D66829;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;">Have Their Office Reach Out to Me</a>
          </div>
          <div style="text-align:center;margin:0 0 24px;">
            <a href="${profileUrl}" style="color:#D66829;font-size:14px;text-decoration:none;">or view their full profile</a>
          </div>
          <p style="font-size:15px;color:#333;line-height:1.7;">Dr. Ray<br><a href="https://neurochiro.co" style="color:#D66829;">neurochiro.co</a></p>
        `

        const result = await resend.emails.send({
          from,
          to: [sub.email],
          subject: `A nervous system chiropractor just listed in ${doctor.city}`,
          html: wrapMarketingEmail(bodyHtml),
          headers: {
            'List-Unsubscribe': '<{{{RESEND_UNSUBSCRIBE_URL}}}>',
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        })

        await logNotification({
          queue_id: entry.id,
          doctor_id: entry.doctor_id,
          subscriber_id: sub.id,
          email_number: 1,
          status: 'sent',
          distance_miles: sub.distance_miles,
          subscriber_city: sub.city,
          subscriber_state: sub.state,
          resend_id: (result as any)?.data?.id || undefined,
        })
        email1Sent++
      } catch (err) {
        console.error(`[DOCTOR-JOINED-SEND] Email 1 failed for ${sub.email}:`, err)
        // Roll back dedupe on failure
        await (supabase as any).from('doctor_notifications').delete()
          .eq('doctor_id', entry.doctor_id).eq('subscriber_id', sub.id).eq('email_number', 1)

        await logNotification({
          queue_id: entry.id,
          doctor_id: entry.doctor_id,
          subscriber_id: sub.id,
          email_number: 1,
          status: 'failed',
          distance_miles: sub.distance_miles,
          subscriber_city: sub.city,
          subscriber_state: sub.state,
        })
        email1Failed++
      }

      // Rate limit: 100ms between sends
      await new Promise(r => setTimeout(r, 100))
    }

    // Mark queue entry as sent
    await (supabase as any)
      .from('doctor_notify_queue')
      .update({ status: 'sent', processed_at: now.toISOString() })
      .eq('id', entry.id)
  }

  // ── Email 2: Follow-up for entries sent 4+ days ago ──

  const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000)

  const { data: sentEntries } = await (supabase as any)
    .from('doctor_notify_queue')
    .select('id, doctor_id, matched_subscribers')
    .eq('status', 'sent')
    .lte('processed_at', fourDaysAgo.toISOString())

  let email2Sent = 0
  let email2Suppressed = 0

  for (const entry of (sentEntries || [])) {
    const { data: doctor } = await (supabase as any)
      .from('doctors')
      .select('first_name, last_name, clinic_name, city, state, slug, verification_status')
      .eq('id', entry.doctor_id)
      .single()

    if (!doctor || doctor.verification_status !== 'verified') continue

    const doctorName = `Dr. ${doctor.first_name} ${doctor.last_name}`
    const profileUrl = `https://neurochiro.co/directory/${doctor.slug}`
    const contactUrl = `https://neurochiro.co/contact-request?doctor=${doctor.slug}&source=doctor_joined`
    const subscribers = entry.matched_subscribers as MatchedSubscriber[]

    for (const sub of subscribers) {
      // Already sent email 2?
      const { data: existing } = await (supabase as any)
        .from('doctor_notifications')
        .select('id')
        .eq('doctor_id', entry.doctor_id)
        .eq('subscriber_id', sub.id)
        .eq('email_number', 2)
        .maybeSingle()

      if (existing) continue

      // Stop condition: subscriber already submitted contact request for this doctor
      const { data: contactReq } = await (supabase as any)
        .from('contact_requests')
        .select('id')
        .eq('doctor_id', entry.doctor_id)
        .maybeSingle()

      // Check by phone/email match is complex; check if ANY contact request exists for this doctor
      // from doctor_joined source since the notification was sent
      if (contactReq) {
        await logNotification({
          queue_id: entry.id,
          doctor_id: entry.doctor_id,
          subscriber_id: sub.id,
          email_number: 2,
          status: 'suppressed',
          suppression_reason: 'contact_request_exists',
          distance_miles: sub.distance_miles,
          subscriber_city: sub.city,
          subscriber_state: sub.state,
        })
        email2Suppressed++
        continue
      }

      // Stop condition: unsubscribed
      const { data: subRecord } = await (supabase as any)
        .from('subscribers')
        .select('status, unsubscribed_at')
        .eq('id', sub.id)
        .single()

      if (!subRecord || subRecord.status !== 'confirmed' || subRecord.unsubscribed_at) {
        await logNotification({
          queue_id: entry.id,
          doctor_id: entry.doctor_id,
          subscriber_id: sub.id,
          email_number: 2,
          status: 'suppressed',
          suppression_reason: subRecord?.unsubscribed_at ? 'unsubscribed' : 'not_confirmed',
          distance_miles: sub.distance_miles,
          subscriber_city: sub.city,
          subscriber_state: sub.state,
        })
        email2Suppressed++
        continue
      }

      // Stop condition: newer doctor-joined email sent since email 1
      const { data: email1Record } = await (supabase as any)
        .from('doctor_notifications')
        .select('sent_at')
        .eq('doctor_id', entry.doctor_id)
        .eq('subscriber_id', sub.id)
        .eq('email_number', 1)
        .maybeSingle()

      if (email1Record) {
        const { data: newerNotif } = await (supabase as any)
          .from('doctor_notifications')
          .select('id')
          .eq('subscriber_id', sub.id)
          .eq('email_number', 1)
          .gt('sent_at', email1Record.sent_at)
          .neq('doctor_id', entry.doctor_id)
          .maybeSingle()

        if (newerNotif) {
          await logNotification({
            queue_id: entry.id,
            doctor_id: entry.doctor_id,
            subscriber_id: sub.id,
            email_number: 2,
            status: 'suppressed',
            suppression_reason: 'newer_notification_sent',
            distance_miles: sub.distance_miles,
            subscriber_city: sub.city,
            subscriber_state: sub.state,
          })
          email2Suppressed++
          continue
        }
      }

      // Dedupe
      const { error: dedupErr } = await (supabase as any)
        .from('doctor_notifications')
        .insert({ doctor_id: entry.doctor_id, subscriber_id: sub.id, email_number: 2, queue_id: entry.id })

      if (dedupErr) {
        email2Suppressed++
        continue
      }

      try {
        const resend = getMarketingResend()
        const from = getMarketingFrom()

        const bodyHtml = `
          <p style="font-size:15px;color:#333;line-height:1.7;">A few days ago I let you know that ${doctorName} listed in ${doctor.city}, ${doctor.state}.</p>
          <p style="font-size:15px;color:#333;line-height:1.7;">If you'd like their office to reach out to you, the easiest way is the link below. You leave your number, and they call you.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${contactUrl}" style="display:inline-block;background:#D66829;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;">Request a Call from Their Office</a>
          </div>
          <div style="text-align:center;margin:0 0 24px;">
            <a href="${profileUrl}" style="color:#D66829;font-size:14px;text-decoration:none;">View their profile</a>
          </div>
          <p style="font-size:15px;color:#333;line-height:1.7;">Dr. Ray<br><a href="https://neurochiro.co" style="color:#D66829;">neurochiro.co</a></p>
        `

        const result = await resend.emails.send({
          from,
          to: [sub.email],
          subject: `Did you get a chance to reach out to ${doctorName}?`,
          html: wrapMarketingEmail(bodyHtml),
          headers: {
            'List-Unsubscribe': '<{{{RESEND_UNSUBSCRIBE_URL}}}>',
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        })

        await logNotification({
          queue_id: entry.id,
          doctor_id: entry.doctor_id,
          subscriber_id: sub.id,
          email_number: 2,
          status: 'sent',
          distance_miles: sub.distance_miles,
          subscriber_city: sub.city,
          subscriber_state: sub.state,
          resend_id: (result as any)?.data?.id || undefined,
        })
        email2Sent++
      } catch (err) {
        console.error(`[DOCTOR-JOINED-SEND] Email 2 failed for ${sub.email}:`, err)
        await (supabase as any).from('doctor_notifications').delete()
          .eq('doctor_id', entry.doctor_id).eq('subscriber_id', sub.id).eq('email_number', 2)
      }

      await new Promise(r => setTimeout(r, 100))
    }
  }

  console.log('[DOCTOR-JOINED-SEND]', JSON.stringify({
    email1: { sent: email1Sent, failed: email1Failed, suppressed: email1Suppressed },
    email2: { sent: email2Sent, suppressed: email2Suppressed },
  }))

  return NextResponse.json({
    processed: true,
    email1: { sent: email1Sent, failed: email1Failed, suppressed: email1Suppressed },
    email2: { sent: email2Sent, suppressed: email2Suppressed },
  })
}
