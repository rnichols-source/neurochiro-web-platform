import 'server-only'

import { createAdminClient } from '@/lib/supabase-admin'
import { isMissingColumn, isMissingTable } from '@/lib/leads/schema'

type OptOutResult = { data: { sms_phone?: string | null; sms_opted_out_at?: string | null }[] | null; error?: { code?: string; message?: string } | null }

/** Phones that replied STOP. `unknown` means the lookup failed and texts should not send. */
export async function optedOutPhones(phones: string[]): Promise<Set<string> | 'unknown'> {
  const unique = [...new Set(phones.map((phone) => phone.trim()).filter(Boolean))]
  if (unique.length === 0) return new Set()
  const admin = createAdminClient() as unknown as {
    from: (table: string) => {
      select: (columns: string) => { in: (column: string, values: string[]) => Promise<OptOutResult> }
    }
  }
  const result = await admin.from('subscribers').select('sms_phone, sms_opted_out_at').in('sms_phone', unique)
  if (result.error) {
    if (isMissingColumn(result.error) || isMissingTable(result.error)) return new Set()
    console.error('[application] opt-out lookup failed', result.error.code || 'error')
    return 'unknown'
  }
  const stopped = new Set<string>()
  for (const row of result.data || []) {
    if (row.sms_opted_out_at && row.sms_phone) stopped.add(row.sms_phone)
  }
  return stopped
}
