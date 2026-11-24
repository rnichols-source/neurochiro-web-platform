'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { readSelectedDoctor, selectedDoctorIdFor } from '@/lib/portal/selected-doctor'

export async function getBoostStatus() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: doc } = await readSelectedDoctor<{
    is_boosted?: boolean | null
    boost_expires_at?: string | null
    membership_tier?: string | null
  }>(user.id, 'is_boosted, boost_expires_at, membership_tier');

  if (!doc) return null;

  const expiresAt = doc.boost_expires_at || null;
  const isActive = Boolean(doc.is_boosted && expiresAt && new Date(expiresAt) > new Date());
  const daysLeft = isActive && expiresAt ? Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  return {
    isActive,
    daysLeft,
    expiresAt,
    tier: doc.membership_tier,
    isFree: doc.membership_tier === 'pro',
  };
}

export async function boostProfile() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const admin = createAdminClient() as any;
  const { data: doc } = await readSelectedDoctor<{
    membership_tier?: string | null
    is_boosted?: boolean | null
    boost_expires_at?: string | null
  }>(user.id, 'membership_tier, is_boosted, boost_expires_at');

  if (!doc) return { error: 'Doctor profile not found' };

  // Check if already boosted
  if (doc.is_boosted && doc.boost_expires_at && new Date(doc.boost_expires_at) > new Date()) {
    return { error: 'Profile is already boosted' };
  }

  // Pro tier gets free boost
  if (doc.membership_tier === 'pro') {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const doctorId = await selectedDoctorIdFor(user.id);
    if (!doctorId) return { error: 'Doctor profile not found' };
    const { error } = await admin
      .from('doctors')
      .update({ is_boosted: true, boost_expires_at: expiresAt } as any)
      .eq('id', doctorId)
      .eq('user_id', user.id);

    if (error) return { error: error.message };
    return { success: true, expiresAt };
  }

  // Non-pro tiers: for now, allow boost (Stripe payment can be added later)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const doctorId = await selectedDoctorIdFor(user.id);
  if (!doctorId) return { error: 'Doctor profile not found' };
  const { error } = await admin
    .from('doctors')
    .update({ is_boosted: true, boost_expires_at: expiresAt } as any)
    .eq('id', doctorId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  return { success: true, expiresAt };
}
