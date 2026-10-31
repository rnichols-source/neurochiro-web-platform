'use server';

import { createAdminClient } from '@/lib/supabase-admin';
import { createServerSupabase } from '@/lib/supabase-server';

export type PortalShellDoctor = {
  id: string;
  slug: string | null;
  clinic_name: string | null;
  membership_tier: string | null;
  is_founding_member: boolean;
  neuros_tier: string | null;
  created_at: string | null;
  is_approved: boolean;
  onboarding_call_status: string | null;
  profile_views: number;
  city: string | null;
  state: string | null;
  country: string | null;
};

export type PortalShellData = {
  fullName: string | null;
  initials: string;
  doctor: PortalShellDoctor | null;
  profileTier: string | null;
  unreadNotifications: number;
  unreadMessages: number;
};

type DoctorRow = {
  id: string;
  slug: string | null;
  clinic_name: string | null;
  membership_tier: string | null;
  is_founding_member: boolean | null;
  neuros_tier: string | null;
  created_at: string | null;
  is_approved: boolean | null;
  onboarding_call_status: string | null;
  profile_views: number | null;
  city: string | null;
  state: string | null;
  country: string | null;
};

function initialsFrom(fullName: string | null): string {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return (parts[0]?.[0] || '--').toUpperCase();
}

export async function getPortalShellData(): Promise<PortalShellData | null> {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, tier')
    .eq('id', user.id)
    .maybeSingle();

  const { data: doctorRow } = await (admin.from('doctors') as any)
    .select('id, slug, clinic_name, membership_tier, is_founding_member, neuros_tier, created_at, is_approved, onboarding_call_status, profile_views, city, state, country')
    .eq('user_id', user.id)
    .maybeSingle() as { data: DoctorRow | null };

  const { countUnread } = await import('@/lib/messaging/db');
  const unread = await countUnread(user.id);
  const unreadNotifications = unread.notificationsExcludingMessages;
  const unreadMessages = unread.messages;

  const fullName = profile?.full_name ?? null;

  return {
    fullName,
    initials: initialsFrom(fullName),
    doctor: doctorRow
      ? {
          id: doctorRow.id,
          slug: doctorRow.slug,
          clinic_name: doctorRow.clinic_name,
          membership_tier: doctorRow.membership_tier,
          is_founding_member: Boolean(doctorRow.is_founding_member),
          neuros_tier: doctorRow.neuros_tier ?? null,
          created_at: doctorRow.created_at,
          is_approved: doctorRow.is_approved === true,
          onboarding_call_status: doctorRow.onboarding_call_status ?? null,
          profile_views: doctorRow.profile_views || 0,
          city: doctorRow.city ?? null,
          state: doctorRow.state ?? null,
          country: doctorRow.country ?? null,
        }
      : null,
    profileTier: profile?.tier ?? null,
    unreadNotifications: unreadNotifications || 0,
    unreadMessages: unreadMessages || 0,
  };
}
