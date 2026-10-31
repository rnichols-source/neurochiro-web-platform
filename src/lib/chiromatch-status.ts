export type CycleTiming = {
  ranking_opens_at?: string | null;
  ranking_closes_at?: string | null;
  match_day?: string | null;
  status?: string | null;
};

export type DerivedCycleStatus = {
  open: boolean;
  finished: boolean;
  phase: 'upcoming' | 'open' | 'closed' | 'finished';
};

// Date-only values cover that whole UTC day, so a close of 2026-09-14 still includes the 14th.
function instant(value: string | null | undefined, edge: 'start' | 'end'): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    if (edge === 'start') return Date.UTC(year, month - 1, day, 0, 0, 0, 0);
    return Date.UTC(year, month - 1, day, 23, 59, 59, 999);
  }
  const time = new Date(trimmed).getTime();
  return Number.isFinite(time) ? time : null;
}

export function deriveCycleStatus(cycle: CycleTiming, now: Date): DerivedCycleStatus {
  const opens = instant(cycle.ranking_opens_at, 'start');
  const closes = instant(cycle.ranking_closes_at, 'end');
  const match = instant(cycle.match_day, 'end');
  const t = now.getTime();
  const inWindow = opens != null && closes != null && t >= opens && t <= closes;
  const pastMatch = match != null && t > match;
  const closedWithoutMatchDay = match == null && closes != null && t > closes;
  const storedFinished = cycle.status === 'completed';
  const finished = !inWindow && (pastMatch || closedWithoutMatchDay || storedFinished);

  let phase: DerivedCycleStatus['phase'] = 'upcoming';
  if (inWindow) phase = 'open';
  else if (finished) phase = 'finished';
  else if (closes != null && t > closes) phase = 'closed';

  return { open: phase === 'open', finished: phase === 'finished', phase };
}
