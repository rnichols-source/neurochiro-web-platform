import { NextResponse } from 'next/server'
import { runProfileBuildBatch } from '@/lib/profile-build/run'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const result = await runProfileBuildBatch()
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('[profile-build] cron failed', error instanceof Error ? error.name : 'error')
    return NextResponse.json({ error: 'Profile research failed' }, { status: 500 })
  }
}
