import 'server-only'

import { unstable_cache } from 'next/cache'
import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase-admin'
import { deltaFromCounts, type PulseWindows, type WindowPair } from './pulse'

const DAY = 86_400_000

type CountResult = { count: number | null; error: { message?: string } | null }

type CountQuery = PromiseLike<CountResult> & {
  gt: (column: string, value: string) => CountQuery
  lte: (column: string, value: string) => CountQuery
  eq: (column: string, value: string) => CountQuery
}

type CountClient = {
  from: (table: string) => {
    select: (columns: string, options: { count: 'exact'; head: true }) => CountQuery
  }
}

async function rangedCount(admin: CountClient, table: string, fromIso: string, toIso: string, eventType?: string): Promise<number | null> {
  try {
    let query = admin.from(table).select('id', { count: 'exact', head: true }).gt('created_at', fromIso).lte('created_at', toIso)
    if (eventType) query = query.eq('event_type', eventType)
    const { count, error } = await query
    if (error) return null
    return count ?? 0
  } catch {
    return null
  }
}

async function pair(admin: CountClient, table: string, now: number, eventType?: string): Promise<WindowPair | null> {
  const at = (ms: number) => new Date(now - ms).toISOString()
  const nowIso = new Date(now).toISOString()
  const [dayCurrent, dayPrevious, weekCurrent, weekPrevious] = await Promise.all([
    rangedCount(admin, table, at(DAY), nowIso, eventType),
    rangedCount(admin, table, at(2 * DAY), at(DAY), eventType),
    rangedCount(admin, table, at(7 * DAY), nowIso, eventType),
    rangedCount(admin, table, at(14 * DAY), at(7 * DAY), eventType),
  ])
  if (dayCurrent == null || dayPrevious == null || weekCurrent == null || weekPrevious == null) return null
  return {
    day: deltaFromCounts(dayCurrent, dayPrevious),
    week: deltaFromCounts(weekCurrent, weekPrevious),
  }
}

async function loadPulseWindowsFresh(): Promise<PulseWindows> {
  const admin = createAdminClient() as unknown as CountClient
  const now = Date.now()
  const [mentions, searches, profileViews, portalVisits] = await Promise.all([
    pair(admin, 'demand_mentions', now),
    pair(admin, 'site_activity', now, 'search'),
    pair(admin, 'site_activity', now, 'profile_view'),
    pair(admin, 'community_visit_requests', now),
  ])
  return { mentions, searches, profileViews, portalVisits }
}

const loadPulseWindowsCached = unstable_cache(loadPulseWindowsFresh, ['founder-pulse-windows-v1'], { revalidate: 60 })

/** Time-window counts for Pulse. A failed read is null, not zero, and is not thrown. */
export const loadPulseWindows = cache(async (): Promise<PulseWindows> => {
  try {
    return await loadPulseWindowsCached()
  } catch {
    return { mentions: null, searches: null, profileViews: null, portalVisits: null }
  }
})
