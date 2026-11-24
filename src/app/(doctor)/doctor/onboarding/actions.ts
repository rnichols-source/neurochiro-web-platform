'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { selectedDoctorIdFor } from '@/lib/portal/selected-doctor'

export async function completeOnboarding() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Mark onboarding complete
  await (supabase as any).from('profiles').update({
    onboarding_completed_at: new Date().toISOString(),
  }).eq('id', user.id);

  // Profile onboarding complete — verification happens after onboarding call with Dr. Ray
  const admin = createAdminClient();
  const doctorId = await selectedDoctorIdFor(user.id);
  if (!doctorId) return { error: 'Doctor profile not found' };
  await admin.from('doctors').update({
    verification_status: 'pending',
  } as any).eq('id', doctorId).eq('user_id', user.id);

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
  const doctorId = await selectedDoctorIdFor(user.id);
  if (!doctorId) return { error: 'Doctor profile not found' };
  const updateData: any = { specialties: data.specialties };
  if (data.bio) updateData.bio = data.bio;

  await admin.from('doctors').update(updateData).eq('id', doctorId).eq('user_id', user.id);
  return { success: true };
}
