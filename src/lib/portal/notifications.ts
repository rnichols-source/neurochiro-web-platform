/** Seeded badge rows are not tied to a real award. Hide them until a writer exists. */
export function isHiddenNotification(row: { type?: string | null; title?: string | null }): boolean {
  const type = (row.type || '').toLowerCase();
  if (type === 'portal_login' || type === 'badge' || type === 'badge_earned') return true;
  return (row.title || '').startsWith('Badge earned');
}
