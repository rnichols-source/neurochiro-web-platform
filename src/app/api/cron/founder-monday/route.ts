import { NextRequest, NextResponse } from 'next/server'
import { sendMondayDigest } from '@/lib/founder/send'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'America/New_York' }).format(new Date())
  if (weekday !== 'Mon') return NextResponse.json({ ok: true, skipped: 'not monday in New York' })
  const result = await sendMondayDigest('cron')
  return NextResponse.json(result)
}
