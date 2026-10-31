'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { checkAdminAuth } from '@/lib/admin-auth'
import { stripe } from '@/lib/stripe'
import { STUDENT_CONFIG } from '@/config/students'
import { planApprove, planReject, escapeHtml, MEMBER_UPSELL } from '@/lib/jobs/posting-pure'
import { Resend } from 'resend'

export async function getAdminJobPostings() {
  await checkAdminAuth();
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('job_postings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error("Error fetching admin job postings:", error)
    return []
  }

  // Fetch doctor names for each job
  if (data && data.length > 0) {
    const doctorIds = [...new Set(data.map(j => j.doctor_id).filter(Boolean))]
    const { data: doctors } = await supabase
      .from('doctors')
      .select('user_id, first_name, last_name, clinic_name')
      .in('user_id', doctorIds)

    const doctorMap = new Map((doctors || []).map(d => [d.user_id, d]))

    return data.map(j => ({
      ...j,
      doctor: doctorMap.get(j.doctor_id) || null
    }))
  }

  return data || []
}

export async function updateJobStatus(jobId: string, status: string) {
  await checkAdminAuth();
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('job_postings')
    .update({ status })
    .eq('id', jobId)

  if (error) throw new Error(error.message)
  return { success: true }
}

export async function deleteJobPosting(jobId: string) {
  await checkAdminAuth();
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('job_postings')
    .delete()
    .eq('id', jobId)

  if (error) throw new Error(error.message)
  return { success: true }
}

async function emailPoster(to: string | null | undefined, subject: string, html: string) {
  if (!to) return
  try {
    const resend = new Resend(process.env.RESEND_API_KEY || '')
    await resend.emails.send({
      from: 'NeuroChiro <support@neurochirodirectory.com>',
      to: [to],
      subject,
      html,
    })
  } catch {
    console.error('[JOBS] Admin email failed')
  }
}

export async function approveJobPost(jobId: string) {
  const adminUser = await checkAdminAuth()
  const supabase = createAdminClient() as any
  const { data: job } = await supabase.from('job_postings').select('id, approval_status, poster_email, title').eq('id', jobId).maybeSingle()
  if (!job) return { error: 'Post not found.' }
  const plan = planApprove(job.approval_status, new Date(), STUDENT_CONFIG.jobs.nonMember.days)
  if (!plan.ok) return { error: 'Only a paid post waiting for review can be approved.' }
  const { error } = await supabase.from('job_postings').update({
    approval_status: 'approved',
    status: 'Active',
    expires_at: plan.expires_at,
    approved_at: new Date().toISOString(),
    approved_by: adminUser.id,
  }).eq('id', jobId)
  if (error) return { error: 'Could not approve the post.' }
  await emailPoster(
    job.poster_email,
    'Your associateship is live',
    `<p>${escapeHtml(job.title || 'Your post')} is live for ${STUDENT_CONFIG.jobs.nonMember.days} days.</p><p>${MEMBER_UPSELL}</p>`,
  )
  return { success: true }
}

export async function rejectJobPost(jobId: string, reason: string) {
  await checkAdminAuth()
  const note = reason.trim()
  if (!note) return { error: 'A reason is required.' }
  const supabase = createAdminClient() as any
  const { data: job } = await supabase.from('job_postings').select('id, approval_status, poster_email, title, stripe_payment_intent_id, refund_id').eq('id', jobId).maybeSingle()
  if (!job) return { error: 'Post not found.' }
  const plan = planReject({
    approvalStatus: job.approval_status,
    refundOnReject: STUDENT_CONFIG.jobs.refundOnReject,
    refundId: job.refund_id,
    paymentIntent: job.stripe_payment_intent_id,
  })
  if (!plan.ok) return { error: 'Only a post waiting for review can be rejected.' }
  let refundId = job.refund_id as string | null
  if (plan.refund && job.stripe_payment_intent_id) {
    const refund = await stripe.refunds.create({ payment_intent: job.stripe_payment_intent_id })
    refundId = refund.id
  }
  const { error } = await supabase.from('job_postings').update({
    approval_status: 'rejected',
    status: 'Rejected',
    rejected_reason: note,
    refund_id: refundId,
  }).eq('id', jobId)
  if (error) return { error: 'Could not reject the post.' }
  await emailPoster(
    job.poster_email,
    'Your associateship was not approved',
    `<p>${escapeHtml(job.title || 'Your post')} was not approved.</p><p>${escapeHtml(note)}</p>${refundId ? '<p>The payment was refunded.</p>' : ''}`,
  )
  return { success: true }
}
