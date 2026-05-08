'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function getBoostStatus() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: doc } = await (createAdminClient() as any)
    .from('doctors')
    .select('is_boosted, boost_expires_at, membership_tier')
    .eq('user_id', user.id)
    .single();

  if (!doc) return null;

  const isActive = doc.is_boosted && doc.boost_expires_at && new Date(doc.boost_expires_at) > new Date();
  const daysLeft = isActive ? Math.ceil((new Date(doc.boost_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  return {
    isActive,
    daysLeft,
    expiresAt: doc.boost_expires_at,
    tier: doc.membership_tier,
    isFree: doc.membership_tier === 'pro',
  };
}

export async function boostProfile() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const admin = createAdminClient() as any;
  const { data: doc } = await admin
    .from('doctors')
    .select('membership_tier, is_boosted, boost_expires_at')
    .eq('user_id', user.id)
    .single();

  if (!doc) return { error: 'Doctor profile not found' };

  // Check if already boosted
  if (doc.is_boosted && doc.boost_expires_at && new Date(doc.boost_expires_at) > new Date()) {
    return { error: 'Profile is already boosted' };
  }

  // Pro tier gets free boost
  if (doc.membership_tier === 'pro') {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await admin
      .from('doctors')
      .update({ is_boosted: true, boost_expires_at: expiresAt } as any)
      .eq('user_id', user.id);

    if (error) return { error: error.message };
    return { success: true, expiresAt };
  }

  // Non-pro tiers: for now, allow boost (Stripe payment can be added later)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await admin
    .from('doctors')
    .update({ is_boosted: true, boost_expires_at: expiresAt } as any)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  return { success: true, expiresAt };
}
