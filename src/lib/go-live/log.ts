import 'server-only'

import { isMissingColumn, isMissingTable } from '@/lib/leads/schema'
import { createAdminClient } from '@/lib/supabase-admin'
import { GO_LIVE_STEPS, type GoLiveStep, type GoLiveStatus, type GoLiveStepResult } from './steps.ts'

export { GO_LIVE_STEPS }
export type { GoLiveStep, GoLiveStatus, GoLiveStepResult }

function db() {
  return createAdminClient() as any
}

export async function openGoLiveRun(doctorId: string, source: string, dryRun: boolean): Promise<string | null> {
  const inserted = await db().from('doctor_go_live_runs').insert({
    doctor_id: doctorId,
    source,
    dry_run: dryRun,
  }).select('id').single()
  if (inserted.error) {
    if (!isMissingTable(inserted.error)) console.error('[go-live] run log failed', inserted.error.code || 'error')
    return null
  }
  return inserted.data?.id ? String(inserted.data.id) : null
}

export async function saveGoLiveStep(runId: string | null, doctorId: string, result: GoLiveStepResult): Promise<void> {
  if (!runId) return
  const saved = await db().from('doctor_go_live_steps').upsert({
    run_id: runId,
    doctor_id: doctorId,
    step: result.step,
    status: result.status,
    reason: result.reason.slice(0, 500),
    detail: result.detail || {},
    updated_at: new Date().toISOString(),
  }, { onConflict: 'run_id,step' })
  if (saved.error && !isMissingTable(saved.error)) {
    console.error('[go-live] step log failed', saved.error.code || 'error')
  }
}

export async function goLiveStepAlreadyOk(doctorId: string, step: GoLiveStep): Promise<boolean> {
  const { data, error } = await db()
    .from('doctor_go_live_steps')
    .select('id')
    .eq('doctor_id', doctorId)
    .eq('step', step)
    .eq('status', 'ok')
    .limit(1)
  if (error) return false
  return Array.isArray(data) && data.length > 0
}

export async function countGoLiveStep(doctorId: string, step: GoLiveStep, status: GoLiveStatus): Promise<number> {
  const { count, error } = await db()
    .from('doctor_go_live_steps')
    .select('id', { count: 'exact', head: true })
    .eq('doctor_id', doctorId)
    .eq('step', step)
    .eq('status', status)
  if (error) return 0
  return count || 0
}

const LOCK_MS = 3 * 60 * 1000

export async function acquireGoLiveLock(doctorId: string): Promise<boolean> {
  const now = new Date().toISOString()
  const inserted = await db().from('doctor_go_live_locks').insert({ doctor_id: doctorId, acquired_at: now })
  if (!inserted.error) return true
  if (isMissingTable(inserted.error)) return true
  if (inserted.error.code !== '23505') return true
  const current = await db().from('doctor_go_live_locks').select('acquired_at').eq('doctor_id', doctorId).maybeSingle()
  const acquiredAt = typeof current.data?.acquired_at === 'string' ? current.data.acquired_at : ''
  if (!acquiredAt || Date.now() - Date.parse(acquiredAt) < LOCK_MS) return false
  const stolen = await db()
    .from('doctor_go_live_locks')
    .update({ acquired_at: now })
    .eq('doctor_id', doctorId)
    .eq('acquired_at', acquiredAt)
    .select('doctor_id')
  return Array.isArray(stolen.data) && stolen.data.length > 0
}

export async function releaseGoLiveLock(doctorId: string): Promise<void> {
  await db().from('doctor_go_live_locks').delete().eq('doctor_id', doctorId)
}

export async function claimWelcomeStep(runId: string | null, doctorId: string): Promise<'won' | 'lost' | 'unavailable'> {
  if (!runId) return 'unavailable'
  const inserted = await db().from('doctor_go_live_steps').insert({
    run_id: runId,
    doctor_id: doctorId,
    step: 'welcome',
    status: 'pending',
    reason: 'Welcome claimed. The email sends only for the claim that won.',
    detail: {},
  })
  if (!inserted.error) return 'won'
  if (inserted.error.code === '23505') return 'lost'
  if (inserted.error.code === '23514' || isMissingTable(inserted.error) || isMissingColumn(inserted.error)) return 'unavailable'
  console.error('[go-live] welcome claim failed', inserted.error.code || 'error')
  return 'unavailable'
}

export type GoLiveStepRow = GoLiveStepResult & {
  id: string
  doctorId: string
  doctorName: string
  source: string
  updatedAt: string
}

export async function loadRecentGoLiveSteps(): Promise<{ ready: boolean; rows: GoLiveStepRow[] }> {
  const { data, error } = await db()
    .from('doctor_go_live_steps')
    .select('id, doctor_id, step, status, reason, updated_at, run_id')
    .order('updated_at', { ascending: false })
    .limit(200)
  if (error) return { ready: !isMissingTable(error), rows: [] }
  const steps = (data || []) as Record<string, unknown>[]
  const doctorIds = Array.from(new Set(steps.map((row) => String(row.doctor_id || '')).filter(Boolean)))
  const names = new Map<string, string>()
  if (doctorIds.length) {
    const doctors = await db().from('doctors').select('id, first_name, last_name').in('id', doctorIds)
    for (const row of doctors.data || []) {
      names.set(String(row.id), `Dr. ${row.last_name || row.first_name || 'Doctor'}`)
    }
  }
  const seen = new Set<string>()
  const rows: GoLiveStepRow[] = []
  for (const row of steps) {
    const doctorId = String(row.doctor_id || '')
    const step = String(row.step || '') as GoLiveStep
    const key = `${doctorId}:${step}`
    if (seen.has(key)) continue
    seen.add(key)
    if (!GO_LIVE_STEPS.includes(step)) continue
    rows.push({
      id: String(row.id),
      doctorId,
      doctorName: names.get(doctorId) || 'Doctor',
      source: '',
      step,
      status: (row.status === 'failed' || row.status === 'skipped' || row.status === 'pending' ? row.status : 'ok'),
      reason: String(row.reason || ''),
      updatedAt: String(row.updated_at || ''),
    })
  }
  return { ready: true, rows }
}
