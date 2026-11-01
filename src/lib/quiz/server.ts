import 'server-only'

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { searchDirectory } from '@/lib/directory/search'
import { isMissingTable } from '@/lib/leads/schema'
import type { QuizEventInput } from '@/lib/quiz/schema'
import type { RankDoctor } from '@/lib/quiz/rank'

let warnedMissingTable = false

function warnMissing(): void {
  if (warnedMissingTable) return
  warnedMissingTable = true
  console.warn('[QUIZ] quiz_events table missing; run 20261107000000_quiz_events.sql')
}

type QuizTable = {
  from: (name: 'quiz_events') => {
    insert: (row: Record<string, unknown>) => Promise<{ error: { code?: string; message?: string; details?: string } | null }>
  }
}

/** Fire-and-forget. Never throws and is not awaited by the caller. */
export function recordQuizEvent(input: QuizEventInput): void {
  void writeQuizEvent(input)
}

async function writeQuizEvent(input: QuizEventInput): Promise<void> {
  try {
    const supabase = createAdminClient()
    // quiz_events is not in the generated Database types until the migration is applied.
    const table = supabase as unknown as QuizTable
    const { error } = await table.from('quiz_events').insert({
      session_id: input.sessionId,
      event: input.event,
      step: input.step ?? null,
      source: input.source ?? null,
      country: input.country ?? null,
      concern: input.concern ?? null,
      match_count: input.matchCount ?? null,
      band_miles: input.bandMiles ?? null,
      doctor_id: input.doctorId ?? null,
    })
    if (error) {
      if (isMissingTable(error)) warnMissing()
      else console.error('[QUIZ] track:', error.message || 'insert failed')
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'quiz event failed'
    if (isMissingTable({ message })) warnMissing()
    else console.error('[QUIZ] track:', message)
  }
}

export async function runQuizSearch(params: Record<string, string>): Promise<{
  doctors?: RankDoctor[]
  nearest?: RankDoctor[]
  unknownPlace?: boolean
  error?: boolean
}> {
  const url = new URL('https://www.neurochiro.co/api/directory/search')
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  const response = await searchDirectory(new NextRequest(url))
  return response.json()
}

/**
 * TODO(conversion-offers): when doctor_offers lands, return { [doctorId]: { title } }.
 * Offers are not on main, so this stays empty.
 */
export async function getOffersFor(ids: string[]): Promise<Record<string, { title: string }>> {
  void ids
  return {}
}
