import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

/**
 * Cron: Expire job postings past their expires_at date.
 * Send renewal reminders at day 25.
 * Schedule: daily at 6am UTC
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()
  let expired = 0
  let reminded = 0

  // 1. Expire active posts past their expires_at
  const { data: expiredPosts } = await (supabase as any)
    .from('job_postings')
    .select('id, title, doctor_id, apply_email')
    .eq('status', 'Active')
    .not('expires_at', 'is', null)
    .lt('expires_at', now.toISOString())

  for (const post of (expiredPosts || [])) {
    await (supabase as any).from('job_postings')
      .update({ status: 'Expired' })
      .eq('id', post.id)
    expired++

    // Email the doctor
    try {
      if (post.apply_email) {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'NeuroChiro Jobs <support@neurochirodirectory.com>',
          to: post.apply_email,
          subject: `Your job posting has expired — "${post.title}"`,
          html: `
            <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 480px; margin: 0 auto; color: #1E2D3B;">
              <p>Your job posting <strong>"${post.title}"</strong> has expired after 30 days.</p>
              <p>Your existing applications are still accessible in your dashboard. To relist the position, post again for $99.</p>
              <p style="margin: 24px 0;">
                <a href="https://neurochiro.co/doctor/jobs" style="display: inline-block; padding: 14px 28px; background: #D66829; color: white; text-decoration: none; border-radius: 10px; font-weight: 700;">Post Again</a>
              </p>
            </div>
          `,
        })
      }
    } catch {}
  }

  // 2. Send renewal reminders at day 25 (5 days before expiry)
  const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
  const { data: soonExpiring } = await (supabase as any)
    .from('job_postings')
    .select('id, title, doctor_id, apply_email, expires_at')
    .eq('status', 'Active')
    .eq('renewal_reminded', false)
    .not('expires_at', 'is', null)
    .lte('expires_at', fiveDaysFromNow.toISOString())
    .gt('expires_at', now.toISOString())

  for (const post of (soonExpiring || [])) {
    const expiresDate = new Date(post.expires_at)
    const daysLeft = Math.ceil((expiresDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

    await (supabase as any).from('job_postings')
      .update({ renewal_reminded: true })
      .eq('id', post.id)
    reminded++

    try {
      if (post.apply_email) {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'NeuroChiro Jobs <support@neurochirodirectory.com>',
          to: post.apply_email,
          subject: `Your job posting expires in ${daysLeft} days — "${post.title}"`,
          html: `
            <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 480px; margin: 0 auto; color: #1E2D3B;">
              <p>Your job posting <strong>"${post.title}"</strong> expires in <strong>${daysLeft} days</strong> (${expiresDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}).</p>
              <p>If you're still hiring, you can renew for another 30 days ($99) from your dashboard.</p>
              <p style="margin: 24px 0;">
                <a href="https://neurochiro.co/doctor/jobs" style="display: inline-block; padding: 14px 28px; background: #D66829; color: white; text-decoration: none; border-radius: 10px; font-weight: 700;">Renew Your Posting</a>
              </p>
            </div>
          `,
        })
      }
    } catch {}
  }

  return NextResponse.json({
    expired,
    reminded,
    timestamp: now.toISOString(),
  })
}
