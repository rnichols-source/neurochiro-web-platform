export type FollowRow = {
  id: string
  name: string
  plan: string
  assignmentId: string | null
  remedyId?: string | null
  recommendedAt: string
  openedAt: string | null
  lastTickAt: string | null
  /** Calendar days (yyyy-mm-dd in the doctor's zone) they marked the plan or remedy done. Same-day repeats count once. */
  doneOn?: string[]
  /** Sessions expected each week. Missing rows use FOLLOW_BOARD.defaultTimesPerWeek. */
  timesPerWeek?: number
  profileId?: string | null
  email?: string | null
}

/**
 * One place for the follow-through board.
 * Green: at least 75% of expected sessions.
 * Yellow: 40% to 74%, or no logged session for 3 or more days.
 * Red: under 40%, no logged session for 7 or more days, or never opened after 3 days.
 * Expected sessions use finished days before today, so the day it was sent is not owed yet.
 * A logged session is one calendar day with a completed exercise or a remedy check-in.
 * Plan defaults snap to Daily (7), 3 times a week, or once a week.
 */
export const FOLLOW_BOARD = {
  greenMin: 0.75,
  yellowMin: 0.4,
  quietDaysYellow: 3,
  quietDaysRed: 7,
  neverOpenedDays: 3,
  defaultTimesPerWeek: 3,
} as const

export type BoardTone = 'green' | 'yellow' | 'red'

export type BoardStatus = {
  tone: BoardTone
  label: 'On track' | 'Falling behind' | 'Stopped'
  sinceDone: number
  sinceExpected: number
  weekDone: number
  weekExpected: number
}

export type RecommendChannel = 'assign' | 'invite' | 'email_steps'

/** One tap sends an in-app plan when they have an account, otherwise the email they already shared. */
export function recommendDelivery(input: {
  profileId: string | null
  email: string | null
  kind: 'library' | 'custom' | 'new' | 'remedy'
}): { ok: true; channel: RecommendChannel } | { ok: false; error: string } {
  const email = (input.email || '').trim()
  if (input.profileId) return { ok: true, channel: 'assign' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'They did not share an email, so the plan cannot be sent.' }
  }
  if (input.kind === 'library' || input.kind === 'remedy') return { ok: true, channel: 'invite' }
  return { ok: true, channel: 'email_steps' }
}

export function clampTimesPerWeek(value: unknown, fallback: number = FOLLOW_BOARD.defaultTimesPerWeek): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 7) return fallback
  return parsed
}

/** Snap a library frequency line onto Daily, 3 times a week, or once a week. */
export function defaultTimesPerWeek(frequency: string | null | undefined): number {
  const value = (frequency || '').toLowerCase()
  const count = value.match(/(\d+)\s*x/)
  const raw = count ? Number(count[1]) : /daily|every day/.test(value) ? 7 : /week/.test(value) ? FOLLOW_BOARD.defaultTimesPerWeek : FOLLOW_BOARD.defaultTimesPerWeek
  if (raw >= 5) return 7
  if (raw >= 2) return 3
  return 1
}

export function frequencyLabel(times: number): string {
  const n = clampTimesPerWeek(times)
  if (n >= 7) return 'Daily'
  if (n === 1) return 'Once a week'
  return `${n} times a week`
}

export function followLabelForPerson(
  person: { profileId?: string | null; email?: string | null },
  rows: FollowRow[],
  now: Date,
  timeZone: string,
): string | null {
  const email = (person.email || '').trim().toLowerCase()
  const matches = rows.filter((row) => {
    if (person.profileId && row.profileId === person.profileId) return true
    return Boolean(email) && (row.email || '').trim().toLowerCase() === email
  })
  const match = sortFollowRows(matches, now, timeZone)[0]
  return match ? followStatusLabel(match, now, timeZone) : null
}

export type FollowCounts = {
  all: number
  onTrack: number
  falling: number
  stopped: number
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

function daySpan(startKey: string, endKey: string): number {
  const [startYear, startMonth, startDay] = startKey.split('-').map(Number)
  const [endYear, endMonth, endDay] = endKey.split('-').map(Number)
  if (![startYear, startMonth, startDay, endYear, endMonth, endDay].every(Number.isFinite)) return 0
  const start = Date.UTC(startYear, startMonth - 1, startDay)
  const end = Date.UTC(endYear, endMonth - 1, endDay)
  return Math.max(0, Math.round((end - start) / 86400000))
}

function datesInRange(dates: string[], startKey: string, endKey: string): number {
  return dates.filter((day) => day >= startKey && day <= endKey).length
}

export function expectedSessions(finishedDays: number, timesPerWeek: number): number {
  const days = Math.max(0, finishedDays)
  return Math.round(days * clampTimesPerWeek(timesPerWeek) / 7)
}

export function boardStatus(row: FollowRow, now: Date, timeZone: string): BoardStatus {
  const today = zonedDateKey(now, timeZone).key
  const sent = dateKey(row.recommendedAt, timeZone) || today
  const weekStart = weekStartKeyInZone(now, timeZone)
  const weekFrom = weekStart > sent ? weekStart : sent
  const times = clampTimesPerWeek(row.timesPerWeek, FOLLOW_BOARD.defaultTimesPerWeek)
  const done = [...new Set((row.doneOn && row.doneOn.length ? row.doneOn : [dateKey(row.lastTickAt, timeZone)]).filter((day): day is string => Boolean(day)))]
  const sinceDone = datesInRange(done, sent, today)
  const sinceExpected = expectedSessions(daySpan(sent, today), times)
  const weekDone = datesInRange(done, weekFrom, today)
  const weekExpected = expectedSessions(daySpan(weekFrom, today), times)
  const last = done.filter((day) => day <= today).sort().at(-1) || null
  const quietDays = daySpan(last || sent, today)
  const opened = Boolean(row.openedAt || row.lastTickAt || done.length)
  const ratio = sinceExpected > 0 ? sinceDone / sinceExpected : null
  let tone: BoardTone = 'green'
  if (!opened && daySpan(sent, today) >= FOLLOW_BOARD.neverOpenedDays) tone = 'red'
  else if (quietDays >= FOLLOW_BOARD.quietDaysRed) tone = 'red'
  else if (ratio != null && ratio < FOLLOW_BOARD.yellowMin) tone = 'red'
  else if (ratio != null && ratio < FOLLOW_BOARD.greenMin) tone = 'yellow'
  else if (quietDays >= FOLLOW_BOARD.quietDaysYellow) tone = 'yellow'
  const label = tone === 'green' ? 'On track' : tone === 'yellow' ? 'Falling behind' : 'Stopped'
  return { tone, label, sinceDone, sinceExpected, weekDone, weekExpected }
}

export function followCounts(rows: FollowRow[], now: Date, timeZone: string): FollowCounts {
  const counts = { all: rows.length, onTrack: 0, falling: 0, stopped: 0 }
  for (const row of rows) {
    const status = boardStatus(row, now, timeZone)
    if (status.tone === 'green') counts.onTrack += 1
    else if (status.tone === 'yellow') counts.falling += 1
    else counts.stopped += 1
  }
  return counts
}

const TONE_RANK: Record<BoardTone, number> = { red: 0, yellow: 1, green: 2 }

export function sortFollowRows(rows: FollowRow[], now: Date, timeZone: string): FollowRow[] {
  return [...rows].sort((a, b) => {
    const left = boardStatus(a, now, timeZone)
    const right = boardStatus(b, now, timeZone)
    if (TONE_RANK[left.tone] !== TONE_RANK[right.tone]) return TONE_RANK[left.tone] - TONE_RANK[right.tone]
    const leftRatio = left.sinceExpected > 0 ? left.sinceDone / left.sinceExpected : 1
    const rightRatio = right.sinceExpected > 0 ? right.sinceDone / right.sinceExpected : 1
    if (leftRatio !== rightRatio) return leftRatio - rightRatio
    return a.name.localeCompare(b.name)
  })
}

export function followStatusLabel(row: FollowRow, now: Date, timeZone: string): string {
  const status = boardStatus(row, now, timeZone)
  if (status.sinceExpected > 0) return `${status.label}, ${status.sinceDone} of ${status.sinceExpected}`
  return status.label
}
