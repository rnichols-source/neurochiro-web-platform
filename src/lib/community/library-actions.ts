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
    '/portal/refer',
    '/portal/me',
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

export async function sendCareSetInvite(input: { email: string; slug: string; note: string; message: string }): Promise<Result & { preview?: string }> {
  const doctor = await requireDoctor()
  if (!doctor) return fail('A doctor profile is required.')
  const email = input.email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Enter an email address.')
  const plans = libraryPlans()
  if (!isAssignableSlug(plans, input.slug)) return fail('That plan is not in the NeuroChiro library.')
  const plan = planBySlug(plans, input.slug)
  if (!plan) return fail('That plan is not in the NeuroChiro library.')
  const note = parseDoctorNote(input.note || '')
  if ('error' in note) return fail(note.error)
  const message = (input.message || '').trim()
  if (!message) return fail('Write the note you want to send, then click send.')
  const admin = createAdminClient() as any
  const token = crypto.randomUUID().replace(/-/g, '')
  const row = await admin.from('community_doctor_care_invites').insert({
    doctor_id: doctor.doctorId,
    email,
    plan_slug: plan.slug,
    note: note.note,
    token,
  }).select('id').maybeSingle()
  if (schemaNotReady(row.error)) return fail('Care invites need the latest database update.')
  if (!row.data?.id) return fail('Could not save that invite.')
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://neurochiro.co'
  const link = `${site}/portal/care/from-doctor?token=${token}`
  const { Resend } = await import('resend')
  const key = process.env.RESEND_API_KEY
  if (!key) return fail('Email is not configured on this server, so nothing was sent.')
  const resend = new Resend(key)
  const sent = await resend.emails.send({
    from: 'NeuroChiro <support@neurochirodirectory.com>',
    to: email,
    subject: `${plan.name} from your NeuroChiro doctor`,
    text: `${message}\n\nOpen your care set: ${link}\n\nneurochiro.co`,
  })
  if (sent.error) return fail('The invite was saved, but the email did not send.')
  await admin.from('community_doctor_care_invites').update({ sent_at: new Date().toISOString() }).eq('id', row.data.id)
  return { ok: true, preview: link }
}

export async function claimCareSetInvite(token: string): Promise<Result> {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const { loginPathWithReturn } = await import('@/lib/auth/safe-return-path')
    const { redirect } = await import('next/navigation')
    redirect(loginPathWithReturn(`/portal/care/from-doctor?token=${encodeURIComponent(token)}`))
  }
  const session = await requireCommunityMember()
  const admin = createAdminClient() as any
  const invite = await admin.from('community_doctor_care_invites').select('id, doctor_id, plan_slug, note, claimed_profile_id, email').eq('token', token).maybeSingle()
  if (schemaNotReady(invite.error)) return fail('Care invites need the latest database update.')
  if (!invite.data?.id) return fail('This link is not active.')
  if (invite.data.claimed_profile_id && invite.data.claimed_profile_id !== session.userId) return fail('This link was already used.')
  const profile = await admin.from('profiles').select('email').eq('id', session.userId).maybeSingle()
  if ((profile.data?.email || '').toLowerCase() !== String(invite.data.email || '').toLowerCase()) {
    return fail('Sign in with the email address this invite was sent to.')
  }
  if (!invite.data.claimed_profile_id) {
    const existing = await admin.from('community_exercise_assignments').select('id').eq('profile_id', session.userId).eq('library_plan_slug', invite.data.plan_slug).eq('status', 'active').maybeSingle()
    if (!existing.data?.id) {
      const assignment = await admin.from('community_exercise_assignments').insert({
        profile_id: session.userId,
        set_id: null,
        library_plan_slug: invite.data.plan_slug,
        doctor_id: invite.data.doctor_id,
        doctor_note: invite.data.note,
        status: 'active',
      }).select('id').maybeSingle()
      if (!assignment.data?.id && !existing.data?.id) return fail('We could not add that care set to your account.')
    }
    const home = await admin.from('community_home_doctors').select('doctor_id').eq('profile_id', session.userId).maybeSingle()
    if (!home.data?.doctor_id) {
      await admin.from('community_home_doctors').insert({ profile_id: session.userId, doctor_id: invite.data.doctor_id })
    }
    await admin.from('community_doctor_care_invites').update({ claimed_profile_id: session.userId, claimed_at: new Date().toISOString() }).eq('id', invite.data.id)
  }
  refresh()
  return { ok: true }
}

export async function markLibraryPhaseDone(assignmentId: string, phaseKey: string): Promise<Result> {
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
  const phase = plan?.phases.find((item) => item.key === phaseKey)
  if (!plan || !phase) return fail('That phase is not on this plan.')
  const stamp = new Date().toISOString()
  const saved = await admin.from('community_library_exercise_done').upsert(
    phase.exercises.map((exercise) => ({
      assignment_id: assignmentId,
      exercise_key: exercise.key,
      completed_at: stamp,
    })),
    { onConflict: 'assignment_id,exercise_key' },
  )
  if (schemaNotReady(saved.error)) return fail(LIBRARY_COPY.libraryReadyNote)
  const finished = await admin.from('community_library_exercise_done').select('exercise_key').eq('assignment_id', assignmentId)
  const keys = new Set((finished.data || []).map((row: { exercise_key: string }) => row.exercise_key))
  const allDone = planExerciseKeys(plan).every((key) => keys.has(key))
  await admin.from('community_exercise_assignments').update({
    status: allDone ? 'done' : 'active',
    updated_at: stamp,
  }).eq('id', assignmentId).eq('profile_id', session.userId)
  refresh()
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
