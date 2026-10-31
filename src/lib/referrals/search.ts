import 'server-only';
import { createAdminClient } from '@/lib/supabase-admin';
import { resolveLocation } from '@/lib/resolve-city';
import { boundingBox, isValidCoord } from '@/lib/geo';
import { getThresholds } from '@/lib/thresholds';
import { deriveMembership } from '@/lib/portal/membership';
import { interpretLocation, referralDistance, shouldResolvePlace, type Place } from '@/lib/referrals/pure';
import { hiddenTestUserIds } from '@/lib/profiles/test-users';

export type ReferableDoctor = {
  id: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  clinicName: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  slug: string | null;
  photoUrl: string | null;
  specialties: string[];
  distanceMiles: number | null;
  acceptingNewPatients: boolean;
};

export type ReferralSearchResult = {
  choices: Place[] | null;
  doctors: ReferableDoctor[];
  ms: number;
  label: string;
};

type DoctorRow = {
  id: string;
  user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  clinic_name: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  slug: string | null;
  photo_url: string | null;
  specialties: string[] | null;
  latitude: number | null;
  longitude: number | null;
  accepting_new_patients: boolean | null;
  membership_tier: string | null;
  is_founding_member: boolean | null;
  neuros_tier: string | null;
  created_at: string | null;
  subscription_status: string | null;
  verification_status: string | null;
};

const SELECT = 'id, user_id, first_name, last_name, clinic_name, city, state, country, slug, photo_url, specialties, latitude, longitude, accepting_new_patients, membership_tier, is_founding_member, neuros_tier, created_at, subscription_status, verification_status';

function paid(row: DoctorRow, stripeIds: Set<string>): boolean {
  if (row.verification_status !== 'verified') return false;
  const membership = deriveMembership({
    membershipTier: row.membership_tier,
    isFoundingMember: row.is_founding_member,
    neurosTier: row.neuros_tier,
    createdAt: row.created_at,
    hasStripeCustomer: Boolean(row.user_id && stripeIds.has(row.user_id)),
    stripeStatus: row.user_id && stripeIds.has(row.user_id)
      ? ((row.subscription_status as 'active' | 'trialing' | 'past_due' | 'canceled' | 'none' | null) || 'active')
      : null,
  });
  return membership.tier !== 'free' && membership.status !== 'canceled';
}

function toDoctor(row: DoctorRow, origin: Place | null): ReferableDoctor {
  const distance = origin && isValidCoord(row.latitude, row.longitude)
    ? referralDistance(origin.lat, origin.lng, Number(row.latitude), Number(row.longitude))
    : null;
  return {
    id: row.id,
    userId: row.user_id,
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    clinicName: row.clinic_name,
    city: row.city,
    state: row.state,
    country: row.country,
    slug: row.slug,
    photoUrl: row.photo_url,
    specialties: row.specialties || [],
    distanceMiles: distance,
    acceptingNewPatients: Boolean(row.accepting_new_patients),
  };
}

async function stripeSet(admin: any, userIds: string[]): Promise<Set<string>> {
  if (!userIds.length) return new Set();
  const { data } = await admin.from('profiles').select('id, stripe_customer_id').in('id', userIds);
  const ids = new Set<string>();
  for (const row of data || []) {
    if (row.stripe_customer_id) ids.add(row.id);
  }
  return ids;
}

export async function searchReferableDoctors(input: {
  query: string;
  country?: string;
  selfDoctorId: string;
  specialty?: string | null;
  acceptingOnly?: boolean;
  place?: Place | null;
}): Promise<ReferralSearchResult> {
  const started = Date.now();
  const admin = createAdminClient() as any;
  const query = input.query.trim();
  const country = input.country || 'US';
  const acceptingOnly = input.acceptingOnly !== false;
  let choices: Place[] | null = null;
  let origin: Place | null = input.place || null;

  if (!origin && query && shouldResolvePlace(query)) {
    const resolved = await resolveLocation(query, country);
    const interpreted = interpretLocation(resolved);
    if (interpreted.kind === 'choices') {
      choices = interpreted.choices;
    } else if (interpreted.kind === 'resolved') {
      origin = interpreted.place;
    }
  }

  const thresholds = await getThresholds();
  const radius = thresholds.directory_expansion_2;
  let locationRows: DoctorRow[] = [];
  if (origin) {
    const [minLng, minLat, maxLng, maxLat] = boundingBox(origin.lat, origin.lng, radius);
    let q = admin.from('doctors').select(SELECT)
      .eq('verification_status', 'verified')
      .gte('latitude', minLat)
      .lte('latitude', maxLat)
      .gte('longitude', minLng)
      .lte('longitude', maxLng)
      .neq('id', input.selfDoctorId)
      .limit(200);
    if (acceptingOnly) q = q.eq('accepting_new_patients', true);
    if (input.specialty) q = q.contains('specialties', [input.specialty]);
    const { data } = await q;
    locationRows = (data || []) as DoctorRow[];
  }

  let nameRows: DoctorRow[] = [];
  if (query.length >= 2) {
    const safe = query.replace(/[%_,]/g, '').slice(0, 60);
    if (safe) {
      let q = admin.from('doctors').select(SELECT)
        .eq('verification_status', 'verified')
        .or(`first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,clinic_name.ilike.%${safe}%`)
        .neq('id', input.selfDoctorId)
        .limit(20);
      if (acceptingOnly) q = q.eq('accepting_new_patients', true);
      if (input.specialty) q = q.contains('specialties', [input.specialty]);
      const { data } = await q;
      nameRows = (data || []) as DoctorRow[];
    }
  }

  const merged = new Map<string, DoctorRow>();
  for (const row of [...locationRows, ...nameRows]) merged.set(row.id, row);
  const stripeIds = await stripeSet(admin, [...merged.values()].map((row) => row.user_id).filter(Boolean) as string[]);
  const hidden = new Set(await hiddenTestUserIds());
  const doctors = [...merged.values()]
    .filter((row) => !row.user_id || !hidden.has(row.user_id))
    .filter((row) => paid(row, stripeIds))
    .map((row) => toDoctor(row, origin))
    .filter((row) => row.distanceMiles == null || row.distanceMiles <= radius)
    .sort((a, b) => {
      if (a.distanceMiles == null && b.distanceMiles == null) return a.lastName.localeCompare(b.lastName);
      if (a.distanceMiles == null) return 1;
      if (b.distanceMiles == null) return -1;
      return a.distanceMiles - b.distanceMiles;
    });

  const ms = Date.now() - started;
  console.info(`[referrals] search ${ms}ms results=${doctors.length} choices=${choices?.length || 0}`);
  const label = choices
    ? 'That place is in more than one state. Pick one.'
    : origin
      ? `Doctors near ${origin.city}, ${origin.state}`
      : doctors.length
        ? 'Name matches'
        : 'No matching doctor';
  return { choices, doctors, ms, label };
}
