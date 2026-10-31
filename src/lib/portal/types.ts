import type { Membership } from '@/lib/portal/membership';
import type { PortalNavItem } from '@/lib/portal/features';

export type PortalDoctor = {
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

/** Serializable portal context. Safe to pass into client components. */
export type PortalContextValue = {
  userId: string;
  email: string | null;
  fullName: string | null;
  initials: string;
  doctor: PortalDoctor | null;
  membership: Membership;
  unreadNotifications: number;
  unreadMessages: number;
  hasPurchase: boolean;
  chiroMatchOpen: boolean;
  nav: PortalNavItem[];
  comingSoonCount: number;
};
