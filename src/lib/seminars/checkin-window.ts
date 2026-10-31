import { timezoneForCity, zonedIso } from "./dates.ts";

export type CheckinWindowInput = {
  now: Date;
  startsAt?: string | null;
  endsAt?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  startTime?: string | null;
  timeZone?: string | null;
  city?: string | null;
  country?: string | null;
};

export type CheckinWindowResult = { ok: true } | { ok: false; reason: "too_early" | "ended" };

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

function parseInstant(value: string | null | undefined): number | null {
  if (!value || /^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

function normalizeTime(raw: string | null | undefined): string {
  const value = (raw || "").trim();
  const ampm = value.match(/^(\d{1,2})(?::(\d{2}))?\s*([ap]m)$/i);
  if (ampm) {
    let hour = Number(ampm[1]) % 12;
    if (ampm[3].toLowerCase() === "pm") hour += 12;
    return `${String(hour).padStart(2, "0")}:${ampm[2] || "00"}`;
  }
  const hm = value.match(/^(\d{1,2}):(\d{2})/);
  if (hm) return `${String(Number(hm[1])).padStart(2, "0")}:${hm[2]}`;
  return "09:00";
}

function calendarDate(ms: number, timeZone: string): string | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(ms));
    const bag: Record<string, string> = {};
    for (const part of parts) bag[part.type] = part.value;
    if (!bag.year || !bag.month || !bag.day) return null;
    return `${bag.year}-${bag.month}-${bag.day}`;
  } catch {
    return null;
  }
}

function endOfDay(date: string, timeZone: string): number | null {
  try {
    const ms = Date.parse(zonedIso(date, "23:59", timeZone));
    if (Number.isNaN(ms)) return null;
    return ms + 60_000;
  } catch {
    return null;
  }
}

function zonedStart(date: string, time: string, timeZone: string): number | null {
  try {
    const ms = Date.parse(zonedIso(date, normalizeTime(time), timeZone));
    return Number.isNaN(ms) ? null : ms;
  } catch {
    return null;
  }
}

/** Check-in is allowed from 2 hours before the start through the end of the last day. */
export function checkinWindow(input: CheckinWindowInput): CheckinWindowResult {
  const timeZone = input.timeZone || timezoneForCity(input.city, input.country);
  const now = input.now.getTime();
  const startsAt = parseInstant(input.startsAt);
  const endsAt = parseInstant(input.endsAt);
  const startDate = input.startDate || (startsAt != null ? calendarDate(startsAt, timeZone) : null);
  const endDate = input.endDate || (endsAt != null ? calendarDate(endsAt, timeZone) : null) || startDate;
  const startMs = startsAt ?? (startDate ? zonedStart(startDate, input.startTime || "09:00", timeZone) : null);
  const endMs = endDate ? endOfDay(endDate, timeZone) : null;

  if (startMs == null && endMs == null) return { ok: true };
  if (startMs != null && now < startMs - TWO_HOURS_MS) return { ok: false, reason: "too_early" };
  if (endMs != null && now > endMs) return { ok: false, reason: "ended" };
  return { ok: true };
}
