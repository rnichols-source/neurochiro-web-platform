import 'server-only';
import { createAdminClient } from '@/lib/supabase-admin';
import { resolveLocation } from '@/lib/resolve-city';
import { boundingBox, isValidCoord } from '@/lib/geo';
import { deriveMembership } from '@/lib/portal/membership';
import {
  blockedSearchNote,
  interpretLocation,
  looksLikePostal,
  nameMatchSkipsPlace,
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
import { resolveFastPlace } from '@/lib/founder/geo-search';
import { countryStoredValues, matchCountry } from '@/lib/geo/country-alias';
import { THRESHOLD_DEFAULTS } from '@/lib/thresholds';

const GENERIC_NAME = new Set(['chiropractic', 'chiropractor', 'clinic', 'centre', 'center', 'office', 'the', 'and', 'of'])
const geoCache = new Map<string, { at: number; value: Awaited<ReturnType<typeof resolveFastPlace>> }>()

async function cachedGrowth(query: string) {
  const key = query.trim().toLowerCase()
  const hit = geoCache.get(key)
  if (hit && Date.now() - hit.at < 86_400_000) return hit.value
  const value = await resolveFastPlace(query).catch(() => null)
  if (value?.resolved || value?.choices?.length) geoCache.set(key, { at: Date.now(), value })
  return value
}

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
  return query.in('country', countryStoredValues(iso));
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
  /** Test doctors can refer to other test doctors. Public search still hides them. */
  allowTestDoctors?: boolean;
}): Promise<ReferralSearchResult> {
  const started = Date.now();
  const admin = createAdminClient() as any;
  const query = input.query.trim();
  let country = searchCountryForQuery(input.country || 'US', query);
  const acceptingOnly = input.acceptingOnly === true;
  let origin: Place | null = input.place || null;
  const nameIds = new Set<string>();

  const needles = nameNeedles(query);
  const nameJobs: Array<Promise<DoctorRow[]>> = [];
  if (needles.full.length >= 2 && !looksLikePostal(query, 'ALL')) {
    const like = `%${needles.full}%`;
    nameJobs.push(runQuery(() => admin.from('doctors').select(SELECT).ilike('first_name', like).neq('id', input.selfDoctorId).limit(20)));
    nameJobs.push(runQuery(() => admin.from('doctors').select(SELECT).ilike('last_name', like).neq('id', input.selfDoctorId).limit(20)));
    nameJobs.push(runQuery(() => admin.from('doctors').select(SELECT).ilike('clinic_name', like).neq('id', input.selfDoctorId).limit(20)));
    if (needles.first && needles.last) {
      nameJobs.push(runQuery(() => admin.from('doctors').select(SELECT)
        .ilike('first_name', `%${needles.first}%`)
        .ilike('last_name', `%${needles.last}%`)
        .neq('id', input.selfDoctorId)
        .limit(20)));
    }
    for (const token of needles.full.split(' ').filter((word) => word.length >= 4 && !GENERIC_NAME.has(word.toLowerCase())).slice(0, 2)) {
      nameJobs.push(runQuery(() => admin.from('doctors').select(SELECT).ilike('clinic_name', `%${token}%`).neq('id', input.selfDoctorId).limit(15)));
      nameJobs.push(runQuery(() => admin.from('doctors').select(SELECT).ilike('last_name', `%${token}%`).neq('id', input.selfDoctorId).limit(15)));
    }
  }
  let nameRows = (await Promise.all(nameJobs)).flat();
  for (const row of nameRows) nameIds.add(row.id);
  const skipPlace = nameMatchSkipsPlace(query, nameRows.map((row) => ({
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    clinicName: row.clinic_name,
  })));

  const namedCountry = !looksLikePostal(query, 'ALL') ? matchCountry(query) : null;
  if (namedCountry) {
    nameRows = [];
    nameIds.clear();
  }
  let locationRows: DoctorRow[] = [];
  if (namedCountry) {
    country = referralCountry(namedCountry.iso2);
    locationRows = await runQuery(() => applyCountry(
      admin.from('doctors').select(SELECT).neq('id', input.selfDoctorId).limit(40),
      country,
    ));
  } else if (!skipPlace && !origin && query && (shouldResolvePlace(query, 'ALL') || looksLikePostal(query, 'ALL'))) {
    const growth = await cachedGrowth(query);
    if (growth?.choices?.length) {
      return {
        choices: growth.choices.map((choice) => ({ city: choice.query || choice.label, state: '', lat: 0, lng: 0 })),
        doctors: [],
        ms: Date.now() - started,
        label: growth.message || 'More than one place matches. Pick one.',
        note: 'You can refer a community member to a NeuroChiro doctor anywhere in the world.',
      };
    }
    if (growth?.resolved) {
      origin = {
        city: growth.resolved.city,
        state: growth.resolved.state,
        lat: growth.resolved.lat,
        lng: growth.resolved.lng,
      };
      if (growth.resolved.country) country = referralCountry(growth.resolved.country);
    }
  }

  const radius = THRESHOLD_DEFAULTS.directory_expansion_2;
  const wide = Math.max(radius * 12, 3000);
  if (!namedCountry && origin) {
    const [minLng, minLat, maxLng, maxLat] = boundingBox(origin.lat, origin.lng, wide);
    locationRows = await runQuery(() => {
      let q = admin.from('doctors').select(SELECT)
        .gte('latitude', minLat)
        .lte('latitude', maxLat)
        .gte('longitude', minLng)
        .lte('longitude', maxLng)
        .neq('id', input.selfDoctorId)
        .limit(80);
      q = applyCountry(q, country);
      return q;
    });
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
  const userIds = [...merged.values()].map((row) => row.user_id).filter(Boolean) as string[];
  const [stripeIds, hiddenList] = await Promise.all([stripeSet(admin, userIds), hiddenTestUserIds()]);
  const hidden = new Set(hiddenList);
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
        hidden: !input.allowTestDoctors && Boolean(row.user_id && hidden.has(row.user_id)),
      });
      if (reason === 'unapproved' || reason === 'inactive' || reason === 'no-account') blocked.push(reason);
      return reason === null;
    })
    .map((row) => toDoctor(row, origin));
  const byDistance = (a: ReferableDoctor, b: ReferableDoctor) => {
    if (a.distanceMiles == null) return 1;
    if (b.distanceMiles == null) return -1;
    return a.distanceMiles - b.distanceMiles;
  };
  const names = referable.filter((row) => nameIds.has(row.id));
  const local = referable.filter((row) => !nameIds.has(row.id));
  const inRange = local.filter((row) => row.distanceMiles == null || row.distanceMiles <= radius);
  const placePool = inRange.length ? inRange : local.slice().sort(byDistance).slice(0, 8);
  const seen = new Set<string>();
  const pool: ReferableDoctor[] = [];
  for (const row of [...names, ...placePool]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    pool.push(row);
  }
  const doctors = pool
    .filter((row) => !acceptingOnly || row.acceptingNewPatients)
    .sort((a, b) => {
      if (a.distanceMiles == null && b.distanceMiles == null) return a.lastName.localeCompare(b.lastName);
      if (a.distanceMiles == null) return 1;
      if (b.distanceMiles == null) return -1;
      return a.distanceMiles - b.distanceMiles;
    });
  const acceptingHid = acceptingOnly && doctors.length === 0 && referable.length > 0;

  const ms = Date.now() - started;
  console.info(`[referrals] search ${ms}ms results=${doctors.length}`);
  const note = doctors.length
    ? ''
    : acceptingHid
      ? 'No doctors there are marked as accepting new community members. Turn off that filter to see every active member.'
      : blockedSearchNote(blocked);
  const showingNearest = inRange.length === 0 && pool.length > 0 && Boolean(origin);
  const where = origin ? placeLabel(origin) : '';
  const label = namedCountry
    ? `Doctors in ${namedCountry.name}`
    : showingNearest
      ? `Nearest doctors to ${where || 'that place'}`
      : origin
        ? `Doctors near ${where || 'that place'}`
        : doctors.length
          ? 'Name matches'
          : note;
  return { choices: null, doctors, ms, label, note };
}

export async function receiverBlockReason(admin: any, doctorId: string, selfDoctorId: string): Promise<string | null> {
  const { data } = await admin.from('doctors').select(SELECT).eq('id', doctorId).maybeSingle();
  if (!data) return 'That doctor was not found.';
  const row = data as DoctorRow;
  const stripeIds = await stripeSet(admin, row.user_id ? [row.user_id] : []);
  const hidden = new Set(await hiddenTestUserIds());
  const self = await admin.from('doctors').select('user_id').eq('id', selfDoctorId).maybeSingle();
  const allowTest = Boolean(self.data?.user_id && hidden.has(self.data.user_id));
  const membership = membershipOf(row, stripeIds);
  const reason = referralBlockReason({
    doctorId: row.id,
    selfDoctorId,
    userId: row.user_id,
    verificationStatus: row.verification_status,
    membershipTier: membership.tier,
    membershipStatus: membership.status,
    hidden: !allowTest && Boolean(row.user_id && hidden.has(row.user_id)),
  });
  if (reason === 'self') return 'Pick another doctor. You cannot refer a community member to yourself.';
  if (reason === 'unapproved') return 'That doctor is not approved yet, so they cannot take a referral.';
  if (reason === 'inactive') return 'That doctor is not an active member, so they cannot take a referral.';
  if (reason === 'no-account' || reason === 'hidden') return 'That doctor cannot receive referrals yet.';
  return null;
}
