type QueryError = { code?: string; message?: string; status?: number } | null | undefined;

export function isMissingRelation(error: QueryError): boolean {
  if (!error) return false;
  if (error.code === 'PGRST205' || error.code === '42P01' || error.status === 404) return true;
  const message = error.message || '';
  return message.includes('PGRST205') || message.includes('42P01') || message.includes('does not exist');
}
