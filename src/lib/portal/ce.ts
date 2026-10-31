import { eventEndMs, parseSeminarDates } from '../seminars/dates.ts';

export function certificateIssuedAt(
  now: Date,
  seminar: { ends_at?: string | null; dates?: string | null } | null | undefined,
): Date {
  const column = seminar?.ends_at ? new Date(seminar.ends_at) : null;
  const columnMs = column && !Number.isNaN(column.getTime()) ? column.getTime() : null;
  const parsed = parseSeminarDates(seminar?.dates);
  const textMs = eventEndMs(parsed?.end || null);
  const endMs = columnMs ?? textMs;
  if (endMs == null) return now;
  return new Date(Math.max(now.getTime(), endMs));
}
