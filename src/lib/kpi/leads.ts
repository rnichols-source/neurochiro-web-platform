import { clinicToday } from './dates.ts'
import { compareYmd, shiftYmd } from './dates.ts'
import type { KpiValue } from './types.ts'

export type LeadEvent = {
  id: string
  at: string
  email?: string | null
  phone?: string | null
}

function personKey(event: LeadEvent): string {
  const email = (event.email || '').trim().toLowerCase()
  if (email.includes('@')) return `e:${email}`
  const digits = (event.phone || '').replace(/\D/g, '')
  if (digits.length >= 10) return `p:${digits.slice(-10)}`
  return `id:${event.id}`
}

/**
 * One NeuroChiro request per person per clinic day.
 * The same person asking twice on the same local day counts once.
 */
export function countNeuroChiroLeadsByDay(events: LeadEvent[], timeZone: string): Map<string, number> {
  const seen = new Set<string>()
  const counts = new Map<string, number>()
  for (const event of events) {
    const when = new Date(event.at)
    if (Number.isNaN(when.getTime())) continue
    const day = clinicToday(timeZone, when)
    if (!day) continue
    const key = `${day}|${personKey(event)}`
    if (seen.has(key)) continue
    seen.add(key)
    counts.set(day, (counts.get(day) || 0) + 1)
  }
  return counts
}

/**
 * Days without a hand-entered number use the counted total.
 * A saved number, including zero, stays as the doctor left it.
 */
export function applyAutoLeadCounts(
  values: KpiValue[],
  definitionId: string,
  counts: Map<string, number>,
  from: string,
  to: string,
): { values: KpiValue[]; autoDates: string[] } {
  const manual = new Set(values.filter((value) => value.definitionId === definitionId).map((value) => value.date))
  const next = values.slice()
  const autoDates: string[] = []
  let guard = 0
  let cursor = from
  while (compareYmd(cursor, to) <= 0 && guard < 4000) {
    if (!manual.has(cursor)) {
      next.push({
        definitionId,
        date: cursor,
        value: counts.get(cursor) || 0,
        source: 'auto',
      })
      autoDates.push(cursor)
    }
    cursor = shiftYmd(cursor, 1)
    guard += 1
  }
  return { values: next, autoDates }
}
