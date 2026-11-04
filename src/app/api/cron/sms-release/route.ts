import { NextRequest, NextResponse } from 'next/server'
import { releaseHeldTexts } from '@/lib/sms/release-held'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

/**
 * Every 15 minutes. Sends doctor lead texts that waited out quiet hours.
 * Does nothing while SMS_ENABLED is not exactly true.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (process.env.SMS_ENABLED !== 'true') {
    return NextResponse.json({ skipped: 'disabled' })
  }

  try {
    const result = await releaseHeldTexts()
    return NextResponse.json({
      released: result.released,
      canceled: result.canceled,
      failed: result.failed,
    })
  } catch {
    console.warn('[SMS] held texts were not released')
    return NextResponse.json({ error: 'Release failed' }, { status: 500 })
  }
}
