/** leads.doctor_id must be doctors.id. Older callers sometimes passed the doctor's user id. */

type DoctorLookup = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: { id?: string } | null }>
      }
    }
  }
}

export async function resolveDoctorRowId(
  db: DoctorLookup,
  raw: string | null | undefined,
): Promise<string | null> {
  const value = (raw || '').trim()
  if (!value) return null
  const byId = await db.from('doctors').select('id').eq('id', value).maybeSingle()
  if (byId.data?.id) return String(byId.data.id)
  const byUser = await db.from('doctors').select('id').eq('user_id', value).maybeSingle()
  if (byUser.data?.id) return String(byUser.data.id)
  return null
}
