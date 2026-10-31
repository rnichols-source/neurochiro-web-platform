import { countPatientRequests, type LeadLike } from '../portal/stats.ts';
import { isUpcoming, parseSeminarDates } from '../seminars/dates.ts';

export const PUBLISHED_JOB_STATUSES = new Set(['active', 'open', 'published']);

export type BadgeSeminar = {
  dates?: string | null;
  is_past?: boolean | null;
  is_approved?: boolean | null;
};

export type BadgeCertificate = {
  registration_id?: string | null;
  seminar_id?: string | null;
  user_id?: string | null;
  ce_hours?: number | null;
};

export type BadgeFacts = {
  photo_url?: string | null;
  bio?: string | null;
  clinic_name?: string | null;
  specialties?: string[] | null;
  website_url?: string | null;
  profile_views?: number | null;
  patientRequests?: number;
  seminars?: BadgeSeminar[];
  jobs?: { status?: string | null }[];
  certificates?: BadgeCertificate[];
  chiromatch?: boolean;
  cityPeers?: { id: string; views: number; verified: boolean }[];
  doctorId?: string;
  reviews?: { rating?: number | null }[];
  referralsSent?: number;
  now?: number;
};

export function profileIsComplete(doctor: Pick<BadgeFacts, 'photo_url' | 'bio' | 'clinic_name' | 'specialties' | 'website_url'>): boolean {
  return !!(
    doctor.photo_url
    && doctor.bio
    && doctor.bio.length >= 50
    && doctor.clinic_name
    && (doctor.specialties?.length || 0) > 0
    && doctor.website_url
  );
}

export function countPastApprovedSeminars(seminars: BadgeSeminar[] | undefined, now = Date.now()): number {
  return (seminars || []).filter((row) => {
    if (row.is_approved !== true) return false;
    const end = parseSeminarDates(row.dates)?.end || null;
    return !isUpcoming(end, row.is_past, now);
  }).length;
}

export function countPublishedJobs(jobs: { status?: string | null }[] | undefined): number {
  return (jobs || []).filter((job) => PUBLISHED_JOB_STATUSES.has((job.status || '').toLowerCase())).length;
}

export function dedupedCeHours(certificates: BadgeCertificate[] | undefined): number {
  const seen = new Set<string>();
  let total = 0;
  for (const cert of certificates || []) {
    const key = cert.registration_id
      ? `registration:${cert.registration_id}`
      : `seminar:${cert.seminar_id || ''}:${cert.user_id || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    total += Number(cert.ce_hours) || 0;
  }
  return total;
}

export function cityRank(peers: { id: string; views: number; verified: boolean }[] | undefined, doctorId: string | undefined): { verifiedCount: number; rank: number | null } {
  const verified = (peers || []).filter((peer) => peer.verified);
  if (!doctorId || !verified.some((peer) => peer.id === doctorId)) {
    return { verifiedCount: verified.length, rank: null };
  }
  const sorted = [...verified].sort((a, b) => b.views - a.views || a.id.localeCompare(b.id));
  return { verifiedCount: verified.length, rank: sorted.findIndex((peer) => peer.id === doctorId) + 1 };
}

export function qualifiesForReviewStar(reviews: { rating?: number | null }[] | undefined): boolean {
  const ratings = (reviews || []).map((review) => Number(review.rating)).filter((rating) => !Number.isNaN(rating));
  if (ratings.length < 3) return false;
  const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  return average >= 4.5;
}

/** Live badge ids from real counts. An empty list means the section should stay hidden. */
export function computeEarnedBadges(doctor: BadgeFacts): string[] {
  const earned: string[] = [];
  if (profileIsComplete(doctor)) earned.push('profile_complete');
  if ((doctor.profile_views || 0) >= 100) earned.push('first_100_views');
  if ((doctor.patientRequests || 0) >= 10) earned.push('lead_magnet');
  if (countPastApprovedSeminars(doctor.seminars, doctor.now) >= 1) earned.push('seminar_host');
  if (countPublishedJobs(doctor.jobs) >= 3) earned.push('hiring_pro');
  if (dedupedCeHours(doctor.certificates) >= 20) earned.push('ce_champion');
  if (doctor.chiromatch) earned.push('chiromatch_participant');
  const rank = cityRank(doctor.cityPeers, doctor.doctorId);
  if (rank.verifiedCount >= 10 && rank.rank != null && rank.rank <= 10) earned.push('top_10');
  if (qualifiesForReviewStar(doctor.reviews)) earned.push('review_star');
  if ((doctor.referralsSent || 0) >= 5) earned.push('community_builder');
  return earned;
}

function contactStage(row: { contact_outcome?: string | null; outcome_detail?: string | null }): string {
  if (row.contact_outcome === 'patient_contacted_confirmed' || row.outcome_detail === 'booked') {
    return row.outcome_detail === 'booked' ? 'scheduled' : 'contacted';
  }
  return 'new';
}

/** Load the counts and return the badge ids. Query failures count as not earned. */
export async function loadEarnedBadgeIds(doctor: {
  id: string;
  user_id?: string | null;
  photo_url?: string | null;
  bio?: string | null;
  clinic_name?: string | null;
  specialties?: string[] | null;
  website_url?: string | null;
  profile_views?: number | null;
  city?: string | null;
  state?: string | null;
}): Promise<string[]> {
  try {
    const { createAdminClient } = await import('@/lib/supabase-admin');
    const admin = createAdminClient() as any;
    const userId = doctor.user_id || '';
    const jobKeys = [doctor.id, userId].filter(Boolean);
    let peerQuery = doctor.city
      ? admin.from('doctors').select('id, profile_views, verification_status').eq('city', doctor.city).eq('verification_status', 'verified')
      : null;
    if (peerQuery && doctor.state) peerQuery = peerQuery.eq('state', doctor.state);

    const [leadsRes, contactsRes, seminarsRes, jobsRes, ceRes, matchProfileRes, matchPositionRes, peersRes, referralsRes] = await Promise.all([
      admin.from('leads').select('id, stage, created_at, email, phone').eq('doctor_id', doctor.id),
      admin.from('contact_requests').select('id, contact_outcome, outcome_detail, created_at, email, phone').eq('doctor_id', doctor.id),
      userId
        ? admin.from('seminars').select('id, dates, is_past, is_approved').eq('host_id', userId).eq('is_approved', true)
        : Promise.resolve({ data: [], error: null }),
      jobKeys.length
        ? admin.from('job_postings').select('id, status').in('doctor_id', jobKeys)
        : Promise.resolve({ data: [], error: null }),
      userId
        ? admin.from('ce_certificates').select('registration_id, seminar_id, user_id, ce_hours').eq('user_id', userId)
        : Promise.resolve({ data: [], error: null }),
      admin.from('match_profiles').select('user_id').eq('doctor_id', doctor.id).not('completed_at', 'is', null).limit(1),
      jobKeys.length
        ? admin.from('match_positions').select('id').in('doctor_id', jobKeys).limit(1)
        : Promise.resolve({ data: [], error: null }),
      peerQuery || Promise.resolve({ data: [], error: null }),
      admin.from('doctor_referrals').select('id', { count: 'exact', head: true }).eq('referring_doctor_id', doctor.id),
    ]);

    const seminarRows = seminarsRes.error ? [] : (seminarsRes.data || []);
    const seminarIds = seminarRows.map((row: { id: string }) => row.id);
    let reviews: { rating?: number | null }[] = [];
    if (seminarIds.length) {
      const reviewRes = await admin.from('seminar_reviews').select('rating').in('seminar_id', seminarIds);
      if (!reviewRes.error) reviews = reviewRes.data || [];
    }

    const contacts: LeadLike[] = contactsRes.error
      ? []
      : (contactsRes.data || []).map((row: any) => ({
          id: row.id,
          stage: contactStage(row),
          created_at: row.created_at,
          email: row.email,
          phone: row.phone,
        }));
    const patientRequests = (leadsRes.error || contactsRes.error)
      ? 0
      : countPatientRequests(leadsRes.data || [], contacts, null).total;

    const cityPeers = (peersRes.error ? [] : (peersRes.data || [])).map((row: any) => ({
      id: row.id as string,
      views: row.profile_views || 0,
      verified: row.verification_status === 'verified',
    }));

    return computeEarnedBadges({
      photo_url: doctor.photo_url,
      bio: doctor.bio,
      clinic_name: doctor.clinic_name,
      specialties: doctor.specialties,
      website_url: doctor.website_url,
      profile_views: doctor.profile_views,
      patientRequests,
      seminars: seminarRows,
      jobs: jobsRes.error ? [] : (jobsRes.data || []),
      certificates: ceRes.error ? [] : (ceRes.data || []),
      chiromatch: (!matchProfileRes.error && (matchProfileRes.data || []).length > 0)
        || (!matchPositionRes.error && (matchPositionRes.data || []).length > 0),
      cityPeers,
      doctorId: doctor.id,
      reviews,
      referralsSent: referralsRes.error ? 0 : (referralsRes.count || 0),
    });
  } catch {
    return [];
  }
}
