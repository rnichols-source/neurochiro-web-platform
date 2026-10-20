import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { Resend } from 'resend'
import { wrapEmail } from '@/lib/email-template'

export const maxDuration = 120

const FROM = 'Dr. Ray <support@neurochirodirectory.com>'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || '')
}

/**
 * REFERRAL REMINDERS + EXPIRY CRON
 *
 * Runs every hour (or as configured). For each pending referral:
 * - 24h+ and no reminder sent: send reminder email to receiving doctor
 * - 48h+ (or past expires_at): expire the referral, notify referring doctor
 *
 * Kill switch: REFERRAL_CRONS_ENABLED must be 'true'
 * Dry run: REFERRAL_CRON_DRY_RUN = 'true' to log without sending
 */
export async function GET(req: Request) {
  // Auth
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Kill switch
  if (process.env.REFERRAL_CRONS_ENABLED !== 'true') {
    console.log('[REFERRAL CRON] Referral crons disabled (REFERRAL_CRONS_ENABLED != true)')
    return NextResponse.json({ success: true, message: 'Referral crons disabled' })
  }

  const dryRun = process.env.REFERRAL_CRON_DRY_RUN === 'true'
  if (dryRun) console.log('[REFERRAL CRON] Running in DRY RUN mode')

  const admin = createAdminClient()
  const resend = getResend()
  const now = new Date()
  const twentyFourAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

  // Fetch all pending referrals with joined doctor info
  const { data: pendingReferrals, error } = await (admin as any)
    .from('doctor_referrals')
    .select(`
      id, created_at, expires_at, reminder_sent_at, patient_first_name, patient_last_initial, urgency,
      referring_doctor:referring_doctor_id(id, user_id, first_name, last_name),
      receiving_doctor:receiving_doctor_id(id, user_id, first_name, last_name)
    `)
    .eq('status', 'pending')
    .limit(500) // intentional bound

  if (error) {
    console.error('[REFERRAL CRON] Fetch error:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  if (!pendingReferrals || pendingReferrals.length === 0) {
    console.log('[REFERRAL CRON] No pending referrals found')
    return NextResponse.json({ success: true, message: 'No pending referrals', processed: 0 })
  }

  let reminders = 0
  let expired = 0
  let noAction = 0

  for (const ref of pendingReferrals) {
    const createdAt = new Date(ref.created_at)
    const expiresAt = ref.expires_at ? new Date(ref.expires_at) : new Date(createdAt.getTime() + 48 * 60 * 60 * 1000)
    const ageMs = now.getTime() - createdAt.getTime()
    const ageHours = ageMs / (1000 * 60 * 60)

    // Check if expired (past expires_at or 48h)
    if (now >= expiresAt) {
      console.log(`[REFERRAL CRON] Evaluated referral ${ref.id}: EXPIRING (${ageHours.toFixed(1)}h old, expires_at passed)`)

      if (!dryRun) {
        // Mark expired
        await (admin as any)
          .from('doctor_referrals')
          .update({ status: 'expired' })
          .eq('id', ref.id)

        // Get referring doctor's email
        const { data: referrerProfile } = await (admin as any)
          .from('profiles')
          .select('email')
          .eq('id', ref.referring_doctor?.user_id)
          .single()

        if (referrerProfile?.email) {
          try {
            const receiverName = `Dr. ${ref.receiving_doctor?.first_name || ''} ${ref.receiving_doctor?.last_name || ''}`.trim()
            await resend.emails.send({
              from: FROM,
              to: referrerProfile.email,
              subject: `Referral Expired: ${ref.patient_first_name} ${ref.patient_last_initial}.`,
              html: wrapEmail(`
                <h1>Referral Expired</h1>
                <p>Your referral for <strong>${ref.patient_first_name} ${ref.patient_last_initial}.</strong> to <strong>${receiverName}</strong> was not responded to within 48 hours and has expired.</p>
                <p>You can search for another doctor in that area to re-refer this patient.</p>
                <div style="text-align:center;margin-top:30px;">
                  <a href="https://neurochiro.co/doctor/referral-network" style="display:inline-block;background-color:#D66829;color:#FFFFFF;padding:16px 32px;text-decoration:none;border-radius:12px;font-weight:900;font-size:14px;letter-spacing:1px;text-transform:uppercase;">Find Another Doctor</a>
                </div>
              `),
            })
          } catch (e) {
            console.error(`[REFERRAL CRON] Error sending expiry email for ${ref.id}:`, e)
          }
        }

        // Notification for referring doctor
        try {
          await (admin as any).from('notifications').insert({
            user_id: ref.referring_doctor?.user_id,
            title: 'Referral Expired',
            body: `Your referral for ${ref.patient_first_name} ${ref.patient_last_initial}. was not responded to in time.`,
            type: 'referral',
            link: '/doctor/referral-network?tab=sent',
            priority: 'info',
          })
        } catch {
          // non-critical
        }
      }

      expired++
      continue
    }

    // Check if due for 24h reminder
    if (ageHours >= 24 && !ref.reminder_sent_at) {
      console.log(`[REFERRAL CRON] Evaluated referral ${ref.id}: SENDING REMINDER (${ageHours.toFixed(1)}h old, no reminder sent yet)`)

      if (!dryRun) {
        // Get receiving doctor's email
        const { data: receiverProfile } = await (admin as any)
          .from('profiles')
          .select('email')
          .eq('id', ref.receiving_doctor?.user_id)
          .single()

        if (receiverProfile?.email) {
          try {
            const referrerName = `Dr. ${ref.referring_doctor?.first_name || ''} ${ref.referring_doctor?.last_name || ''}`.trim()
            const urgencyNote = ref.urgency === 'urgent' ? ' <span style="color:#ef4444;font-weight:900;">(URGENT)</span>' : ''

            await resend.emails.send({
              from: FROM,
              to: receiverProfile.email,
              subject: `Reminder: Pending Referral from ${referrerName}`,
              html: wrapEmail(`
                <h1>You Have a Pending Referral</h1>
                <p><strong>${referrerName}</strong> referred a patient to you 24 hours ago.${urgencyNote}</p>
                <p><strong>Patient:</strong> ${ref.patient_first_name} ${ref.patient_last_initial}.</p>
                <p>This referral will expire in 24 hours if not accepted or declined.</p>
                <div style="text-align:center;margin-top:30px;">
                  <a href="https://neurochiro.co/doctor/referral-network?tab=received" style="display:inline-block;background-color:#D66829;color:#FFFFFF;padding:16px 32px;text-decoration:none;border-radius:12px;font-weight:900;font-size:14px;letter-spacing:1px;text-transform:uppercase;">View Referral</a>
                </div>
              `),
            })
          } catch (e) {
            console.error(`[REFERRAL CRON] Error sending reminder for ${ref.id}:`, e)
          }
        }

        // Update reminder_sent_at
        await (admin as any)
          .from('doctor_referrals')
          .update({ reminder_sent_at: now.toISOString() })
          .eq('id', ref.id)
      }

      reminders++
      continue
    }

    // Not yet due
    if (ref.reminder_sent_at) {
      console.log(`[REFERRAL CRON] Evaluated referral ${ref.id}: already reminded (${ageHours.toFixed(1)}h old)`)
    } else {
      console.log(`[REFERRAL CRON] Evaluated referral ${ref.id}: not yet due for reminder (${ageHours.toFixed(1)}h old, threshold 24h)`)
    }
    noAction++
  }

  const summary = `Processed ${pendingReferrals.length} referrals: ${reminders} reminders sent, ${expired} expired, ${noAction} no action${dryRun ? ' (DRY RUN)' : ''}`
  console.log(`[REFERRAL CRON] ${summary}`)

  return NextResponse.json({
    success: true,
    message: summary,
    processed: pendingReferrals.length,
    reminders,
    expired,
    noAction,
    dryRun,
  })
}
