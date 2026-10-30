import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { runLeadEscalation } from '@/lib/leads/run-escalation'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

/**
 * Hourly lead follow-up. One bad row cannot stop the run.
 * ?dry_run=true reports the next action and does not send.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dryRun = req.nextUrl.searchParams.get('dry_run') === 'true'
  try {
    const db = createAdminClient()
    const result = await runLeadEscalation(db, dryRun)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Escalation failed'
    console.error('[LEADS] contact-escalation failed:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
