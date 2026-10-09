import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

/**
 * Cron: Contact request escalation
 * Runs every 15 minutes. For each unacknowledged request, checks if the next
 * escalation step is due and sends it if so. Quiet hours enforced.
 * Idempotency enforced by UNIQUE(contact_request_id, step) on the escalation table.
 */
export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Load config
  const { data: configRow } = await (supabase as any)
    .from('platform_settings').select('value').eq('key', 'contact_escalation').single()
  const config = configRow?.value
  if (!config?.enabled) return NextResponse.json({ skipped: true, reason: 'Escalation disabled' })

  const quietStart = config.quiet_hours?.start ?? 21
  const quietEnd = config.quiet_hours?.end ?? 8
  const fallbackTz = config.fallback_timezone || 'America/New_York'

  // Get all unacknowledged requests (status = 'new', contact_outcome != 'patient_contacted_confirmed')
  const { data: requests } = await (supabase as any)
    .from('contact_requests')
    .select('id, name, phone, note, doctor_id, created_at, acknowledge_token, status, contact_outcome')
    .eq('status', 'new')
    .or('contact_outcome.is.null,contact_outcome.neq.patient_contacted_confirmed')

  if (!requests?.length) return NextResponse.json({ processed: 0 })

  const results: any[] = []
  const now = Date.now()

  for (const req of requests) {
    // Skip withdrawn
    if (req.status === 'withdrawn') continue

    // Get doctor info
    const { data: doctor } = await supabase
      .from('doctors')
      .select('first_name, last_name, clinic_name, email, phone, city, state, latitude, longitude')
      .eq('id', req.doctor_id)
      .single()
    if (!doctor) continue

    // Check which steps have been sent
    const { data: sentSteps } = await (supabase as any)
      .from('contact_request_escalations')
      .select('step')
      .eq('contact_request_id', req.id)
    const completedSteps = new Set((sentSteps || []).map((s: any) => s.step))

    // Determine which step to send next
    const stepConfigs = config.steps as Record<string, { delay_hours: number; channel: string }>
    for (const [stepNum, stepConfig] of Object.entries(stepConfigs)) {
      const step = parseInt(stepNum)
      if (completedSteps.has(step)) continue
      if (stepConfig.channel !== 'email') continue // Phase 2 only handles email

      // Check timing
      const requestAge = (now - new Date(req.created_at).getTime()) / 3600000 // hours
      if (requestAge < stepConfig.delay_hours) continue

      // Quiet hours check — use doctor's city coords to estimate timezone
      if (isQuietHours(doctor.latitude, doctor.longitude, quietStart, quietEnd, fallbackTz)) {
        results.push({ request: req.id, step, skipped: 'quiet_hours' })
        continue
      }

      // Send the email
      const doctorEmail = doctor.email
      if (!doctorEmail) {
        // Log the skip
        await (supabase as any).from('contact_request_escalations').insert({
          contact_request_id: req.id, step, channel: 'email',
          skipped: true, skip_reason: 'No doctor email',
        }).onConflict('contact_request_id, step').ignore()
        results.push({ request: req.id, step, skipped: 'no_email' })
        continue
      }

      // Build the email
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://neurochiro.co'
      const ackUrl = `${siteUrl}/api/contact-request/acknowledge?token=${req.acknowledge_token}`

      // Determine greeting — skip if last_name looks like a business
      const lastName = doctor.last_name || ''
      const looksLikeBusiness = !lastName || /\b(chiro|clinic|wellness|health|care|center|office)\b/i.test(lastName)
      const greeting = looksLikeBusiness ? '' : `<p>Hi Dr. ${lastName},</p>`

      let subject = ''
      let body = ''

      if (step === 2) {
        subject = `${req.name} is still waiting to hear from your office`
        body = `
          <div style="font-family:-apple-system,system-ui,sans-serif;max-width:480px;margin:0 auto;color:#1E2D3B;">
            ${greeting}
            <p><strong>${req.name}</strong> asked to be contacted by your office a few hours ago and I want to make sure it doesn't slip through.</p>
            <div style="background:#f5f5f5;padding:16px;border-radius:10px;margin:16px 0;">
              <p style="margin:0 0 8px;font-size:14px;"><strong>Name:</strong> ${req.name}</p>
              <p style="margin:0;font-size:14px;"><strong>Phone:</strong> <a href="tel:${req.phone}" style="color:#D66829;font-weight:700;">${req.phone}</a></p>
            </div>
            <p style="margin:24px 0;">
              <a href="${ackUrl}" style="display:inline-block;padding:16px 32px;background:#22c55e;color:white;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;">I've contacted this patient</a>
            </p>
            <p style="font-size:12px;color:#999;">If you've already reached out, tap the button so I know it's handled.</p>
          </div>
        `
      }

      if (!subject) continue

      // Send via Resend
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'NeuroChiro <support@neurochirodirectory.com>',
          to: doctorEmail,
          subject,
          html: body,
        })

        // Log success — unique constraint prevents duplicates
        await (supabase as any).from('contact_request_escalations').insert({
          contact_request_id: req.id, step, channel: 'email',
        })

        results.push({ request: req.id, step, sent: true, to: doctorEmail })
      } catch (e: any) {
        // Log failure — still insert to prevent retries (mark as error)
        await (supabase as any).from('contact_request_escalations').insert({
          contact_request_id: req.id, step, channel: 'email',
          delivered: false, error: e.message?.slice(0, 200),
        }).onConflict('contact_request_id, step').ignore()

        results.push({ request: req.id, step, error: e.message })
      }

      break // Only send one step per request per cron run
    }
  }

  return NextResponse.json({ processed: requests.length, results })
}

/**
 * Check if it is currently quiet hours at the doctor's location.
 * Uses longitude to estimate timezone offset (rough but works for US/CA).
 */
function isQuietHours(
  lat: number | null, lng: number | null,
  quietStart: number, quietEnd: number,
  fallbackTz: string
): boolean {
  let localHour: number

  if (lng && lat) {
    // Rough timezone from longitude: every 15 degrees = 1 hour offset from UTC
    const offsetHours = Math.round(lng / 15)
    const utcNow = new Date()
    localHour = (utcNow.getUTCHours() + offsetHours + 24) % 24
  } else {
    // Fallback: use configured timezone
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: fallbackTz,
        hour: 'numeric',
        hour12: false,
      })
      localHour = parseInt(formatter.format(new Date()))
    } catch {
      localHour = new Date().getUTCHours() - 5 // EST fallback
      if (localHour < 0) localHour += 24
    }
  }

  // Quiet if localHour >= quietStart (e.g. 21) OR localHour < quietEnd (e.g. 8)
  if (quietStart > quietEnd) {
    return localHour >= quietStart || localHour < quietEnd
  }
  return localHour >= quietStart && localHour < quietEnd
}
