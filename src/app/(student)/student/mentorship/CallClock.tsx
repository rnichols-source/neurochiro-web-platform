'use client';

export default function CallClock({ startsAt }: { startsAt: string }) {
  const date = new Date(startsAt);
  const local = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
  const eastern = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York', timeZoneName: 'short' }).format(date);
  return <p className="text-base text-portal-ink">{local} ({eastern})</p>;
}
