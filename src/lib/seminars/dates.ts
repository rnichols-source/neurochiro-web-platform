const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

export interface ParsedSeminarDates {
  start: string;
  end: string;
  year: string;
}

/** Parse display strings such as "June 6-7, 2026" or "May 29 – May 30, 2026". */
export function parseSeminarDates(input: string | null | undefined): ParsedSeminarDates | null {
  const raw = (input || "").replace(/\s+/g, " ").trim();
  if (!raw) return null;

  const cross = raw.match(/^([A-Za-z]+)\s+(\d{1,2})\s*[–—-]\s*([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/);
  if (cross) {
    const start = ymd(cross[5], cross[1], cross[2]);
    const end = ymd(cross[5], cross[3], cross[4]);
    if (start && end) return { start, end, year: cross[5] };
  }

  const same = raw.match(/^([A-Za-z]+)\s+(\d{1,2})\s*[–—-]\s*(\d{1,2}),\s*(\d{4})$/);
  if (same) {
    const start = ymd(same[4], same[1], same[2]);
    const end = ymd(same[4], same[1], same[3]);
    if (start && end) return { start, end, year: same[4] };
  }

  const single = raw.match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/);
  if (single) {
    const day = ymd(single[3], single[1], single[2]);
    if (day) return { start: day, end: day, year: single[3] };
  }

  return null;
}

function ymd(year: string, monthName: string, day: string): string | null {
  const month = MONTHS[monthName.toLowerCase()];
  const d = Number(day);
  const y = Number(year);
  if (!month || !d || !y) return null;
  const check = new Date(Date.UTC(y, month - 1, d));
  if (check.getUTCMonth() !== month - 1) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const CITY_TZ: Record<string, string> = {
  adelaide: "Australia/Adelaide",
  perth: "Australia/Perth",
  sydney: "Australia/Sydney",
  melbourne: "Australia/Melbourne",
  brisbane: "Australia/Brisbane",
  auckland: "Pacific/Auckland",
  london: "Europe/London",
  birmingham: "Europe/London",
  "fort lauderdale": "America/New_York",
  "asbury park": "America/New_York",
  atlanta: "America/New_York",
  oakland: "America/Los_Angeles",
  davenport: "America/Chicago",
};

export function timezoneForCity(city?: string | null, country?: string | null): string {
  const key = (city || "").trim().toLowerCase();
  if (CITY_TZ[key]) return CITY_TZ[key];
  const code = (country || "").toLowerCase();
  if (code === "au" || code === "australia") return "Australia/Sydney";
  if (code === "uk" || code === "gb" || code === "united kingdom") return "Europe/London";
  if (code === "nz" || code === "new zealand") return "Pacific/Auckland";
  return "America/New_York";
}

/** End of the event day in UTC, using noon UTC as a safe date boundary. */
export function eventEndMs(endDate: string | null): number | null {
  if (!endDate) return null;
  const [y, m, d] = endDate.split("-").map(Number);
  if (!y || !m || !d) return null;
  return Date.UTC(y, m - 1, d, 23, 59, 59);
}

export function isUpcoming(endDate: string | null, isPastFlag?: boolean | null, now = Date.now()): boolean {
  const end = eventEndMs(endDate);
  if (end != null) return end >= now;
  return !isPastFlag;
}

function tzOffsetMs(timeZone: string, date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const bag: Record<string, string> = {};
  for (const part of parts) bag[part.type] = part.value;
  const hour = Number(bag.hour) % 24;
  const asUtc = Date.UTC(Number(bag.year), Number(bag.month) - 1, Number(bag.day), hour, Number(bag.minute), Number(bag.second));
  return asUtc - date.getTime();
}

/** Wall-clock time in an IANA zone, as an ISO string with a numeric offset. */
export function zonedIso(date: string, time: string, timeZone: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const wall = Date.UTC(y, m - 1, d, hh || 0, mm || 0, 0);
  let utc = wall;
  for (let i = 0; i < 3; i++) {
    const next = wall - tzOffsetMs(timeZone, new Date(utc));
    if (next === utc) break;
    utc = next;
  }
  const offset = tzOffsetMs(timeZone, new Date(utc));
  const sign = offset >= 0 ? "+" : "-";
  const abs = Math.abs(offset);
  const oh = String(Math.floor(abs / 3600000)).padStart(2, "0");
  const om = String(Math.floor((abs % 3600000) / 60000)).padStart(2, "0");
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${y}-${pad(m)}-${pad(d)}T${pad(hh || 0)}:${pad(mm || 0)}:00${sign}${oh}:${om}`;
}
