import 'server-only'
import { createAdminClient } from '@/lib/supabase-admin'
import { libraryPlans } from '@/lib/community/library-content'
import { planBySlug } from '@/lib/community/library-model'
import { schemaNotReady } from '@/lib/community/phase-data'
import { remedyGuide } from '@/lib/community/library-content'
import { plainGuideLabel, remedyByKey } from '@/lib/community/library-model'
import { clampTimesPerWeek, defaultTimesPerWeek, followCounts, zonedDateKey, type FollowCounts, type FollowRow } from '@/lib/doctor/follow-through'

export type FollowDesk = {
  rows: FollowRow[]
  counts: FollowCounts
  ready: boolean
}

export async function loadFollowThrough(doctorId: string, now = new Date(), timeZone = 'America/New_York'): Promise<FollowDesk> {
  const admin = createAdminClient() as any
  const rich = await admin
    .from('community_exercise_assignments')
    .select('id, profile_id, set_id, library_plan_slug, status, created_at, opened_at, times_per_week')
    .eq('doctor_id', doctorId)
    .order('created_at', { ascending: false })
    .limit(200)
  const assignments = schemaNotReady(rich.error)
    ? await admin.from('community_exercise_assignments').select('id, profile_id, set_id, library_plan_slug, status, created_at').eq('doctor_id', doctorId).order('created_at', { ascending: false }).limit(200)
    : rich
  if (assignments.error) return { rows: [], counts: followCounts([], now, timeZone), ready: false }
  const assignmentRows = assignments.data || []
  const ids = assignmentRows.map((row: { id: string }) => row.id)
  const [libraryDone, stepDone, invites] = await Promise.all([
    ids.length
      ? admin.from('community_library_exercise_done').select('assignment_id, completed_at').in('assignment_id', ids)
      : Promise.resolve({ data: [], error: null }),
    ids.length
      ? admin.from('community_exercise_step_done').select('assignment_id, completed_at').in('assignment_id', ids)
      : Promise.resolve({ data: [], error: null }),
    admin.from('community_doctor_care_invites').select('id, email, plan_slug, created_at, sent_at, claimed_profile_id, claimed_at, times_per_week').eq('doctor_id', doctorId).order('created_at', { ascending: false }).limit(200),
  ])
  const ticks = new Map<string, string>()
  const doneDays = new Map<string, Set<string>>()
  for (const row of [...(libraryDone.data || []), ...(stepDone.error ? [] : stepDone.data || [])]) {
    const at = row.completed_at as string | undefined
    if (!at) continue
    const prev = ticks.get(row.assignment_id)
    if (!prev || at > prev) ticks.set(row.assignment_id, at)
    const day = zonedDateKey(new Date(at), timeZone).key
    const set = doneDays.get(row.assignment_id) || new Set<string>()
    set.add(day)
    doneDays.set(row.assignment_id, set)
  }
  const profileIds = [...new Set(assignmentRows.map((row: { profile_id?: string | null }) => row.profile_id).filter(Boolean))] as string[]
  const profiles = profileIds.length
    ? await admin.from('profiles').select('id, full_name, email').in('id', profileIds)
    : { data: [] }
  const names = new Map<string, { name: string; email: string | null }>((profiles.data || []).map((row: { id: string; full_name?: string | null; email?: string | null }) => [row.id, { name: (row.full_name || '').trim(), email: row.email || null }]))
  const setIds = assignmentRows.map((row: { set_id?: string | null }) => row.set_id).filter(Boolean)
  const sets = setIds.length
    ? await admin.from('community_exercise_sets').select('id, title').in('id', setIds)
    : { data: [] }
  const setNames = new Map((sets.data || []).map((row: { id: string; title: string }) => [row.id, row.title]))
  const plans = libraryPlans()
  const guide = remedyGuide()
  const inviteRows = schemaNotReady(invites.error)
    ? await admin.from('community_doctor_care_invites').select('id, email, plan_slug, created_at, sent_at, claimed_profile_id, claimed_at').eq('doctor_id', doctorId).order('created_at', { ascending: false }).limit(200)
    : invites
  const claimed = new Set((inviteRows.data || []).filter((row: { claimed_profile_id?: string | null; plan_slug?: string | null }) => row.claimed_profile_id).map((row: { claimed_profile_id: string; plan_slug?: string | null }) => `${row.claimed_profile_id}:${row.plan_slug || ''}`))
  const rows: FollowRow[] = assignmentRows.map((row: Record<string, string | null>) => {
    const who = names.get(String(row.profile_id))
    const plan = row.library_plan_slug ? planBySlug(plans, row.library_plan_slug) : null
    return {
      id: `assignment-${row.id}`,
      name: who?.name || 'Patient',
      plan: plan?.name || setNames.get(String(row.set_id || '')) || 'Home plan',
      assignmentId: String(row.id),
      recommendedAt: String(row.created_at || now.toISOString()),
      openedAt: row.opened_at || null,
      lastTickAt: ticks.get(String(row.id)) || null,
      doneOn: [...(doneDays.get(String(row.id)) || [])],
      timesPerWeek: clampTimesPerWeek(row.times_per_week, plan ? defaultTimesPerWeek(plan.phases[0]?.frequency) : 3),
      profileId: row.profile_id,
      email: who?.email || null,
    }
  })
  for (const invite of inviteRows.error ? [] : (inviteRows.data || [])) {
    if (invite.claimed_profile_id && claimed.has(`${invite.claimed_profile_id}:${invite.plan_slug || ''}`)) continue
    if (invite.claimed_profile_id) continue
    const plan = planBySlug(plans, invite.plan_slug || '')
    rows.push({
      id: `invite-${invite.id}`,
      name: invite.email || 'Email invite',
      plan: plan?.name || 'Home plan',
      assignmentId: null,
      recommendedAt: invite.sent_at || invite.created_at,
      openedAt: invite.claimed_at || null,
      lastTickAt: null,
      doneOn: [],
      timesPerWeek: clampTimesPerWeek(invite.times_per_week, plan ? defaultTimesPerWeek(plan.phases[0]?.frequency) : 3),
      profileId: invite.claimed_profile_id,
      email: invite.email,
    })
  }
  const remedies = await admin
    .from('community_remedy_recommendations')
    .select('id, profile_id, email, remedy_key, times_per_week, opened_at, created_at')
    .eq('doctor_id', doctorId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(200)
  if (!schemaNotReady(remedies.error) && !remedies.error) {
    const remedyIds = (remedies.data || []).map((row: { id: string }) => row.id)
    const checkins = remedyIds.length
      ? await admin.from('community_remedy_checkins').select('recommendation_id, checked_on').in('recommendation_id', remedyIds)
      : { data: [] }
    const remedyDays = new Map<string, string[]>()
    for (const row of checkins.data || []) {
      const list = remedyDays.get(row.recommendation_id) || []
      list.push(String(row.checked_on))
      remedyDays.set(row.recommendation_id, list)
    }
    const extraIds = (remedies.data || []).map((row: { profile_id?: string | null }) => row.profile_id).filter((id: string | null | undefined) => id && !names.has(id))
    if (extraIds.length) {
      const extra = await admin.from('profiles').select('id, full_name, email').in('id', extraIds)
      for (const row of extra.data || []) names.set(row.id, { name: (row.full_name || '').trim(), email: row.email || null })
    }
    for (const remedy of remedies.data || []) {
      const card = remedyByKey(guide, remedy.remedy_key)
      const who = remedy.profile_id ? names.get(remedy.profile_id) : null
      const days = remedyDays.get(remedy.id) || []
      rows.push({
        id: `remedy-${remedy.id}`,
        name: who?.name || remedy.email || 'Email invite',
        plan: card ? plainGuideLabel(card.name) : 'Home remedy',
        assignmentId: null,
        remedyId: remedy.id,
        recommendedAt: remedy.created_at,
        openedAt: remedy.opened_at || null,
        lastTickAt: days.length ? `${[...days].sort().at(-1)}T12:00:00.000Z` : null,
        doneOn: days,
        timesPerWeek: clampTimesPerWeek(remedy.times_per_week, 3),
        profileId: remedy.profile_id,
        email: who?.email || remedy.email,
      })
    }
  }
  return { rows, counts: followCounts(rows, now, timeZone), ready: true }
}

export async function loadDoctorPlanChoices(doctorId: string): Promise<{ customSets: { id: string; title: string }[] }> {
  const admin = createAdminClient() as any
  const sets = await admin.from('community_exercise_sets').select('id, title, is_sample').eq('doctor_id', doctorId).order('created_at', { ascending: false }).limit(40)
  if (sets.error) return { customSets: [] }
  return {
    customSets: (sets.data || [])
      .filter((row: { is_sample?: boolean; title?: string }) => row.is_sample !== true && row.title)
      .map((row: { id: string; title: string }) => ({ id: row.id, title: row.title })),
  }
}
