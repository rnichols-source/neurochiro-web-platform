'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function completeOnboarding() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Mark onboarding complete
  await (supabase as any).from('profiles').update({
    is_first_login: false,
    onboarding_completed_at: new Date().toISOString(),
  }).eq('id', user.id);

  // Set doctor as verified
  await createAdminClient().from('doctors').update({
    verification_status: 'verified',
  } as any).eq('user_id', user.id);

  return { success: true };
}

export async function updateOnboardingProfile(data: {
  specialties: string[];
  bio?: string;
}) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const admin = createAdminClient();
  const updateData: any = { specialties: data.specialties };
  if (data.bio) updateData.bio = data.bio;

  await admin.from('doctors').update(updateData).eq('user_id', user.id);
  return { success: true };
}
