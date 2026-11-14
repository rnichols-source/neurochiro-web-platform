import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { shouldHideUnpaid } from '@/lib/go-live/plan'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const admin = createAdminClient() as any
  const now = new Date().toISOString()
  const { data, error } = await admin
    .from('doctor_applications')
    .select('id, doctor_id, status, reviewed_at')
    .eq('status', 'needs_action')
    .limit(100)
  if (error) return NextResponse.json({ ok: true, hidden: 0 })
  let hidden = 0
  for (const row of data || []) {
    if (!shouldHideUnpaid({ status: row.status, reviewedAt: row.reviewed_at, paid: false, now })) continue
    const doctor = await admin.from('doctors').select('paid_at').eq('id', row.doctor_id).maybeSingle()
    if (doctor.data?.paid_at) continue
    await admin.from('doctors').update({
      verification_status: 'hidden',
      is_approved: false,
      listing_exception: 'unpaid_hidden',
    }).eq('id', row.doctor_id)
    hidden += 1
  }
  return NextResponse.json({ ok: true, hidden })
}
