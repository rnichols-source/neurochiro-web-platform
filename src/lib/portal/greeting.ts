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
  const withoutTitle = (fullName || '').trim().replace(/^dr\.?\s+/i, '');
  const part = withoutTitle.split(/\s+/).filter(Boolean)[0] || '';
  return part.replace(/^dr\.?$/i, '') || 'there';
}
