import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { toE164 } from '@/lib/sms/phone'
import { isStopMessage } from '@/lib/sms/waitlist-text'

export const dynamic = 'force-dynamic'

function readBody(payload: unknown): { from: string; text: string } | null {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>
  const data = root.data && typeof root.data === 'object' ? root.data as Record<string, unknown> : root
  const object = data.object && typeof data.object === 'object' ? data.object as Record<string, unknown> : data
  const from = typeof object.from === 'string' ? object.from : typeof object.phone === 'string' ? object.phone : ''
  const text = typeof object.body === 'string' ? object.body : typeof object.text === 'string' ? object.text : typeof object.content === 'string' ? object.content : ''
  if (!from || !text) return null
  return { from, text }
}

export async function POST(req: Request) {
  const secret = process.env.QUO_WEBHOOK_SECRET || ''
  if (secret) {
    const header = req.headers.get('authorization') || req.headers.get('x-quo-signature') || ''
    if (header !== secret && header !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  const payload = await req.json().catch(() => null)
  const message = readBody(payload)
  if (!message || !isStopMessage(message.text)) return NextResponse.json({ ok: true, ignored: true })
  const phone = toE164(message.from, 'US')
  if (!phone) return NextResponse.json({ ok: true, ignored: true })
  const admin = createAdminClient() as any
  await admin.from('subscribers').update({
    sms_consent: false,
    sms_opted_out_at: new Date().toISOString(),
  }).eq('sms_phone', phone)
  return NextResponse.json({ ok: true, stopped: true })
}
