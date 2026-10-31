'use server';

import { createServerSupabase } from '@/lib/supabase-server';
import { loadShell } from '@/lib/portal/shell';

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
  specialties: string[];
};

export type PortalShellData = {
  fullName: string | null;
  initials: string;
  doctor: PortalShellDoctor | null;
  profileTier: string | null;
  unreadNotifications: number;
  unreadMessages: number;
};

export async function getPortalShellData(): Promise<PortalShellData | null> {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const shell = await loadShell(user);
  const { countUnread } = await import('@/lib/messaging/db');
  const unread = await countUnread(user.id);

  return {
    fullName: shell.fullName,
    initials: shell.initials,
    doctor: shell.doctor,
    profileTier: shell.profileTier,
    unreadNotifications: unread.notificationsExcludingMessages || 0,
    unreadMessages: unread.messages || 0,
  };
}
