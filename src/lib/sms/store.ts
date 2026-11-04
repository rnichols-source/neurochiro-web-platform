import { isMissingColumn, isMissingTable } from '../leads/schema.ts'
import type { SmsInsert, SmsLogRow, SmsNotify, SmsStore } from './types.ts'

type DbError = { message?: string; code?: string; details?: string } | null

interface SmsChain extends PromiseLike<{ data: unknown; error: DbError }> {
  insert(row: SmsInsert | SmsNotify & { channel: string; attempt: number }): SmsChain
  update(patch: Record<string, unknown>): SmsChain
  select(columns: string): SmsChain
  eq(column: string, value: string): SmsChain
  lte(column: string, value: string): SmsChain
  order(column: string, options: { ascending: boolean }): SmsChain
  limit(count: number): SmsChain
  maybeSingle(): Promise<{ data: { id?: string } | null; error: DbError }>
}

function missingError(error: DbError): boolean {
  return isMissingTable(error) || isMissingColumn(error)
}

export function supabaseSmsStore(db: { from: (table: string) => SmsChain }): SmsStore {
  return {
    async insertLog(row: SmsInsert) {
      const { data, error } = await db.from('sms_log').insert(row).select('id').maybeSingle()
      if (error) {
        if (missingError(error)) return { id: null, duplicate: false, missing: true }
        if (error.code === '23505') return { id: null, duplicate: true, missing: false }
        console.warn('[SMS] could not write the text log')
        return { id: null, duplicate: false, missing: false }
      }
      if (!data?.id) return { id: null, duplicate: true, missing: false }
      return { id: String(data.id), duplicate: false, missing: false }
    },

    async mark(id, patch, onlyStatus) {
      let query = db.from('sms_log').update(patch).eq('id', id)
      if (onlyStatus) query = query.eq('status', onlyStatus)
      const { data, error } = await query.select('id').maybeSingle()
      if (error) {
        if (missingError(error)) return false
        console.warn('[SMS] could not update the text log')
        return false
      }
      return Boolean(data?.id)
    },

    async notify(row: SmsNotify) {
      const { error } = await db.from('lead_notifications').insert({
        contact_request_id: row.contact_request_id,
        kind: row.kind,
        channel: 'sms',
        recipient: row.recipient,
        status: row.status,
        provider_message_id: row.provider_message_id,
        attempt: 1,
        error: row.error,
      })
      if (!error) return { missing: false }
      if (missingError(error)) return { missing: true }
      console.warn('[SMS] could not write the lead timeline')
      return { missing: false }
    },

    async dueHeld(nowIso, limit) {
      const { data, error } = await db.from('sms_log')
        .select('id, dedupe_key, kind, audience, contact_request_id, doctor_id, to_phone, body, status, send_after, attempt, test_mode, created_at')
        .eq('status', 'held_quiet_hours')
        .lte('send_after', nowIso)
        .order('send_after', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(limit)
      if (error) {
        if (missingError(error)) return { missing: true, rows: [] }
        console.warn('[SMS] could not read held texts')
        return { missing: false, rows: [] }
      }
      return { missing: false, rows: (data || []) as SmsLogRow[] }
    },
  }
}
