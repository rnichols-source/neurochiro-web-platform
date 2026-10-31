const PLACEHOLDERS = new Set(['new', 'member', 'student', 'user', 'there', 'name']);

export function studentGreetingName(fullName: string | null | undefined): string {
  const trimmed = (fullName || '').trim();
  const first = trimmed.split(/\s+/)[0] || '';
  const lowered = trimmed.toLowerCase();
  if (!first || lowered === 'new member' || PLACEHOLDERS.has(first.toLowerCase())) return 'Welcome';
  return first;
}
