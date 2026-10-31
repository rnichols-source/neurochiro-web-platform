import 'server-only';

import { Resend } from 'resend';
import { EMPTY_ANSWERS, cleanAnswers, labelFor, profileComplete, type MatchAnswers, type MatchSide } from '@/config/match-questions';
import { STUDENT_CONFIG } from '@/config/students';
import { wrapEmail } from '@/lib/email-template';
import { ensureContextConversation, postSystemMessage } from '@/lib/messaging/db';
import { deriveMembership, type MembershipStatus } from '@/lib/portal/membership';
import { getMembership } from '@/lib/portal/membership-load';
import { isDoctorMember } from '@/lib/jobs/posting-pure';
import { createAdminClient } from '@/lib/supabase-admin';
import { createServerSupabase } from '@/lib/supabase-server';
import { getStudentMembership } from '@/lib/students/membership';
import { deriveStudentMembership, hasMemberAccess } from '@/lib/students/membership-pure';
import { missingSchema } from '@/lib/students/schema';
import { allowDecision } from './decide';
import { canDoctorMatch, canStudentMatch, publicStudentName } from './eligibility';
import { SCORE_VERSION, WEIGHTS_V1, scoreMatch, type ScoreSide } from './score';
import type { MatchCard, MatchDeskData, MatchRowView } from './view';

const NOT_READY = 'ChiroMatch is not ready yet. The database update has not been run.';
const UNAVAILABLE = 'That person is not in ChiroMatch right now.';
const STUDENT_EMPTY = "No new matches right now. We'll email you when a practice that fits joins.";
const DOCTOR_CLOSED = "Turn on 'Open to students' in your profile to appear here.";
const DOCTOR_EMPTY = "No new students right now. We'll email you when a student who fits joins.";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Actor = { id: string; role: string; email: string; name: string };
type StoredProfile = {
  user_id: string;
  side: MatchSide;
  doctor_id: string | null;
  answers: MatchAnswers;
  visible: boolean;
  completed_at: string | null;
  updated_at: string | null;
};

function db() {
  return createAdminClient() as any;
}

function isUuid(value: string): boolean {
  return UUID.test(value);
}

function dayStamp(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

async function actor(): Promise<Actor | null> {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const profile = await db().from('profiles').select('role, full_name, email').eq('id', user.id).maybeSingle();
  const row = profile.data as { role?: string | null; full_name?: string | null; email?: string | null } | null;
  return {
    id: user.id,
    role: row?.role || '',
    email: row?.email || user.email || '',
    name: row?.full_name || '',
  };
}

function sideOf(role: string): MatchSide | null {
  if (role === 'student') return 'student';
  if (role === 'doctor') return 'doctor';
  return null;
}

async function schemaReady(): Promise<boolean> {
  const probe = await db().from('match_profiles').select('user_id').limit(1);
  return !probe.error || !missingSchema(probe.error);
}

function answersOf(raw: unknown): MatchAnswers {
  const cleaned = cleanAnswers(raw);
  return cleaned.ok ? cleaned.answers : { ...EMPTY_ANSWERS };
}

function toSide(answers: MatchAnswers, clinic: { state: string | null; lat: number | null; lng: number | null } | null, role: MatchSide): ScoreSide {
  return {
    technique: answers.technique,
    patientFocus: answers.patient_focus,
    practiceModel: answers.practice_model,
    practiceSize: answers.practice_size,
    states: role === 'doctor' ? (clinic?.state ? [clinic.state.toUpperCase()] : []) : answers.states,
    relocateAnywhere: answers.relocate_anywhere,
    maxDistanceMiles: answers.max_distance_miles,
    homeLat: answers.home_lat,
    homeLng: answers.home_lng,
    clinicState: role === 'doctor' ? clinic?.state || null : null,
    clinicLat: role === 'doctor' ? clinic?.lat ?? null : null,
    clinicLng: role === 'doctor' ? clinic?.lng ?? null : null,
    startWindow: answers.start_window,
    compModel: answers.comp_model,
    careExplain: answers.care_explain,
    carePace: answers.care_pace,
    offers: role === 'doctor' ? answers.offers : [],
    lookingFor: role === 'student' ? answers.looking_for : [],
  };
}

function labels(group: string, keys: string[]): string[] {
  return keys.map((key) => labelFor(group, key)).filter(Boolean);
}

async function loadStored(userId: string): Promise<StoredProfile | null> {
  const row = await db().from('match_profiles').select('user_id, side, doctor_id, answers, visible, completed_at, updated_at').eq('user_id', userId).maybeSingle();
  if (row.error || !row.data) return null;
  const data = row.data as StoredProfile;
  return { ...data, answers: answersOf(data.answers), visible: data.visible !== false };
}

async function schoolVerified(userId: string): Promise<{ verified: boolean; school: string | null; year: number | null }> {
  let row = await db().from('students').select('school_verified, school, graduation_year').eq('user_id', userId).maybeSingle();
  if (row.error && missingSchema(row.error)) return { verified: false, school: null, year: null };
  if (!row.data) row = await db().from('students').select('school_verified, school, graduation_year').eq('id', userId).maybeSingle();
  const data = row.data as { school_verified?: boolean | null; school?: string | null; graduation_year?: number | null } | null;
  return { verified: Boolean(data?.school_verified), school: data?.school || null, year: data?.graduation_year ?? null };
}

type DoctorFacts = {
  id: string;
  user_id: string;
  slug: string | null;
  clinic_name: string | null;
  city: string | null;
  state: string | null;
  photo_url: string | null;
  latitude: number | null;
  longitude: number | null;
  booking_url: string | null;
  open_to_students: boolean;
  member: boolean;
  name: string;
};

async function loadDoctors(userIds: string[]): Promise<Map<string, DoctorFacts>> {
  const map = new Map<string, DoctorFacts>();
  if (!userIds.length) return map;
  const base = 'id, user_id, slug, clinic_name, city, state, photo_url, membership_tier, is_founding_member, neuros_tier, created_at';
  let rows = await db().from('doctors').select(`${base}, latitude, longitude, booking_url, open_to_students, subscription_status`).in('user_id', userIds);
  if (rows.error && missingSchema(rows.error)) {
    rows = await db().from('doctors').select(`${base}, open_to_students`).in('user_id', userIds);
  }
  if (rows.error && missingSchema(rows.error)) {
    rows = await db().from('doctors').select(base).in('user_id', userIds);
  }
  const profiles = await db().from('profiles').select('id, tier, full_name, stripe_customer_id').in('id', userIds);
  const names = new Map<string, { tier?: string | null; full_name?: string | null; stripe_customer_id?: string | null }>();
  for (const profile of (profiles.data || []) as { id: string; tier?: string | null; full_name?: string | null; stripe_customer_id?: string | null }[]) {
    names.set(profile.id, profile);
  }
  for (const row of (rows.data || []) as Record<string, unknown>[]) {
    const userId = String(row.user_id || '');
    if (!userId) continue;
    const profile = names.get(userId);
    const rawStatus = typeof row.subscription_status === 'string' ? row.subscription_status : null;
    const statuses = new Set(['active', 'trialing', 'past_due', 'canceled', 'none']);
    const stripeStatus = rawStatus && statuses.has(rawStatus) ? rawStatus as MembershipStatus : null;
    const membership = deriveMembership({
      membershipTier: (row.membership_tier as string | null) || null,
      profileTier: profile?.tier,
      isFoundingMember: Boolean(row.is_founding_member),
      neurosTier: (row.neuros_tier as string | null) || null,
      createdAt: (row.created_at as string | null) || null,
      hasStripeCustomer: Boolean(profile?.stripe_customer_id),
      stripeStatus: profile?.stripe_customer_id ? (stripeStatus || 'active') : stripeStatus,
    });
    map.set(userId, {
      id: String(row.id),
      user_id: userId,
      slug: (row.slug as string | null) || null,
      clinic_name: (row.clinic_name as string | null) || null,
      city: (row.city as string | null) || null,
      state: (row.state as string | null) || null,
      photo_url: (row.photo_url as string | null) || null,
      latitude: typeof row.latitude === 'number' ? row.latitude : null,
      longitude: typeof row.longitude === 'number' ? row.longitude : null,
      booking_url: (row.booking_url as string | null) || null,
      open_to_students: row.open_to_students === true,
      member: isDoctorMember(membership.tier, membership.status),
      name: profile?.full_name || '',
    });
  }
  return map;
}

async function loadStudents(userIds: string[]) {
  const map = new Map<string, { name: string; school: string | null; year: number | null; eligible: boolean }>();
  if (!userIds.length) return map;
  let profiles = await db().from('profiles').select('id, role, tier, full_name, created_at, student_past_due_since').in('id', userIds);
  if (profiles.error && missingSchema(profiles.error)) {
    profiles = await db().from('profiles').select('id, role, tier, full_name, created_at').in('id', userIds);
  }
  let students = await db().from('students').select('user_id, school_verified, school, graduation_year').in('user_id', userIds);
  if (students.error && missingSchema(students.error)) students = { data: [], error: null };
  const byUser = new Map<string, { school_verified?: boolean | null; school?: string | null; graduation_year?: number | null }>();
  for (const row of (students.data || []) as { user_id?: string; school_verified?: boolean | null; school?: string | null; graduation_year?: number | null }[]) {
    if (row.user_id) byUser.set(row.user_id, row);
  }
  for (const profile of (profiles.data || []) as { id: string; role?: string | null; tier?: string | null; full_name?: string | null; created_at?: string | null; student_past_due_since?: string | null }[]) {
    const membership = deriveStudentMembership({
      role: profile.role,
      tier: profile.tier,
      createdAt: profile.created_at,
      launchAt: STUDENT_CONFIG.launchAt,
      graceDays: STUDENT_CONFIG.freeAccessGraceDays,
      subscriptionStatus: profile.tier === 'student_paid' && profile.student_past_due_since ? 'past_due' : profile.tier === 'student_paid' ? 'active' : null,
      pastDueSince: profile.student_past_due_since || null,
    });
    const student = byUser.get(profile.id);
    const verified = Boolean(student?.school_verified);
    map.set(profile.id, {
      name: profile.full_name || '',
      school: student?.school || null,
      year: student?.graduation_year ?? null,
      eligible: canStudentMatch({
        memberAccess: hasMemberAccess(membership),
        schoolVerified: verified,
        requireSchoolVerification: STUDENT_CONFIG.requireSchoolVerification,
        completed: true,
        visible: true,
      }),
    });
  }
  return map;
}

async function blockedSet(userId: string): Promise<Set<string>> {
  const rows = await db().from('user_blocks').select('blocker_id, blocked_id').or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
  const ids = new Set<string>();
  if (rows.error) return ids;
  for (const row of (rows.data || []) as { blocker_id: string; blocked_id: string }[]) {
    ids.add(row.blocker_id === userId ? row.blocked_id : row.blocker_id);
  }
  return ids;
}

function blankDesk(side: MatchSide, notice: string | null, ready = false): MatchDeskData {
  return {
    ready,
    notice,
    empty: notice,
    side,
    complete: false,
    visible: true,
    openToStudents: false,
    schoolVerified: false,
    clinicLabel: null,
    answers: { ...EMPTY_ANSWERS },
    candidates: [],
    matches: [],
    nextCursor: null,
  };
}

export async function loadDesk(cursor = 0): Promise<MatchDeskData> {
  const me = await actor();
  const side = sideOf(me?.role || '');
  if (!me || !side) return blankDesk('student', 'Sign in with a student or doctor account.');
  if (!(await schemaReady())) return blankDesk(side, NOT_READY);
  const mine = await loadStored(me.id);
  const doctors = side === 'doctor' ? await loadDoctors([me.id]) : new Map();
  const mineDoctor = doctors.get(me.id) || null;
  const school = side === 'student' ? await schoolVerified(me.id) : { verified: false, school: null, year: null };
  const membership = side === 'doctor' ? await getMembership(me.id) : null;
  const studentMember = side === 'student' ? hasMemberAccess(await getStudentMembership(me.id)) : false;
  const open = mineDoctor?.open_to_students === true;
  const complete = Boolean(mine?.completed_at);
  const visible = mine?.visible !== false;
  const clinicLabel = mineDoctor ? [mineDoctor.clinic_name, mineDoctor.city, mineDoctor.state].filter(Boolean).join(' · ') : null;
  const base: MatchDeskData = {
    ready: true,
    notice: null,
    empty: null,
    side,
    complete,
    visible,
    openToStudents: open,
    schoolVerified: school.verified,
    clinicLabel,
    answers: mine?.answers || { ...EMPTY_ANSWERS },
    candidates: [],
    matches: await listMatches(me, side),
    nextCursor: null,
  };
  if (side === 'student' && !studentMember) {
    base.notice = 'Membership is required to use ChiroMatch.';
    return base;
  }
  if (side === 'doctor' && membership && !isDoctorMember(membership.tier, membership.status)) {
    base.notice = 'This is part of Pro.';
    return base;
  }
  if (!complete) return base;
  if (side === 'doctor' && !open) {
    base.empty = DOCTOR_CLOSED;
    return base;
  }
  if (side === 'student' && STUDENT_CONFIG.requireSchoolVerification && !school.verified) {
    base.notice = 'Verify your school on your home page before practices can see you.';
    base.empty = base.notice;
    return base;
  }
  const cards = await candidatesFor(me, side, mine as StoredProfile, cursor);
  base.candidates = cards.rows;
  base.nextCursor = cards.next;
  base.empty = cards.rows.length ? null : side === 'student' ? STUDENT_EMPTY : DOCTOR_EMPTY;
  return base;
}

async function candidatesFor(me: Actor, side: MatchSide, mine: StoredProfile, cursor: number): Promise<{ rows: MatchCard[]; next: string | null }> {
  const other = side === 'student' ? 'doctor' : 'student';
  const listed = await db().from('match_profiles').select('user_id, side, doctor_id, answers, visible, completed_at, updated_at').eq('side', other).eq('visible', true).not('completed_at', 'is', null).order('updated_at', { ascending: false }).limit(500);
  if (listed.error) return { rows: [], next: null };
  const profiles = ((listed.data || []) as StoredProfile[]).map((row) => ({ ...row, answers: answersOf(row.answers) }));
  const ids = profiles.map((row) => row.user_id);
  const [blocks, interests, matched, doctors, students] = await Promise.all([
    blockedSet(me.id),
    db().from('match_interests').select('to_user').eq('from_user', me.id),
    db().from('matches').select('student_user_id, doctor_user_id').or(`student_user_id.eq.${me.id},doctor_user_id.eq.${me.id}`),
    other === 'doctor' ? loadDoctors(ids) : Promise.resolve(new Map<string, DoctorFacts>()),
    other === 'student' ? loadStudents(ids) : Promise.resolve(new Map()),
  ]);
  const decided = new Set(((interests.data || []) as { to_user: string }[]).map((row) => row.to_user));
  const already = new Set<string>();
  for (const row of (matched.data || []) as { student_user_id: string; doctor_user_id: string }[]) {
    already.add(row.student_user_id === me.id ? row.doctor_user_id : row.student_user_id);
  }
  const myDoctor = side === 'doctor' ? (await loadDoctors([me.id])).get(me.id) || null : null;
  const myClinic = myDoctor ? { state: myDoctor.state, lat: myDoctor.latitude, lng: myDoctor.longitude } : null;
  const myScore = toSide(mine.answers, myClinic, side);
  const ranked: { card: MatchCard; pct: number; active: string }[] = [];
  for (const profile of profiles) {
    if (profile.user_id === me.id || blocks.has(profile.user_id) || decided.has(profile.user_id) || already.has(profile.user_id)) continue;
    if (other === 'doctor') {
      const doctor = doctors.get(profile.user_id);
      if (!doctor || !canDoctorMatch({ member: doctor.member, openToStudents: doctor.open_to_students, completed: true, visible: profile.visible })) continue;
      const scored = scoreMatch(myScore, toSide(profile.answers, { state: doctor.state, lat: doctor.latitude, lng: doctor.longitude }, 'doctor'));
      if (scored.excluded) continue;
      ranked.push({
        pct: scored.pct,
        active: profile.updated_at || '',
        card: {
          userId: profile.user_id,
          pct: scored.pct,
          reason: scored.reasons[0] || 'Your answers line up.',
          title: doctor.name || doctor.clinic_name || 'Practice',
          subtitle: [doctor.clinic_name, doctor.city, doctor.state].filter(Boolean).join(' · '),
          facts: [
            ...labels('looking', profile.answers.offers),
            ...labels('technique', profile.answers.technique).slice(0, 3),
            ...labels('patient_focus', profile.answers.patient_focus).slice(0, 3),
          ].slice(0, 6),
          profileHref: doctor.slug ? `/directory/${doctor.slug}` : null,
          photoUrl: doctor.photo_url,
          doctorId: doctor.id,
        },
      });
    } else {
      const student = students.get(profile.user_id);
      if (!student?.eligible || !profile.visible) continue;
      const scored = scoreMatch(toSide(profile.answers, null, 'student'), myScore);
      if (scored.excluded) continue;
      ranked.push({
        pct: scored.pct,
        active: profile.updated_at || '',
        card: {
          userId: profile.user_id,
          pct: scored.pct,
          reason: scored.reasons[0] || 'Your answers line up.',
          title: publicStudentName(student.name),
          subtitle: [student.school, student.year ? String(student.year) : null].filter(Boolean).join(' · '),
          facts: [
            ...labels('looking', profile.answers.looking_for),
            ...labels('technique', profile.answers.technique).slice(0, 3),
            labelFor('start_window', profile.answers.start_window),
          ].filter(Boolean).slice(0, 6),
          profileHref: null,
          photoUrl: null,
          doctorId: null,
        },
      });
    }
  }
  ranked.sort((a, b) => b.pct - a.pct || b.active.localeCompare(a.active));
  const start = Number.isFinite(cursor) && cursor > 0 ? cursor : 0;
  const page = ranked.slice(start, start + 20);
  const next = start + 20 < ranked.length ? String(start + 20) : null;
  return { rows: page.map((item) => item.card), next };
}

async function listMatches(me: Actor, side: MatchSide): Promise<MatchRowView[]> {
  const column = side === 'student' ? 'student_user_id' : 'doctor_user_id';
  const rows = await db().from('matches').select('id, student_user_id, doctor_user_id, score, reasons, conversation_id, closed_at').eq(column, me.id).order('created_at', { ascending: false }).limit(50);
  if (rows.error) return [];
  const data = (rows.data || []) as { id: string; student_user_id: string; doctor_user_id: string; score: number; reasons: string[] | null; conversation_id: string | null; closed_at: string | null }[];
  const otherIds = data.map((row) => side === 'student' ? row.doctor_user_id : row.student_user_id);
  const profiles = await db().from('profiles').select('id, full_name').in('id', otherIds.length ? otherIds : ['00000000-0000-0000-0000-000000000000']);
  const names = new Map<string, string>();
  for (const profile of (profiles.data || []) as { id: string; full_name?: string | null }[]) names.set(profile.id, profile.full_name || '');
  const doctors = await loadDoctors(side === 'student' ? otherIds : [me.id]);
  return data.map((row) => {
    const other = side === 'student' ? row.doctor_user_id : row.student_user_id;
    const doctor = side === 'student' ? doctors.get(other) : doctors.get(me.id);
    const full = names.get(other) || '';
    return {
      id: row.id,
      pct: row.score,
      reason: row.reasons?.[0] || 'Your answers line up.',
      title: side === 'doctor' ? full || publicStudentName(full) : full || doctor?.clinic_name || 'Practice',
      conversationId: row.conversation_id,
      bookingUrl: doctor?.booking_url || null,
      doctorId: side === 'student' ? doctor?.id || null : null,
      otherUserId: other,
      closed: Boolean(row.closed_at),
    };
  });
}

export async function saveProfile(raw: unknown, visible: boolean): Promise<{ error?: string; complete?: boolean }> {
  const me = await actor();
  const side = sideOf(me?.role || '');
  if (!me || !side) return { error: 'Sign in first.' };
  if (!(await schemaReady())) return { error: NOT_READY };
  const cleaned = cleanAnswers(raw);
  if (!cleaned.ok) return { error: cleaned.error };
  if (side === 'student' && !hasMemberAccess(await getStudentMembership(me.id))) {
    return { error: 'Membership is required to use ChiroMatch.' };
  }
  if (side === 'doctor') {
    const membership = await getMembership(me.id);
    if (!isDoctorMember(membership.tier, membership.status)) return { error: 'This is part of Pro.' };
  }
  const doctor = side === 'doctor' ? (await loadDoctors([me.id])).get(me.id) || null : null;
  const complete = profileComplete(side, cleaned.answers, doctor?.state || null);
  const saved = await db().from('match_profiles').upsert({
    user_id: me.id,
    side,
    doctor_id: doctor?.id || null,
    answers: cleaned.answers,
    visible,
    completed_at: complete ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (saved.error) return { error: missingSchema(saved.error) ? NOT_READY : 'Could not save that.' };
  return { complete };
}

async function eligiblePair(me: Actor, otherId: string): Promise<{ studentId: string; doctorId: string; scored: ReturnType<typeof scoreMatch> } | null> {
  const mine = await loadStored(me.id);
  const theirs = await loadStored(otherId);
  const mySide = sideOf(me.role);
  if (!mine?.completed_at || !theirs?.completed_at || !mySide || mine.side === theirs.side || !mine.visible || !theirs.visible) return null;
  const studentId = mine.side === 'student' ? me.id : otherId;
  const doctorId = mine.side === 'doctor' ? me.id : otherId;
  const doctor = (await loadDoctors([doctorId])).get(doctorId);
  if (!doctor) return null;
  const studentInfo = (await loadStudents([studentId])).get(studentId);
  if (!studentInfo?.eligible) return null;
  if (!canDoctorMatch({ member: doctor.member, openToStudents: doctor.open_to_students, completed: true, visible: true })) return null;
  const studentProfile = studentId === me.id ? mine : theirs;
  const doctorProfile = doctorId === me.id ? mine : theirs;
  const scored = scoreMatch(
    toSide(studentProfile.answers, null, 'student'),
    toSide(doctorProfile.answers, { state: doctor.state, lat: doctor.latitude, lng: doctor.longitude }, 'doctor'),
  );
  if (scored.excluded) return null;
  return { studentId, doctorId, scored };
}

export async function decide(otherUserId: string, decision: 'interested' | 'not_now'): Promise<{ error?: string; ok?: boolean; matched?: boolean; conversationId?: string | null; pct?: number; reason?: string }> {
  const me = await actor();
  if (!me || !sideOf(me.role)) return { error: 'Sign in first.' };
  if (!isUuid(otherUserId) || otherUserId === me.id) return { error: UNAVAILABLE };
  if (decision !== 'interested' && decision !== 'not_now') return { error: UNAVAILABLE };
  if (!(await schemaReady())) return { error: NOT_READY };
  if (await blockedSet(me.id).then((ids) => ids.has(otherUserId))) return { error: UNAVAILABLE };
  const pair = await eligiblePair(me, otherUserId);
  if (!pair) return { error: UNAVAILABLE };
  const day = dayStamp();
  const prior = await db().from('match_interests').select('decided_on').eq('from_user', me.id).eq('to_user', otherUserId).maybeSingle();
  const count = await db().from('match_interests').select('from_user', { count: 'exact', head: true }).eq('from_user', me.id).eq('decided_on', day);
  const today = !count.error && typeof count.count === 'number' ? count.count : 0;
  const already = prior.data?.decided_on === day;
  if (!count.error && !allowDecision(today, already)) return { error: 'You can make 50 decisions a day. Try again tomorrow.' };
  const saved = await db().from('match_interests').upsert({
    from_user: me.id,
    to_user: otherUserId,
    decision,
    decided_on: day,
  }, { onConflict: 'from_user,to_user' });
  if (saved.error) return { error: 'Could not save that.' };
  if (decision !== 'interested') return { ok: true, matched: false };
  const back = await db().from('match_interests').select('decision').eq('from_user', otherUserId).eq('to_user', me.id).maybeSingle();
  if (back.data?.decision !== 'interested') return { ok: true, matched: false };
  const created = await createMatch(pair.studentId, pair.doctorId, pair.scored);
  if (!created.id) return { ok: true, matched: true, conversationId: null, pct: pair.scored.pct, reason: pair.scored.reasons[0] };
  let conversationId = created.conversationId;
  if (created.id && (created.created || !conversationId)) {
    conversationId = await openThread(pair.studentId, pair.doctorId, created.id, pair.scored.pct, pair.scored.reasons[0] || 'Your answers line up.', created.created);
  }
  return { ok: true, matched: true, conversationId, pct: pair.scored.pct, reason: pair.scored.reasons[0] };
}

async function createMatch(studentId: string, doctorId: string, scored: ReturnType<typeof scoreMatch>): Promise<{ id: string | null; created: boolean; conversationId: string | null }> {
  const rpc = await db().rpc('create_match_if_mutual', {
    p_student: studentId,
    p_doctor: doctorId,
    p_score: scored.pct,
    p_version: SCORE_VERSION,
    p_factors: scored.factors,
    p_reasons: scored.reasons,
  });
  const rpcRow = Array.isArray(rpc.data) ? rpc.data[0] : rpc.data;
  if (!rpc.error && rpcRow?.id) {
    const existing = await db().from('matches').select('conversation_id').eq('id', rpcRow.id).maybeSingle();
    return { id: rpcRow.id as string, created: rpcRow.created === true, conversationId: existing.data?.conversation_id || null };
  }
  if (rpc.error && !missingRpc(rpc.error)) {
    console.error('[MATCH] create failed', rpc.error.code);
  }
  const inserted = await db().from('matches').insert({
    student_user_id: studentId,
    doctor_user_id: doctorId,
    score: scored.pct,
    score_version: SCORE_VERSION,
    factors: scored.factors,
    reasons: scored.reasons,
  }).select('id, conversation_id').maybeSingle();
  if (inserted.error?.code === '23505') {
    const existing = await db().from('matches').select('id, conversation_id').eq('student_user_id', studentId).eq('doctor_user_id', doctorId).maybeSingle();
    return { id: existing.data?.id || null, created: false, conversationId: existing.data?.conversation_id || null };
  }
  if (inserted.error || !inserted.data) return { id: null, created: false, conversationId: null };
  return { id: inserted.data.id, created: true, conversationId: inserted.data.conversation_id || null };
}

function missingRpc(error: { code?: string; message?: string }): boolean {
  if (missingSchema(error)) return true;
  return error.code === '42883' || error.code === 'PGRST202' || /could not find the function/i.test(error.message || '');
}

async function openThread(studentId: string, doctorId: string, matchId: string, pct: number, reason: string, email: boolean): Promise<string | null> {
  const conversationId = await ensureContextConversation({
    participantOne: studentId,
    participantTwo: doctorId,
    contextType: 'match',
    contextId: matchId,
  });
  if (!conversationId) return null;
  await postSystemMessage(conversationId, `You matched · ${pct}% · ${reason}`.slice(0, 2000));
  await db().from('matches').update({ conversation_id: conversationId }).eq('id', matchId);
  if (!email) return conversationId;
  const people = await db().from('profiles').select('id, email, role').in('id', [studentId, doctorId]);
  for (const person of (people.data || []) as { id: string; email?: string | null; role?: string | null }[]) {
    if (!person.email) continue;
    const path = person.role === 'doctor' ? `/doctor/messages?c=${conversationId}` : `/student/messages?c=${conversationId}`;
    await sendPlain(person.email, 'You have a new match on NeuroChiro', `<h1>You have a new match</h1><p>You have a new match on NeuroChiro.</p><p><a href="https://neurochiro.co${path}">Open the thread</a></p>`);
  }
  return conversationId;
}

async function sendPlain(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'NeuroChiro <support@neurochirodirectory.com>',
      to: [to],
      subject,
      html: wrapEmail(html),
    });
  } catch {
    console.error('[MATCH] Email failed');
  }
}

async function ownMatch(userId: string, matchId: string) {
  const row = await db().from('matches').select('id, student_user_id, doctor_user_id, conversation_id, closed_at').eq('id', matchId).maybeSingle();
  const data = row.data as { id: string; student_user_id: string; doctor_user_id: string; conversation_id: string | null; closed_at: string | null } | null;
  if (!data || (data.student_user_id !== userId && data.doctor_user_id !== userId)) return null;
  return data;
}

export async function closeMatch(matchId: string, reason: string): Promise<{ error?: string }> {
  const me = await actor();
  if (!me || !isUuid(matchId)) return { error: UNAVAILABLE };
  const match = await ownMatch(me.id, matchId);
  if (!match) return { error: UNAVAILABLE };
  const updated = await db().from('matches').update({ closed_at: new Date().toISOString(), closed_reason: reason.trim().slice(0, 200) || 'Closed' }).eq('id', matchId);
  if (updated.error) return { error: 'Could not save that.' };
  return {};
}

export async function reportOutcome(matchId: string, outcome: string, note: string): Promise<{ error?: string }> {
  const me = await actor();
  if (!me || !isUuid(matchId)) return { error: UNAVAILABLE };
  const allowed = new Set(['talked', 'shadow_booked', 'shadow_done', 'interviewed', 'offer', 'hired', 'not_a_fit', 'no_reply']);
  if (!allowed.has(outcome)) return { error: 'Pick one of the listed outcomes.' };
  const match = await ownMatch(me.id, matchId);
  if (!match) return { error: UNAVAILABLE };
  const inserted = await db().from('match_outcomes').insert({ match_id: matchId, reported_by: me.id, outcome, note: note.trim().slice(0, 500) || null });
  if (inserted.error) return { error: missingSchema(inserted.error) ? NOT_READY : 'Could not save that.' };
  return {};
}

export async function setOpenToStudents(on: boolean): Promise<{ error?: string }> {
  const me = await actor();
  if (!me || me.role !== 'doctor') return { error: 'Sign in first.' };
  const updated = await db().from('doctors').update({ open_to_students: on }).eq('user_id', me.id);
  if (updated.error && missingSchema(updated.error)) return { error: 'Student settings are not on yet.' };
  if (updated.error) return { error: 'Could not save that.' };
  return {};
}

export async function suggestCall(matchId: string, times: string[]): Promise<{ error?: string }> {
  const me = await actor();
  if (!me || !isUuid(matchId)) return { error: UNAVAILABLE };
  const match = await ownMatch(me.id, matchId);
  if (!match?.conversation_id) return { error: 'The message thread is not open yet.' };
  const clean = times.map((item) => item.trim()).filter(Boolean).slice(0, 3);
  if (!clean.length || clean.some((item) => item.length > 80)) return { error: 'Add up to 3 times.' };
  const other = match.student_user_id === me.id ? match.doctor_user_id : match.student_user_id;
  const body = `I can talk at: ${clean.join('; ')}.`;
  const inserted = await db().from('messages').insert({
    conversation_id: match.conversation_id,
    sender_id: me.id,
    recipient_id: other,
    body,
    message_type: 'user',
  });
  if (inserted.error) return { error: 'Could not send that.' };
  await db().from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', match.conversation_id);
  return {};
}

export async function adminMatchStats() {
  const admin = await import('@/lib/admin-auth');
  await admin.checkAdminAuth();
  const [profiles, interests, matches, outcomes, weights] = await Promise.all([
    db().from('match_profiles').select('side'),
    db().from('match_interests').select('decision'),
    db().from('matches').select('id', { count: 'exact', head: true }),
    db().from('match_outcomes').select('id, match_id, outcome, note, created_at').order('created_at', { ascending: false }).limit(200),
    db().from('match_weights').select('version, active').eq('active', true).limit(1),
  ]);
  if (profiles.error && missingSchema(profiles.error)) return { ready: false as const };
  const sides = { student: 0, doctor: 0 };
  for (const row of (profiles.data || []) as { side?: string }[]) {
    if (row.side === 'student' || row.side === 'doctor') sides[row.side] += 1;
  }
  let interested = 0;
  let passed = 0;
  for (const row of (interests.data || []) as { decision?: string }[]) {
    if (row.decision === 'interested') interested += 1;
    if (row.decision === 'not_now') passed += 1;
  }
  return {
    ready: true as const,
    sides,
    interested,
    passed,
    matches: matches.count || 0,
    outcomes: (outcomes.data || []) as { id: string; match_id: string; outcome: string; note: string | null; created_at: string }[],
    weightVersion: (weights.data?.[0] as { version?: string } | undefined)?.version || SCORE_VERSION,
    weights: WEIGHTS_V1,
  };
}

export async function outcomeCsv(): Promise<string> {
  const stats = await adminMatchStats();
  if (!stats.ready) return 'outcome,note,created_at\n';
  const lines = ['match_id,outcome,note,created_at'];
  for (const row of stats.outcomes) {
    const note = (row.note || '').replaceAll('"', '""');
    lines.push(`${row.match_id},${row.outcome},"${note}",${row.created_at}`);
  }
  return lines.join('\n');
}
