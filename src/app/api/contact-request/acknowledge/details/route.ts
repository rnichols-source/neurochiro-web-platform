import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { isMissingColumn } from '@/lib/leads/schema'
import { parseLegacyNote } from '@/lib/leads/validate'

/**
 * GET /api/contact-request/acknowledge/details?token=...
 * Token is the only auth. Returns the contact details the doctor needs to call.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token || token.length < 32) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  const db = createAdminClient() as any
  const extended = await db
    .from('contact_requests')
    .select('name, phone, note, email, preferred_time, message')
    .eq('acknowledge_token', token)
    .maybeSingle()

  let data = extended.data
  if (extended.error && isMissingColumn(extended.error)) {
    console.error('[LEADS] acknowledge details is missing follow-up columns. Apply migration 20261030000000_lead_followup.sql.', extended.error.message)
    const basic = await db.from('contact_requests').select('name, phone, note').eq('acknowledge_token', token).maybeSingle()
    data = basic.data
  } else if (extended.error) {
    console.error('[LEADS] acknowledge details failed:', extended.error.message)
  }

  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const legacy = parseLegacyNote(data.note)
  return NextResponse.json({
    name: data.name,
    phone: data.phone || '',
    note: data.note || '',
    email: data.email || legacy.email || '',
    preferredTime: data.preferred_time || legacy.preferredTime || '',
    message: data.message || '',
  })
}
