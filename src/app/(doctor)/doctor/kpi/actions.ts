'use server'

import { createServerSupabase } from '@/lib/supabase-server'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DailyEntryInput {
  patientVisits: number
  newPatients: number
  collections: number
  noShows: number
  energyLevel: number
}

export interface KpiEntry {
  id: string
  user_id: string
  date: string
  patient_visits: number
  new_patients: number
  collections: number
  no_shows: number
  energy_level: number
  created_at: string
}

export interface WeeklySummary {
  weekStart: string
  patientVisits: number
  newPatients: number
  collections: number
  noShows: number
  energyLevel: number
  entryCount: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Return the Monday (ISO week start) for a given date string. */
function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay() // 0=Sun … 6=Sat
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
  const monday = new Date(d)
  monday.setDate(diff)
  return monday.toISOString().slice(0, 10)
}

async function getAuthUserId(): Promise<string | null> {
  try {
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// 1. logDailyEntry — upsert today's KPI entry
// ---------------------------------------------------------------------------

export async function logDailyEntry(
  data: DailyEntryInput
): Promise<{ success: true } | { error: string }> {
  try {
    const userId = await getAuthUserId()
    if (!userId) return { error: 'Not authenticated' }

    const supabase = createServerSupabase()
    const db = supabase as any

    const { error } = await db
      .from('kpi_entries')
      .upsert(
        {
          user_id: userId,
          date: todayISO(),
          patient_visits: data.patientVisits,
          new_patients: data.newPatients,
          collections: data.collections,
          no_shows: data.noShows,
          energy_level: data.energyLevel,
        },
        { onConflict: 'user_id,date' }
      )

    if (error) return { error: error.message }
    return { success: true }
  } catch (e: any) {
    return { error: e?.message ?? 'Failed to log entry' }
  }
}

// ---------------------------------------------------------------------------
// 2. getTodayEntry — fetch today's entry for the current user
// ---------------------------------------------------------------------------

export async function getTodayEntry(): Promise<KpiEntry | null> {
  try {
    const userId = await getAuthUserId()
    if (!userId) return null

    const supabase = createServerSupabase()
    const db = supabase as any

    const { data, error } = await db
      .from('kpi_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', todayISO())
      .maybeSingle()

    if (error) return null
    return data as KpiEntry | null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// 3. getWeeklyData — entries aggregated by week
// ---------------------------------------------------------------------------

export async function getWeeklyData(
  weeksBack: number = 2
): Promise<WeeklySummary[]> {
  try {
    const userId = await getAuthUserId()
    if (!userId) return []

    const supabase = createServerSupabase()
    const db = supabase as any

    // Calculate the start date (beginning of the earliest week we need)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - weeksBack * 7)
    const startISO = startDate.toISOString().slice(0, 10)

    const { data, error } = await db
      .from('kpi_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startISO)
      .order('date', { ascending: true })

    if (error || !data) return []

    const entries = data as KpiEntry[]

    // Group by week start (Monday)
    const weekMap = new Map<string, KpiEntry[]>()
    for (const entry of entries) {
      const ws = getWeekStart(entry.date)
      const list = weekMap.get(ws) ?? []
      list.push(entry)
      weekMap.set(ws, list)
    }

    const summaries: WeeklySummary[] = []
    for (const [weekStart, items] of weekMap) {
      summaries.push({
        weekStart,
        patientVisits: items.reduce((s, e) => s + (e.patient_visits ?? 0), 0),
        newPatients: items.reduce((s, e) => s + (e.new_patients ?? 0), 0),
        collections: items.reduce((s, e) => s + (e.collections ?? 0), 0),
        noShows: items.reduce((s, e) => s + (e.no_shows ?? 0), 0),
        energyLevel:
          items.length > 0
            ? Math.round(
                items.reduce((s, e) => s + (e.energy_level ?? 0), 0) /
                  items.length
              )
            : 0,
        entryCount: items.length,
      })
    }

    // Sort ascending by weekStart
    summaries.sort((a, b) => a.weekStart.localeCompare(b.weekStart))
    return summaries
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// 4. getDailyEntries — last N days of entries sorted ascending
// ---------------------------------------------------------------------------

export async function getDailyEntries(
  days: number = 90
): Promise<KpiEntry[]> {
  try {
    const userId = await getAuthUserId()
    if (!userId) return []

    const supabase = createServerSupabase()
    const db = supabase as any

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startISO = startDate.toISOString().slice(0, 10)

    const { data, error } = await db
      .from('kpi_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startISO)
      .order('date', { ascending: true })

    if (error || !data) return []
    return data as KpiEntry[]
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// 5. getStreak — consecutive day streak (current + longest ever)
// ---------------------------------------------------------------------------

export async function getStreak(): Promise<{ current: number; longest: number }> {
  try {
    const userId = await getAuthUserId()
    if (!userId) return { current: 0, longest: 0 }

    const supabase = createServerSupabase()
    const db = supabase as any

    // Fetch all entries sorted descending to walk backwards for streaks
    const { data, error } = await db
      .from('kpi_entries')
      .select('date')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error || !data || data.length === 0) return { current: 0, longest: 0 }

    const dates = new Set((data as { date: string }[]).map((e) => e.date))

    // Current streak: walk backwards from yesterday (today doesn't need to be logged)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    // If today is logged, start from today; otherwise start from yesterday
    let cursor = new Date()
    if (!dates.has(cursor.toISOString().slice(0, 10))) {
      cursor = yesterday
    }

    let current = 0
    while (true) {
      const iso = cursor.toISOString().slice(0, 10)
      if (!dates.has(iso)) break
      current++
      cursor.setDate(cursor.getDate() - 1)
    }

    // Longest streak: sort all dates ascending and walk forward
    const sorted = Array.from(dates).sort()
    let longest = 0
    let streak = 1

    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1] + 'T00:00:00')
      const curr = new Date(sorted[i] + 'T00:00:00')
      const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)

      if (diffDays === 1) {
        streak++
      } else {
        if (streak > longest) longest = streak
        streak = 1
      }
    }
    if (streak > longest) longest = streak
    if (current > longest) longest = current

    return { current, longest }
  } catch {
    return { current: 0, longest: 0 }
  }
}
