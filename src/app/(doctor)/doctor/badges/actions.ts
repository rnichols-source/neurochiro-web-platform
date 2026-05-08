'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { BADGE_DEFINITIONS } from '@/lib/badges'

export async function checkAndAwardBadges() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { newlyEarned: [], allBadges: [] };

  const admin = createAdminClient() as any;

  // Fetch all data needed for badge checks
  const [docRes, leadsRes, seminarsRes, jobsRes, ceRes, matchRes] = await Promise.all([
    createAdminClient().from('doctors').select('profile_views, patient_leads, city, state, photo_url, bio, clinic_name, specialties, website_url, instagram_url, facebook_url, video_url').eq('user_id', user.id).single(),
    admin.from('leads').select('id', { count: 'exact', head: true }).eq('doctor_id', user.id),
    createAdminClient().from('seminars').select('id', { count: 'exact', head: true }).eq('host_id', user.id).eq('is_approved', true),
    createAdminClient().from('job_postings').select('id', { count: 'exact', head: true }).eq('doctor_id', user.id),
    admin.from('ce_certificates').select('ce_hours').eq('user_id', user.id),
    admin.from('match_positions').select('id', { count: 'exact', head: true }).eq('doctor_id', user.id),
  ]);

  const doc = docRes.data;
  if (!doc) return { newlyEarned: [], allBadges: [] };

  const ceHours = (ceRes.data || []).reduce((s: number, c: any) => s + (c.ce_hours || 0), 0);

  // Profile completeness check
  const profileComplete = !!(doc.photo_url && doc.bio && doc.bio.length >= 50 && doc.clinic_name && doc.specialties?.length > 0 && doc.website_url);

  // City rank check
  let isTop10 = false;
  if (doc.city && doc.state) {
    const { data: cityDocs } = await createAdminClient()
      .from('doctors')
      .select('profile_views')
      .eq('city', doc.city)
      .eq('state', doc.state)
      .order('profile_views', { ascending: false })
      .limit(10);
    if (cityDocs) {
      const minTop10Views = cityDocs.length >= 10 ? (cityDocs[9].profile_views || 0) : 0;
      isTop10 = (doc.profile_views || 0) >= minTop10Views && cityDocs.length >= 10;
    }
  }

  // Check conditions
  const earned: string[] = [];
  if (profileComplete) earned.push('profile_complete');
  if ((doc.profile_views || 0) >= 100) earned.push('first_100_views');
  if ((leadsRes.count || 0) >= 10) earned.push('lead_magnet');
  if ((seminarsRes.count || 0) >= 1) earned.push('seminar_host');
  if ((jobsRes.count || 0) >= 3) earned.push('hiring_pro');
  if (ceHours >= 20) earned.push('ce_champion');
  if ((matchRes.count || 0) >= 1) earned.push('chiromatch_participant');
  if (isTop10) earned.push('top_10');

  // Get existing badges
  const { data: existing } = await admin.from('doctor_badges').select('badge_id').eq('user_id', user.id);
  const existingIds = new Set((existing || []).map((b: any) => b.badge_id));

  // Award new badges
  const newlyEarned: string[] = [];
  for (const badgeId of earned) {
    if (!existingIds.has(badgeId)) {
      await admin.from('doctor_badges').insert({ user_id: user.id, badge_id: badgeId });
      newlyEarned.push(badgeId);
    }
  }

  // Return all badges
  const { data: allBadges } = await admin.from('doctor_badges').select('badge_id, earned_at').eq('user_id', user.id).order('earned_at', { ascending: false });

  return { newlyEarned, allBadges: allBadges || [] };
}

export async function getDoctorBadges() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { earned: [], total: 0 };

  const admin = createAdminClient() as any;
  const { data } = await admin.from('doctor_badges').select('badge_id, earned_at').eq('user_id', user.id).order('earned_at', { ascending: false });

  return { earned: data || [], total: BADGE_DEFINITIONS.length };
}
