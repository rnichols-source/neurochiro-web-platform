import 'server-only';
import { createAdminClient } from '@/lib/supabase-admin';
import {
  countFromHead,
  countPatientRequests,
  patientRequestSources,
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
  const since = (query: any) => (startIso ? query.gte('created_at', startIso) : query);

  const [leadsRes, contactsRes, viewsRes, introRes, clicksRes, sentRes, receivedRes, eventsRes, earliestRes, peersRes] = await Promise.all([
    since(admin.from('leads').select('id, stage, created_at, email, phone, source').eq('doctor_id', input.doctorId)),
    since(admin.from('contact_requests').select('id, contact_outcome, outcome_detail, created_at, email, phone, source').eq('doctor_id', input.doctorId)),
    admin.from('doctors').select('profile_views').eq('id', input.doctorId).maybeSingle(),
    since(
      admin
        .from('reply_logs')
        .select('id', { count: 'exact', head: true })
        .eq('doctor_id', input.doctorId)
        .or('template_id.is.null,template_id.not.in.(waitlist_comment,waitlist_dm)'),
    ),
    since(admin.from('link_clicks').select('id', { count: 'exact', head: true }).eq('doctor_id', input.doctorId).eq('destination', 'profile')),
    since(admin.from('doctor_referrals').select('id', { count: 'exact', head: true }).eq('referring_doctor_id', input.doctorId)),
    since(admin.from('doctor_referrals').select('id', { count: 'exact', head: true }).eq('receiving_doctor_id', input.doctorId)),
    since(
      admin
        .from('analytics_events')
        .select('id', { count: 'exact', head: true })
        .eq('doctor_id', input.doctorId)
        .eq('event_type', 'profile_view'),
    ),
    admin
      .from('analytics_events')
      .select('created_at')
      .eq('doctor_id', input.doctorId)
      .eq('event_type', 'profile_view')
      .order('created_at', { ascending: true })
      .limit(1),
    input.city
      ? admin.from('doctors').select('id, profile_views').eq('city', input.city).eq('verification_status', 'verified')
      : Promise.resolve({ data: null, error: null }),
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
  const viewsInRange = countFromHead(eventsRes);
  const viewsTrackedSince = earliestRes.error ? null : (earliestRes.data?.[0]?.created_at ?? null);
  const market = !peersRes.error && Array.isArray(peersRes.data)
    ? marketRank(
        peersRes.data.map((row: any) => ({ id: row.id, views: row.profile_views || 0 })),
        input.doctorId,
      )
    : null;

  return {
    patientRequests: requestsKnown ? countPatientRequests(leadsRes.data || [], contacts, start) : null,
    profileViews: viewsRes.data?.profile_views ?? input.profileViews ?? 0,
    viewsInRange,
    viewsTrackedSince,
    introductions: countFromHead(introRes),
    profileClicks: countFromHead(clicksRes),
    referralsSent: countFromHead(sentRes),
    referralsReceived: countFromHead(receivedRes),
    requestSources: requestsKnown ? patientRequestSources(leadsRes.data || [], contacts, start) : null,
    market,
  };
}
