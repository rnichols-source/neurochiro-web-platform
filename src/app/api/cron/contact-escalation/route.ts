import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getDoctorTimezone, isQuietHours } from '@/lib/doctor-timezone'

/**
 * Cron: Contact request escalation
 * Runs on Vercel schedule. For each unacknowledged request, checks if the
 * next escalation step is due, respects quiet hours, logs every evaluation.
 *
 * ?dry_run=true logs what would happen without sending.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dryRun = req.nextUrl.searchParams.get('dry_run') === 'true'
  const supabase = createAdminClient()

  // Load config
  const { data: configRow } = await (supabase as any)
    .from('platform_settings').select('value').eq('key', 'contact_escalation').single()
  const config = configRow?.value
  if (!config?.enabled && !dryRun) {
    return NextResponse.json({ skipped: true, reason: 'Escalation disabled' })
  }

  const quietStart = config?.quiet_hours?.start ?? 21
  const quietEnd = config?.quiet_hours?.end ?? 8
  const steps = (config?.steps || {}) as Record<string, { delay_hours: number; channel: string }>

  // Get ALL requests that are not fully resolved
  // This includes: new, will_call_today past deadline
  const { data: requests } = await (supabase as any)
    .from('contact_requests')
    .select('id, name, phone, note, doctor_id, created_at, acknowledge_token, status, contact_outcome, acknowledged_at, will_call_deadline')
    .in('status', ['new', 'acknowledged'])
    .neq('status', 'withdrawn')

  if (!requests?.length) return NextResponse.json({ processed: 0, dry_run: dryRun })

  const now = Date.now()
  const results: any[] = []

  for (const req of requests) {
    // Skip if fully confirmed
    if (req.contact_outcome === 'patient_contacted_confirmed') {
      await logEval(supabase, req.id, 0, 'skip', 'Already confirmed', dryRun)
      continue
    }

    // Skip if will_call_today and deadline has not passed
    if (req.contact_outcome === 'will_call_today' && req.will_call_deadline) {
      if (new Date(req.will_call_deadline).getTime() > now) {
        await logEval(supabase, req.id, 0, 'skip', 'will_call_today, deadline not passed', dryRun)
        continue
      }
      // Deadline passed — flag it
      await logEval(supabase, req.id, 0, 'flag', 'will_call_today deadline passed, returning to escalation', dryRun)
    }

    // Get doctor info
    const { data: doctor } = await supabase
      .from('doctors')
      .select('first_name, last_name, clinic_name, email, phone, city, state, country')
      .eq('id', req.doctor_id)
      .single()
    if (!doctor) {
      await logEval(supabase, req.id, 0, 'skip', 'Doctor not found', dryRun)
      continue
    }

    // Determine timezone
    const tz = getDoctorTimezone(doctor.state, doctor.country)

    // Check which steps have been sent
    const { data: sentSteps } = await (supabase as any)
      .from('contact_request_escalations')
      .select('step')
      .eq('contact_request_id', req.id)
    const completedSteps = new Set((sentSteps || []).map((s: any) => s.step))

    // Find the next step to send
    let acted = false
    for (const [stepNum, stepConfig] of Object.entries(steps)) {
      const step = parseInt(stepNum)
      if (completedSteps.has(step)) continue
      if (stepConfig.channel !== 'email') continue // Only email in Phase 2

      // Check timing
      const requestAge = (now - new Date(req.created_at).getTime()) / 3600000
      if (requestAge < stepConfig.delay_hours) {
        await logEval(supabase, req.id, step, 'not_due', `Age ${Math.round(requestAge)}h < ${stepConfig.delay_hours}h threshold`, dryRun, tz)
        continue
      }

      // Quiet hours
      if (!tz) {
        await logEval(supabase, req.id, step, 'hold', 'Cannot determine timezone, holding', dryRun, null)
        continue
      }
      if (isQuietHours(tz, quietStart, quietEnd)) {
        await logEval(supabase, req.id, step, 'hold', `Quiet hours in ${tz}`, dryRun, tz)
        continue
      }

      // No doctor email
      if (!doctor.email) {
        await logEval(supabase, req.id, step, 'skip', 'No doctor email', dryRun, tz)
        // Log in escalation table to prevent retries
        if (!dryRun) {
          await (supabase as any).from('contact_request_escalations').insert({
            contact_request_id: req.id, step, channel: 'email',
            skipped: true, skip_reason: 'No doctor email',
          }).catch(() => {})
        }
        continue
      }

      // Build the email
      if (step !== 2) continue // Only step 2 for now

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://neurochiro.co'
      const ackUrl = `${siteUrl}/api/contact-request/acknowledge?token=${req.acknowledge_token}`

      const lastName = doctor.last_name || ''
      const looksLikeBusiness = !lastName || /\b(chiro|clinic|wellness|health|care|center|office)\b/i.test(lastName)
      const greeting = looksLikeBusiness ? '' : `<p>Hi Dr. ${lastName},</p>`

      const subject = `${req.name} is still waiting to hear from your office`
      const body = `
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

      if (dryRun) {
        await logEval(supabase, req.id, step, 'would_send', `To ${doctor.email}, subject: ${subject}`, dryRun, tz)
        results.push({ request: req.id, step, would_send: doctor.email, dry_run: true })
        acted = true
        break
      }

      // Send
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        const sendResult = await resend.emails.send({
          from: 'NeuroChiro <support@neurochirodirectory.com>',
          to: doctor.email,
          subject,
          html: body,
        })

        // Log success with Resend message ID
        await (supabase as any).from('contact_request_escalations').insert({
          contact_request_id: req.id, step, channel: 'email',
          delivered: null, // Unknown until webhook confirms
        })
        await logEval(supabase, req.id, step, 'sent', `To ${doctor.email}, resend_id: ${(sendResult as any)?.data?.id || 'unknown'}`, false, tz)
        results.push({ request: req.id, step, sent: true, to: doctor.email })
      } catch (e: any) {
        await (supabase as any).from('contact_request_escalations').insert({
          contact_request_id: req.id, step, channel: 'email',
          delivered: false, error: e.message?.slice(0, 200),
        }).catch(() => {})
        await logEval(supabase, req.id, step, 'error', e.message?.slice(0, 200), false, tz)
        results.push({ request: req.id, step, error: e.message })
      }

      acted = true
      break // One step per request per run
    }

    if (!acted) {
      // Request was evaluated but no step was actionable
      await logEval(supabase, req.id, 0, 'no_action', 'All steps completed or not due', dryRun)
    }
  }

  return NextResponse.json({ processed: requests.length, results, dry_run: dryRun })
}

async function logEval(
  supabase: any, requestId: string, step: number, action: string,
  reason: string, dryRun: boolean, timezone?: string | null,
) {
  try {
    await supabase.from('escalation_run_log').insert({
      contact_request_id: requestId,
      step,
      action,
      reason,
      doctor_timezone: timezone || null,
      dry_run: dryRun,
    })
  } catch {}
}
