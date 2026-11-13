import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { isMissingColumn } from '@/lib/leads/schema'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  let body: { token?: string; response?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const token = typeof body.token === 'string' ? body.token : ''
  const response = body.response === 'yes' || body.response === 'no' ? body.response : null
  if (token.length < 32 || !response) return NextResponse.json({ error: 'Invalid token or response' }, { status: 400 })

  const admin = createAdminClient() as any
  const stamp = new Date().toISOString()
  const contact = await admin.from('contact_requests').select('id, office_visit_response, status').eq('office_visit_token', token).maybeSingle()
  if (contact.error && isMissingColumn(contact.error)) {
    return NextResponse.json({ error: 'This question is not open yet.' }, { status: 503 })
  }
  if (contact.data) {
    if (contact.data.status === 'withdrawn') return NextResponse.json({ error: 'Withdrawn' }, { status: 410 })
    if (contact.data.office_visit_response) return NextResponse.json({ ok: true, already: true })
    const saved = await admin.from('contact_requests').update({
      office_visit_response: response,
      office_visit_responded_at: stamp,
    }).eq('id', contact.data.id)
    if (saved.error) return NextResponse.json({ error: 'Could not save your answer.' }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  const visit = await admin.from('community_visit_requests').select('id, office_visit_response').eq('office_visit_token', token).maybeSingle()
  if (visit.error && isMissingColumn(visit.error)) return NextResponse.json({ error: 'This question is not open yet.' }, { status: 503 })
  if (!visit.data) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  if (visit.data.office_visit_response) return NextResponse.json({ ok: true, already: true })
  const saved = await admin.from('community_visit_requests').update({
    office_visit_response: response,
    office_visit_responded_at: stamp,
  }).eq('id', visit.data.id)
  if (saved.error) return NextResponse.json({ error: 'Could not save your answer.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
