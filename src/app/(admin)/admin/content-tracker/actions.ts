'use server'

import { createAdminClient } from '@/lib/supabase-admin';
import { checkAdminAuth } from '@/lib/admin-auth';

export async function getContentTrackerData() {
  await checkAdminAuth();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('doctors')
    .select('id, user_id, first_name, last_name, email, city, state, membership_tier, is_founding_member, is_approved, onboarding_call_status, spotlight_status, spotlight_date, spotlight_youtube_url, live_feature_status, live_feature_date, content_created, last_featured_date, times_featured')
    .not('user_id', 'is', null)
    .order('last_name', { ascending: true });

  if (error) {
    console.error('Content tracker error:', error);
    return [];
  }

  return data || [];
}

export async function updateDoctorTracking(doctorId: string, updates: {
  spotlight_status?: string;
  spotlight_date?: string | null;
  spotlight_youtube_url?: string | null;
  live_feature_status?: string;
  live_feature_date?: string | null;
  content_created?: boolean;
  last_featured_date?: string | null;
  times_featured?: number;
}) {
  await checkAdminAuth();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('doctors')
    .update(updates as any)
    .eq('id', doctorId);

  if (error) {
    console.error('Update tracking error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
