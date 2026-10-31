import 'server-only';
import { unstable_cache } from 'next/cache';
import { createAdminClient } from '@/lib/supabase-admin';
import { createServerSupabase } from '@/lib/supabase-server';
import {
  filterUpcomingRecommendations,
  recommendationChips,
  type DoctorFocus,
  type SeminarRecommendationRow,
} from '@/lib/portal/seminar-recommendations';

export async function loadDoctorSeminars(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('seminars')
    .select(`
      id, host_id, title, description, dates, location, city, country,
      venue_name, venue_address, start_time, end_time, event_type,
      instructor_name, instructor_bio, registration_link, price, ce_hours,
      categories, tags, target_audience, image_url, hero_image_url,
      gallery_images, schedule, speakers, faq, listing_tier,
      is_past, is_approved, payment_status, page_views, clicks,
      created_at, updated_at,
      registrations:seminar_registrations(count)
    `)
    .eq('host_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching doctor seminars:', error.message);
    return [];
  }
  return data || [];
}

async function fetchRecommendedSeminars(userId: string, focus: DoctorFocus) {
  const admin = createAdminClient() as any;
  const { data: seminars } = await admin
    .from('seminars')
    .select('id, title, dates, city, country, location, description, tags, ce_hours, host_id, is_past')
    .eq('is_approved', true)
    .neq('host_id', userId)
    .order('dates', { ascending: true })
    .limit(40);

  if (!seminars || seminars.length === 0) return [];

  const scored = (seminars as Array<SeminarRecommendationRow & { id?: string }>).map((sem) => {
    const haystack = `${sem.title || ''} ${sem.description || ''} ${(sem.tags || []).join(' ')}`.toLowerCase();
    const place = `${sem.city || ''} ${sem.location || ''} ${sem.country || ''}`.toLowerCase();
    let relevance = 0;
    if (focus.city && (sem.city || '').toLowerCase() === focus.city.toLowerCase()) relevance += 30;
    else if (focus.state && place.includes(focus.state.toLowerCase())) relevance += 15;
    for (const specialty of focus.specialties || []) {
      if (specialty && haystack.includes(specialty.toLowerCase())) relevance += 10;
    }
    if (sem.ce_hours && sem.ce_hours > 0) relevance += Math.min(sem.ce_hours, 20);
    return { ...sem, relevance };
  });

  return filterUpcomingRecommendations(scored, Date.now()).map((sem) => ({
    ...sem,
    chips: recommendationChips(sem, focus),
  }));
}

/** Approved seminars other doctors are hosting. Cached 10 minutes per city, state, and specialties. */
export function loadRecommendedSeminars(userId: string, focus: DoctorFocus) {
  const city = focus.city || '';
  const state = focus.state || '';
  const specialties = [...(focus.specialties || [])];
  const specialtyKey = specialties.map((item) => item.toLowerCase()).sort().join('|');
  return unstable_cache(
    () => fetchRecommendedSeminars(userId, { city, state, specialties }),
    ['recommended-seminars', userId, city.toLowerCase(), state.toLowerCase(), specialtyKey],
    { revalidate: 600 },
  )();
}

async function hostSeminarIds(userId: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin.from('seminars').select('id').eq('host_id', userId);
  return (data || []).map((row) => row.id);
}

const EMPTY_ANALYTICS = { totalSeminars: 0, totalAttendees: 0, avgRating: 0, reviewCount: 0, totalCEDelivered: 0 };

/** Pass the host's seminar ids when the page already loaded them. A user id fetches those ids once. */
export async function loadEnhancedSeminarAnalytics(userIdOrIds: string | string[]) {
  const seminarIds = Array.isArray(userIdOrIds) ? userIdOrIds : await hostSeminarIds(userIdOrIds);
  if (seminarIds.length === 0) return EMPTY_ANALYTICS;

  const supabase = createServerSupabase();
  const sb = supabase as any;
  const [attendees, reviews, certs] = await Promise.all([
    supabase.from('seminar_registrations').select('id', { count: 'exact', head: true }).in('seminar_id', seminarIds),
    sb.from('seminar_reviews').select('rating').in('seminar_id', seminarIds),
    sb.from('ce_certificates').select('ce_hours').in('seminar_id', seminarIds),
  ]);

  const reviewRows = reviews.data || [];
  const reviewCount = reviewRows.length;
  const avgRating = reviewCount > 0
    ? Number((reviewRows.reduce((sum: number, row: { rating?: number }) => sum + (row.rating || 0), 0) / reviewCount).toFixed(1))
    : 0;
  const totalCEDelivered = (certs.data || []).reduce((sum: number, row: { ce_hours?: number }) => sum + (row.ce_hours || 0), 0);

  return {
    totalSeminars: seminarIds.length,
    totalAttendees: attendees.count || 0,
    avgRating,
    reviewCount,
    totalCEDelivered,
  };
}
