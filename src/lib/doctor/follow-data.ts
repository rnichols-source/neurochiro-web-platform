import 'server-only'
import { createAdminClient } from '@/lib/supabase-admin'
import { libraryPlans } from '@/lib/community/library-content'
import { planBySlug } from '@/lib/community/library-model'
import { schemaNotReady } from '@/lib/community/phase-data'
import { followCounts, type FollowCounts, type FollowRow } from '@/lib/doctor/follow-through'

export type FollowDesk = {
  rows: FollowRow[]
  counts: FollowCounts
  ready: boolean
}

export async function loadFollowThrough(doctorId: string, now = new Date(), timeZone = 'America/New_York'): Promise<FollowDesk> {
  const admin = createAdminClient() as any
  const rich = await admin
    .from('community_exercise_assignments')
    .select('id, profile_id, set_id, library_plan_slug, status, created_at, opened_at')
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
    admin.from('community_doctor_care_invites').select('id, email, plan_slug, created_at, sent_at, claimed_profile_id, claimed_at').eq('doctor_id', doctorId).order('created_at', { ascending: false }).limit(200),
  ])
  const ticks = new Map<string, string>()
  for (const row of [...(libraryDone.data || []), ...(stepDone.error ? [] : stepDone.data || [])]) {
    const at = row.completed_at as string | undefined
    if (!at) continue
    const prev = ticks.get(row.assignment_id)
    if (!prev || at > prev) ticks.set(row.assignment_id, at)
  }
  const profileIds = [...new Set(assignmentRows.map((row: { profile_id?: string | null }) => row.profile_id).filter(Boolean))] as string[]
  const profiles = profileIds.length
    ? await admin.from('profiles').select('id, full_name').in('id', profileIds)
    : { data: [] }
  const names = new Map((profiles.data || []).map((row: { id: string; full_name?: string | null }) => [row.id, (row.full_name || '').trim()]))
  const setIds = assignmentRows.map((row: { set_id?: string | null }) => row.set_id).filter(Boolean)
  const sets = setIds.length
    ? await admin.from('community_exercise_sets').select('id, title').in('id', setIds)
    : { data: [] }
  const setNames = new Map((sets.data || []).map((row: { id: string; title: string }) => [row.id, row.title]))
  const plans = libraryPlans()
  const claimed = new Set((invites.data || []).filter((row: { claimed_profile_id?: string | null; plan_slug?: string | null }) => row.claimed_profile_id).map((row: { claimed_profile_id: string; plan_slug?: string | null }) => `${row.claimed_profile_id}:${row.plan_slug || ''}`))
  const rows: FollowRow[] = assignmentRows.map((row: Record<string, string | null>) => ({
    id: `assignment-${row.id}`,
    name: names.get(String(row.profile_id)) || 'Patient',
    plan: (row.library_plan_slug ? planBySlug(plans, row.library_plan_slug)?.name : null) || setNames.get(String(row.set_id || '')) || 'Home plan',
    assignmentId: String(row.id),
    recommendedAt: String(row.created_at || now.toISOString()),
    openedAt: row.opened_at || null,
    lastTickAt: ticks.get(String(row.id)) || null,
  }))
  for (const invite of invites.error ? [] : (invites.data || [])) {
    if (invite.claimed_profile_id && claimed.has(`${invite.claimed_profile_id}:${invite.plan_slug || ''}`)) continue
    if (invite.claimed_profile_id) continue
    rows.push({
      id: `invite-${invite.id}`,
      name: invite.email || 'Email invite',
      plan: planBySlug(plans, invite.plan_slug || '')?.name || 'Home plan',
      assignmentId: null,
      recommendedAt: invite.sent_at || invite.created_at,
      openedAt: invite.claimed_at || null,
      lastTickAt: null,
    })
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
