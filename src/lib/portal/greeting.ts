export function greeting(now: Date, timeZone: string): string {
  const hour = Number(new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    hourCycle: 'h23',
  }).format(now));
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function firstName(fullName: string | null | undefined): string {
  const part = (fullName || '').trim().split(/\s+/)[0] || '';
  return part.replace(/^dr\.?/i, '') || 'there';
}

/** Name patients see on a document. Uses the public doctor row, not the login name. */
export function publicDoctorName(
  doctor: { first_name?: string | null; last_name?: string | null } | null | undefined,
  fallbackFullName?: string | null,
): string {
  const fromRow = [doctor?.first_name, doctor?.last_name].map((part) => (part || '').trim()).filter(Boolean).join(' ');
  const base = (fromRow || fallbackFullName || '').replace(/^dr\.?\s+/i, '').trim();
  if (!base) return '';
  return `Dr. ${base}`;
}
