'use server'

import { createServerSupabase } from '@/lib/supabase-server'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getUser() {
  const supabase = createServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return { supabase, user }
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function calculateScore(sleep: number, stress: number, energy: number, pain: number): number {
  return (sleep * 5) + ((6 - stress) * 5) + (energy * 5) + ((6 - pain) * 5)
}

// ---------------------------------------------------------------------------
// 1. logCheckin
// ---------------------------------------------------------------------------

export async function logCheckin(data: {
  sleep: number
  stress: number
  energy: number
  pain: number
  note?: string
}): Promise<{ success: true; score: number } | { error: string }> {
  try {
    const { supabase, user } = await getUser()
    const score = calculateScore(data.sleep, data.stress, data.energy, data.pain)
    const date = todayDate()

    const { error } = await (supabase as any)
      .from('patient_checkins')
      .upsert(
        {
          user_id: user.id,
          date,
          sleep: data.sleep,
          stress: data.stress,
          energy: data.energy,
          pain: data.pain,
          score,
          note: data.note ?? null,
        },
        { onConflict: 'user_id,date' }
      )

    if (error) return { error: error.message }
    return { success: true, score }
  } catch (e: any) {
    return { error: e.message ?? 'Failed to log check-in' }
  }
}

// ---------------------------------------------------------------------------
// 2. getTodayCheckin
// ---------------------------------------------------------------------------

export async function getTodayCheckin(): Promise<{
  date: string
  sleep: number
  stress: number
  energy: number
  pain: number
  score: number
  note: string | null
} | null> {
  try {
    const { supabase, user } = await getUser()
    const date = todayDate()

    const { data, error } = await (supabase as any)
      .from('patient_checkins')
      .select('date, sleep, stress, energy, pain, score, note')
      .eq('user_id', user.id)
      .eq('date', date)
      .maybeSingle()

    if (error) return null
    return data ?? null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// 3. getCheckinHistory
// ---------------------------------------------------------------------------

export async function getCheckinHistory(days: number = 30): Promise<
  { date: string; sleep: number; stress: number; energy: number; pain: number; score: number; note: string | null }[]
> {
  try {
    const { supabase, user } = await getUser()
    const since = new Date()
    since.setDate(since.getDate() - days)
    const sinceStr = since.toISOString().slice(0, 10)

    const { data, error } = await (supabase as any)
      .from('patient_checkins')
      .select('date, sleep, stress, energy, pain, score, note')
      .eq('user_id', user.id)
      .gte('date', sinceStr)
      .order('date', { ascending: true })

    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// 4. getCheckinStreak
// ---------------------------------------------------------------------------

export async function getCheckinStreak(): Promise<{ current: number; longest: number }> {
  try {
    const { supabase, user } = await getUser()

    const { data, error } = await (supabase as any)
      .from('patient_checkins')
      .select('date')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (error || !data || data.length === 0) return { current: 0, longest: 0 }

    const dates = new Set<string>(data.map((r: { date: string }) => r.date))

    // Walk backward from today (or yesterday if today not logged)
    const today = todayDate()
    let cursor = new Date(today + 'T00:00:00')
    if (!dates.has(today)) {
      cursor.setDate(cursor.getDate() - 1)
      if (!dates.has(cursor.toISOString().slice(0, 10))) {
        // No streak at all — still compute longest
        return { current: 0, longest: computeLongest(data) }
      }
    }

    let current = 0
    while (dates.has(cursor.toISOString().slice(0, 10))) {
      current++
      cursor.setDate(cursor.getDate() - 1)
    }

    const longest = Math.max(current, computeLongest(data))
    return { current, longest }
  } catch {
    return { current: 0, longest: 0 }
  }
}

function computeLongest(rows: { date: string }[]): number {
  if (rows.length === 0) return 0
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date))
  let longest = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].date + 'T00:00:00')
    const curr = new Date(sorted[i].date + 'T00:00:00')
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    if (diff === 1) {
      run++
      longest = Math.max(longest, run)
    } else {
      run = 1
    }
  }
  return longest
}

// ---------------------------------------------------------------------------
// 5. markExerciseComplete
// ---------------------------------------------------------------------------

export async function markExerciseComplete(
  exerciseId: string
): Promise<{ success: true } | { error: string }> {
  try {
    const { supabase, user } = await getUser()

    const { error } = await (supabase as any)
      .from('patient_exercises')
      .insert({
        user_id: user.id,
        exercise_id: exerciseId,
        completed_at: new Date().toISOString(),
      })

    if (error) return { error: error.message }
    return { success: true }
  } catch (e: any) {
    return { error: e.message ?? 'Failed to mark exercise complete' }
  }
}

// ---------------------------------------------------------------------------
// 6. getCompletedExercises
// ---------------------------------------------------------------------------

export async function getCompletedExercises(
  days: number = 7
): Promise<{ exercise_id: string; completed_at: string }[]> {
  try {
    const { supabase, user } = await getUser()
    const since = new Date()
    since.setDate(since.getDate() - days)

    const { data, error } = await (supabase as any)
      .from('patient_exercises')
      .select('exercise_id, completed_at')
      .eq('user_id', user.id)
      .gte('completed_at', since.toISOString())
      .order('completed_at', { ascending: false })

    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// 7. markArticleRead
// ---------------------------------------------------------------------------

export async function markArticleRead(
  articleId: string
): Promise<{ success: true } | { error: string }> {
  try {
    const { supabase, user } = await getUser()

    const { error } = await (supabase as any)
      .from('patient_articles_read')
      .upsert(
        {
          user_id: user.id,
          article_id: articleId,
          read_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,article_id' }
      )

    if (error) return { error: error.message }
    return { success: true }
  } catch (e: any) {
    return { error: e.message ?? 'Failed to mark article as read' }
  }
}

// ---------------------------------------------------------------------------
// 8. getReadArticles
// ---------------------------------------------------------------------------

export async function getReadArticles(): Promise<string[]> {
  try {
    const { supabase, user } = await getUser()

    const { data, error } = await (supabase as any)
      .from('patient_articles_read')
      .select('article_id')
      .eq('user_id', user.id)

    if (error) return []
    return (data ?? []).map((r: { article_id: string }) => r.article_id)
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// 9. addJourneyNote
// ---------------------------------------------------------------------------

export async function addJourneyNote(
  date: string,
  note: string
): Promise<{ success: true } | { error: string }> {
  try {
    const { supabase, user } = await getUser()

    // Try to update existing entry first
    const { data: existing } = await (supabase as any)
      .from('patient_checkins')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', date)
      .maybeSingle()

    if (existing) {
      const { error } = await (supabase as any)
        .from('patient_checkins')
        .update({ note })
        .eq('user_id', user.id)
        .eq('date', date)

      if (error) return { error: error.message }
      return { success: true }
    }

    // No entry for that date — create one with neutral defaults + note
    const defaults = { sleep: 3, stress: 3, energy: 3, pain: 3 }
    const score = calculateScore(defaults.sleep, defaults.stress, defaults.energy, defaults.pain)

    const { error } = await (supabase as any)
      .from('patient_checkins')
      .insert({
        user_id: user.id,
        date,
        ...defaults,
        score,
        note,
      })

    if (error) return { error: error.message }
    return { success: true }
  } catch (e: any) {
    return { error: e.message ?? 'Failed to add journey note' }
  }
}

// ---------------------------------------------------------------------------
// 10. isPremiumMember
// ---------------------------------------------------------------------------

export async function isPremiumMember(): Promise<boolean> {
  try {
    const { supabase, user } = await getUser()

    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('tier, subscription_status')
      .eq('id', user.id)
      .maybeSingle()

    if (error || !data) return false
    return data.tier !== 'free' || data.subscription_status === 'active'
  } catch {
    return false
  }
}
