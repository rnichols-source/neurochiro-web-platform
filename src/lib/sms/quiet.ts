import { getDoctorTimezone, getLocalHour, isQuietHours } from '../doctor-timezone.ts'

const QUIET_START = 21
const QUIET_END = 8
const FALLBACK_TZ = 'America/New_York'

export function localParts(timeZone: string, now: Date): {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
} {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const bag: Record<string, string> = {}
  for (const part of fmt.formatToParts(now)) bag[part.type] = part.value
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour: Number(bag.hour) % 24,
    minute: Number(bag.minute),
    second: Number(bag.second),
  }
}

function offsetMs(timeZone: string, date: Date): number {
  const parts = localParts(timeZone, date)
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  return asUtc - date.getTime()
}

export function utcFromLocal(timeZone: string, year: number, month: number, day: number, hour: number, minute: number): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0))
  const first = offsetMs(timeZone, guess)
  let utc = new Date(guess.getTime() - first)
  const second = offsetMs(timeZone, utc)
  if (second !== first) utc = new Date(guess.getTime() - second)
  return utc
}

/** Next local clock time at `hour`:00. If that hour has passed, it is tomorrow. */
export function nextLocalHour(timeZone: string, hour: number, now: Date): Date {
  const parts = localParts(timeZone, now)
  let year = parts.year
  let month = parts.month
  let day = parts.day
  if (parts.hour >= hour) {
    const shifted = new Date(Date.UTC(year, month - 1, day + 1))
    year = shifted.getUTCFullYear()
    month = shifted.getUTCMonth() + 1
    day = shifted.getUTCDate()
  }
  return utcFromLocal(timeZone, year, month, day, hour, 0)
}

export function doctorQuietWindow(
  doctor: { state?: string | null; country?: string | null },
  now: Date,
): { quiet: boolean; timeZone: string; sendAfter: Date } {
  const timeZone = getDoctorTimezone(doctor.state ?? null, doctor.country ?? null, FALLBACK_TZ) || FALLBACK_TZ
  let quiet = true
  try {
    quiet = isQuietHours(timeZone, QUIET_START, QUIET_END, now)
  } catch {
    quiet = true
  }
  if (!quiet) return { quiet: false, timeZone, sendAfter: now }
  try {
    const morning = nextLocalHour(timeZone, QUIET_END, now)
    if (getLocalHour(timeZone, morning) === QUIET_END) return { quiet: true, timeZone, sendAfter: morning }
  } catch {
    // Fall through to a fixed wait so a bad timezone cannot send at night.
  }
  return { quiet: true, timeZone, sendAfter: new Date(now.getTime() + 11 * 60 * 60 * 1000) }
}
