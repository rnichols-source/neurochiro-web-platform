import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { escapeHtml, expiryReminderVerb, EXPIRY_REMINDER_DAYS } from '@/lib/jobs/posting-pure'
import { missingSchema } from '@/lib/students/schema'

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

  await (supabase as any)
    .from('job_postings')
    .update({ featured_until: null })
    .lt('featured_until', now.toISOString())
    .then((result: { error?: { code?: string; message?: string } }) => {
      if (result.error && !missingSchema(result.error)) console.error('Featured expiry failed', result.error.code)
    })

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
              <p>Your job posting <strong>"${escapeHtml(post.title || 'Associateship')}"</strong> has expired.</p>
              <p>Applications already received stay in your dashboard. Members can post again from the hiring page. Outside clinics can post again at neurochiro.co/jobs/post.</p>
              <p style="margin: 24px 0;">
                <a href="https://neurochiro.co/doctor/jobs" style="display: inline-block; padding: 14px 28px; background: #D66829; color: white; text-decoration: none; border-radius: 10px; font-weight: 700;">Post Again</a>
              </p>
            </div>
          `,
        })
      }
    } catch {}
  }

  // 7 days before expiry. Renew for outside posts, Extend for members.
  const reminderHorizon = new Date(now.getTime() + EXPIRY_REMINDER_DAYS * 24 * 60 * 60 * 1000)
  let soon = await (supabase as any)
    .from('job_postings')
    .select('id, title, doctor_id, apply_email, expires_at, poster_type, poster_email')
    .eq('status', 'Active')
    .eq('renewal_reminded', false)
    .not('expires_at', 'is', null)
    .lte('expires_at', reminderHorizon.toISOString())
    .gt('expires_at', now.toISOString())
  if (soon.error && missingSchema(soon.error)) {
    soon = await (supabase as any)
      .from('job_postings')
      .select('id, title, doctor_id, apply_email, expires_at')
      .eq('status', 'Active')
      .eq('renewal_reminded', false)
      .not('expires_at', 'is', null)
      .lte('expires_at', reminderHorizon.toISOString())
      .gt('expires_at', now.toISOString())
  }
  const soonExpiring = soon.error ? [] : (soon.data || [])

  for (const post of soonExpiring) {
    const expiresDate = new Date(post.expires_at)
    const daysLeft = Math.ceil((expiresDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

    await (supabase as any).from('job_postings')
      .update({ renewal_reminded: true })
      .eq('id', post.id)
    reminded++

    try {
      const to = post.poster_email || post.apply_email
      const verb = expiryReminderVerb(post.poster_type)
      if (to) {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'NeuroChiro Jobs <support@neurochirodirectory.com>',
          to,
          subject: `${verb} your associateship — "${post.title}"`,
          html: `
            <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 480px; margin: 0 auto; color: #1E2D3B;">
              <p>Your job posting <strong>"${escapeHtml(post.title || 'Associateship')}"</strong> expires in <strong>${daysLeft} days</strong> (${expiresDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}).</p>
              <p>${verb === 'Renew' ? 'Renew the post from your manage link or post again.' : 'Extend it from your hiring page.'}</p>
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
