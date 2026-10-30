/**
 * PostgREST and Postgres errors when the lead-followup migration is not applied yet.
 * Callers log these and fall back to the original columns so the lead is still saved.
 */

type DbError = { message?: string; code?: string; details?: string } | null | undefined

export function errorText(error: DbError): string {
  return [error?.code, error?.message, error?.details].filter(Boolean).join(' ')
}

export function isMissingColumn(error: DbError): boolean {
  if (!error) return false
  const text = errorText(error).toLowerCase()
  return error.code === 'PGRST204'
    || error.code === '42703'
    || text.includes('schema cache')
    || (text.includes('column') && text.includes('does not exist'))
}

export function isMissingTable(error: DbError): boolean {
  if (!error) return false
  const text = errorText(error).toLowerCase()
  return error.code === '42P01'
    || error.code === 'PGRST205'
    || text.includes('could not find the table')
    || (text.includes('relation') && text.includes('does not exist'))
}

const LEGACY_CONTACT_COLUMNS = new Set([
  'status', 'note', 'phone', 'name', 'acknowledged_at', 'acknowledged_by', 'acknowledged_via',
  'admin_note', 'contact_outcome', 'will_call_deadline', 'withdrawn_at', 'source',
])

/**
 * Update contact_requests. If a new column is missing, retry with the original columns
 * that are present in the patch. Never throws.
 */
export async function updateContactRequest(
  db: any,
  id: string,
  patch: Record<string, unknown>,
): Promise<{ ok: boolean; missingColumn?: boolean; error?: string }> {
  const { error } = await db.from('contact_requests').update(patch).eq('id', id)
  if (!error) return { ok: true }
  if (!isMissingColumn(error)) {
    console.error('[LEADS] contact_requests update failed:', error.message)
    return { ok: false, error: error.message }
  }

  const legacy: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(patch)) {
    if (LEGACY_CONTACT_COLUMNS.has(key)) legacy[key] = value
  }
  console.error(
    '[LEADS] contact_requests is missing a follow-up column. Apply migration 20261030000000_lead_followup.sql.',
    error.message,
  )
  if (Object.keys(legacy).length === 0) return { ok: false, missingColumn: true, error: error.message }

  const second = await db.from('contact_requests').update(legacy).eq('id', id)
  if (second.error) {
    console.error('[LEADS] contact_requests legacy update failed:', second.error.message)
    return { ok: false, missingColumn: true, error: second.error.message }
  }
  return { ok: true, missingColumn: true }
}
