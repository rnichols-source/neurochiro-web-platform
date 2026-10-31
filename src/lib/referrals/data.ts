import 'server-only';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase-admin';
import { createServerSupabase } from '@/lib/supabase-server';
import {
  acceptedToReferrerEmail,
  bookedThankYouEmail,
  declinedToReferrerEmail,
  patientIntroEmail,
  REFERRAL_FROM,
  reminderEmail,
  sentToReceiverEmail,
} from '@/lib/referrals/emails';
import {
  canSeePatientContact,
  patientLabel,
  planReminders,
  shouldSendPatientIntro,
  type ReminderKind,
} from '@/lib/referrals/pure';
import { searchReferableDoctors, type ReferableDoctor, type ReferralSearchResult } from '@/lib/referrals/search';

const BASE_COLUMNS = 'id, referring_doctor_id, receiving_doctor_id, patient_first_name, patient_last_initial, patient_phone, patient_email, patient_city, patient_zip, reason, urgency, consent_confirmed, status, decline_reason, created_at, responded_at, expires_at';
const V2_COLUMNS = `${BASE_COLUMNS}, viewed_at, contacted_at, scheduled_at, scheduled_for, cancelled_at, thank_you_note, patient_intro_sent_at, receiver_reminder_1_at, receiver_reminder_2_at, referrer_nudge_at`;

export type ReferralRow = {
  id: string;
  referring_doctor_id: string;
  receiving_doctor_id: string;
  patient_first_name: string;
  patient_last_initial: string;
  patient_phone: string | null;
  patient_email: string | null;
  patient_city: string | null;
  patient_zip: string | null;
  reason: string;
  urgency: string;
  consent_confirmed: boolean;
  status: string;
  decline_reason: string | null;
  created_at: string;
  responded_at: string | null;
  expires_at: string | null;
  viewed_at?: string | null;
  contacted_at?: string | null;
  scheduled_at?: string | null;
  scheduled_for?: string | null;
  cancelled_at?: string | null;
  thank_you_note?: string | null;
  patient_intro_sent_at?: string | null;
  receiver_reminder_1_at?: string | null;
  receiver_reminder_2_at?: string | null;
  referrer_nudge_at?: string | null;
  other_name?: string;
  other_id?: string;
};

type Me = {
  userId: string;
  doctorId: string;
  firstName: string;
  lastName: string;
  clinicName: string | null;
  phone: string | null;
  address: string | null;
  bookingUrl: string | null;
  slug: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
};

let v2Cache: { at: number; value: boolean } | null = null;

export async function referralsV2(admin = createAdminClient() as any): Promise<boolean> {
  if (v2Cache && Date.now() - v2Cache.at < 30_000) return v2Cache.value;
  const { error } = await admin.from('doctor_referrals').select('viewed_at').limit(1);
  const value = !error;
  v2Cache = { at: Date.now(), value };
  return value;
}

async function currentDoctor(): Promise<Me | null> {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient() as any;
  const { data } = await admin
    .from('doctors')
    .select('id, first_name, last_name, clinic_name, phone, address, booking_url, slug, city, state, country')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!data) return null;
  return {
    userId: user.id,
    doctorId: data.id,
    firstName: data.first_name || '',
    lastName: data.last_name || '',
    clinicName: data.clinic_name || null,
    phone: data.phone || null,
    address: data.address || null,
    bookingUrl: data.booking_url || null,
    slug: data.slug || null,
    city: data.city || null,
    state: data.state || null,
    country: data.country || 'US',
  };
}

function resend() {
  return new Resend(process.env.RESEND_API_KEY || '');
}

async function emailForUser(admin: any, userId: string | null): Promise<string | null> {
  if (!userId) return null;
  const { data } = await admin.from('profiles').select('email').eq('id', userId).maybeSingle();
  return data?.email || null;
}

async function sendOnce(admin: any, referralId: string, kind: string, v2: boolean, to: string | null, build: () => { subject: string; html: string }) {
  if (!to || !process.env.RESEND_API_KEY) return false;
  let claimed = false;
  if (v2) {
    const inserted = await admin.from('referral_emails').insert({ referral_id: referralId, kind });
    if (inserted.error) {
      if (inserted.error.code === '23505') return false;
      if (!/does not exist|schema cache|referral_emails/i.test(inserted.error.message || '')) {
        console.error('[referrals] email log failed', inserted.error.code || 'unknown');
      }
    } else {
      claimed = true;
    }
  }
  try {
    const mail = build();
    const sent = await resend().emails.send({ from: REFERRAL_FROM, to, subject: mail.subject, html: mail.html });
    const providerId = (sent as { data?: { id?: string } }).data?.id;
    if (claimed && providerId) {
      await admin.from('referral_emails').update({ provider_id: providerId }).eq('referral_id', referralId).eq('kind', kind);
    }
    return true;
  } catch {
    if (claimed) await admin.from('referral_emails').delete().eq('referral_id', referralId).eq('kind', kind);
    console.error('[referrals] email send failed', kind);
    return false;
  }
}

async function namesFor(admin: any, ids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!ids.length) return map;
  const { data } = await admin.from('doctors').select('id, first_name, last_name').in('id', ids);
  for (const row of data || []) {
    map.set(row.id, `Dr. ${row.first_name || ''} ${row.last_name || ''}`.trim());
  }
  return map;
}

function decorate(row: ReferralRow, me: Me, names: Map<string, string>): ReferralRow {
  const otherId = row.referring_doctor_id === me.doctorId ? row.receiving_doctor_id : row.referring_doctor_id;
  return { ...row, other_id: otherId, other_name: names.get(otherId) || 'Doctor' };
}

export async function listMyReferrals(): Promise<{ sent: ReferralRow[]; received: ReferralRow[]; v2: boolean } | null> {
  const me = await currentDoctor();
  if (!me) return null;
  const admin = createAdminClient() as any;
  const v2 = await referralsV2(admin);
  const supabase = createServerSupabase() as any;
  const columns = v2 ? V2_COLUMNS : BASE_COLUMNS;
  const [sentRes, receivedRes] = await Promise.all([
    supabase.from('doctor_referrals_safe').select(columns).eq('referring_doctor_id', me.doctorId).order('created_at', { ascending: false }).limit(100),
    supabase.from('doctor_referrals_safe').select(columns).eq('receiving_doctor_id', me.doctorId).order('created_at', { ascending: false }).limit(100),
  ]);
  if (sentRes.error || receivedRes.error) {
    console.error('[referrals] list failed');
    return { sent: [], received: [], v2 };
  }
  const rows = [...(sentRes.data || []), ...(receivedRes.data || [])] as ReferralRow[];
  const ids = [...new Set(rows.flatMap((row) => [row.referring_doctor_id, row.receiving_doctor_id]))];
  const names = await namesFor(admin, ids);
  return {
    sent: (sentRes.data || []).map((row: ReferralRow) => decorate(row, me, names)),
    received: (receivedRes.data || []).map((row: ReferralRow) => decorate(row, me, names)),
    v2,
  };
}

export async function getReferral(id: string): Promise<{ row: ReferralRow; v2: boolean; viewerDoctorId: string } | null> {
  const me = await currentDoctor();
  if (!me) return null;
  const admin = createAdminClient() as any;
  const v2 = await referralsV2(admin);
  const supabase = createServerSupabase() as any;
  const { data, error } = await supabase.from('doctor_referrals_safe').select(v2 ? V2_COLUMNS : BASE_COLUMNS).eq('id', id).maybeSingle();
  if (error || !data) return null;
  const names = await namesFor(admin, [data.referring_doctor_id, data.receiving_doctor_id]);
  return { row: decorate(data as ReferralRow, me, names), v2, viewerDoctorId: me.doctorId };
}

export async function markViewed(id: string): Promise<void> {
  const me = await currentDoctor();
  if (!me) return;
  const admin = createAdminClient() as any;
  if (!(await referralsV2(admin))) return;
  const supabase = createServerSupabase() as any;
  await supabase
    .from('doctor_referrals')
    .update({ status: 'viewed', viewed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('receiving_doctor_id', me.doctorId)
    .in('status', ['sent', 'pending']);
}

export async function searchForCurrentDoctor(input: {
  query: string;
  specialty?: string | null;
  acceptingOnly?: boolean;
  place?: { city: string; state: string; lat: number; lng: number } | null;
}): Promise<ReferralSearchResult | null> {
  const me = await currentDoctor();
  if (!me) return null;
  return searchReferableDoctors({
    query: input.query,
    country: me.country || 'US',
    selfDoctorId: me.doctorId,
    specialty: input.specialty,
    acceptingOnly: input.acceptingOnly,
    place: input.place,
  });
}

export async function loadDoctorCard(doctorId: string): Promise<ReferableDoctor | null> {
  const me = await currentDoctor();
  if (!me || !doctorId) return null;
  const admin = createAdminClient() as any;
  const { data } = await admin.from('doctors').select('id, user_id, first_name, last_name, clinic_name, city, state, country, slug, photo_url, specialties, accepting_new_patients').eq('id', doctorId).maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    userId: data.user_id,
    firstName: data.first_name || '',
    lastName: data.last_name || '',
    clinicName: data.clinic_name,
    city: data.city,
    state: data.state,
    country: data.country,
    slug: data.slug,
    photoUrl: data.photo_url,
    specialties: data.specialties || [],
    distanceMiles: null,
    acceptingNewPatients: Boolean(data.accepting_new_patients),
  };
}

export async function doctorIdForUser(userId: string): Promise<string | null> {
  const me = await currentDoctor();
  if (!me || !userId) return null;
  const admin = createAdminClient() as any;
  const { data } = await admin.from('doctors').select('id').eq('user_id', userId).maybeSingle();
  return data?.id || null;
}

export async function listShortcuts(): Promise<{ recent: ReferableDoctor[]; favoriteIds: string[]; v2: boolean }> {
  const me = await currentDoctor();
  if (!me) return { recent: [], favoriteIds: [], v2: false };
  const admin = createAdminClient() as any;
  const v2 = await referralsV2(admin);
  const supabase = createServerSupabase() as any;
  const { data: sent } = await supabase
    .from('doctor_referrals_safe')
    .select('receiving_doctor_id, created_at')
    .eq('referring_doctor_id', me.doctorId)
    .order('created_at', { ascending: false })
    .limit(30);
  const recentIds: string[] = [];
  for (const row of sent || []) {
    if (!recentIds.includes(row.receiving_doctor_id)) recentIds.push(row.receiving_doctor_id);
    if (recentIds.length === 5) break;
  }
  let favoriteIds: string[] = [];
  if (v2) {
    const fav = await supabase.from('doctor_favorites').select('favorite_doctor_id').eq('doctor_id', me.doctorId);
    if (!fav.error) favoriteIds = (fav.data || []).map((row: { favorite_doctor_id: string }) => row.favorite_doctor_id);
  }
  const ids = [...new Set([...recentIds, ...favoriteIds])];
  if (!ids.length) return { recent: [], favoriteIds, v2 };
  const { data } = await admin.from('doctors').select('id, user_id, first_name, last_name, clinic_name, city, state, country, slug, photo_url, specialties, accepting_new_patients').in('id', ids);
  const byId = new Map<string, ReferableDoctor>();
  for (const row of data || []) {
    byId.set(row.id, {
      id: row.id,
      userId: row.user_id,
      firstName: row.first_name || '',
      lastName: row.last_name || '',
      clinicName: row.clinic_name,
      city: row.city,
      state: row.state,
      country: row.country,
      slug: row.slug,
      photoUrl: row.photo_url,
      specialties: row.specialties || [],
      distanceMiles: null,
      acceptingNewPatients: Boolean(row.accepting_new_patients),
    });
  }
  return { recent: recentIds.map((id) => byId.get(id)).filter(Boolean) as ReferableDoctor[], favoriteIds, v2 };
}

export async function toggleFavorite(doctorId: string): Promise<{ ok: boolean; favorited: boolean; unavailable?: boolean }> {
  const me = await currentDoctor();
  if (!me || doctorId === me.doctorId) return { ok: false, favorited: false };
  const admin = createAdminClient() as any;
  if (!(await referralsV2(admin))) return { ok: false, favorited: false, unavailable: true };
  const supabase = createServerSupabase() as any;
  const existing = await supabase.from('doctor_favorites').select('favorite_doctor_id').eq('doctor_id', me.doctorId).eq('favorite_doctor_id', doctorId).maybeSingle();
  if (existing.error) return { ok: false, favorited: false, unavailable: true };
  if (existing.data) {
    await supabase.from('doctor_favorites').delete().eq('doctor_id', me.doctorId).eq('favorite_doctor_id', doctorId);
    return { ok: true, favorited: false };
  }
  const inserted = await supabase.from('doctor_favorites').insert({ doctor_id: me.doctorId, favorite_doctor_id: doctorId });
  if (inserted.error) return { ok: false, favorited: false, unavailable: true };
  return { ok: true, favorited: true };
}

async function loadParty(admin: any, doctorId: string) {
  const { data } = await admin.from('doctors').select('id, user_id, first_name, last_name, clinic_name, phone, address, booking_url, slug').eq('id', doctorId).maybeSingle();
  return data as {
    id: string;
    user_id: string | null;
    first_name: string | null;
    last_name: string | null;
    clinic_name: string | null;
    phone: string | null;
    address: string | null;
    booking_url: string | null;
    slug: string | null;
  } | null;
}

async function noteReferralThread(id: string, event: 'sent' | 'accepted' | 'declined' | 'booked'): Promise<string | null> {
  try {
    const { ensureReferralThread } = await import('@/lib/messaging/referral-thread');
    return await ensureReferralThread(id, event);
  } catch {
    return null;
  }
}

function doctorName(row: { first_name?: string | null; last_name?: string | null } | null): string {
  return `Dr. ${row?.first_name || ''} ${row?.last_name || ''}`.trim();
}

export async function submitReferral(input: {
  receivingDoctorId: string;
  patientFirstName: string;
  patientLastInitial: string;
  patientPhone: string;
  patientEmail?: string;
  patientZip?: string;
  reason: string;
  urgency: 'routine' | 'urgent';
  consentConfirmed: boolean;
}): Promise<{ success: boolean; error?: string; referralId?: string; receiverName?: string }> {
  const me = await currentDoctor();
  if (!me) return { success: false, error: 'Sign in to refer.' };
  if (!input.consentConfirmed) return { success: false, error: 'Patient consent is required.' };
  const first = input.patientFirstName.trim();
  const initial = input.patientLastInitial.trim().charAt(0).toUpperCase();
  const phone = input.patientPhone.trim();
  const reason = input.reason.trim();
  if (!first || !initial || !phone || !reason) return { success: false, error: 'Add the first name, last initial, phone, and why you are referring.' };
  if (input.receivingDoctorId === me.doctorId) return { success: false, error: 'Pick another doctor.' };

  const admin = createAdminClient() as any;
  const receiver = await loadParty(admin, input.receivingDoctorId);
  if (!receiver) return { success: false, error: 'That doctor was not found.' };
  const v2 = await referralsV2(admin);
  const supabase = createServerSupabase() as any;
  const now = new Date();
  const row: Record<string, unknown> = {
    referring_doctor_id: me.doctorId,
    receiving_doctor_id: input.receivingDoctorId,
    patient_first_name: first,
    patient_last_initial: initial,
    patient_phone: phone,
    patient_email: input.patientEmail?.trim() || null,
    patient_zip: input.patientZip?.trim() || null,
    reason,
    urgency: input.urgency === 'urgent' ? 'urgent' : 'routine',
    consent_confirmed: true,
    status: v2 ? 'sent' : 'pending',
    created_at: now.toISOString(),
  };
  if (v2) row.expires_at = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const inserted = await supabase.from('doctor_referrals').insert(row).select('id').single();
  if (inserted.error || !inserted.data) return { success: false, error: 'Could not send that referral.' };

  const id = inserted.data.id as string;
  const threadId = await noteReferralThread(id, 'sent');
  const to = await emailForUser(admin, receiver.user_id);
  const referrerName = `Dr. ${me.firstName} ${me.lastName}`.trim();
  await sendOnce(admin, id, 'sent', v2, to, () => sentToReceiverEmail({
    id,
    referrerName,
    patientFirst: first,
    patientInitial: initial,
    reason,
    urgency: input.urgency,
    messageUrl: threadId ? `https://neurochiro.co/doctor/messages?c=${threadId}` : null,
  }));
  if (receiver.user_id) {
    await admin.from('notifications').insert({
      user_id: receiver.user_id,
      title: 'New referral',
      body: `${patientLabel(first, initial)} was referred to you.`,
      type: 'referral',
      link: `/doctor/referrals/${id}`,
    }).then(() => {}).catch(() => {});
  }
  return { success: true, referralId: id, receiverName: doctorName(receiver) };
}

async function ownReferral(id: string): Promise<{ me: Me; row: ReferralRow; v2: boolean; admin: any } | null> {
  const loaded = await getReferral(id);
  const me = await currentDoctor();
  if (!loaded || !me) return null;
  return { me, row: loaded.row, v2: loaded.v2, admin: createAdminClient() as any };
}

export async function acceptReferral(id: string): Promise<{ success: boolean; error?: string }> {
  const ctx = await ownReferral(id);
  if (!ctx) return { success: false, error: 'Referral not found.' };
  if (ctx.row.receiving_doctor_id !== ctx.me.doctorId) return { success: false, error: 'Only the receiving doctor can accept.' };
  const supabase = createServerSupabase() as any;
  const updated = await supabase.from('doctor_referrals').update({
    status: 'accepted',
    responded_at: new Date().toISOString(),
  }).eq('id', id).eq('receiving_doctor_id', ctx.me.doctorId).select('id').maybeSingle();
  if (updated.error) return { success: false, error: 'Could not accept this referral.' };

  const referrer = await loadParty(ctx.admin, ctx.row.referring_doctor_id);
  const receiver = await loadParty(ctx.admin, ctx.me.doctorId);
  const referrerEmail = await emailForUser(ctx.admin, referrer?.user_id || null);
  await sendOnce(ctx.admin, id, 'accepted', ctx.v2, referrerEmail, () => acceptedToReferrerEmail({
    receiverName: doctorName(receiver),
    patientFirst: ctx.row.patient_first_name,
    patientInitial: ctx.row.patient_last_initial,
  }));

  const full = await ctx.admin.from('doctor_referrals').select('patient_email, consent_confirmed, patient_intro_sent_at, patient_first_name').eq('id', id).maybeSingle();
  const patientEmail = full.data?.patient_email as string | null;
  if (shouldSendPatientIntro({
    consentConfirmed: Boolean(full.data?.consent_confirmed),
    patientEmail,
    alreadySent: Boolean(full.data?.patient_intro_sent_at),
  })) {
    const sent = await sendOnce(ctx.admin, id, 'patient_intro', ctx.v2, patientEmail, () => patientIntroEmail({
      patientFirst: ctx.row.patient_first_name,
      receiverName: doctorName(receiver),
      clinic: receiver?.clinic_name || null,
      phone: receiver?.phone || null,
      address: receiver?.address || null,
      bookingUrl: receiver?.booking_url || null,
      profileUrl: receiver?.slug ? `https://neurochiro.co/directory/${receiver.slug}` : null,
    }));
    if (sent && ctx.v2) {
      await ctx.admin.from('doctor_referrals').update({ patient_intro_sent_at: new Date().toISOString() }).eq('id', id);
    }
  }
  await noteReferralThread(id, 'accepted');
  return { success: true };
}

export async function declineReferral(id: string, reason: string): Promise<{ success: boolean; error?: string }> {
  const ctx = await ownReferral(id);
  if (!ctx) return { success: false, error: 'Referral not found.' };
  if (ctx.row.receiving_doctor_id !== ctx.me.doctorId) return { success: false, error: 'Only the receiving doctor can decline.' };
  const supabase = createServerSupabase() as any;
  const updated = await supabase.from('doctor_referrals').update({
    status: 'declined',
    decline_reason: reason.trim() || null,
    responded_at: new Date().toISOString(),
  }).eq('id', id).eq('receiving_doctor_id', ctx.me.doctorId);
  if (updated.error) return { success: false, error: 'Could not decline this referral.' };
  const referrer = await loadParty(ctx.admin, ctx.row.referring_doctor_id);
  const to = await emailForUser(ctx.admin, referrer?.user_id || null);
  await sendOnce(ctx.admin, id, 'declined', ctx.v2, to, () => declinedToReferrerEmail({
    id,
    receiverName: `Dr. ${ctx.me.firstName} ${ctx.me.lastName}`.trim(),
    patientFirst: ctx.row.patient_first_name,
    patientInitial: ctx.row.patient_last_initial,
    reason: reason.trim(),
  }));
  await noteReferralThread(id, 'declined');
  return { success: true };
}

export async function markContacted(id: string): Promise<{ success: boolean; error?: string }> {
  const ctx = await ownReferral(id);
  if (!ctx) return { success: false, error: 'Referral not found.' };
  if (!ctx.v2) return { success: false, error: 'This step opens after the referrals update.' };
  if (ctx.row.receiving_doctor_id !== ctx.me.doctorId) return { success: false, error: 'Only the receiving doctor can update this.' };
  const supabase = createServerSupabase() as any;
  const updated = await supabase.from('doctor_referrals').update({
    status: 'patient_contacted',
    contacted_at: new Date().toISOString(),
  }).eq('id', id).eq('receiving_doctor_id', ctx.me.doctorId);
  if (updated.error) return { success: false, error: 'Could not update this referral.' };
  return { success: true };
}

export async function markScheduled(id: string, scheduledFor: string | null, note: string): Promise<{ success: boolean; error?: string }> {
  const ctx = await ownReferral(id);
  if (!ctx) return { success: false, error: 'Referral not found.' };
  if (!ctx.v2) return { success: false, error: 'This step opens after the referrals update.' };
  if (ctx.row.receiving_doctor_id !== ctx.me.doctorId) return { success: false, error: 'Only the receiving doctor can update this.' };
  const supabase = createServerSupabase() as any;
  const updated = await supabase.from('doctor_referrals').update({
    status: 'scheduled',
    scheduled_at: new Date().toISOString(),
    scheduled_for: scheduledFor || null,
    thank_you_note: note.trim() || null,
  }).eq('id', id).eq('receiving_doctor_id', ctx.me.doctorId);
  if (updated.error) return { success: false, error: 'Could not update this referral.' };
  const referrer = await loadParty(ctx.admin, ctx.row.referring_doctor_id);
  const to = await emailForUser(ctx.admin, referrer?.user_id || null);
  await sendOnce(ctx.admin, id, 'booked', ctx.v2, to, () => bookedThankYouEmail({
    receiverName: `Dr. ${ctx.me.firstName} ${ctx.me.lastName}`.trim(),
    patientFirst: ctx.row.patient_first_name,
    patientInitial: ctx.row.patient_last_initial,
    note: note.trim() || null,
  }));
  await noteReferralThread(id, 'booked');
  return { success: true };
}

export async function cancelReferral(id: string): Promise<{ success: boolean; error?: string }> {
  const ctx = await ownReferral(id);
  if (!ctx) return { success: false, error: 'Referral not found.' };
  if (!ctx.v2) return { success: false, error: 'Cancel opens after the referrals update.' };
  if (ctx.row.referring_doctor_id !== ctx.me.doctorId) return { success: false, error: 'Only the referring doctor can cancel.' };
  const supabase = createServerSupabase() as any;
  const updated = await supabase.from('doctor_referrals').update({
    status: 'cancelled',
    cancelled_at: new Date().toISOString(),
  }).eq('id', id).eq('referring_doctor_id', ctx.me.doctorId);
  if (updated.error) return { success: false, error: 'Could not cancel this referral.' };
  return { success: true };
}

const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/heif']);

export async function uploadReferralFiles(referralId: string, files: File[]): Promise<{ success: boolean; error?: string }> {
  const ctx = await ownReferral(referralId);
  if (!ctx) return { success: false, error: 'Referral not found.' };
  if (!ctx.v2) return { success: false, error: 'File sharing opens after the referrals update.' };
  if (ctx.row.referring_doctor_id !== ctx.me.doctorId) return { success: false, error: 'Only the referring doctor can add files.' };
  if (files.length > 3) return { success: false, error: 'Add up to 3 files.' };
  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) return { success: false, error: 'Each file must be 10 MB or smaller.' };
    if (!ALLOWED_MIME.has(file.type)) return { success: false, error: 'Use a PDF, JPG, PNG, or HEIC file.' };
  }
  for (const file of files) {
    const path = `${referralId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]+/g, '_')}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const uploaded = await ctx.admin.storage.from('referral-attachments').upload(path, bytes, { contentType: file.type, upsert: false });
    if (uploaded.error) return { success: false, error: 'Could not store that file.' };
    const inserted = await ctx.admin.from('referral_attachments').insert({
      referral_id: referralId,
      storage_path: path,
      file_name: file.name,
      mime: file.type,
      size_bytes: file.size,
      uploaded_by: ctx.me.userId,
    });
    if (inserted.error) return { success: false, error: 'Could not save that file.' };
  }
  return { success: true };
}

export async function attachmentUrl(attachmentId: string): Promise<string | null> {
  const me = await currentDoctor();
  if (!me) return null;
  const admin = createAdminClient() as any;
  const { data: file } = await admin.from('referral_attachments').select('id, referral_id, storage_path').eq('id', attachmentId).maybeSingle();
  if (!file) return null;
  const loaded = await getReferral(file.referral_id);
  if (!loaded) return null;
  const allowed = canSeePatientContact({
    viewerDoctorId: me.doctorId,
    referringDoctorId: loaded.row.referring_doctor_id,
    receivingDoctorId: loaded.row.receiving_doctor_id,
    status: loaded.row.status,
  });
  if (!allowed) return null;
  const signed = await admin.storage.from('referral-attachments').createSignedUrl(file.storage_path, 60 * 10);
  return signed.data?.signedUrl || null;
}

export async function listAttachments(referralId: string): Promise<{ id: string; fileName: string }[]> {
  const loaded = await getReferral(referralId);
  const me = await currentDoctor();
  if (!loaded || !me) return [];
  const allowed = canSeePatientContact({
    viewerDoctorId: me.doctorId,
    referringDoctorId: loaded.row.referring_doctor_id,
    receivingDoctorId: loaded.row.receiving_doctor_id,
    status: loaded.row.status,
  });
  if (!allowed && loaded.row.referring_doctor_id !== me.doctorId) return [];
  if (loaded.row.referring_doctor_id !== me.doctorId && !allowed) return [];
  const admin = createAdminClient() as any;
  const { data, error } = await admin.from('referral_attachments').select('id, file_name').eq('referral_id', referralId);
  if (error || !data) return [];
  return data.map((row: { id: string; file_name: string }) => ({ id: row.id, fileName: row.file_name }));
}

async function applyReminder(admin: any, row: any, kind: ReminderKind, v2: boolean) {
  const referrer = row.referring_doctor;
  const receiver = row.receiving_doctor;
  if (kind === 'receiver_24h') {
    const to = await emailForUser(admin, receiver?.user_id || null);
    await sendOnce(admin, row.id, 'receiver_24h', v2, to, () => reminderEmail('receiver_24h', {
      id: row.id,
      otherName: doctorName(referrer),
      patientFirst: row.patient_first_name,
      patientInitial: row.patient_last_initial,
    }));
    const patch = v2 ? { receiver_reminder_1_at: new Date().toISOString() } : { reminder_sent_at: new Date().toISOString() };
    await admin.from('doctor_referrals').update(patch).eq('id', row.id);
    return;
  }
  if (kind === 'receiver_48h_after_accept') {
    const to = await emailForUser(admin, receiver?.user_id || null);
    await sendOnce(admin, row.id, 'receiver_48h_after_accept', v2, to, () => reminderEmail('receiver_48h_after_accept', {
      id: row.id,
      otherName: doctorName(referrer),
      patientFirst: row.patient_first_name,
      patientInitial: row.patient_last_initial,
    }));
    const patch = v2
      ? { receiver_reminder_2_at: new Date().toISOString() }
      : { reminder_sent_at: new Date().toISOString() };
    await admin.from('doctor_referrals').update(patch).eq('id', row.id);
    return;
  }
  const to = await emailForUser(admin, referrer?.user_id || null);
  await sendOnce(admin, row.id, 'referrer_7d_expire', v2, to, () => reminderEmail('referrer_7d_expire', {
    id: row.id,
    otherName: doctorName(receiver),
    patientFirst: row.patient_first_name,
    patientInitial: row.patient_last_initial,
  }));
  const patch: Record<string, string> = { status: 'expired' };
  if (v2) patch.referrer_nudge_at = new Date().toISOString();
  await admin.from('doctor_referrals').update(patch).eq('id', row.id);
}

export async function runReferralReminders(now = new Date()): Promise<{ processed: number; sent: number }> {
  const admin = createAdminClient() as any;
  const v2 = await referralsV2(admin);
  const columns = v2
    ? 'id, status, created_at, expires_at, responded_at, contacted_at, reminder_sent_at, receiver_reminder_1_at, receiver_reminder_2_at, referrer_nudge_at, patient_first_name, patient_last_initial, referring_doctor:referring_doctor_id(user_id, first_name, last_name), receiving_doctor:receiving_doctor_id(user_id, first_name, last_name)'
    : 'id, status, created_at, expires_at, responded_at, reminder_sent_at, patient_first_name, patient_last_initial, referring_doctor:referring_doctor_id(user_id, first_name, last_name), receiving_doctor:receiving_doctor_id(user_id, first_name, last_name)';
  const statuses = v2 ? ['sent', 'pending', 'viewed', 'accepted'] : ['pending', 'accepted'];
  const { data, error } = await admin.from('doctor_referrals').select(columns).in('status', statuses).limit(500);
  if (error || !data) {
    console.error('[referrals] reminder read failed');
    return { processed: 0, sent: 0 };
  }
  let sent = 0;
  for (const row of data) {
    if (!v2 && row.status === 'accepted' && row.reminder_sent_at) {
      row.receiver_reminder_2_at = row.reminder_sent_at;
    }
    const kinds = planReminders(row, now);
    for (const kind of kinds) {
      await applyReminder(admin, row, kind, v2);
      sent += 1;
    }
  }
  console.info(`[referrals] reminders processed=${data.length} sent=${sent}`);
  return { processed: data.length, sent };
}
