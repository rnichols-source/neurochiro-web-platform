'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerSupabase } from '@/lib/supabase-server'
import { sendCareSetInvite } from '@/lib/community/library-actions'
import { assignExerciseSet } from '@/lib/community/phase-actions'
import { libraryPlans } from '@/lib/community/library-content'
import { planBySlug } from '@/lib/community/library-model'
import { parseExerciseDraft, reminderLine } from '@/lib/community/phases'
import { isMissingTable } from '@/lib/leads/schema'
import { outcomePatch, stageToAckAction } from '@/lib/leads/outcomes'
import { updateContactRequest } from '@/lib/leads/schema'
import { FROM_ADDRESS } from '@/lib/leads/config'
import { doctorMayAssignProfile } from '@/lib/doctor/assign-access'
import { isPipelineStage, legacyLeadStage, type PipelineStage } from '@/lib/doctor/pipeline'

type Result = { ok: true; message?: string } | { ok: false; error: string }

function fail(error: string): Result {
  return { ok: false, error }
}

async function requireDoctor(): Promise<{ userId: string; doctorId: string } | null> {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient() as any
  const doctor = await admin.from('doctors').select('id').eq('user_id', user.id).maybeSingle()
  if (!doctor.data?.id) return null
  return { userId: user.id, doctorId: doctor.data.id }
}

function refresh() {
  for (const path of ['/doctor/people', '/doctor/care-sets', '/doctor/visit-requests', '/doctor/leads', '/portal/care/exercises', '/portal']) {
    revalidatePath(path)
  }
}

const PIPELINE_MISSING = 'That step needs the patient pipeline update from this change. It has not been applied on the database yet.'

export async function setRequestStage(source: string, sourceId: string, stage: string): Promise<Result> {
  const doctor = await requireDoctor()
  if (!doctor) return fail('A doctor profile is required.')
  if (source !== 'visit' && source !== 'lead' && source !== 'contact_request') return fail('That request is not in your list.')
  if (!isPipelineStage(stage)) return fail('That stage is not one of the patient steps.')
  if (!/^[0-9a-f-]{36}$/i.test(sourceId)) return fail('That request is not in your list.')
  const admin = createAdminClient() as any
  const owned = await sourceOwned(admin, doctor.doctorId, source, sourceId)
  if (!owned) return fail('That request is not in your list.')

  const saved = await savePipelineStage(admin, doctor.doctorId, source, sourceId, stage)
  const mirrored = await mirrorLegacyStage(admin, doctor.doctorId, source, sourceId, stage)
  if (!saved.ok && !mirrored.ok) return fail(saved.error || PIPELINE_MISSING)
  if (!saved.ok && mirrored.ok && (stage === 'not_a_fit' || stage === 'no_answer' || stage === 'went_elsewhere' || (source === 'visit' && (stage === 'scheduled' || stage === 'started_care')))) {
    return fail(PIPELINE_MISSING)
  }
  refresh()
  return { ok: true, message: saved.ok ? 'Saved.' : 'Saved on the request. Dated history starts after the pipeline update.' }
}

async function sourceOwned(admin: any, doctorId: string, source: string, sourceId: string): Promise<boolean> {
  const table = source === 'visit' ? 'community_visit_requests' : source === 'lead' ? 'leads' : 'contact_requests'
  const row = await admin.from(table).select('id').eq('id', sourceId).eq('doctor_id', doctorId).maybeSingle()
  return Boolean(row.data?.id)
}

async function savePipelineStage(admin: any, doctorId: string, source: string, sourceId: string, stage: PipelineStage): Promise<Result & { id?: string }> {
  const existing = await admin.from('doctor_request_pipeline').select('id, stage').eq('source', source).eq('source_id', sourceId).maybeSingle()
  if (isMissingTable(existing.error)) return fail(PIPELINE_MISSING)
  let id = existing.data?.id as string | undefined
  if (!id) {
    const inserted = await admin.from('doctor_request_pipeline').insert({
      doctor_id: doctorId,
      source,
      source_id: sourceId,
      stage,
    }).select('id').maybeSingle()
    if (isMissingTable(inserted.error)) return fail(PIPELINE_MISSING)
    if (!inserted.data?.id) return fail('The stage was not saved.')
    id = inserted.data.id
  } else if (existing.data.stage !== stage) {
    const updated = await admin.from('doctor_request_pipeline').update({
      stage,
      updated_at: new Date().toISOString(),
    }).eq('id', id).eq('doctor_id', doctorId).select('id').maybeSingle()
    if (!updated.data?.id) return fail('The stage was not saved.')
  }
  if (existing.data?.stage !== stage) {
    const event = await admin.from('doctor_request_stage_events').insert({
      pipeline_id: id,
      doctor_id: doctorId,
      stage,
    })
    if (event.error && !isMissingTable(event.error)) return fail('The stage was saved, but the dated history was not.')
  }
  return { ok: true, id }
}

async function mirrorLegacyStage(admin: any, doctorId: string, source: string, sourceId: string, stage: PipelineStage): Promise<Result> {
  if (source === 'lead') {
    const legacy = legacyLeadStage(stage)
    if (!legacy) return fail(PIPELINE_MISSING)
    const patch: Record<string, string> = { stage: legacy }
    if (stage === 'contacted') patch.last_contacted_at = new Date().toISOString()
    if (stage === 'started_care') patch.confirmed_at = new Date().toISOString()
    const updated = await admin.from('leads').update(patch).eq('id', sourceId).eq('doctor_id', doctorId).select('id')
    if (updated.error || !updated.data?.length) return fail('The lead stage was not saved.')
    return { ok: true }
  }
  if (source === 'contact_request') {
    const action = stageToAckAction(stage === 'started_care' ? 'converted' : stage)
    if (!action) return fail(PIPELINE_MISSING)
    const existing = await admin.from('contact_requests').select('id, acknowledged_at').eq('id', sourceId).eq('doctor_id', doctorId).maybeSingle()
    if (!existing.data?.id) return fail('That request is not in your list.')
    const updated = await updateContactRequest(admin, sourceId, outcomePatch(action, 'dashboard', existing.data.acknowledged_at || null))
    if (!updated.ok) return fail(updated.error || 'The request was not updated.')
    return { ok: true }
  }
  if (stage === 'contacted' || stage === 'scheduled' || stage === 'started_care') {
    const updated = await admin.from('community_visit_requests').update({
      status: 'seen',
      seen_at: new Date().toISOString(),
    }).eq('id', sourceId).eq('doctor_id', doctorId).in('status', ['requested', 'seen']).select('id')
    if (updated.error) return fail('The visit was not updated.')
    return { ok: true }
  }
  if (stage === 'not_a_fit' || stage === 'no_answer' || stage === 'went_elsewhere') {
    const updated = await admin.from('community_visit_requests').update({ status: 'closed' }).eq('id', sourceId).eq('doctor_id', doctorId).select('id')
    if (updated.error || !updated.data?.length) return fail(PIPELINE_MISSING)
    return { ok: true }
  }
  return { ok: true }
}

type RecommendPlan =
  | { kind: 'library'; slug: string }
  | { kind: 'custom'; setId: string }
  | { kind: 'new'; title: string; note: string; stepsText: string }

export async function recommendHomePlan(input: { source: string; sourceId: string; plan: RecommendPlan }): Promise<Result> {
  const doctor = await requireDoctor()
  if (!doctor) return fail('A doctor profile is required.')
  const target = await requestTarget(doctor.doctorId, input.source, input.sourceId)
  if (!target) return fail('That patient is not in your list.')
  const admin = createAdminClient() as any

  if (input.plan.kind === 'library') {
    if (target.profileId) {
      const { assignLibraryPlan } = await import('@/lib/community/library-actions')
      const assigned = await assignLibraryPlan({ profileId: target.profileId, slug: input.plan.slug, note: '' })
      if (!assigned.ok) return fail(assigned.error)
      refresh()
      return { ok: true, message: 'Home plan sent. It is on their Care page.' }
    }
    if (!target.email) return fail('They did not share an email, so the invite cannot be sent.')
    const invited = await sendCareSetInvite({
      email: target.email,
      slug: input.plan.slug,
      note: '',
      message: 'I put a home plan aside for you on NeuroChiro. Create your free account with this email and it will be waiting.',
    })
    if (!invited.ok) return fail(invited.error)
    refresh()
    return { ok: true, message: 'Invite sent. The home plan is waiting when they join with that email.' }
  }

  if (input.plan.kind === 'new') {
    if (!target.profileId) {
      return sendCustomEmail(admin, doctor.doctorId, target.email, input.plan.title, input.plan.note, input.plan.stepsText)
    }
    const assigned = await assignExerciseSet({
      profileId: target.profileId,
      title: input.plan.title,
      note: input.plan.note,
      stepsText: input.plan.stepsText,
    })
    if (!assigned.ok) return fail(assigned.error)
    refresh()
    return { ok: true, message: 'Home plan sent.' }
  }

  const set = await admin.from('community_exercise_sets').select('id, title, note, doctor_id').eq('id', input.plan.setId).eq('doctor_id', doctor.doctorId).maybeSingle()
  if (!set.data?.id) return fail('That plan is not one of yours.')
  if (target.profileId) {
    const allowed = await doctorMayAssignProfile(admin, doctor.doctorId, target.profileId)
    if (!allowed) return fail('That patient is not in your list.')
    const assignment = await admin.from('community_exercise_assignments').insert({
      profile_id: target.profileId,
      set_id: set.data.id,
      doctor_id: doctor.doctorId,
      status: 'active',
    }).select('id').maybeSingle()
    if (!assignment.data?.id) return fail('We could not send that plan.')
    await admin.from('notifications').insert({
      user_id: target.profileId,
      title: 'A home plan from your doctor',
      body: `${set.data.title} is in Your NeuroChiro. It supports the care you are already receiving. It is not a substitute for a visit.`,
      type: 'system',
      priority: 'info',
      link: '/portal/care/exercises',
    })
    refresh()
    return { ok: true, message: 'Home plan sent.' }
  }
  const steps = await admin.from('community_exercise_steps').select('position, label').eq('set_id', set.data.id).order('position')
  const lines = (steps.data || []).map((step: { label: string }) => step.label).join('\n')
  return sendCustomEmail(admin, doctor.doctorId, target.email, set.data.title, set.data.note || '', lines, set.data.id)
}

async function requestTarget(doctorId: string, source: string, sourceId: string): Promise<{ profileId: string | null; email: string | null } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(sourceId || '')) return null
  const admin = createAdminClient() as any
  if (source === 'visit') {
    const row = await admin.from('community_visit_requests').select('id, profile_id, shared_email').eq('id', sourceId).eq('doctor_id', doctorId).maybeSingle()
    if (!row.data?.id) return null
    return { profileId: row.data.profile_id || null, email: row.data.shared_email || null }
  }
  if (source === 'lead') {
    const row = await admin.from('leads').select('id, email').eq('id', sourceId).eq('doctor_id', doctorId).maybeSingle()
    if (!row.data?.id) return null
    return { profileId: null, email: row.data.email || null }
  }
  if (source === 'contact_request') {
    const row = await admin.from('contact_requests').select('id, email').eq('id', sourceId).eq('doctor_id', doctorId).maybeSingle()
    if (!row.data?.id) return null
    return { profileId: null, email: row.data.email || null }
  }
  if (source === 'member') {
    const allowed = await doctorMayAssignProfile(admin, doctorId, sourceId)
    if (!allowed) return null
    const profile = await admin.from('profiles').select('email').eq('id', sourceId).maybeSingle()
    return { profileId: sourceId, email: profile.data?.email || null }
  }
  return null
}

async function sendCustomEmail(admin: any, doctorId: string, email: string | null, title: string, note: string, stepsText: string, setId?: string): Promise<Result> {
  const to = (email || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return fail('They did not share an email, so the invite cannot be sent.')
  const draft = parseExerciseDraft({ title, note, stepsText })
  if ('error' in draft) return fail(draft.error)
  const key = process.env.RESEND_API_KEY
  if (!key) return fail('Email is not configured on this server, so nothing was sent.')
  const { Resend } = await import('resend')
  const resend = new Resend(key)
  const body = [draft.note || '', '', ...draft.steps.map((step, index) => `${index + 1}. ${step}`), '', 'neurochiro.co'].filter((line) => line !== '').join('\n')
  const sent = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `${title.trim()} from your NeuroChiro doctor`,
    text: `${body}\n`,
  })
  if (sent.error) return fail('The email did not send. Nothing was marked as sent.')
  if (setId) {
    await admin.from('community_doctor_care_invites').insert({
      doctor_id: doctorId,
      email: to,
      plan_slug: null,
      set_id: setId,
      note: note.trim() || null,
      token: crypto.randomUUID().replace(/-/g, ''),
      sent_at: new Date().toISOString(),
    })
  }
  refresh()
  return { ok: true, message: 'Email sent with the steps.' }
}

export async function nudgeHomePlan(assignmentId: string): Promise<Result> {
  const doctor = await requireDoctor()
  if (!doctor) return fail('A doctor profile is required.')
  if (!/^[0-9a-f-]{36}$/i.test(assignmentId || '')) return fail('That plan is not on your list.')
  const admin = createAdminClient() as any
  const row = await admin.from('community_exercise_assignments').select('id, profile_id, set_id, library_plan_slug, doctor_id').eq('id', assignmentId).eq('doctor_id', doctor.doctorId).maybeSingle()
  if (!row.data?.id || !row.data.profile_id) return fail('That plan is not on your list.')
  const updated = await admin.from('community_exercise_assignments').update({ reminder_enabled: true }).eq('id', assignmentId).select('id').maybeSingle()
  if (!updated.data?.id) return fail('The nudge was not saved.')
  let title = 'Your home plan'
  if (row.data.library_plan_slug) {
    title = planBySlug(libraryPlans(), row.data.library_plan_slug)?.name || title
  } else if (row.data.set_id) {
    const set = await admin.from('community_exercise_sets').select('title').eq('id', row.data.set_id).maybeSingle()
    if (set.data?.title) title = set.data.title
  }
  await admin.from('notifications').insert({
    user_id: row.data.profile_id,
    title: 'A quiet reminder',
    body: reminderLine(title),
    type: 'system',
    priority: 'info',
    link: '/portal/care/exercises',
  })
  refresh()
  return { ok: true, message: 'Nudge sent. It shows on their week page. No extra email.' }
}
