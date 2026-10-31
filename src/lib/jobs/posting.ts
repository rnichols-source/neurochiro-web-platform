import 'server-only';

import { randomBytes } from 'node:crypto';
import { STUDENT_CONFIG } from '@/config/students';
import { getMembership } from '@/lib/portal/membership-load';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase-admin';
import { missingSchema } from '@/lib/students/schema';
import { hashToken } from './hash';
import {
  DESCRIPTION_MAX,
  LIMIT_MESSAGE,
  descriptionOk,
  jobPaymentMetadata,
  oneTimePriceOk,
  postDecision,
  addDays,
} from './posting-pure';

const SITE = () => (process.env.NEXT_PUBLIC_SITE_URL || 'https://neurochiro.co').replace(/\/$/, '');

export async function countActivePosts(doctorUserId: string): Promise<number | null> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { count, error } = await (admin as any)
    .from('job_postings')
    .select('id', { count: 'exact', head: true })
    .eq('doctor_id', doctorUserId)
    .in('status', ['Active', 'open'])
    .or(`expires_at.is.null,expires_at.gt.${now}`);
  if (error) return null;
  return count || 0;
}

export async function canPostFree(doctorUserId: string) {
  const membership = await getMembership(doctorUserId);
  const activeCount = await countActivePosts(doctorUserId);
  if (activeCount == null) {
    return { ok: false as const, reason: 'unavailable' as const, message: 'We could not check your active posts. Try again.' };
  }
  const decision = postDecision({
    tier: membership.tier,
    status: membership.status,
    activeCount,
    limit: STUDENT_CONFIG.jobs.memberActivePostLimit,
  });
  if (!decision.ok && decision.reason === 'limit') {
    return { ...decision, message: LIMIT_MESSAGE };
  }
  return decision;
}

async function guardedPrice(envName: string, expectCents: number) {
  const priceId = process.env[envName];
  if (!priceId) return { error: 'Posting checkout is not ready yet. Email support@neurochirodirectory.com.' as const };
  const price = await stripe.prices.retrieve(priceId);
  if (!oneTimePriceOk(price.unit_amount, expectCents)) {
    console.error('Job price refused', envName);
    return { error: 'Posting checkout is not ready yet. Email support@neurochirodirectory.com.' as const };
  }
  return { priceId };
}

export async function insertMemberPost(input: {
  doctorUserId: string;
  title: string;
  description: string;
  employmentType?: string | null;
  type?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  city?: string | null;
  state?: string | null;
  clinicName?: string | null;
  applyEmail?: string | null;
  whatLookingFor?: string | null;
}) {
  if (!descriptionOk(input.description)) {
    return { error: `Description must be ${DESCRIPTION_MAX} characters or less.` };
  }
  const admin = createAdminClient();
  const expires = addDays(new Date(), STUDENT_CONFIG.jobs.memberPostDays).toISOString();
  const row = {
    doctor_id: input.doctorUserId,
    title: input.title.trim(),
    description: input.description.trim(),
    employment_type: input.employmentType || 'Full-time',
    type: input.type || 'Associate',
    salary_min: input.salaryMin || null,
    salary_max: input.salaryMax || null,
    compensation_min: input.salaryMin || null,
    compensation_max: input.salaryMax || null,
    city: input.city || null,
    state: input.state || null,
    clinic_name: input.clinicName || null,
    apply_email: input.applyEmail || null,
    what_looking_for: input.whatLookingFor || null,
    status: 'Active',
    is_paid: false,
    poster_type: 'member',
    approval_status: 'approved',
    expires_at: expires,
  };
  let inserted = await (admin as any).from('job_postings').insert(row).select('id').single();
  if (inserted.error && missingSchema(inserted.error)) {
    const { compensation_min, compensation_max, clinic_name, poster_type, approval_status, what_looking_for, is_paid, ...base } = row;
    void compensation_min; void compensation_max; void clinic_name; void poster_type; void approval_status; void what_looking_for; void is_paid;
    inserted = await (admin as any).from('job_postings').insert(base).select('id').single();
  }
  if (inserted.error || !inserted.data) {
    console.error('Member job insert failed', inserted.error?.code);
    return { error: 'Failed to create the post.' };
  }
  return { jobId: inserted.data.id as string };
}

export async function createFeaturedCheckout(doctorUserId: string, jobId: string) {
  const membership = await getMembership(doctorUserId);
  const decision = postDecision({ tier: membership.tier, status: membership.status, activeCount: 0, limit: 1 });
  if (!decision.ok && decision.reason === 'not_member') {
    return { error: 'Featured boosts are for members.' };
  }
  const admin = createAdminClient();
  const { data: job } = await (admin as any).from('job_postings').select('id, doctor_id').eq('id', jobId).maybeSingle();
  if (!job || job.doctor_id !== doctorUserId) return { error: 'That post is not yours.' };
  const spec = STUDENT_CONFIG.jobs.featured;
  const price = await guardedPrice(spec.stripePriceEnv, spec.expectCents);
  if ('error' in price) return price;
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: price.priceId, quantity: 1 }],
    success_url: `${SITE()}/doctor/jobs?featured=1`,
    cancel_url: `${SITE()}/doctor/jobs`,
    metadata: jobPaymentMetadata('job_feature', jobId),
  });
  return { checkoutUrl: session.url };
}

export type NonMemberDraft = {
  clinicName: string;
  contactName: string;
  email: string;
  phone?: string;
  city: string;
  state: string;
  title: string;
  description: string;
  type: string;
  payMin?: number | null;
  payMax?: number | null;
  startDate?: string | null;
  techniqueTags?: string[];
  applyMethod?: string | null;
  doctorUserId?: string | null;
};

export async function createNonMemberCheckout(input: NonMemberDraft) {
  if (!descriptionOk(input.description)) {
    return { error: `Description must be ${DESCRIPTION_MAX} characters or less.` };
  }
  if (!input.email.includes('@') || !input.clinicName.trim() || !input.title.trim()) {
    return { error: 'Clinic, email, and title are required.' };
  }
  const spec = STUDENT_CONFIG.jobs.nonMember;
  const price = await guardedPrice(spec.stripePriceEnv, spec.expectCents);
  if ('error' in price) return price;

  const rawToken = randomBytes(32).toString('hex');
  const admin = createAdminClient();
  const row = {
    doctor_id: input.doctorUserId || null,
    title: input.title.trim(),
    description: input.description.trim().slice(0, DESCRIPTION_MAX),
    type: input.type || 'Associate',
    employment_type: input.type || 'Associate',
    salary_min: input.payMin || null,
    salary_max: input.payMax || null,
    compensation_min: input.payMin || null,
    compensation_max: input.payMax || null,
    city: input.city.trim(),
    state: input.state.trim(),
    clinic_name: input.clinicName.trim(),
    poster_name: input.contactName.trim(),
    poster_email: input.email.trim(),
    poster_phone: input.phone?.trim() || null,
    poster_type: 'nonmember',
    approval_status: 'awaiting_payment',
    status: 'Draft',
    is_paid: false,
    start_date: input.startDate || null,
    technique_tags: input.techniqueTags || [],
    apply_method: input.applyMethod || 'neurochiro',
    apply_email: input.email.trim(),
    manage_token_hash: hashToken(rawToken),
  };
  let inserted = await (admin as any).from('job_postings').insert(row).select('id').single();
  if (inserted.error && missingSchema(inserted.error)) {
    return { error: 'Outside posts are not ready yet. Email support@neurochirodirectory.com.' };
  }
  if (inserted.error || !inserted.data) {
    console.error('Non-member job insert failed', inserted.error?.code);
    return { error: 'Failed to save the draft.' };
  }
  const jobId = inserted.data.id as string;
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: price.priceId, quantity: 1 }],
    customer_email: input.email.trim(),
    success_url: `${SITE()}/jobs/post/thanks?token=${rawToken}`,
    cancel_url: `${SITE()}/jobs/post?canceled=1`,
    metadata: jobPaymentMetadata('job_post_nonmember', jobId),
  });
  await (admin as any).from('job_postings').update({ stripe_checkout_session_id: session.id }).eq('id', jobId);
  return { checkoutUrl: session.url, jobId };
}
