export type LeadLike = {
  id?: string;
  email?: string | null;
  phone?: string | null;
  stage?: string | null;
  created_at?: string | null;
  source?: string | null;
};

export type RequestCounts = { total: number; new: number; contacted: number; booked: number };

export type PortalStats = {
  patientRequests: RequestCounts | null;
  profileViews: number;
  viewsInRange: number | null;
  viewsTrackedSince: string | null;
  introductions: number | null;
  profileClicks: number | null;
  referralsSent: number | null;
  referralsReceived: number | null;
  requestSources: { label: string; count: number }[] | null;
  market: { rank: number; total: number; avgViews: number } | null;
};

export const PATIENT_REQUESTS_HINT =
  'Patient requests: people who asked to book with you through NeuroChiro. The same person is counted once.';

export const UNAVAILABLE_HINT = 'Not available yet.';

const FALLBACK_TZ = 'America/New_York';
const STAGE_RANK = { new: 0, contacted: 1, booked: 2 } as const;

function inRange(iso: string | null | undefined, start: Date | null): boolean {
  if (!start) return true;
  if (!iso) return false;
  const time = new Date(iso).getTime();
  return !Number.isNaN(time) && time >= start.getTime();
}

export function stageBucket(stage: string | null | undefined): 'new' | 'contacted' | 'booked' {
  const value = (stage || 'new').toLowerCase();
  if (value === 'scheduled' || value === 'converted' || value === 'booked') return 'booked';
  if (value === 'contacted' || value === 'follow_up') return 'contacted';
  return 'new';
}

/** Workflow tab for the leads page. follow_up sits with contacted. booked sits with scheduled. */
export function pipelineTab(stage: string | null | undefined): 'new' | 'contacted' | 'scheduled' | 'converted' {
  const value = (stage || 'new').toLowerCase();
  if (value === 'converted') return 'converted';
  if (value === 'scheduled' || value === 'booked') return 'scheduled';
  if (stageBucket(value) === 'contacted') return 'contacted';
  return 'new';
}

function timeZoneOrFallback(timeZone: string | null | undefined): string {
  const value = (timeZone || '').trim();
  if (!value) return FALLBACK_TZ;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date());
    return value;
  } catch {
    return FALLBACK_TZ;
  }
}

function wallClockUtc(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || '0';
  return Date.UTC(
    Number(pick('year')),
    Number(pick('month')) - 1,
    Number(pick('day')),
    Number(pick('hour')),
    Number(pick('minute')),
    Number(pick('second')),
  );
}

function zonedOffsetMs(date: Date, timeZone: string): number {
  return wallClockUtc(date, timeZone) - date.getTime();
}

/** Midnight at the start of `now`'s month in the doctor's time zone, as a UTC instant. */
export function zonedMonthStart(now: Date, timeZone: string): Date {
  const zone = timeZoneOrFallback(timeZone);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const wallAsUtc = Date.UTC(year, month - 1, 1, 0, 0, 0);
  let utc = wallAsUtc;
  for (let pass = 0; pass < 3; pass += 1) {
    utc = wallAsUtc - zonedOffsetMs(new Date(utc), zone);
  }
  return new Date(utc);
}

export function rangeStart(
  range: '30d' | 'month' | 'all',
  now = new Date(),
  timeZone: string | null = FALLBACK_TZ,
): Date | null {
  if (range === 'all') return null;
  if (range === '30d') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return zonedMonthStart(now, timeZone || FALLBACK_TZ);
}

export function formatMonthDay(isoOrDate: string | Date, timeZone: string | null = FALLBACK_TZ): string {
  const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: timeZoneOrFallback(timeZone),
  }).format(date);
}

function sameZonedMonth(a: Date, b: Date, timeZone: string): boolean {
  const zone = timeZoneOrFallback(timeZone);
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: zone, year: 'numeric', month: '2-digit' });
  return fmt.format(a) === fmt.format(b);
}

export function monthlyViewsDisplay(input: {
  viewsInRange: number | null;
  viewsTrackedSince: string | null;
  profileViews: number;
  now?: Date;
  timeZone?: string | null;
}): { value: string; hint: string } {
  const now = input.now || new Date();
  const timeZone = input.timeZone || FALLBACK_TZ;
  const allTime = input.profileViews.toLocaleString();
  if (!input.viewsTrackedSince) {
    return {
      value: '—',
      hint: `Monthly views start counting from the day this update is live. All-time total: ${allTime}.`,
    };
  }
  if (input.viewsInRange == null) {
    return { value: '—', hint: UNAVAILABLE_HINT };
  }
  if (sameZonedMonth(new Date(input.viewsTrackedSince), now, timeZone)) {
    return {
      value: input.viewsInRange.toLocaleString(),
      hint: `Counting since ${formatMonthDay(input.viewsTrackedSince, timeZone)}`,
    };
  }
  return {
    value: input.viewsInRange.toLocaleString(),
    hint: 'Profile views: people who opened your public profile this month.',
  };
}

export function displayCount(value: number | null, hint: string): { value: string; hint: string } {
  if (value == null) return { value: '—', hint: UNAVAILABLE_HINT };
  return { value: String(value), hint };
}

function last10Phone(phone: string | null | undefined): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length < 10) return '';
  return digits.slice(-10);
}

function emailKey(email: string | null | undefined): string {
  return (email || '').trim().toLowerCase();
}

/** Keep one row per person. Phone (last 10 digits) or email links the rows. The most advanced stage wins. */
export function dedupePatientRequests<T extends LeadLike>(rows: T[]): T[] {
  const parent = rows.map((_, index) => index);
  const find = (index: number): number => {
    let cursor = index;
    while (parent[cursor] !== cursor) {
      parent[cursor] = parent[parent[cursor]];
      cursor = parent[cursor];
    }
    return cursor;
  };
  const union = (a: number, b: number) => {
    const left = find(a);
    const right = find(b);
    if (left !== right) parent[right] = left;
  };
  const phones = new Map<string, number>();
  const emails = new Map<string, number>();
  rows.forEach((row, index) => {
    const phone = last10Phone(row.phone);
    const email = emailKey(row.email);
    if (phone) {
      const prev = phones.get(phone);
      if (prev != null) union(prev, index);
      phones.set(phone, find(index));
    }
    if (email) {
      const prev = emails.get(email);
      if (prev != null) union(prev, index);
      emails.set(email, find(index));
    }
  });
  const winners = new Map<number, T>();
  rows.forEach((row, index) => {
    const root = find(index);
    const current = winners.get(root);
    if (!current || STAGE_RANK[stageBucket(row.stage)] > STAGE_RANK[stageBucket(current.stage)]) {
      winners.set(root, row);
    }
  });
  return [...winners.values()];
}

/** Same merge as getLeadPipeline, then one row per person. */
export function countPatientRequests(
  leads: LeadLike[],
  contactRequests: LeadLike[],
  start: Date | null,
): RequestCounts {
  const rows = dedupePatientRequests(
    [...leads, ...contactRequests].filter((row) => inRange(row.created_at, start)),
  );
  const counts: RequestCounts = { total: rows.length, new: 0, contacted: 0, booked: 0 };
  for (const row of rows) counts[stageBucket(row.stage)] += 1;
  return counts;
}

const SOURCE_LABELS: Record<string, string> = {
  dm_outreach: 'NeuroChiro introduction',
  appointment_request: 'Appointment request',
  quiz: 'Quiz',
  profile: 'Directory profile',
  directory: 'Directory profile',
  doctor_joined: 'Doctor joined',
  coverage_result: 'Coverage search',
  contact_form: 'Contact form',
};

/** Plain label for a stored lead or contact-request source. Blank means the directory profile. */
export function sourceLabel(source: string | null | undefined): string {
  const key = (source || '').trim().toLowerCase();
  if (!key) return 'Directory profile';
  if (SOURCE_LABELS[key]) return SOURCE_LABELS[key];
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** One count per person, same rows as countPatientRequests, so the labels add up to the total. */
export function patientRequestSources(
  leads: LeadLike[],
  contactRequests: LeadLike[],
  start: Date | null,
): { label: string; count: number }[] {
  const rows = dedupePatientRequests(
    [...leads, ...contactRequests].filter((row) => inRange(row.created_at, start)),
  );
  const counts = new Map<string, number>();
  for (const row of rows) {
    const label = sourceLabel(row.source);
    counts.set(label, (counts.get(label) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function summarizeLeads(
  leads: LeadLike[],
  range: '30d' | 'month' | 'all',
  timeZone: string | null = FALLBACK_TZ,
  now = new Date(),
): { header: RequestCounts; tabs: RequestCounts } {
  const header = countPatientRequests(leads, [], rangeStart(range, now, timeZone));
  const tabs = countPatientRequests(leads, [], null);
  return { header, tabs };
}

const EXCLUDED_INTRO_TEMPLATES = new Set(['waitlist_comment', 'waitlist_dm']);

export function countIntroductions(
  result: { data: { template_id?: string | null; created_at?: string | null }[] | null; error: unknown },
  start: Date | null,
): number | null {
  if (result.error || !Array.isArray(result.data)) return null;
  return result.data.filter((row) => {
    if (EXCLUDED_INTRO_TEMPLATES.has(row.template_id || '')) return false;
    return inRange(row.created_at, start);
  }).length;
}

export function countFromHead(result: { count?: number | null; error?: unknown }): number | null {
  if (result.error) return null;
  return result.count ?? 0;
}

export function countDatedRows(
  result: { data: { created_at?: string | null }[] | null; error: unknown },
  start: Date | null,
): number | null {
  if (result.error || !Array.isArray(result.data)) return null;
  return result.data.filter((row) => inRange(row.created_at, start)).length;
}

export function earliestIso(rows: { created_at?: string | null }[] | null | undefined): string | null {
  if (!rows?.length) return null;
  let best: { iso: string; time: number } | null = null;
  for (const row of rows) {
    if (!row.created_at) continue;
    const time = new Date(row.created_at).getTime();
    if (Number.isNaN(time)) continue;
    if (!best || time < best.time) best = { iso: row.created_at, time };
  }
  return best?.iso ?? null;
}

export function marketRank(peers: { id: string; views: number }[], doctorId: string): PortalStats['market'] {
  if (peers.length < 3) return null;
  const sorted = [...peers].sort((a, b) => b.views - a.views);
  const rank = sorted.findIndex((peer) => peer.id === doctorId) + 1;
  const avgViews = Math.round(sorted.reduce((sum, peer) => sum + peer.views, 0) / sorted.length);
  return { rank: rank || sorted.length, total: sorted.length, avgViews };
}
