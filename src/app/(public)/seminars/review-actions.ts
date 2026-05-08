'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function getSeminarReviews(seminarId: string) {
  const admin = createAdminClient() as any;
  const { data, error } = await admin
    .from('seminar_reviews')
    .select('id, rating, review_text, created_at, reviewer_id')
    .eq('seminar_id', seminarId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !data) return [];

  // Get reviewer info (could be doctors or students)
  const reviewerIds = data.map((r: any) => r.reviewer_id);
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name, avatar_url, role')
    .in('id', reviewerIds);

  const { data: doctors } = await (createAdminClient())
    .from('doctors')
    .select('user_id, first_name, last_name, clinic_name, photo_url')
    .in('user_id', reviewerIds);

  const profileMap: Map<string, any> = new Map((profiles || []).map((p: any) => [p.id, p]));
  const doctorMap: Map<string, any> = new Map((doctors || []).map((d: any) => [d.user_id, d]));

  return data.map((r: any) => {
    const profile = profileMap.get(r.reviewer_id);
    const doctor = doctorMap.get(r.reviewer_id);
    return {
      id: r.id,
      rating: r.rating,
      reviewText: r.review_text,
      createdAt: r.created_at,
      reviewer: doctor ? {
        name: `Dr. ${doctor.first_name} ${doctor.last_name}`,
        subtitle: doctor.clinic_name,
        photoUrl: doctor.photo_url,
      } : {
        name: profile?.full_name || 'NeuroChiro Member',
        subtitle: profile?.role === 'student' ? 'Student' : null,
        photoUrl: profile?.avatar_url,
      },
    };
  });
}

export async function submitSeminarReview(seminarId: string, rating: number, reviewText: string) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Verify user attended this seminar (has a registration record)
  const admin = createAdminClient() as any;
  const { data: registration } = await admin
    .from('seminar_registrations')
    .select('id')
    .eq('seminar_id', seminarId)
    .or(`profile_id.eq.${user.id},user_id.eq.${user.id}`)
    .maybeSingle();

  if (!registration) {
    return { error: 'Only registered attendees can review seminars' };
  }

  const { error } = await admin
    .from('seminar_reviews')
    .upsert({
      seminar_id: seminarId,
      reviewer_id: user.id,
      rating,
      review_text: reviewText.slice(0, 1000),
    }, { onConflict: 'seminar_id,reviewer_id' });

  if (error) return { error: error.message };
  return { success: true };
}

export async function getSeminarAverageRating(seminarId: string) {
  const admin = createAdminClient() as any;
  const { data } = await admin
    .from('seminar_reviews')
    .select('rating')
    .eq('seminar_id', seminarId);

  if (!data || data.length === 0) return { avg: 0, count: 0 };
  const sum = data.reduce((s: number, r: any) => s + r.rating, 0);
  return { avg: Number((sum / data.length).toFixed(1)), count: data.length };
}
