'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { BADGE_DEFINITIONS } from '@/lib/badges'
import { loadEarnedBadgeIds } from '@/lib/badges/compute'
import { readSelectedDoctor } from '@/lib/portal/selected-doctor'

export async function checkAndAwardBadges() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { newlyEarned: [], allBadges: [] };

  const admin = createAdminClient() as any;
  const { data: doc } = await readSelectedDoctor<{
    id: string
    user_id?: string | null
    profile_views?: number | null
    city?: string | null
    state?: string | null
    photo_url?: string | null
    bio?: string | null
    clinic_name?: string | null
    specialties?: string[] | null
    website_url?: string | null
  }>(user.id, 'id, user_id, profile_views, city, state, photo_url, bio, clinic_name, specialties, website_url');
  if (!doc) return { newlyEarned: [], allBadges: [] };

  const earned = await loadEarnedBadgeIds({ ...doc, user_id: doc.user_id || user.id });

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
