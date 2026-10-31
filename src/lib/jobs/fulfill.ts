import 'server-only';

import { Resend } from 'resend';
import { STUDENT_CONFIG } from '@/config/students';
import { missingSchema } from '@/lib/students/schema';
import {
  MEMBER_UPSELL,
  MEMBER_UPSELL_PATH,
  escapeHtml,
  planFeatureUpdate,
  planNonMemberPaid,
} from './posting-pure';

type SessionLike = {
  id: string;
  metadata?: { type?: string; job_id?: string } | null;
  payment_intent?: string | { id?: string } | null;
  payment_status?: string | null;
};

function paymentIntentId(session: SessionLike): string | null {
  const pi = session.payment_intent;
  if (typeof pi === 'string') return pi;
  return pi?.id || null;
}

async function notify(title: string, html: string, to: string | null | undefined) {
  if (!to) return;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY || '');
    await resend.emails.send({
      from: 'NeuroChiro <support@neurochirodirectory.com>',
      to: [to],
      subject: title,
      html,
    });
  } catch {
    console.error('[JOBS] Poster email failed');
  }
}

async function alertStaff(text: string, admin: any) {
  const discordUrl = process.env.DISCORD_WEBHOOK_URL;
  if (discordUrl) {
    await fetch(discordUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text }),
    }).catch(() => {});
  }
  const { data: admins } = await admin.from('profiles').select('id').in('role', ['admin', 'founder', 'super_admin']).limit(20);
  for (const person of admins || []) {
    await admin.from('notifications').insert({
      user_id: person.id,
      title: 'Job post to review',
      body: text,
      type: 'job',
      link: '/admin/jobs',
    }).then(() => {}).catch(() => {});
  }
}

export async function fulfillJobCheckout(admin: any, session: SessionLike): Promise<'feature' | 'nonmember' | 'skip'> {
  const type = session.metadata?.type;
  const jobId = session.metadata?.job_id;
  if (!jobId || (type !== 'job_feature' && type !== 'job_post_nonmember')) return 'skip';
  if (session.payment_status && session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
    return 'skip';
  }

  const { data: job, error } = await admin
    .from('job_postings')
    .select('id, title, clinic_name, poster_email, stripe_checkout_session_id, featured_until, approval_status')
    .eq('id', jobId)
    .maybeSingle();
  if (error && missingSchema(error)) {
    console.error('[JOBS] Fulfill skipped, columns missing');
    return 'skip';
  }
  if (!job) return 'skip';

  if (type === 'job_feature') {
    const plan = planFeatureUpdate(
      { stripe_checkout_session_id: job.stripe_checkout_session_id, featured_until: job.featured_until },
      session.id,
      new Date(),
      STUDENT_CONFIG.jobs.featured.days,
    );
    if (!plan.apply) return 'skip';
    const { error: updateError } = await admin.from('job_postings').update({
      featured_until: plan.featured_until,
      stripe_checkout_session_id: plan.stripe_checkout_session_id,
    }).eq('id', jobId);
    if (updateError) {
      console.error('[JOBS] Feature update failed', updateError.code);
      return 'skip';
    }
    return 'feature';
  }

  const plan = planNonMemberPaid(
    { stripe_checkout_session_id: job.stripe_checkout_session_id, approval_status: job.approval_status },
    session.id,
  );
  if (!plan.apply) return 'skip';
  const { error: updateError } = await admin.from('job_postings').update({
    approval_status: plan.approval_status,
    is_paid: true,
    stripe_checkout_session_id: plan.stripe_checkout_session_id,
    stripe_payment_intent_id: paymentIntentId(session),
  }).eq('id', jobId);
  if (updateError) {
    console.error('[JOBS] Non-member update failed', updateError.code);
    return 'skip';
  }

  const clinic = escapeHtml(job.clinic_name || 'Your clinic');
  const upsell = `${MEMBER_UPSELL.replace(' →', '')} <a href="https://neurochiro.co${MEMBER_UPSELL_PATH}">Join NeuroChiro</a>.`;
  await notify(
    'Paid. We review posts within 1 business day.',
    `<p>Paid. We review posts within 1 business day.</p><p>${clinic}</p><p>${upsell}</p>`,
    job.poster_email,
  );
  await alertStaff(`Job post paid and waiting for review: ${job.clinic_name || 'Clinic'} — ${job.title || 'Associateship'}`, admin);
  return 'nonmember';
}
