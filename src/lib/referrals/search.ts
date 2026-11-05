import 'server-only';
import { createAdminClient } from '@/lib/supabase-admin';
import { resolveLocation } from '@/lib/resolve-city';
import { boundingBox, isValidCoord } from '@/lib/geo';
import { getThresholds } from '@/lib/thresholds';
import { deriveMembership } from '@/lib/portal/membership';
import {
  blockedSearchNote,
  interpretLocation,
  looksLikePostal,
  nameNeedles,
  placeLabel,
  referralBlockReason,
  referralCountry,
  referralDistance,
  searchCountryForQuery,
  shouldResolvePlace,
  type Place,
} from '@/lib/referrals/pure';
import { hiddenTestUserIds } from '@/lib/profiles/test-users';
import { REFERRAL_DOCTOR_SELECT } from '@/lib/referrals/columns';

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
  unavailableReason?: string | null;
};

export type ReferralSearchResult = {
  choices: Place[] | null;
  doctors: ReferableDoctor[];
  ms: number;
  label: string;
  note: string;
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
  verification_status: string | null;
};

const SELECT = REFERRAL_DOCTOR_SELECT;

function membershipOf(row: DoctorRow, stripeIds: Set<string>) {
  const hasStripe = Boolean(row.user_id && stripeIds.has(row.user_id));
  return deriveMembership({
    membershipTier: row.membership_tier,
    isFoundingMember: row.is_founding_member,
    neurosTier: row.neuros_tier,
    createdAt: row.created_at,
    hasStripeCustomer: hasStripe,
    // No subscription_status column exists. A Stripe customer stays active, which is the old null-status fallback.
    stripeStatus: hasStripe ? 'active' : null,
  });
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

function matchesSpecialty(row: DoctorRow, specialty: string | null | undefined): boolean {
  const needle = (specialty || '').trim().toLowerCase();
  if (!needle) return true;
  return (row.specialties || []).some((item) => item.toLowerCase().includes(needle));
}

function applyCountry(query: any, country: string) {
  const iso = referralCountry(country);
  if (iso === 'ALL') return query;
  if (iso === 'US') return query.or('country.is.null,country.eq.US,country.eq.USA');
  if (iso === 'GB') return query.in('country', ['GB', 'UK']);
  return query.eq('country', iso);
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

async function runQuery(build: () => any): Promise<DoctorRow[]> {
  const { data, error } = await build();
  if (error) {
    console.error('[referrals] doctor query failed', error.code || '', error.message || '');
    return [];
  }
  return (data || []) as DoctorRow[];
}

async function resolveQueryPlace(query: string, country: string): Promise<{ origin: Place | null; choices: Place[] | null }> {
  const compact = query.replace(/\s+/g, '');
  if (country === 'ALL' && /^\d{6}$/.test(compact)) {
    const places: Place[] = [];
    for (const code of ['IN', 'SG']) {
      const resolved = await resolveLocation(query, code);
      const interpreted = interpretLocation(resolved);
      if (interpreted.kind === 'resolved') places.push(interpreted.place);
      if (interpreted.kind === 'choices') places.push(...interpreted.choices);
    }
    const unique = new Map<string, Place>();
    for (const place of places) unique.set(`${place.city}|${place.state}|${place.lat}|${place.lng}`, place);
    const list = [...unique.values()];
    if (list.length > 1) return { origin: null, choices: list };
    if (list.length === 1) return { origin: list[0], choices: null };
    return { origin: null, choices: null };
  }
  const resolved = await resolveLocation(query, country === 'ALL' ? 'US' : country);
  const interpreted = interpretLocation(resolved);
  if (interpreted.kind === 'choices') return { origin: null, choices: interpreted.choices };
  if (interpreted.kind === 'resolved') return { origin: interpreted.place, choices: null };
  return { origin: null, choices: null };
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
  const country = searchCountryForQuery(input.country || 'US', query);
  const acceptingOnly = input.acceptingOnly === true;
  let choices: Place[] | null = null;
  let origin: Place | null = input.place || null;

  if (!origin && query && shouldResolvePlace(query, country)) {
    const resolved = await resolveQueryPlace(query, country);
    choices = resolved.choices;
    origin = resolved.origin;
  }

  const thresholds = await getThresholds();
  const radius = thresholds.directory_expansion_2;
  let locationRows: DoctorRow[] = [];
  if (origin) {
    const [minLng, minLat, maxLng, maxLat] = boundingBox(origin.lat, origin.lng, radius);
    locationRows = await runQuery(() => {
      let q = admin.from('doctors').select(SELECT)
        .gte('latitude', minLat)
        .lte('latitude', maxLat)
        .gte('longitude', minLng)
        .lte('longitude', maxLng)
        .neq('id', input.selfDoctorId)
        .limit(200);
      q = applyCountry(q, country);
      return q;
    });
  }

  let nameRows: DoctorRow[] = [];
  const needles = nameNeedles(query);
  if (needles.full.length >= 2 && !looksLikePostal(query, country)) {
    const like = `%${needles.full}%`;
    const batches = await Promise.all([
      runQuery(() => applyCountry(admin.from('doctors').select(SELECT).ilike('first_name', like).neq('id', input.selfDoctorId).limit(20), country)),
      runQuery(() => applyCountry(admin.from('doctors').select(SELECT).ilike('last_name', like).neq('id', input.selfDoctorId).limit(20), country)),
      runQuery(() => applyCountry(admin.from('doctors').select(SELECT).ilike('clinic_name', like).neq('id', input.selfDoctorId).limit(20), country)),
    ]);
    nameRows = batches.flat();
    if (needles.first && needles.last) {
      nameRows.push(...await runQuery(() => applyCountry(
        admin.from('doctors').select(SELECT)
          .ilike('first_name', `%${needles.first}%`)
          .ilike('last_name', `%${needles.last}%`)
          .neq('id', input.selfDoctorId)
          .limit(20),
        country,
      )));
    }
  }

  let postalRows: DoctorRow[] = [];
  if (looksLikePostal(query, country)) {
    const code = query.replace(/\s+/g, '');
    postalRows = await runQuery(() => applyCountry(
      admin.from('doctors').select(SELECT).ilike('zip_code', code).neq('id', input.selfDoctorId).limit(20),
      country,
    ));
  }

  const merged = new Map<string, DoctorRow>();
  for (const row of [...locationRows, ...nameRows, ...postalRows]) merged.set(row.id, row);
  const stripeIds = await stripeSet(admin, [...merged.values()].map((row) => row.user_id).filter(Boolean) as string[]);
  const hidden = new Set(await hiddenTestUserIds());
  const blocked: Array<'unapproved' | 'inactive' | 'no-account'> = [];
  const referable = [...merged.values()]
    .filter((row) => matchesSpecialty(row, input.specialty))
    .filter((row) => {
      const membership = membershipOf(row, stripeIds);
      const reason = referralBlockReason({
        doctorId: row.id,
        selfDoctorId: input.selfDoctorId,
        userId: row.user_id,
        verificationStatus: row.verification_status,
        membershipTier: membership.tier,
        membershipStatus: membership.status,
        hidden: Boolean(row.user_id && hidden.has(row.user_id)),
      });
      if (reason === 'unapproved' || reason === 'inactive' || reason === 'no-account') blocked.push(reason);
      return reason === null;
    })
    .map((row) => toDoctor(row, origin))
    .filter((row) => row.distanceMiles == null || row.distanceMiles <= radius);
  const doctors = referable
    .filter((row) => !acceptingOnly || row.acceptingNewPatients)
    .sort((a, b) => {
      if (a.distanceMiles == null && b.distanceMiles == null) return a.lastName.localeCompare(b.lastName);
      if (a.distanceMiles == null) return 1;
      if (b.distanceMiles == null) return -1;
      return a.distanceMiles - b.distanceMiles;
    });
  const acceptingHid = acceptingOnly && doctors.length === 0 && referable.length > 0;

  const ms = Date.now() - started;
  console.info(`[referrals] search ${ms}ms results=${doctors.length} choices=${choices?.length || 0}`);
  const note = doctors.length
    ? ''
    : acceptingHid
      ? 'No doctors there are marked as accepting new patients. Turn off that filter to see every active member.'
      : blockedSearchNote(blocked);
  const label = choices
    ? 'That place is in more than one area. Pick one.'
    : origin
      ? `Doctors near ${placeLabel(origin) || 'that place'}`
      : doctors.length
        ? 'Name matches'
        : note;
  return { choices, doctors, ms, label, note };
}

export async function receiverBlockReason(admin: any, doctorId: string, selfDoctorId: string): Promise<string | null> {
  const { data } = await admin.from('doctors').select(SELECT).eq('id', doctorId).maybeSingle();
  if (!data) return 'That doctor was not found.';
  const row = data as DoctorRow;
  const stripeIds = await stripeSet(admin, row.user_id ? [row.user_id] : []);
  const hidden = new Set(await hiddenTestUserIds());
  const membership = membershipOf(row, stripeIds);
  const reason = referralBlockReason({
    doctorId: row.id,
    selfDoctorId,
    userId: row.user_id,
    verificationStatus: row.verification_status,
    membershipTier: membership.tier,
    membershipStatus: membership.status,
    hidden: Boolean(row.user_id && hidden.has(row.user_id)),
  });
  if (reason === 'self') return 'Pick another doctor. You cannot refer a patient to yourself.';
  if (reason === 'unapproved') return 'That doctor is not approved yet, so they cannot take a referral.';
  if (reason === 'inactive') return 'That doctor is not an active member, so they cannot take a referral.';
  if (reason === 'no-account' || reason === 'hidden') return 'That doctor cannot receive referrals yet.';
  return null;
}
