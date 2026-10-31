const TZ = 'America/New_York';
const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

type Zoned = { key: string; weekday: string; hour: number; minute: number };

function zoned(now: Date): Zoned {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || '';
  return {
    key: `${get('year')}-${get('month')}-${get('day')}`,
    weekday: get('weekday'),
    hour: Number(get('hour')),
    minute: Number(get('minute')),
  };
}

function addDays(key: string, days: number): string {
  const [year, month, day] = key.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return utc.toISOString().slice(0, 10);
}

/** Next Thursday 8:00 PM America/New_York, counted in calendar days. */
export function nextWeeklyShow(now: Date): { dateKey: string; label: string } {
  const here = zoned(now);
  const todayIndex = WEEKDAY_INDEX[here.weekday] ?? 0;
  let delta = (4 - todayIndex + 7) % 7;
  const showHasStarted = here.hour > 20 || (here.hour === 20 && here.minute > 0);
  if (delta === 0 && showHasStarted) delta = 7;
  const dateKey = addDays(here.key, delta);
  const tomorrow = addDays(here.key, 1);
  if (dateKey === here.key) return { dateKey, label: 'Tonight 8 PM ET' };
  if (dateKey === tomorrow) return { dateKey, label: 'Tomorrow 8 PM ET' };
  const formatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${dateKey}T12:00:00Z`)).replace(',', '');
  return { dateKey, label: `${formatted} · 8 PM ET` };
}
