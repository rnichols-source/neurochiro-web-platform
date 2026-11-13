import { NextRequest, NextResponse } from 'next/server'
import { runAutoNudge, runOfficeFollowup, runScheduledBroadcasts } from '@/lib/founder/send'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const [followup, nudge, scheduled] = await Promise.all([
    runOfficeFollowup(),
    runAutoNudge(),
    runScheduledBroadcasts(),
  ])
  return NextResponse.json({ followup, nudge, scheduled })
}
