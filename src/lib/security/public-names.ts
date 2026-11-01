export type PublicName = {
  id: string
  full_name: string | null
  avatar_url: string | null
}

/**
 * Display names only. Email, role, and Stripe fields are dropped even if the
 * source row has them. Role stays on the caller, outside this object.
 */
export function toPublicNames(
  rows: Array<Record<string, unknown> | null | undefined>,
): PublicName[] {
  const names: PublicName[] = []
  for (const row of rows) {
    if (!row || typeof row.id !== 'string' || !row.id) continue
    names.push({
      id: row.id,
      full_name: typeof row.full_name === 'string' ? row.full_name : null,
      avatar_url: typeof row.avatar_url === 'string' ? row.avatar_url : null,
    })
  }
  return names
}
