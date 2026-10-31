export type JobDateInput = {
  status?: string | null;
  expires_at?: string | null;
};

export function jobDateLine(
  job: JobDateInput,
  now: Date,
  timeZone = 'America/New_York',
): { pill: string; expiry: string | null } {
  const status = (job.status || '').trim();
  if (status.toLowerCase() !== 'active') {
    return { pill: status || 'Closed', expiry: null };
  }
  const expires = job.expires_at ? new Date(job.expires_at) : null;
  if (!expires || Number.isNaN(expires.getTime())) return { pill: 'Open', expiry: null };
  const label = new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(expires);
  if (expires.getTime() < now.getTime()) return { pill: 'Expired', expiry: `Expired ${label}` };
  return { pill: 'Open', expiry: `Expires ${label}` };
}
