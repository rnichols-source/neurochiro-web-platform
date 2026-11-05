/** Clinic-local calendar dates. Never build these with toISOString(). */

const YMD = /^(\d{4})-(\d{2})-(\d{2})$/

export function isValidYmd(value: string): boolean {
  const match = YMD.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12 || day < 1) return false
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export function parseYmd(value: string): { year: number; month: number; day: number } {
  const match = YMD.exec(value)
  if (!match || !isValidYmd(value)) {
    throw new Error(`Invalid date: ${value}`)
  }
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
}

export function formatYmd(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function shiftYmd(value: string, deltaDays: number): string {
  const { year, month, day } = parseYmd(value)
  const date = new Date(Date.UTC(year, month - 1, day + deltaDays))
  return formatYmd(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
}

export function diffDays(start: string, end: string): number {
  const a = parseYmd(start)
  const b = parseYmd(end)
  const ms = Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)
  return Math.round(ms / 86400000)
}

export function compareYmd(a: string, b: string): number {
  if (a === b) return 0
  return a < b ? -1 : 1
}

/** 0 = Sunday … 6 = Saturday, from the calendar date itself. */
export function weekdayIndex(value: string): number {
  const { year, month, day } = parseYmd(value)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

/** Monday of the week that contains this calendar date. */
export function weekStartMonday(value: string): string {
  const weekday = weekdayIndex(value)
  const delta = weekday === 0 ? -6 : 1 - weekday
  return shiftYmd(value, delta)
}

export function monthStart(value: string): string {
  const { year, month } = parseYmd(value)
  return formatYmd(year, month, 1)
}

export function yearStart(value: string): string {
  const { year } = parseYmd(value)
  return formatYmd(year, 1, 1)
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

export function dayOfYear(value: string): number {
  const { year } = parseYmd(value)
  return diffDays(formatYmd(year, 1, 1), value) + 1
}

export function historyStart(today: string): string {
  const { year } = parseYmd(today)
  return formatYmd(year - 1, 1, 1)
}

/**
 * Today's calendar date in an IANA timezone.
 * Returns null when the timezone cannot be read.
 */
export function clinicToday(timeZone: string, now: Date): string | null {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now)
    const bag: Record<string, string> = {}
    for (const part of parts) bag[part.type] = part.value
    if (!bag.year || !bag.month || !bag.day) return null
    const ymd = `${bag.year}-${bag.month}-${bag.day}`
    return isValidYmd(ymd) ? ymd : null
  } catch {
    return null
  }
}

export function periodRange(period: 'today' | 'wtd' | 'mtd' | 'ytd', today: string): { start: string; end: string } {
  if (period === 'today') return { start: today, end: today }
  if (period === 'wtd') return { start: weekStartMonday(today), end: today }
  if (period === 'mtd') return { start: monthStart(today), end: today }
  return { start: yearStart(today), end: today }
}

/**
 * The previous period, matched to how far the current one has run.
 * March 31 compared with February stops on the last day of February.
 * February 29 compared with the year before stops on February 28.
 */
export function previousPeriodRange(period: 'today' | 'wtd' | 'mtd' | 'ytd', today: string): { start: string; end: string } {
  if (period === 'today') {
    const yesterday = shiftYmd(today, -1)
    return { start: yesterday, end: yesterday }
  }
  if (period === 'wtd') {
    const start = shiftYmd(weekStartMonday(today), -7)
    const elapsed = diffDays(weekStartMonday(today), today)
    return { start, end: shiftYmd(start, elapsed) }
  }
  if (period === 'mtd') {
    const current = parseYmd(today)
    const previousMonthDate = shiftYmd(monthStart(today), -1)
    const previous = parseYmd(previousMonthDate)
    const day = Math.min(current.day, daysInMonth(previous.year, previous.month))
    return {
      start: formatYmd(previous.year, previous.month, 1),
      end: formatYmd(previous.year, previous.month, day),
    }
  }
  const current = parseYmd(today)
  const day = Math.min(current.day, daysInMonth(current.year - 1, current.month))
  return {
    start: formatYmd(current.year - 1, 1, 1),
    end: formatYmd(current.year - 1, current.month, day),
  }
}

export function countMondays(start: string, end: string): number {
  if (compareYmd(start, end) > 0) return 0
  let monday = weekStartMonday(start)
  if (compareYmd(monday, start) < 0) monday = shiftYmd(monday, 7)
  let count = 0
  while (compareYmd(monday, end) <= 0) {
    count += 1
    monday = shiftYmd(monday, 7)
  }
  return count
}

export function shortLabel(value: string): string {
  const { year, month, day } = parseYmd(value)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

export function longLabel(value: string): string {
  const { year, month, day } = parseYmd(value)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

export function weekRangeLabel(value: string): string {
  const start = weekStartMonday(value)
  return `${shortLabel(start)} – ${shortLabel(shiftYmd(start, 6))}`
}
