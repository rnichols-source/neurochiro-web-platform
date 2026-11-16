import 'server-only'

import { createAdminClient } from '@/lib/supabase-admin'
import { retryPlanForDoctor } from './plan.ts'
import type { GoLiveStep } from './steps.ts'

function db() {
  return createAdminClient() as any
}

export async function retryFailedGoLive(): Promise<{ doctors: number; ran: number }> {
  const stale = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  await db()
    .from('doctor_go_live_steps')
    .update({
      status: 'failed',
      reason: 'Welcome claim expired before the email was sent.',
      updated_at: new Date().toISOString(),
    })
    .eq('step', 'welcome')
    .eq('status', 'pending')
    .lt('updated_at', stale)

  const failed = await db()
    .from('doctor_go_live_steps')
    .select('doctor_id')
    .eq('status', 'failed')
    .order('updated_at', { ascending: false })
    .limit(80)
  const waiting = await db()
    .from('doctor_go_live_steps')
    .select('doctor_id')
    .eq('step', 'welcome')
    .eq('status', 'skipped')
    .order('updated_at', { ascending: false })
    .limit(40)
  const ids = Array.from(new Set([
    ...(failed.data || []).map((row: { doctor_id?: string }) => String(row.doctor_id || '')),
    ...(waiting.data || []).map((row: { doctor_id?: string }) => String(row.doctor_id || '')),
  ].filter(Boolean))).slice(0, 20)
  if (!ids.length) return { doctors: 0, ran: 0 }

  const steps = await db()
    .from('doctor_go_live_steps')
    .select('doctor_id, step, status, updated_at')
    .in('doctor_id', ids)
    .order('updated_at', { ascending: false })
    .limit(400)
  const byDoctor = new Map<string, { step: string; status: string }[]>()
  for (const row of steps.data || []) {
    const doctorId = String(row.doctor_id || '')
    if (!doctorId) continue
    const list = byDoctor.get(doctorId) || []
    list.push({ step: String(row.step || ''), status: String(row.status || '') })
    byDoctor.set(doctorId, list)
  }

  const { runDoctorGoLive } = await import('./orchestrator')
  let ran = 0
  for (const [doctorId, rows] of byDoctor) {
    const only = retryPlanForDoctor(rows)
    if (!only) continue
    await runDoctorGoLive({ doctorId, source: 'retry', only: only as GoLiveStep[] })
    ran += 1
  }
  return { doctors: byDoctor.size, ran }
}
