'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerSupabase } from '@/lib/supabase-server'
import { requireCommunityMember } from '@/lib/community/data'
import { libraryPlans, remedyGuide } from '@/lib/community/library-content'
import {
  LIBRARY_COPY,
  isAssignableSlug,
  knownRemedyKey,
  knownShoppingKey,
  parseDoctorNote,
  parseIllnessNote,
  planBySlug,
  planExerciseKeys,
  planIncludesExercise,
  todayKey,
} from '@/lib/community/library-model'
import { schemaNotReady } from '@/lib/community/phase-data'

type Result = { ok: true } | { ok: false; error: string }

function fail(error: string): Result {
  return { ok: false, error }
}

function refresh(extra: string[] = []) {
  for (const path of [
    '/portal',
    '/portal/week',
    '/portal/care',
    '/portal/care/exercises',
    '/portal/care/remedies',
    '/doctor/care-sets',
    ...extra,
  ]) revalidatePath(path)
}

async function requireDoctor(): Promise<{ doctorId: string } | null> {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient() as any
  const doctor = await admin.from('doctors').select('id').eq('user_id', user.id).maybeSingle()
  if (!doctor.data?.id) return null
  return { doctorId: doctor.data.id }
}

export async function assignLibraryPlan(input: { profileId: string; slug: string; note: string }): Promise<Result> {
  const doctor = await requireDoctor()
  if (!doctor) return fail('A doctor profile is required.')
  const plans = libraryPlans()
  if (!isAssignableSlug(plans, input.slug)) return fail('That plan is not in the NeuroChiro library.')
  const plan = planBySlug(plans, input.slug)
  if (!plan) return fail('That plan is not in the NeuroChiro library.')
  const note = parseDoctorNote(input.note || '')
  if ('error' in note) return fail(note.error)
  const admin = createAdminClient() as any
  const link = await admin.from('community_home_doctors').select('profile_id').eq('doctor_id', doctor.doctorId).eq('profile_id', input.profileId).maybeSingle()
  if (!link.data?.profile_id) return fail(LIBRARY_COPY.notHomeDoctor)
  const existing = await admin
    .from('community_exercise_assignments')
    .select('id')
    .eq('profile_id', input.profileId)
    .eq('library_plan_slug', plan.slug)
    .eq('status', 'active')
    .maybeSingle()
  if (schemaNotReady(existing.error)) return fail(LIBRARY_COPY.libraryReadyNote)
  if (existing.data?.id) return fail(LIBRARY_COPY.alreadyAssigned)
  const assignment = await admin.from('community_exercise_assignments').insert({
    profile_id: input.profileId,
    set_id: null,
    library_plan_slug: plan.slug,
    doctor_id: doctor.doctorId,
    doctor_note: note.note,
    status: 'active',
  }).select('id').maybeSingle()
  if (schemaNotReady(assignment.error)) return fail(LIBRARY_COPY.libraryReadyNote)
  if (!assignment.data?.id) return fail('We could not assign that plan.')
  await admin.from('notifications').insert({
    user_id: input.profileId,
    title: 'A plan from your home doctor',
    body: `${plan.name} is in Your NeuroChiro. It is from the NeuroChiro library. It is not a substitute for a visit.`,
    type: 'system',
    priority: 'info',
    link: '/portal/care/exercises',
  })
  refresh([`/doctor/care-sets/${plan.slug}`])
  return { ok: true }
}

export async function toggleLibraryExercise(assignmentId: string, exerciseKey: string, done: boolean): Promise<Result> {
  const session = await requireCommunityMember()
  const admin = createAdminClient() as any
  const owned = await admin
    .from('community_exercise_assignments')
    .select('id, library_plan_slug')
    .eq('id', assignmentId)
    .eq('profile_id', session.userId)
    .maybeSingle()
  if (schemaNotReady(owned.error)) return fail(LIBRARY_COPY.libraryReadyNote)
  const slug = owned.data?.library_plan_slug as string | undefined
  if (!owned.data?.id || !slug) return fail('That plan is not on your account.')
  const plan = planBySlug(libraryPlans(), slug)
  if (!plan || !planIncludesExercise(plan, exerciseKey)) return fail('That exercise is not on this plan.')
  if (done) {
    const saved = await admin.from('community_library_exercise_done').upsert({
      assignment_id: assignmentId,
      exercise_key: exerciseKey,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'assignment_id,exercise_key' })
    if (schemaNotReady(saved.error)) return fail(LIBRARY_COPY.libraryReadyNote)
  } else {
    await admin.from('community_library_exercise_done').delete().eq('assignment_id', assignmentId).eq('exercise_key', exerciseKey)
  }
  const finished = await admin.from('community_library_exercise_done').select('exercise_key').eq('assignment_id', assignmentId)
  const keys = new Set((finished.data || []).map((row: { exercise_key: string }) => row.exercise_key))
  const allDone = planExerciseKeys(plan).every((key) => keys.has(key))
  await admin.from('community_exercise_assignments').update({
    status: allDone ? 'done' : 'active',
    updated_at: new Date().toISOString(),
  }).eq('id', assignmentId).eq('profile_id', session.userId)
  refresh()
  return { ok: true }
}

export async function toggleRemedyFavorite(remedyKey: string, saved: boolean): Promise<Result> {
  const session = await requireCommunityMember()
  if (!knownRemedyKey(remedyGuide(), remedyKey)) return fail('That remedy is not in the guide.')
  const admin = createAdminClient() as any
  const result = saved
    ? await admin.from('community_remedy_favorites').upsert({
      profile_id: session.userId,
      remedy_key: remedyKey,
    }, { onConflict: 'profile_id,remedy_key' })
    : await admin.from('community_remedy_favorites').delete().eq('profile_id', session.userId).eq('remedy_key', remedyKey)
  if (schemaNotReady(result.error)) return fail(LIBRARY_COPY.almostReady)
  refresh()
  return { ok: true }
}

export async function toggleShoppingItem(itemKey: string, checked: boolean): Promise<Result> {
  const session = await requireCommunityMember()
  if (!knownShoppingKey(remedyGuide(), itemKey)) return fail('That item is not on the shopping list.')
  const admin = createAdminClient() as any
  const result = checked
    ? await admin.from('community_shopping_checks').upsert({
      profile_id: session.userId,
      item_key: itemKey,
    }, { onConflict: 'profile_id,item_key' })
    : await admin.from('community_shopping_checks').delete().eq('profile_id', session.userId).eq('item_key', itemKey)
  if (schemaNotReady(result.error)) return fail(LIBRARY_COPY.almostReady)
  refresh(['/portal/care/remedies/shopping'])
  return { ok: true }
}

export async function saveIllnessNote(input: { startedOn: string; note: string }): Promise<Result> {
  const session = await requireCommunityMember()
  const parsed = parseIllnessNote(input.startedOn, input.note || '', todayKey(new Date()))
  if ('error' in parsed) return fail(parsed.error)
  const admin = createAdminClient() as any
  const saved = await admin.from('community_illness_notes').insert({
    profile_id: session.userId,
    started_on: parsed.startedOn,
    note: parsed.note,
  }).select('id').maybeSingle()
  if (schemaNotReady(saved.error)) return fail(LIBRARY_COPY.almostReady)
  if (!saved.data?.id) return fail('We could not save that note.')
  refresh()
  return { ok: true }
}

export async function deleteIllnessNote(noteId: string): Promise<Result> {
  const session = await requireCommunityMember()
  const admin = createAdminClient() as any
  const removed = await admin.from('community_illness_notes').delete().eq('id', noteId).eq('profile_id', session.userId).select('id').maybeSingle()
  if (schemaNotReady(removed.error)) return fail(LIBRARY_COPY.almostReady)
  if (!removed.data?.id) return fail('We could not remove that note.')
  refresh()
  return { ok: true }
}
