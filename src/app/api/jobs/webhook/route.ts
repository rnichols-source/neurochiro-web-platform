import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

/**
 * POST /api/jobs/webhook
 * Stripe webhook for job posting payments.
 * Source of truth for activating posts after payment.
 */
export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_JOB_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || '')
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const metadata = session.metadata || {}

    if (metadata.type !== 'job_posting') {
      return NextResponse.json({ received: true }) // Not a job posting payment
    }

    const jobId = metadata.job_posting_id
    if (!jobId) {
      console.error('Job webhook: missing job_posting_id in metadata')
      return NextResponse.json({ error: 'Missing job ID' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Activate the job posting
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

    const { error } = await (supabase as any).from('job_postings').update({
      status: 'Active',
      is_paid: true,
      stripe_payment_id: session.payment_intent as string || session.id,
      paid_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    }).eq('id', jobId)

    if (error) {
      console.error('Job webhook: failed to activate post:', error)
      // Flag it so admin catches it
      await (supabase as any).from('automation_queue').insert({
        event_type: 'job_payment_orphan',
        payload: {
          jobId,
          stripeSessionId: session.id,
          paymentIntent: session.payment_intent,
          error: error.message,
        },
      })
      return NextResponse.json({ error: 'Failed to activate' }, { status: 500 })
    }

    console.log(`Job ${jobId} activated via webhook. Expires ${expiresAt.toISOString()}`)

    // Send confirmation email to the doctor
    try {
      const { data: job } = await (supabase as any).from('job_postings').select('title, doctor_id, apply_email').eq('id', jobId).single()
      if (job?.apply_email) {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'NeuroChiro <support@neurochirodirectory.com>',
          to: job.apply_email,
          subject: `Your job posting is live — "${job.title}"`,
          html: `
            <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 480px; margin: 0 auto; color: #1E2D3B;">
              <p>Your job posting <strong>"${job.title}"</strong> is now live on the NeuroChiro job board.</p>
              <p>It will run for 30 days (until ${expiresAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}). You'll receive a renewal reminder at day 25.</p>
              <p>Applications will be delivered to this email address and to your NeuroChiro dashboard.</p>
              <p style="margin: 24px 0;">
                <a href="https://neurochiro.co/doctor/jobs" style="display: inline-block; padding: 14px 28px; background: #D66829; color: white; text-decoration: none; border-radius: 10px; font-weight: 700;">View Your Posting</a>
              </p>
              <p style="color: #999; font-size: 13px;">NeuroChiro Job Board</p>
            </div>
          `,
        })
      }
    } catch (emailErr) {
      console.warn('Job confirmation email failed (non-blocking):', emailErr)
    }
  }

  return NextResponse.json({ received: true })
}
