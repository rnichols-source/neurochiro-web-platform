export type FollowRow = {
  id: string
  name: string
  plan: string
  assignmentId: string | null
  recommendedAt: string
  openedAt: string | null
  lastTickAt: string | null
}

export type FollowCounts = {
  recommended: number
  opened: number
  following: number
  slipping: number
}

const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

export function zonedDateKey(now: Date, timeZone: string): { key: string; weekday: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const get = (type: string) => parts.find((part) => part.type === type)?.value || ''
  return { key: `${get('year')}-${get('month')}-${get('day')}`, weekday: get('weekday') }
}

export function weekStartKeyInZone(now: Date, timeZone: string): string {
  const { key, weekday } = zonedDateKey(now, timeZone)
  const index = WEEKDAY_INDEX[weekday] ?? 1
  const delta = index === 0 ? -6 : 1 - index
  const [year, month, day] = key.split('-').map(Number)
  const shifted = new Date(Date.UTC(year, month - 1, day + delta))
  return shifted.toISOString().slice(0, 10)
}

export function doctorCanSeeDoneLine(name: string | null | undefined): string {
  const clean = (name || '').replace(/\s+/g, ' ').trim()
  if (!clean || clean === 'Dr.') return 'Your doctor can see which exercises you mark done.'
  return `${clean} can see which exercises you mark done.`
}

function dateKey(iso: string | null | undefined, timeZone: string): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (!Number.isFinite(date.getTime())) return null
  return zonedDateKey(date, timeZone).key
}

function ageDays(iso: string, now: Date): number {
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return 0
  return (now.getTime() - then) / 86400000
}

export function followFlags(row: FollowRow, now: Date, timeZone: string): { opened: boolean; following: boolean; slipping: boolean } {
  const weekStart = weekStartKeyInZone(now, timeZone)
  const tickKey = dateKey(row.lastTickAt, timeZone)
  const following = Boolean(tickKey && tickKey >= weekStart)
  const opened = Boolean(row.openedAt || row.lastTickAt)
  const slipping = !following && ageDays(row.recommendedAt, now) >= 7
  return { opened, following, slipping }
}

export function followCounts(rows: FollowRow[], now: Date, timeZone: string): FollowCounts {
  const counts = { recommended: rows.length, opened: 0, following: 0, slipping: 0 }
  for (const row of rows) {
    const flags = followFlags(row, now, timeZone)
    if (flags.opened) counts.opened += 1
    if (flags.following) counts.following += 1
    if (flags.slipping) counts.slipping += 1
  }
  return counts
}

export function followStatusLabel(row: FollowRow, now: Date, timeZone: string): string {
  const flags = followFlags(row, now, timeZone)
  if (flags.following) return 'Following this week'
  if (flags.slipping && flags.opened) return 'Slipping'
  if (flags.slipping) return 'Not opened yet'
  if (flags.opened) return 'Opened'
  return 'Recommended'
}
