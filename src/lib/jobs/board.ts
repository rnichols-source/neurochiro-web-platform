import 'server-only';

import { createAdminClient } from '@/lib/supabase-admin';
import { missingSchema } from '@/lib/students/schema';
import { filterBoard, isPublicJob, type BoardJob } from './posting-pure';

const HIDDEN = new Set([
  'poster_email',
  'manage_token_hash',
  'stripe_checkout_session_id',
  'stripe_payment_intent_id',
  'refund_id',
  'apply_email',
  'poster_phone',
]);

function scrub(row: Record<string, unknown>) {
  const copy: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (!HIDDEN.has(key)) copy[key] = value;
  }
  return copy;
}

export async function loadPublicBoard(filters: { state?: string; type?: string; technique?: string } = {}) {
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await (admin as any)
    .from('job_postings')
    .select('*')
    .in('status', ['Active', 'open'])
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) {
    console.error('Public jobs query failed', error.code);
    return [];
  }
  const now = Date.now();
  const visible = (data || []).filter((row: { status?: string; approval_status?: string | null; expires_at?: string | null }) =>
    isPublicJob(row, now),
  );
  const doctorIds = [...new Set(visible.map((row: { doctor_id?: string | null }) => row.doctor_id).filter(Boolean))] as string[];
  const clinicMap = new Map<string, { clinic_name?: string; city?: string; state?: string; slug?: string }>();
  if (doctorIds.length) {
    const { data: doctors } = await admin.from('doctors').select('user_id, clinic_name, city, state, slug').in('user_id', doctorIds);
    for (const doctor of doctors || []) {
      if (doctor.user_id) clinicMap.set(doctor.user_id, doctor);
    }
  }
  const shaped = visible.map((row: Record<string, unknown> & { doctor_id?: string }) => {
    const doc = row.doctor_id ? clinicMap.get(row.doctor_id) : undefined;
    return {
      ...scrub(row),
      clinic_name: (row.clinic_name as string) || doc?.clinic_name || '',
      clinic_city: doc?.city || '',
      clinic_state: doc?.state || '',
      slug: doc?.slug || '',
    };
  });
  return filterBoard(shaped as BoardJob[], filters, now);
}

export async function loadPublicJob(id: string) {
  const admin = createAdminClient();
  const { data, error } = await (admin as any).from('job_postings').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  if (!isPublicJob(data, Date.now())) return null;
  let doctor: { clinic_name?: string; city?: string; state?: string; slug?: string } | null = null;
  if (data.doctor_id) {
    const { data: row } = await admin.from('doctors').select('clinic_name, city, state, slug').eq('user_id', data.doctor_id).maybeSingle();
    doctor = row;
  }
  return {
    ...scrub(data),
    clinic_name: data.clinic_name || doctor?.clinic_name || '',
    clinic_city: doctor?.city || '',
    clinic_state: doctor?.state || '',
    slug: doctor?.slug || '',
  };
}

export async function recordJobView(jobId: string, hash: string) {
  if (!hash || hash.length < 32) return;
  const admin = createAdminClient();
  const { error } = await (admin as any).rpc('record_job_view', { job: jobId, viewer: hash });
  if (error && !missingSchema(error)) {
    console.error('record_job_view failed', error.code);
  }
}
