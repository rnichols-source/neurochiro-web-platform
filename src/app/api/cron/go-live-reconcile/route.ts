import { NextResponse } from 'next/server'
import { reconcileDoctorGoLive } from '@/lib/go-live/reconcile'
import { adminIsConfigured } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!adminIsConfigured()) {
    return NextResponse.json({ error: 'Supabase environment is missing' }, { status: 500 })
  }
  try {
    const result = await reconcileDoctorGoLive()
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('[go-live] reconcile cron failed', error instanceof Error ? error.name : 'error')
    return NextResponse.json({ error: 'Go-live reconciliation failed' }, { status: 500 })
  }
}
