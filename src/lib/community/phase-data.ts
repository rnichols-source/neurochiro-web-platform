import 'server-only'
import { createAdminClient } from '@/lib/supabase-admin'
import { excludeDemo } from '@/lib/directory/exclude-demo'
import { applyPublicListing } from '@/lib/directory/visibility'
import { listSeminars } from '@/lib/seminars/queries'
import {
  doctorMayBeHomeDoctor,
  homeDoctorCard,
  type DoctorCardSource,
  type HomeDoctorCard,
} from '@/lib/community/logic'
import {
  FEELING_LABELS,
  SAMPLE_SET_ID,
  WORK_PATH_LABELS,
  formatTripRange,
  isFeeling,
  isTripKind,
  isWorkPath,
  openingMatches,
  passportHomeLine,
  reminderLine,
  weekStartKey,
  weeklyShowLine,
  type Feeling,
  type ParsedPlace,
  type TripKind,
  type WorkPath,
} from '@/lib/community/phases'

const DOCTOR_COLUMNS = 'id, first_name, last_name, clinic_name, city, state, country, slug, photo_url, user_id, verification_status, membership_tier, is_approved, is_founding_member, paid_at, listing_format'

type DbError = { message?: string; code?: string } | null

export function missingRelation(error: DbError): boolean {
  if (!error) return false
  const message = error.message || ''
  return error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache|could not find the table/i.test(message)
}

export type PhaseHome = {
  ready: boolean
  feeling: Feeling | null
  feelingLabel: string | null
  showLabel: string
  showTonight: boolean
  reminderTitle: string | null
  tripLine: string | null
  workLine: string | null
}

export async function loadPhaseHome(profileId: string, now = new Date()): Promise<PhaseHome> {
  const show = weeklyShowLine(now)
  const empty: PhaseHome = {
    ready: true,
    feeling: null,
    feelingLabel: null,
    showLabel: show.label,
    showTonight: show.tonight,
    reminderTitle: null,
    tripLine: null,
    workLine: null,
  }
  const admin = createAdminClient() as any
  const weekStart = weekStartKey(now)
  const [checkin, assignments, trip, work] = await Promise.all([
    admin.from('community_week_checkins').select('feeling').eq('profile_id', profileId).eq('week_start', weekStart).maybeSingle(),
    admin.from('community_exercise_assignments').select('id, set_id, reminder_enabled, status').eq('profile_id', profileId).eq('status', 'active').eq('reminder_enabled', true).limit(1),
    admin.from('community_passport_trips').select('place_label, starts_on, ends_on, status').eq('profile_id', profileId).eq('status', 'upcoming').order('starts_on', { ascending: true }).limit(1),
    admin.from('community_work_interest').select('path, status').eq('profile_id', profileId).neq('status', 'closed').order('created_at', { ascending: false }).limit(1),
  ])
  if ([checkin.error, assignments.error, trip.error, work.error].some(missingRelation)) {
    return { ...empty, ready: false }
  }
  const feelingValue = checkin.data?.feeling
  const feeling: Feeling | null = typeof feelingValue === 'string' && isFeeling(feelingValue) ? feelingValue : null
  let reminderTitle: string | null = null
  const assignment = assignments.data?.[0]
  if (assignment?.set_id) {
    const set = await admin.from('community_exercise_sets').select('title').eq('id', assignment.set_id).maybeSingle()
    if (set.data?.title) reminderTitle = reminderLine(set.data.title)
  }
  const nextTrip = trip.data?.[0]
  const workPathRaw: unknown = work.data?.[0]?.path
  const workPath = typeof workPathRaw === 'string' && isWorkPath(workPathRaw) ? workPathRaw : null
  return {
    ...empty,
    feeling,
    feelingLabel: feeling ? FEELING_LABELS[feeling] : null,
    reminderTitle,
    tripLine: nextTrip ? passportHomeLine(nextTrip.place_label, nextTrip.starts_on, nextTrip.ends_on) : null,
    workLine: workPath ? `You raised a hand for ${WORK_PATH_LABELS[workPath]}.` : null,
  }
}

export type LiveEvent = { title: string; when: string; place: string | null; href: string }

export async function loadUpcomingLives(now = new Date()): Promise<LiveEvent[]> {
  const show = weeklyShowLine(now)
  const events: LiveEvent[] = [{
    title: 'The Weekly Adjustment',
    when: show.label,
    place: 'With Dr. Ray',
    href: 'https://instagram.com/neurochiro',
  }]
  try {
    const seminars = await listSeminars({ when: 'next-3-months' }, now.getTime())
    for (const seminar of seminars.slice(0, 3)) {
      events.push({
        title: seminar.title,
        when: seminar.dates || seminar.startDate || 'Upcoming',
        place: [seminar.city, seminar.state].filter(Boolean).join(', ') || seminar.country,
        href: `/seminars/${seminar.slug}`,
      })
    }
  } catch {
    // The weekly show still stands when seminar rows are unavailable.
  }
  return events
}

export type ExerciseStep = { id: string; position: number; label: string; done: boolean }

export type ExerciseAssignment = {
  id: string
  title: string
  note: string | null
  sample: boolean
  reminder: boolean
  shareOnPassport: boolean
  status: 'active' | 'done'
  steps: ExerciseStep[]
}

export async function loadExercises(profileId: string): Promise<{ ready: boolean; assignments: ExerciseAssignment[]; sampleReady: boolean }> {
  const admin = createAdminClient() as any
  const rows = await admin
    .from('community_exercise_assignments')
    .select('id, set_id, reminder_enabled, share_on_passport, status')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(12)
  if (missingRelation(rows.error)) return { ready: false, assignments: [], sampleReady: false }
  const setIds = [...new Set((rows.data || []).map((row: { set_id: string }) => row.set_id))]
  const sets = setIds.length
    ? await admin.from('community_exercise_sets').select('id, title, note, is_sample').in('id', setIds)
    : { data: [], error: null }
  const steps = setIds.length
    ? await admin.from('community_exercise_steps').select('id, set_id, position, label').in('set_id', setIds).order('position', { ascending: true })
    : { data: [], error: null }
  const assignmentIds = (rows.data || []).map((row: { id: string }) => row.id)
  const done = assignmentIds.length
    ? await admin.from('community_exercise_step_done').select('assignment_id, step_id').in('assignment_id', assignmentIds)
    : { data: [], error: null }
  if ([sets.error, steps.error, done.error].some(missingRelation)) return { ready: false, assignments: [], sampleReady: false }
  const setMap = new Map((sets.data || []).map((row: { id: string }) => [row.id, row]))
  const doneKey = new Set((done.data || []).map((row: { assignment_id: string; step_id: string }) => `${row.assignment_id}:${row.step_id}`))
  const assignments: ExerciseAssignment[] = (rows.data || []).map((row: Record<string, unknown>) => {
    const set = setMap.get(String(row.set_id)) as { title?: string; note?: string | null; is_sample?: boolean } | undefined
    const setSteps = (steps.data || []).filter((step: { set_id: string }) => step.set_id === row.set_id)
    return {
      id: String(row.id),
      title: set?.title || 'A set',
      note: set?.note || null,
      sample: set?.is_sample === true || row.set_id === SAMPLE_SET_ID,
      reminder: row.reminder_enabled === true,
      shareOnPassport: row.share_on_passport === true,
      status: row.status === 'done' ? 'done' : 'active',
      steps: setSteps.map((step: { id: string; position: number; label: string }) => ({
        id: step.id,
        position: step.position,
        label: step.label,
        done: doneKey.has(`${row.id}:${step.id}`),
      })),
    }
  })
  const sample = await admin.from('community_exercise_sets').select('id').eq('id', SAMPLE_SET_ID).maybeSingle()
  return { ready: true, assignments, sampleReady: Boolean(sample.data?.id) }
}

export type TripRecord = {
  id: string
  place: string
  city: string | null
  stateCode: string | null
  countryCode: string | null
  startsOn: string
  endsOn: string
  when: string
  kind: TripKind
  status: string
}

export async function loadTrips(profileId: string): Promise<{ ready: boolean; trips: TripRecord[] }> {
  const admin = createAdminClient() as any
  const rows = await admin
    .from('community_passport_trips')
    .select('id, place_label, city, state_code, country_code, starts_on, ends_on, kind, status')
    .eq('profile_id', profileId)
    .order('starts_on', { ascending: false })
    .limit(8)
  if (missingRelation(rows.error)) return { ready: false, trips: [] }
  return {
    ready: true,
    trips: (rows.data || []).map((row: Record<string, string>) => ({
      id: row.id,
      place: row.place_label,
      city: row.city,
      stateCode: row.state_code,
      countryCode: row.country_code,
      startsOn: row.starts_on,
      endsOn: row.ends_on,
      when: formatTripRange(row.starts_on, row.ends_on),
      kind: isTripKind(row.kind) ? row.kind : 'trip',
      status: row.status,
    })),
  }
}

export type ListedDoctor = HomeDoctorCard & { city: string | null; state: string | null }

function toListed(row: DoctorCardSource & { id: string; city?: string | null; state?: string | null }): ListedDoctor | null {
  if (!doctorMayBeHomeDoctor(row)) return null
  const card = homeDoctorCard(row)
  return { ...card, city: row.city || null, state: row.state || null }
}

export async function findDoctorsForPlace(place: ParsedPlace, pickedId?: string | null): Promise<{ ready: boolean; doctors: ListedDoctor[]; widened: string | null }> {
  const admin = createAdminClient() as any
  async function query(scope: ParsedPlace['scope']): Promise<ListedDoctor[]> {
    let q = applyPublicListing(excludeDemo(admin.from('doctors').select(DOCTOR_COLUMNS).in('verification_status', ['verified', 'pending'])))
    if (scope === 'city' && place.city) q = q.ilike('city', place.city)
    if ((scope === 'city' || scope === 'state') && place.stateCode) q = q.eq('state', place.stateCode)
    if (place.countryCode === 'US') q = q.or('country.is.null,country.eq.US')
    else if (place.countryCode && scope !== 'city') q = q.eq('country', place.countryCode)
    else if (place.countryCode && scope === 'city' && !place.stateCode) q = q.eq('country', place.countryCode)
    const { data, error } = await q.limit(8)
    if (error) return []
    return (data || []).map((row: DoctorCardSource & { id: string }) => toListed(row)).filter(Boolean) as ListedDoctor[]
  }

  let doctors = await query(place.scope)
  let widened: string | null = null
  if (doctors.length === 0 && place.scope === 'city' && place.stateCode) {
    doctors = await query('state')
    widened = place.stateCode
  }
  if (doctors.length === 0 && place.countryCode && place.scope !== 'country') {
    doctors = await query('country')
    widened = place.countryCode
  }
  if (pickedId && !doctors.some((doctor) => doctor.id === pickedId)) {
    const picked = await admin.from('doctors').select(DOCTOR_COLUMNS).eq('id', pickedId).maybeSingle()
    const card = picked.data ? toListed(picked.data) : null
    if (card) doctors = [card, ...doctors].slice(0, 8)
  }
  return { ready: true, doctors, widened }
}

export type InvitationRecord = {
  id: string
  token: string
  recipientWords: string
  place: string
  city: string | null
  stateCode: string | null
  countryCode: string | null
  doctorId: string | null
  note: string | null
  status: string
  createdAt: string
}

export async function loadInvitations(profileId: string): Promise<{ ready: boolean; invitations: InvitationRecord[] }> {
  const admin = createAdminClient() as any
  const rows = await admin
    .from('community_care_invitations')
    .select('id, token, recipient_words, place_label, city, state_code, country_code, doctor_id, note, status, created_at')
    .eq('sender_profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(20)
  if (missingRelation(rows.error)) return { ready: false, invitations: [] }
  return {
    ready: true,
    invitations: (rows.data || []).map(mapInvitation),
  }
}

export async function markInvitationOpened(token: string): Promise<void> {
  const admin = createAdminClient() as any
  await admin
    .from('community_care_invitations')
    .update({ status: 'opened', opened_at: new Date().toISOString() })
    .eq('token', token)
    .eq('status', 'sent')
}

export async function loadInvitationByToken(token: string): Promise<InvitationRecord | null> {
  const admin = createAdminClient() as any
  const row = await admin
    .from('community_care_invitations')
    .select('id, token, recipient_words, place_label, city, state_code, country_code, doctor_id, note, status, created_at')
    .eq('token', token)
    .maybeSingle()
  if (row.error || !row.data) return null
  return mapInvitation(row.data)
}

function mapInvitation(row: Record<string, string | null>): InvitationRecord {
  return {
    id: String(row.id),
    token: String(row.token),
    recipientWords: String(row.recipient_words),
    place: String(row.place_label),
    city: row.city,
    stateCode: row.state_code,
    countryCode: row.country_code,
    doctorId: row.doctor_id,
    note: row.note,
    status: String(row.status || 'sent'),
    createdAt: String(row.created_at),
  }
}

export type WorkInterest = {
  id: string
  path: WorkPath
  place: string
  note: string | null
  shareContact: boolean
  status: string
}

export async function loadWorkInterests(profileId: string): Promise<{ ready: boolean; interests: WorkInterest[] }> {
  const admin = createAdminClient() as any
  const rows = await admin
    .from('community_work_interest')
    .select('id, path, place_label, note, share_contact, status')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(12)
  if (missingRelation(rows.error)) return { ready: false, interests: [] }
  return {
    ready: true,
    interests: (rows.data || []).filter((row: { path: string }) => isWorkPath(row.path)).map((row: Record<string, string | boolean | null>) => ({
      id: String(row.id),
      path: row.path as WorkPath,
      place: String(row.place_label),
      note: (row.note as string | null) || null,
      shareContact: row.share_contact === true,
      status: String(row.status),
    })),
  }
}

export type Opening = { id: string; title: string; clinic: string | null; place: string; href: string }

export async function loadOpenings(path: WorkPath, place: ParsedPlace | null): Promise<Opening[]> {
  const admin = createAdminClient() as any
  const rows = await admin
    .from('job_postings')
    .select('id, title, clinic_name, city, state, approval_status')
    .in('status', ['Active', 'open'])
    .limit(40)
  if (rows.error || !Array.isArray(rows.data)) return []
  return rows.data
    .filter((row: { title?: string; approval_status?: string; state?: string; city?: string }) => {
      if (row.approval_status && row.approval_status !== 'approved') return false
      if (!openingMatches(path, row.title || '')) return false
      if (place?.stateCode && row.state && row.state.toUpperCase() !== place.stateCode) return false
      return true
    })
    .slice(0, 6)
    .map((row: { id: string; title: string; clinic_name?: string | null; city?: string | null; state?: string | null }) => ({
      id: row.id,
      title: row.title,
      clinic: row.clinic_name || null,
      place: [row.city, row.state].filter(Boolean).join(', '),
      href: `/careers/${row.id}`,
    }))
}

export async function loadLiveQuestions(): Promise<{ body: string; createdAt: string }[]> {
  const admin = createAdminClient() as any
  const rows = await admin
    .from('community_live_questions')
    .select('body, created_at')
    .order('created_at', { ascending: false })
    .limit(20)
  if (rows.error) return []
  return (rows.data || []).map((row: { body: string; created_at: string }) => ({
    body: row.body,
    createdAt: row.created_at,
  }))
}

export async function loadHomeDoctorMembers(doctorId: string): Promise<{ id: string; label: string }[]> {
  const admin = createAdminClient() as any
  const links = await admin.from('community_home_doctors').select('profile_id, created_at').eq('doctor_id', doctorId).limit(50)
  if (links.error || !links.data?.length) return []
  const ids = links.data.map((row: { profile_id: string }) => row.profile_id)
  const chosen = new Map(links.data.map((row: { profile_id: string; created_at?: string }) => [row.profile_id, row.created_at || '']))
  const [profiles, privacy] = await Promise.all([
    admin.from('profiles').select('id, full_name').in('id', ids),
    admin.from('community_privacy').select('profile_id, share_name_with_home_doctor').in('profile_id', ids),
  ])
  const names = new Map((profiles.data || []).map((row: { id: string; full_name: string | null }) => [row.id, row.full_name]))
  const shared = new Map((privacy.data || []).map((row: { profile_id: string; share_name_with_home_doctor: boolean }) => [row.profile_id, row.share_name_with_home_doctor === true]))
  return ids.map((id: string) => {
    const full = names.get(id) || ''
    const first = String(full).trim().split(/\s+/)[0]
    const joined = chosen.get(id)
    const when = joined ? new Date(String(joined)).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''
    const label = shared.get(id) && first ? first : `Community member${when && when !== 'Invalid Date' ? ` · ${when}` : ''}`
    return { id, label }
  })
}

export type DoctorIntroduction = {
  id: string
  createdAt: string
  status: string
  place: string
  when: string
  sharedFirstName: string | null
  homeClinicLabel: string | null
  familyFirstNames: string | null
  exerciseTitles: string | null
  note: string | null
}

export async function loadDoctorIntroductions(doctorId: string): Promise<{ ready: boolean; rows: DoctorIntroduction[] }> {
  const admin = createAdminClient() as any
  const rows = await admin
    .from('community_passport_introductions')
    .select('id, trip_id, created_at, status, shared_first_name, home_clinic_label, family_first_names, exercise_titles, note')
    .eq('doctor_id', doctorId)
    .order('created_at', { ascending: false })
    .limit(30)
  if (missingRelation(rows.error)) return { ready: false, rows: [] }
  const tripIds = [...new Set((rows.data || []).map((row: { trip_id: string }) => row.trip_id))]
  const trips = tripIds.length
    ? await admin.from('community_passport_trips').select('id, place_label, starts_on, ends_on').in('id', tripIds)
    : { data: [] }
  const tripMap = new Map((trips.data || []).map((row: { id: string; place_label: string; starts_on: string; ends_on: string }) => [row.id, row]))
  return {
    ready: true,
    rows: (rows.data || []).map((row: Record<string, string | null>) => {
      const trip = tripMap.get(String(row.trip_id)) as { place_label: string; starts_on: string; ends_on: string } | undefined
      return {
        id: String(row.id),
        createdAt: String(row.created_at),
        status: String(row.status || 'sent'),
        place: trip?.place_label || 'A trip',
        when: trip ? formatTripRange(trip.starts_on, trip.ends_on) : '',
        sharedFirstName: row.shared_first_name,
        homeClinicLabel: row.home_clinic_label,
        familyFirstNames: row.family_first_names,
        exerciseTitles: row.exercise_titles,
        note: row.note,
      }
    }),
  }
}

export type NearbyInterest = {
  id: string
  path: WorkPath
  place: string
  note: string | null
  label: string
  email: string | null
  status: string
}

export async function loadNearbyInterest(doctor: { state?: string | null; country?: string | null }): Promise<{ ready: boolean; rows: NearbyInterest[] }> {
  const state = (doctor.state || '').trim().toUpperCase()
  const country = (doctor.country || '').trim().toUpperCase()
  if (!state && !country) return { ready: true, rows: [] }
  const admin = createAdminClient() as any
  let query = admin.from('community_work_interest').select('id, profile_id, path, place_label, note, share_contact, status, state_code, country_code').eq('status', 'open').limit(40)
  if (state) query = query.eq('state_code', state)
  else query = query.eq('country_code', country === 'UK' ? 'GB' : country)
  const rows = await query
  if (missingRelation(rows.error)) return { ready: false, rows: [] }
  const sharedIds = (rows.data || []).filter((row: { share_contact?: boolean }) => row.share_contact === true).map((row: { profile_id: string }) => row.profile_id)
  const profiles = sharedIds.length
    ? await admin.from('profiles').select('id, full_name, email').in('id', sharedIds)
    : { data: [] }
  const people = new Map((profiles.data || []).map((row: { id: string; full_name: string | null; email: string | null }) => [row.id, row]))
  return {
    ready: true,
    rows: (rows.data || []).filter((row: { path: string }) => isWorkPath(row.path)).map((row: Record<string, string | boolean | null>) => {
      const person = row.share_contact === true ? people.get(String(row.profile_id)) as { full_name?: string | null; email?: string | null } | undefined : undefined
      const first = (person?.full_name || '').trim().split(/\s+/)[0]
      return {
        id: String(row.id),
        path: row.path as WorkPath,
        place: String(row.place_label),
        note: (row.note as string | null) || null,
        label: first || 'Community member',
        email: person?.email || null,
        status: String(row.status),
      }
    }),
  }
}

export async function loadSharedExerciseTitles(profileId: string): Promise<string[]> {
  const { assignments } = await loadExercises(profileId)
  return assignments.filter((assignment) => assignment.shareOnPassport).map((assignment) => assignment.sample ? `${assignment.title} (sample)` : assignment.title)
}
