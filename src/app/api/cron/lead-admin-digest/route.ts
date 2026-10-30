import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { runLeadAdminDigest } from '@/lib/leads/digest'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

/** Daily digest. Sends nothing when there is nothing to report. */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = createAdminClient()
    const result = await runLeadAdminDigest(db)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Digest failed'
    console.error('[LEADS] admin digest failed:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
