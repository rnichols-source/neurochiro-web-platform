import 'server-only'
import { createAdminClient } from '@/lib/supabase-admin'
import { schemaNotReady } from '@/lib/community/phase-data'
import { illnessDay, plainGuideLabel, remedyByKey, todayKey } from '@/lib/community/library-model'
import { remedyGuide } from '@/lib/community/library-content'
import { frequencyLabel } from '@/lib/doctor/follow-through'

export type SentRemedy = { id: string; name: string; howOften: string; doneToday: boolean }

export type IllnessNote = { id: string; startedOn: string; note: string | null; day: number }

export async function loadRemedyAccount(profileId: string, now = new Date()): Promise<{
  ready: boolean
  favorites: string[]
  checks: string[]
  notes: IllnessNote[]
}> {
  const admin = createAdminClient() as any
  const today = todayKey(now)
  const [favorites, checks, notes] = await Promise.all([
    admin.from('community_remedy_favorites').select('remedy_key').eq('profile_id', profileId),
    admin.from('community_shopping_checks').select('item_key').eq('profile_id', profileId),
    admin.from('community_illness_notes').select('id, started_on, note').eq('profile_id', profileId).order('started_on', { ascending: false }).limit(8),
  ])
  const ready = ![favorites.error, checks.error, notes.error].some(schemaNotReady)
  return {
    ready,
    favorites: (favorites.data || []).map((row: { remedy_key: string }) => row.remedy_key),
    checks: (checks.data || []).map((row: { item_key: string }) => row.item_key),
    notes: (notes.data || []).map((row: { id: string; started_on: string; note: string | null }) => ({
      id: row.id,
      startedOn: row.started_on,
      note: row.note,
      day: illnessDay(row.started_on, today),
    })),
  }
}

export async function loadSentRemedies(profileId: string, now = new Date()): Promise<SentRemedy[]> {
  const admin = createAdminClient() as any
  const rows = await admin
    .from('community_remedy_recommendations')
    .select('id, remedy_key, times_per_week, opened_at')
    .eq('profile_id', profileId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(40)
  if (schemaNotReady(rows.error) || rows.error) return []
  const ids = (rows.data || []).map((row: { id: string }) => row.id)
  const today = todayKey(now)
  const checks = ids.length
    ? await admin.from('community_remedy_checkins').select('recommendation_id, checked_on').in('recommendation_id', ids).eq('checked_on', today)
    : { data: [] }
  const done = new Set((checks.data || []).map((row: { recommendation_id: string }) => row.recommendation_id))
  const unopened = (rows.data || []).filter((row: { id: string; opened_at?: string | null }) => !row.opened_at).map((row: { id: string }) => row.id)
  if (unopened.length) {
    await admin.from('community_remedy_recommendations').update({ opened_at: now.toISOString() }).in('id', unopened)
  }
  const guide = remedyGuide()
  return (rows.data || []).map((row: { id: string; remedy_key: string; times_per_week?: number | null }) => {
    const card = remedyByKey(guide, row.remedy_key)
    return {
      id: row.id,
      name: card ? (plainGuideLabel(card.name) || 'Home remedy') : 'Home remedy',
      howOften: frequencyLabel(row.times_per_week || 3),
      doneToday: done.has(row.id),
    }
  })
}

export async function loadLibraryAssignees(doctorId: string, slug: string): Promise<string[]> {
  const admin = createAdminClient() as any
  const rows = await admin
    .from('community_exercise_assignments')
    .select('profile_id')
    .eq('doctor_id', doctorId)
    .eq('library_plan_slug', slug)
    .eq('status', 'active')
  if (schemaNotReady(rows.error) || rows.error) return []
  return (rows.data || []).map((row: { profile_id: string }) => row.profile_id)
}
