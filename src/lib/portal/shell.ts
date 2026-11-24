import 'server-only';
import { createAdminClient } from '@/lib/supabase-admin';
import { listingLabel } from '@/lib/portal/listings';
import { portalListingsForUser, readSelectedDoctor } from '@/lib/portal/selected-doctor';
import type { LoadedShell } from '@/lib/portal/context-assemble';
import type { PortalDoctor, PortalListing } from '@/lib/portal/types';

const DOCTOR_COLUMNS =
  'id, slug, clinic_name, membership_tier, is_founding_member, neuros_tier, created_at, is_approved, onboarding_call_status, profile_views, city, state, country, specialties, subscription_status';
const DOCTOR_COLUMNS_FALLBACK =
  'id, slug, clinic_name, membership_tier, is_founding_member, neuros_tier, created_at, is_approved, onboarding_call_status, profile_views, city, state, country, specialties';

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
  specialties?: string[] | null;
  subscription_status?: string | null;
};

function initialsFrom(fullName: string | null): string {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return (parts[0]?.[0] || '--').toUpperCase();
}

function toDoctor(row: DoctorRow | null): PortalDoctor | null {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    clinic_name: row.clinic_name,
    membership_tier: row.membership_tier,
    is_founding_member: Boolean(row.is_founding_member),
    neuros_tier: row.neuros_tier ?? null,
    created_at: row.created_at,
    is_approved: row.is_approved === true,
    onboarding_call_status: row.onboarding_call_status ?? null,
    profile_views: row.profile_views || 0,
    city: row.city ?? null,
    state: row.state ?? null,
    country: row.country ?? null,
    specialties: Array.isArray(row.specialties) ? row.specialties : [],
  };
}

function toListing(row: { id: string; city?: string | null; clinic_name?: string | null; first_name?: string | null; last_name?: string | null }): PortalListing {
  return {
    id: row.id,
    label: listingLabel(row),
    city: row.city ?? null,
    clinicName: row.clinic_name ?? null,
  };
}

/** Profiles and the selected listing. Used by the portal context and by the shell server action. */
export async function loadShell(user: { id: string }): Promise<LoadedShell> {
  const admin = createAdminClient();
  const [profileRes, portal] = await Promise.all([
    admin.from('profiles').select('full_name, tier, stripe_customer_id, role').eq('id', user.id).maybeSingle(),
    portalListingsForUser(user.id),
  ]);
  let doctorRow: DoctorRow | null = null;
  let subscriptionStatus: string | null = null;
  if (portal.selected?.id) {
    const full = await readSelectedDoctor<DoctorRow>(user.id, DOCTOR_COLUMNS);
    if (full.error) {
      const fallback = await readSelectedDoctor<DoctorRow>(user.id, DOCTOR_COLUMNS_FALLBACK);
      doctorRow = fallback.data;
      subscriptionStatus = null;
    } else {
      doctorRow = full.data;
      subscriptionStatus = doctorRow?.subscription_status ?? null;
    }
  }
  const fullName = profileRes.data?.full_name ?? null;
  return {
    fullName,
    initials: initialsFrom(fullName),
    doctor: toDoctor(doctorRow),
    listings: portal.listings.map(toListing),
    profileTier: profileRes.data?.tier ?? null,
    role: (profileRes.data as { role?: string | null } | null)?.role ?? null,
    stripeCustomerId: profileRes.data?.stripe_customer_id ?? null,
    subscriptionStatus,
  };
}
