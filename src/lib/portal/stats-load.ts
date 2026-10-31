import 'server-only';
import { createAdminClient } from '@/lib/supabase-admin';
import { countPatientRequests, marketRank, rangeStart, type LeadLike, type PortalStats } from '@/lib/portal/stats';

export async function getDoctorPortalStats(input: {
  doctorId: string;
  userId: string;
  range?: '30d' | 'month' | 'all';
  city?: string | null;
  profileViews?: number | null;
}): Promise<PortalStats> {
  const admin = createAdminClient() as any;
  const start = rangeStart(input.range || '30d');
  const startIso = start ? start.toISOString() : null;

  const [leadsRes, contactsRes, viewsRes, introRes, clicksRes, sentRes, receivedRes] = await Promise.all([
    admin.from('leads').select('id, stage, created_at, email, phone').eq('doctor_id', input.doctorId),
    admin.from('contact_requests').select('id, contact_outcome, outcome_detail, created_at, email, phone').eq('doctor_id', input.doctorId),
    admin.from('doctors').select('profile_views').eq('id', input.doctorId).maybeSingle(),
    admin.from('reply_logs').select('id, kind, created_at').eq('doctor_id', input.doctorId),
    admin.from('link_clicks').select('id, created_at').eq('doctor_id', input.doctorId).eq('destination', 'profile'),
    admin.from('doctor_referrals').select('id, created_at').eq('referring_doctor_id', input.doctorId),
    admin.from('doctor_referrals').select('id, created_at').eq('receiving_doctor_id', input.doctorId),
  ]);

  const contacts: LeadLike[] = (contactsRes.data || []).map((row: any) => {
    let stage = 'new';
    if (row.contact_outcome === 'patient_contacted_confirmed' || row.outcome_detail === 'booked') {
      stage = row.outcome_detail === 'booked' ? 'scheduled' : 'contacted';
    }
    return { id: row.id, stage, created_at: row.created_at, email: row.email, phone: row.phone };
  });

  const since = (rows: { created_at?: string }[] | null) =>
    (rows || []).filter((row) => !startIso || (row.created_at && row.created_at >= startIso)).length;

  const introductions = (introRes.data || []).filter((row: any) => {
    if (row.kind === 'waitlist_comment' || row.kind === 'waitlist_dm') return false;
    return !startIso || (row.created_at && row.created_at >= startIso);
  }).length;

  let viewsInRange: number | null = null;
  const events = await admin.from('analytics_events').select('id, created_at').eq('doctor_id', input.doctorId).eq('event_type', 'profile_view');
  if (!events.error && Array.isArray(events.data)) {
    viewsInRange = since(events.data);
  }

  let market: PortalStats['market'] = null;
  if (input.city) {
    const peers = await admin.from('doctors').select('id, profile_views, verification_status').eq('city', input.city).eq('verification_status', 'verified');
    if (!peers.error && Array.isArray(peers.data)) {
      market = marketRank(peers.data.map((row: any) => ({ id: row.id, views: row.profile_views || 0 })), input.doctorId);
    }
  }

  return {
    patientRequests: countPatientRequests(leadsRes.data || [], contacts, start),
    profileViews: viewsRes.data?.profile_views ?? input.profileViews ?? 0,
    viewsInRange,
    introductions,
    profileClicks: clicksRes.error ? 0 : since(clicksRes.data),
    referralsSent: sentRes.error ? 0 : since(sentRes.data),
    referralsReceived: receivedRes.error ? 0 : since(receivedRes.data),
    market,
  };
}
