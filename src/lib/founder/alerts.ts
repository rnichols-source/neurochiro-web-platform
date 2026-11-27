import 'server-only'

import { unstable_cache } from 'next/cache'
import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase-admin'
import { loadDoctorBilling } from './money'

export type ShellAlert = { id: string; title: string; href: string }

type WaitChain = PromiseLike<{ data: { doctor_id: string | null }[] | null; error: { message?: string } | null }> & {
  is: (column: string, value: null) => WaitChain
  neq: (column: string, value: string) => WaitChain
  lt: (column: string, value: string) => WaitChain
  limit: (count: number) => WaitChain
}

async function loadWaitingRequests(): Promise<{ doctor_id: string | null }[]> {
  const admin = createAdminClient() as unknown as {
    from: (table: string) => { select: (columns: string) => WaitChain }
  }
  const cutoff = new Date(Date.now() - 48 * 3_600_000).toISOString()
  const waiting = await admin.from('contact_requests').select('doctor_id').is('acknowledged_at', null).neq('status', 'withdrawn').neq('status', 'spam').lt('created_at', cutoff).limit(200)
  if (waiting.error) throw new Error('alerts')
  return (waiting.data || []) as { doctor_id: string | null }[]
}

const loadWaitingCached = unstable_cache(loadWaitingRequests, ['founder-shell-waiting-v3'], { revalidate: 60 })

export const loadShellAlerts = cache(async (): Promise<ShellAlert[]> => {
  try {
    const [waitingRows, billing] = await Promise.all([loadWaitingCached(), loadDoctorBilling()])
    const alerts: ShellAlert[] = []
    if (waitingRows.length) {
      const doctors = new Set(waitingRows.map((row) => row.doctor_id).filter(Boolean))
      alerts.push({
        id: 'waiting',
        title: `${waitingRows.length} visit requests waiting 48h+ at ${doctors.size} doctor${doctors.size === 1 ? '' : 's'}`,
        href: '/admin/people?filter=ignoring',
      })
    }
    if (billing.stripeOk && billing.pastDue) {
      alerts.push({
        id: 'pastdue',
        title: `${billing.pastDue} failed payment${billing.pastDue === 1 ? '' : 's'}`,
        href: '/admin/money',
      })
    }
    if (billing.stripeOk && billing.disputesOpen) {
      alerts.push({
        id: 'disputes',
        title: `${billing.disputesOpen} open dispute${billing.disputesOpen === 1 ? '' : 's'} on Stripe`,
        href: '/admin/money',
      })
    }
    return alerts
  } catch {
    return [{ id: 'alerts-failed', title: 'Could not load alerts. Open Pulse to retry.', href: '/admin' }]
  }
})
