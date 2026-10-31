import 'server-only';
import { createAdminClient } from '@/lib/supabase-admin';
import {
  countDatedRows,
  countIntroductions,
  countPatientRequests,
  earliestIso,
  marketRank,
  rangeStart,
  type LeadLike,
  type PortalStats,
} from '@/lib/portal/stats';

export async function getDoctorPortalStats(input: {
  doctorId: string;
  userId: string;
  range?: '30d' | 'month' | 'all';
  city?: string | null;
  profileViews?: number | null;
  timeZone?: string | null;
  now?: Date;
}): Promise<PortalStats> {
  const admin = createAdminClient() as any;
  const now = input.now || new Date();
  const start = rangeStart(input.range || '30d', now, input.timeZone || 'America/New_York');
  const startIso = start ? start.toISOString() : null;

  const [leadsRes, contactsRes, viewsRes, introRes, clicksRes, sentRes, receivedRes, eventsRes] = await Promise.all([
    admin.from('leads').select('id, stage, created_at, email, phone, source').eq('doctor_id', input.doctorId),
    admin.from('contact_requests').select('id, contact_outcome, outcome_detail, created_at, email, phone, source').eq('doctor_id', input.doctorId),
    admin.from('doctors').select('profile_views').eq('id', input.doctorId).maybeSingle(),
    admin.from('reply_logs').select('id, template_id, created_at').eq('doctor_id', input.doctorId),
    admin.from('link_clicks').select('id, created_at').eq('doctor_id', input.doctorId).eq('destination', 'profile'),
    admin.from('doctor_referrals').select('id, created_at').eq('referring_doctor_id', input.doctorId),
    admin.from('doctor_referrals').select('id, created_at').eq('receiving_doctor_id', input.doctorId),
    admin.from('analytics_events').select('id, created_at').eq('doctor_id', input.doctorId).eq('event_type', 'profile_view'),
  ]);

  const contacts: LeadLike[] = contactsRes.error
    ? []
    : (contactsRes.data || []).map((row: any) => {
        let stage = 'new';
        if (row.contact_outcome === 'patient_contacted_confirmed' || row.outcome_detail === 'booked') {
          stage = row.outcome_detail === 'booked' ? 'scheduled' : 'contacted';
        }
        return {
          id: row.id,
          stage,
          created_at: row.created_at,
          email: row.email,
          phone: row.phone,
          source: row.source,
        };
      });

  const requestsKnown = !leadsRes.error && !contactsRes.error;
  let viewsInRange: number | null = null;
  let viewsTrackedSince: string | null = null;
  if (!eventsRes.error && Array.isArray(eventsRes.data)) {
    viewsTrackedSince = earliestIso(eventsRes.data);
    viewsInRange = eventsRes.data.filter((row: { created_at?: string | null }) => !startIso || (row.created_at && row.created_at >= startIso)).length;
  }

  let market: PortalStats['market'] = null;
  if (input.city) {
    const peers = await admin.from('doctors').select('id, profile_views, verification_status').eq('city', input.city).eq('verification_status', 'verified');
    if (!peers.error && Array.isArray(peers.data)) {
      market = marketRank(
        peers.data.map((row: any) => ({ id: row.id, views: row.profile_views || 0 })),
        input.doctorId,
      );
    }
  }

  return {
    patientRequests: requestsKnown ? countPatientRequests(leadsRes.data || [], contacts, start) : null,
    profileViews: viewsRes.data?.profile_views ?? input.profileViews ?? 0,
    viewsInRange,
    viewsTrackedSince,
    introductions: countIntroductions(introRes, start),
    profileClicks: countDatedRows(clicksRes, start),
    referralsSent: countDatedRows(sentRes, start),
    referralsReceived: countDatedRows(receivedRes, start),
    market,
  };
}
