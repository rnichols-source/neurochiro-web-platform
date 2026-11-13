import 'server-only'

import { createAdminClient } from '@/lib/supabase-admin'
import { isMissingTable } from '@/lib/leads/schema'

export type AuditRow = {
  id: string
  action: string
  summary: string
  targetType: string | null
  targetId: string | null
  createdAt: string
  actorId: string | null
}

const BUFFER_KEY = 'founder_audit_buffer'

export async function writeAudit(input: {
  actorId: string | null
  action: string
  summary: string
  targetType?: string | null
  targetId?: string | null
  detail?: Record<string, unknown>
}): Promise<void> {
  const admin = createAdminClient() as any
  const row = {
    actor_id: input.actorId,
    action: input.action,
    summary: input.summary.slice(0, 400),
    target_type: input.targetType || null,
    target_id: input.targetId || null,
    detail: input.detail || {},
  }
  const inserted = await admin.from('founder_audit_log').insert(row)
  if (!inserted.error) return
  if (!isMissingTable(inserted.error)) {
    console.error('founder audit', inserted.error.message)
  }
  const existing = await admin.from('platform_settings').select('value').eq('key', BUFFER_KEY).maybeSingle()
  const prior = Array.isArray(existing.data?.value) ? existing.data.value : []
  const next = [{ ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() }, ...prior].slice(0, 200)
  await admin.from('platform_settings').upsert({ key: BUFFER_KEY, value: next, updated_at: new Date().toISOString() })
}

export async function listAudit(limit = 80): Promise<{ rows: AuditRow[]; source: 'table' | 'buffer' | 'empty' }> {
  const admin = createAdminClient() as any
  const table = await admin.from('founder_audit_log').select('id, action, summary, target_type, target_id, created_at, actor_id').order('created_at', { ascending: false }).limit(limit)
  if (!table.error) {
    return {
      source: 'table',
      rows: (table.data || []).map(mapRow),
    }
  }
  if (!isMissingTable(table.error)) console.error('founder audit list', table.error.message)
  const buffer = await admin.from('platform_settings').select('value').eq('key', BUFFER_KEY).maybeSingle()
  const rows = Array.isArray(buffer.data?.value) ? buffer.data.value.map(mapRow).slice(0, limit) : []
  return { source: rows.length ? 'buffer' : 'empty', rows }
}

function mapRow(row: any): AuditRow {
  return {
    id: String(row.id || ''),
    action: String(row.action || ''),
    summary: String(row.summary || ''),
    targetType: row.target_type ? String(row.target_type) : null,
    targetId: row.target_id ? String(row.target_id) : null,
    createdAt: String(row.created_at || ''),
    actorId: row.actor_id ? String(row.actor_id) : null,
  }
}

export async function founderTablesReady(): Promise<{ audit: boolean; broadcasts: boolean; banners: boolean; officeVisit: boolean }> {
  const admin = createAdminClient() as any
  const [audit, broadcasts, banners, office] = await Promise.all([
    admin.from('founder_audit_log').select('id').limit(1),
    admin.from('founder_broadcasts').select('id').limit(1),
    admin.from('founder_banners').select('id').limit(1),
    admin.from('contact_requests').select('office_visit_response').limit(1),
  ])
  return {
    audit: !audit.error,
    broadcasts: !broadcasts.error,
    banners: !banners.error,
    officeVisit: !office.error,
  }
}
