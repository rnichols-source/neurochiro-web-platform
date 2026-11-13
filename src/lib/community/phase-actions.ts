'use server'

import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerSupabase } from '@/lib/supabase-server'
import { loadCommunitySnapshot, loadListedDoctor, requireCommunityMember } from '@/lib/community/data'
import { displayFirstName, homeDoctorCard } from '@/lib/community/logic'
import { loadSharedExerciseTitles, missingRelation } from '@/lib/community/phase-data'
import {
  SAMPLE_SET,
  SAMPLE_SET_ID,
  WORK_PATH_LABELS,
  formatTripRange,
  invitationFoundNotice,
  invitationMessage,
  isFeeling,
  isInvitationToken,
  isTripKind,
  isWorkPath,
  parseExerciseDraft,
  parsePlace,
  passportDoctorView,
  prepareInvitation,
  prepareLiveQuestion,
  preparePassportShare,
  prepareWorkInterest,
  validateTripDates,
  weekStartKey,
  weeklyShowLine,
  workConnectNotice,
} from '@/lib/community/phases'

type Result = { ok: true } | { ok: false; error: string }
type InviteCreated = { ok: true; token: string; message: string } | { ok: false; error: string }

function fail(error: string): Result {
  return { ok: false, error }
}

function refresh() {
  for (const path of [
    '/portal',
    '/portal/week',
    '/portal/care',
    '/portal/care/exercises',
    '/portal/care/invite',
    '/portal/passport',
    '/portal/work',
    '/portal/refer',
    '/portal/me',
    '/doctor/care-sets',
    '/doctor/introductions',
    '/doctor/community-interest',
    '/doctor/lives',
  ]) revalidatePath(path)
}

async function requireDoctor(): Promise<{ doctorId: string; userId: string } | null> {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient() as any
  const doctor = await admin.from('doctors').select('id').eq('user_id', user.id).maybeSingle()
  if (!doctor.data?.id) return null
  return { doctorId: doctor.data.id, userId: user.id }
}

export async function saveCheckIn(feeling: string): Promise<Result> {
  const session = await requireCommunityMember()
  if (!isFeeling(feeling)) return fail('Choose how this week is going.')
  const admin = createAdminClient() as any
  const saved = await admin.from('community_week_checkins').upsert({
    profile_id: session.userId,
    week_start: weekStartKey(new Date()),
    feeling,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'profile_id,week_start' }).select('id').maybeSingle()
  if (missingRelation(saved.error)) return fail('This week saves with the latest database update.')
  if (saved.error || !saved.data) return fail('We could not save this week yet.')
  refresh()
  return { ok: true }
}

export async function askLiveQuestion(body: string): Promise<Result> {
  const session = await requireCommunityMember()
  const question = prepareLiveQuestion(body)
  if ('error' in question) return fail(question.error)
  const admin = createAdminClient() as any
  const show = weeklyShowLine(new Date())
  const saved = await admin.from('community_live_questions').upsert({
    profile_id: session.userId,
    show_date: show.dateKey,
    body: question.body,
  }, { onConflict: 'profile_id,show_date' }).select('id').maybeSingle()
  if (missingRelation(saved.error)) return fail('Questions save with the latest database update.')
  if (saved.error || !saved.data) return fail('We could not save that question.')
  refresh()
  return { ok: true }
}

async function ensureSample(admin: any): Promise<boolean> {
  const existing = await admin.from('community_exercise_sets').select('id').eq('id', SAMPLE_SET_ID).maybeSingle()
  if (missingRelation(existing.error)) return false
  if (existing.data?.id) return true
  const inserted = await admin.from('community_exercise_sets').insert({
    id: SAMPLE_SET_ID,
    doctor_id: null,
    title: SAMPLE_SET.title,
    note: SAMPLE_SET.note,
    is_sample: true,
  }).select('id').maybeSingle()
  if (!inserted.data?.id) return false
  await admin.from('community_exercise_steps').insert(SAMPLE_SET.steps.map((label, index) => ({
    set_id: SAMPLE_SET_ID,
    position: index + 1,
    label,
  })))
  return true
}

export async function trySampleSet(): Promise<Result> {
  const session = await requireCommunityMember()
  const admin = createAdminClient() as any
  const ready = await ensureSample(admin)
  if (!ready) return fail('Sets save with the latest database update.')
  const existing = await admin
    .from('community_exercise_assignments')
    .select('id')
    .eq('profile_id', session.userId)
    .eq('set_id', SAMPLE_SET_ID)
    .eq('status', 'active')
    .maybeSingle()
  if (existing.data?.id) {
    refresh()
    return { ok: true }
  }
  const inserted = await admin.from('community_exercise_assignments').insert({
    profile_id: session.userId,
    set_id: SAMPLE_SET_ID,
    doctor_id: null,
    status: 'active',
  }).select('id').maybeSingle()
  if (!inserted.data?.id) return fail('We could not open the sample set.')
  refresh()
  return { ok: true }
}

async function ownAssignment(admin: any, profileId: string, assignmentId: string) {
  const row = await admin.from('community_exercise_assignments').select('id, set_id, status').eq('id', assignmentId).eq('profile_id', profileId).maybeSingle()
  return row.data || null
}

export async function setExerciseReminder(assignmentId: string, enabled: boolean): Promise<Result> {
  const session = await requireCommunityMember()
  const admin = createAdminClient() as any
  const owned = await ownAssignment(admin, session.userId, assignmentId)
  if (!owned) return fail('That set is not on your account.')
  const saved = await admin.from('community_exercise_assignments').update({
    reminder_enabled: enabled === true,
    updated_at: new Date().toISOString(),
  }).eq('id', assignmentId).select('id').maybeSingle()
  if (!saved.data) return fail('We could not update the reminder.')
  refresh()
  return { ok: true }
}

export async function setExercisePassportShare(assignmentId: string, enabled: boolean): Promise<Result> {
  const session = await requireCommunityMember()
  const admin = createAdminClient() as any
  const owned = await ownAssignment(admin, session.userId, assignmentId)
  if (!owned) return fail('That set is not on your account.')
  const saved = await admin.from('community_exercise_assignments').update({
    share_on_passport: enabled === true,
    updated_at: new Date().toISOString(),
  }).eq('id', assignmentId).select('id').maybeSingle()
  if (!saved.data) return fail('We could not update passport sharing.')
  refresh()
  return { ok: true }
}

export async function toggleExerciseStep(assignmentId: string, stepId: string, done: boolean): Promise<Result> {
  const session = await requireCommunityMember()
  const admin = createAdminClient() as any
  const owned = await ownAssignment(admin, session.userId, assignmentId)
  if (!owned) return fail('That set is not on your account.')
  const step = await admin.from('community_exercise_steps').select('id').eq('id', stepId).eq('set_id', owned.set_id).maybeSingle()
  if (!step.data?.id) return fail('That step is not on this set.')
  if (done) {
    await admin.from('community_exercise_step_done').upsert({
      assignment_id: assignmentId,
      step_id: stepId,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'assignment_id,step_id' })
  } else {
    await admin.from('community_exercise_step_done').delete().eq('assignment_id', assignmentId).eq('step_id', stepId)
  }
  const steps = await admin.from('community_exercise_steps').select('id').eq('set_id', owned.set_id)
  const finished = await admin.from('community_exercise_step_done').select('step_id').eq('assignment_id', assignmentId)
  const allDone = (steps.data || []).length > 0 && (finished.data || []).length >= (steps.data || []).length
  await admin.from('community_exercise_assignments').update({
    status: allDone ? 'done' : 'active',
    updated_at: new Date().toISOString(),
  }).eq('id', assignmentId)
  refresh()
  return { ok: true }
}

export async function saveTrip(input: { place: string; startsOn: string; endsOn: string; kind: string }): Promise<Result> {
  const session = await requireCommunityMember()
  const place = parsePlace(input.place)
  if ('error' in place) return fail(place.error)
  const dates = validateTripDates(input.startsOn, input.endsOn, new Date())
  if (dates) return fail(dates)
  if (!isTripKind(input.kind)) return fail('Choose a trip, a move, or a second look.')
  const admin = createAdminClient() as any
  const inserted = await admin.from('community_passport_trips').insert({
    profile_id: session.userId,
    place_label: place.label,
    city: place.city,
    state_code: place.stateCode,
    country_code: place.countryCode,
    starts_on: input.startsOn,
    ends_on: input.endsOn,
    kind: input.kind,
    status: 'upcoming',
  }).select('id').maybeSingle()
  if (missingRelation(inserted.error)) return fail('A passport saves with the latest database update.')
  if (!inserted.data?.id) return fail('We could not save that stay.')
  refresh()
  return { ok: true }
}

export async function closeTrip(tripId: string): Promise<Result> {
  const session = await requireCommunityMember()
  const admin = createAdminClient() as any
  const saved = await admin.from('community_passport_trips').update({ status: 'closed' }).eq('id', tripId).eq('profile_id', session.userId).select('id').maybeSingle()
  if (!saved.data) return fail('We could not close that stay.')
  refresh()
  return { ok: true }
}

export async function sendIntroduction(input: {
  tripId: string
  doctorId: string
  shareFirstName: boolean
  shareHomeClinic: boolean
  shareFamily: boolean
  shareExercises: boolean
  note: string
}): Promise<Result> {
  const session = await requireCommunityMember()
  const doctor = await loadListedDoctor(input.doctorId)
  if (!doctor) return fail('Choose a listed doctor.')
  const admin = createAdminClient() as any
  const trip = await admin.from('community_passport_trips').select('id, place_label, starts_on, ends_on, status').eq('id', input.tripId).eq('profile_id', session.userId).maybeSingle()
  if (!trip.data?.id || trip.data.status !== 'upcoming') return fail('Choose an upcoming stay.')
  const snapshot = await loadCommunitySnapshot(session)
  const titles = await loadSharedExerciseTitles(session.userId)
  const home = snapshot.homeDoctor
  const share = preparePassportShare({
    shareFirstName: input.shareFirstName,
    shareHomeClinic: input.shareHomeClinic,
    shareFamily: input.shareFamily,
    shareExercises: input.shareExercises,
    firstName: displayFirstName(session.fullName),
    homeClinicLabel: home ? `${home.title}${home.place ? ` · ${home.place.replace(' · your home doctor', '')}` : ''}` : null,
    familyFirstNames: snapshot.family.map((person) => person.firstName),
    exerciseTitles: titles,
    note: input.note || '',
  })
  if (share.error) return fail(share.error)
  const inserted = await admin.from('community_passport_introductions').insert({
    trip_id: trip.data.id,
    profile_id: session.userId,
    doctor_id: doctor.id,
    shared_first_name: share.sharedFirstName,
    home_clinic_label: share.homeClinicLabel,
    family_first_names: share.familyFirstNames,
    exercise_titles: share.exerciseTitles,
    note: share.note,
    status: 'sent',
  }).select('id').maybeSingle()
  if (missingRelation(inserted.error)) return fail('Introductions save with the latest database update.')
  if (!inserted.data?.id) return fail('We could not send that introduction.')
  if (doctor.user_id) {
    const view = passportDoctorView({
      place: trip.data.place_label,
      when: formatTripRange(trip.data.starts_on, trip.data.ends_on),
      sharedFirstName: share.sharedFirstName,
      homeClinicLabel: share.homeClinicLabel,
      familyFirstNames: share.familyFirstNames,
      exerciseTitles: share.exerciseTitles,
      note: share.note,
    })
    await admin.from('notifications').insert({
      user_id: doctor.user_id,
      title: view.title,
      body: view.lines.join(' '),
      type: 'system',
      priority: 'important',
      link: '/doctor/introductions',
    })
  }
  refresh()
  return { ok: true }
}

export async function createInvitation(input: {
  recipientWords: string
  place: string
  note: string
  doctorId: string | null
}): Promise<InviteCreated> {
  const session = await requireCommunityMember()
  const prepared = prepareInvitation(input)
  if ('error' in prepared) return { ok: false, error: prepared.error }
  let doctorTitle: string | null = null
  let doctorId: string | null = null
  if (input.doctorId) {
    const doctor = await loadListedDoctor(input.doctorId)
    if (!doctor) return { ok: false, error: 'That doctor is not listed.' }
    doctorId = doctor.id
    doctorTitle = homeDoctorCard(doctor).title
  }
  const admin = createAdminClient() as any
  const count = await admin.from('community_care_invitations').select('id', { count: 'exact', head: true }).eq('sender_profile_id', session.userId)
  if ((count.count || 0) >= 30) return { ok: false, error: 'You already have 30 care invitations. That is enough for now.' }
  const token = randomBytes(18).toString('base64url')
  const inserted = await admin.from('community_care_invitations').insert({
    token,
    sender_profile_id: session.userId,
    recipient_words: prepared.recipientWords,
    place_label: prepared.place.label,
    city: prepared.place.city,
    state_code: prepared.place.stateCode,
    country_code: prepared.place.countryCode,
    doctor_id: doctorId,
    note: prepared.note,
    status: 'sent',
  }).select('id').maybeSingle()
  if (missingRelation(inserted.error)) return { ok: false, error: 'Invitations save with the latest database update.' }
  if (!inserted.data?.id) return { ok: false, error: 'We could not create that invitation.' }
  refresh()
  return {
    ok: true,
    token,
    message: invitationMessage({
      placeLabel: prepared.place.label,
      note: prepared.note,
      doctorTitle,
      token,
    }),
  }
}

export async function chooseInvitedDoctor(input: { token: string; doctorId: string; makeHome: boolean }): Promise<Result> {
  const session = await requireCommunityMember()
  if (!isInvitationToken(input.token)) return fail('This link is not active.')
  const doctor = await loadListedDoctor(input.doctorId)
  if (!doctor) return fail('Choose a listed doctor.')
  const admin = createAdminClient() as any
  const invite = await admin.from('community_care_invitations').select('id, status, place_label, sender_profile_id').eq('token', input.token).maybeSingle()
  if (!invite.data?.id) return fail('This link is not active.')
  if (invite.data.sender_profile_id === session.userId) return fail('This invitation is one you sent.')
  if (input.makeHome) {
    await admin.from('community_home_doctors').upsert({
      profile_id: session.userId,
      doctor_id: doctor.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id' })
  }
  if (invite.data.status !== 'found') {
    await admin.from('community_care_invitations').update({
      status: 'found',
      found_at: new Date().toISOString(),
    }).eq('id', invite.data.id)
    const sender = await admin.from('profiles').select('id').eq('id', invite.data.sender_profile_id).maybeSingle()
    if (sender.data?.id) {
      const notice = invitationFoundNotice(invite.data.place_label)
      await admin.from('notifications').insert({
        user_id: sender.data.id,
        title: notice.title,
        body: notice.body,
        type: 'system',
        priority: 'info',
        link: '/portal/care/invite',
      })
    }
  }
  refresh()
  return { ok: true }
}

export async function saveWorkInterest(input: { path: string; place: string; note: string; shareContact: boolean }): Promise<Result> {
  const session = await requireCommunityMember()
  const prepared = prepareWorkInterest(input)
  if ('error' in prepared) return fail(prepared.error)
  const admin = createAdminClient() as any
  const open = await admin.from('community_work_interest').select('id').eq('profile_id', session.userId).eq('path', prepared.path).eq('status', 'open').maybeSingle()
  if (open.data?.id) return fail(`You already have an open hand raised for ${WORK_PATH_LABELS[prepared.path]}.`)
  const inserted = await admin.from('community_work_interest').insert({
    profile_id: session.userId,
    path: prepared.path,
    place_label: prepared.place.label,
    city: prepared.place.city,
    state_code: prepared.place.stateCode,
    country_code: prepared.place.countryCode,
    note: prepared.note,
    share_contact: input.shareContact === true,
    status: 'open',
  }).select('id').maybeSingle()
  if (missingRelation(inserted.error)) return fail('Work interest saves with the latest database update.')
  if (!inserted.data?.id) return fail('We could not save that.')
  refresh()
  return { ok: true }
}

export async function closeWorkInterest(interestId: string): Promise<Result> {
  const session = await requireCommunityMember()
  const admin = createAdminClient() as any
  const saved = await admin.from('community_work_interest').update({
    status: 'closed',
    updated_at: new Date().toISOString(),
  }).eq('id', interestId).eq('profile_id', session.userId).select('id').maybeSingle()
  if (!saved.data) return fail('We could not close that.')
  refresh()
  return { ok: true }
}

export async function assignExerciseSet(input: { profileId: string; title: string; note: string; stepsText: string }): Promise<Result> {
  const doctor = await requireDoctor()
  if (!doctor) return fail('A doctor profile is required.')
  const draft = parseExerciseDraft(input)
  if ('error' in draft) return fail(draft.error)
  const admin = createAdminClient() as any
  const link = await admin.from('community_home_doctors').select('profile_id').eq('doctor_id', doctor.doctorId).eq('profile_id', input.profileId).maybeSingle()
  if (!link.data?.profile_id) return fail('That community member has not chosen you as their home doctor.')
  const set = await admin.from('community_exercise_sets').insert({
    doctor_id: doctor.doctorId,
    title: draft.title,
    note: draft.note,
    is_sample: false,
  }).select('id').maybeSingle()
  if (missingRelation(set.error)) return fail('Care sets save with the latest database update.')
  if (!set.data?.id) return fail('We could not save that set.')
  const steps = await admin.from('community_exercise_steps').insert(draft.steps.map((label, index) => ({
    set_id: set.data.id,
    position: index + 1,
    label,
  }))).select('id')
  if (!steps.data?.length) return fail('We could not save the steps.')
  const assignment = await admin.from('community_exercise_assignments').insert({
    profile_id: input.profileId,
    set_id: set.data.id,
    doctor_id: doctor.doctorId,
    status: 'active',
  }).select('id').maybeSingle()
  if (!assignment.data?.id) return fail('We could not assign that set.')
  await admin.from('notifications').insert({
    user_id: input.profileId,
    title: 'A set from your home doctor',
    body: `${draft.title} is in Your NeuroChiro. It supports the care you are already receiving. It is not a substitute for a visit.`,
    type: 'system',
    priority: 'info',
    link: '/portal/care/exercises',
  })
  refresh()
  return { ok: true }
}

export async function markIntroductionSeen(formData: FormData): Promise<void> {
  const introductionId = String(formData.get('id') || '')
  const doctor = await requireDoctor()
  if (!doctor || !introductionId) return
  const admin = createAdminClient() as any
  await admin.from('community_passport_introductions').update({
    status: 'seen',
    seen_at: new Date().toISOString(),
  }).eq('id', introductionId).eq('doctor_id', doctor.doctorId).eq('status', 'sent')
  refresh()
}

export async function connectWorkInterest(interestId: string): Promise<Result> {
  const doctor = await requireDoctor()
  if (!doctor) return fail('A doctor profile is required.')
  const admin = createAdminClient() as any
  const interest = await admin.from('community_work_interest').select('id, profile_id, path, place_label, status').eq('id', interestId).maybeSingle()
  if (!interest.data?.id || interest.data.status === 'closed' || !isWorkPath(interest.data.path)) return fail('That interest is not open.')
  const office = await admin.from('doctors').select('clinic_name, city, last_name').eq('id', doctor.doctorId).maybeSingle()
  const officeName = (office.data?.clinic_name || '').trim() || (office.data?.last_name ? `Dr. ${office.data.last_name}'s office` : 'A member office')
  const place = (office.data?.city || '').trim()
  await admin.from('community_work_connections').upsert({
    interest_id: interest.data.id,
    doctor_id: doctor.doctorId,
  }, { onConflict: 'interest_id,doctor_id' })
  await admin.from('community_work_interest').update({
    status: 'connected',
    updated_at: new Date().toISOString(),
  }).eq('id', interest.data.id)
  const notice = workConnectNotice(officeName, place, interest.data.path)
  await admin.from('notifications').insert({
    user_id: interest.data.profile_id,
    title: notice.title,
    body: notice.body,
    type: 'system',
    priority: 'info',
    link: '/portal/work',
  })
  refresh()
  return { ok: true }
}
