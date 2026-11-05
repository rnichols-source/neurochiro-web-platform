import {
  compareYmd,
  daysInMonth,
  formatYmd,
  monthStart,
  parseYmd,
  shiftYmd,
  weekdayIndex,
} from './dates.ts'

export type OfficeCalendar = {
  openWeekdays: number[]
  closedDates: string[]
}

/** Monday through Friday, unless the doctor says otherwise. */
export const DEFAULT_CALENDAR: OfficeCalendar = {
  openWeekdays: [1, 2, 3, 4, 5],
  closedDates: [],
}

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function weekdayName(index: number): string {
  return WEEKDAY_NAMES[index] || ''
}

export function normalizeCalendar(input: Partial<OfficeCalendar> | null | undefined): OfficeCalendar {
  const open = Array.isArray(input?.openWeekdays)
    ? Array.from(new Set(input.openWeekdays.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))).sort((a, b) => a - b)
    : DEFAULT_CALENDAR.openWeekdays
  const closed = Array.isArray(input?.closedDates)
    ? Array.from(new Set(input.closedDates.filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)))).sort()
    : []
  return {
    openWeekdays: open.length > 0 ? open : DEFAULT_CALENDAR.openWeekdays,
    closedDates: closed,
  }
}

export function isClosedDay(date: string, calendar: OfficeCalendar = DEFAULT_CALENDAR): boolean {
  if (calendar.closedDates.includes(date)) return true
  return !calendar.openWeekdays.includes(weekdayIndex(date))
}

export function monthEnd(value: string): string {
  const { year, month } = parseYmd(value)
  return formatYmd(year, month, daysInMonth(year, month))
}

export function openDayCount(start: string, end: string, calendar: OfficeCalendar = DEFAULT_CALENDAR): number {
  if (compareYmd(start, end) > 0) return 0
  let count = 0
  let guard = 0
  let cursor = start
  while (compareYmd(cursor, end) <= 0 && guard < 4000) {
    if (!isClosedDay(cursor, calendar)) count += 1
    cursor = shiftYmd(cursor, 1)
    guard += 1
  }
  return count
}

/** Monthly goals spread across the open days of each month so far this year. */
export function yearOpenGoal(monthlyGoal: number, today: string, calendar: OfficeCalendar = DEFAULT_CALENDAR): number {
  const { year, month } = parseYmd(today)
  let total = 0
  for (let cursor = 1; cursor <= month; cursor += 1) {
    const start = formatYmd(year, cursor, 1)
    const end = cursor === month ? today : formatYmd(year, cursor, daysInMonth(year, cursor))
    const fullEnd = formatYmd(year, cursor, daysInMonth(year, cursor))
    const full = openDayCount(start, fullEnd, calendar)
    const elapsed = openDayCount(start, end, calendar)
    if (full > 0) total += monthlyGoal * (elapsed / full)
  }
  return total
}

export function consistencyWithCalendar(
  dates: Iterable<string>,
  today: string,
  calendar: OfficeCalendar = DEFAULT_CALENDAR,
): { current: number; longest: number; last7: number } {
  const logged = new Set(Array.from(dates).filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date) && !isClosedDay(date, calendar)))
  let current = 0
  let cursor = logged.has(today) || isClosedDay(today, calendar) ? today : shiftYmd(today, -1)
  let guard = 0
  while (guard < 4000) {
    if (isClosedDay(cursor, calendar)) {
      cursor = shiftYmd(cursor, -1)
      guard += 1
      continue
    }
    if (!logged.has(cursor)) break
    current += 1
    cursor = shiftYmd(cursor, -1)
    guard += 1
  }

  const sorted = Array.from(logged).sort()
  let longest = 0
  let run = 0
  let previous: string | null = null
  for (const date of sorted) {
    if (previous && openDaysBetween(previous, date, calendar) === 0) run += 1
    else run = 1
    if (run > longest) longest = run
    previous = date
  }

  let last7 = 0
  let seen = 0
  cursor = today
  guard = 0
  while (seen < 7 && guard < 40) {
    if (!isClosedDay(cursor, calendar)) {
      seen += 1
      if (logged.has(cursor)) last7 += 1
    }
    cursor = shiftYmd(cursor, -1)
    guard += 1
  }
  return { current, longest, last7 }
}

function openDaysBetween(previous: string, date: string, calendar: OfficeCalendar): number {
  if (compareYmd(previous, date) >= 0) return 0
  return openDayCount(shiftYmd(previous, 1), shiftYmd(date, -1), calendar)
}

export function monthStartOf(today: string): string {
  return monthStart(today)
}
