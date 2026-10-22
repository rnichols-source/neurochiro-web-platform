import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const admin = createAdminClient()

  // Look up the reply_log by redirect_code
  const { data: log } = await (admin as any)
    .from('reply_logs')
    .select('id, doctor_id')
    .eq('redirect_code', code)
    .maybeSingle()

  if (!log || !log.doctor_id) {
    return NextResponse.redirect(new URL('/directory', req.url))
  }

  // Get doctor slug
  const { data: doctor } = await admin
    .from('doctors')
    .select('slug')
    .eq('id', log.doctor_id)
    .single()

  // Record the click
  await (admin as any).from('link_clicks').insert({
    reply_log_id: log.id,
    doctor_id: log.doctor_id,
    destination: 'profile',
    user_agent: req.headers.get('user-agent') || null,
    referrer: req.headers.get('referer') || null,
  })

  const slug = doctor?.slug || log.doctor_id
  return NextResponse.redirect(new URL(`/directory/${slug}`, req.url))
}
