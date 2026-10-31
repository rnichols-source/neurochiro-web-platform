export function missingSchema(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  const code = error.code || '';
  if (code === '42P01' || code === '42703' || code === 'PGRST205' || code === 'PGRST204') return true;
  const message = (error.message || '').toLowerCase();
  return message.includes('does not exist') || message.includes('schema cache') || message.includes('could not find');
}
