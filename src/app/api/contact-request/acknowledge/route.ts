import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { siteUrl } from '@/lib/leads/config'
import { sendAdminAlert, type LeadMail } from '@/lib/leads/deliver'
import { logPortalEvent } from '@/lib/leads/send'
import { isAckAction, outcomePatch } from '@/lib/leads/outcomes'
import { isMissingColumn, updateContactRequest } from '@/lib/leads/schema'
import { parseLegacyNote } from '@/lib/leads/validate'

export const maxDuration = 30

/**
 * GET /api/contact-request/acknowledge?token=...
 * Validates the token and redirects. It does not record the outcome.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token || token.length < 32) return redirect('invalid')

  const db = createAdminClient() as any
  const { data: request } = await db
    .from('contact_requests')
    .select('id, status, acknowledged_at, acknowledge_token_expires, contact_outcome')
    .eq('acknowledge_token', token)
    .maybeSingle()

  if (!request) return redirect('invalid')
  if (request.contact_outcome === 'patient_contacted_confirmed') return redirect('already', token)
  if (request.acknowledge_token_expires && new Date(request.acknowledge_token_expires) < new Date()) return redirect('expired')
  if (request.status === 'withdrawn') return redirect('withdrawn')
  return redirect('confirm', token)
}

/**
 * POST /api/contact-request/acknowledge
 * Records called, voicemail, booked, unreachable, or will_call. No login.
 */
export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { token, action } = body
  if (!token || !isAckAction(action)) {
    return NextResponse.json({ error: 'Missing token or action' }, { status: 400 })
  }

  const db = createAdminClient() as any
  const extended = await db
    .from('contact_requests')
    .select('id, name, phone, note, email, doctor_id, acknowledged_at, contact_outcome, acknowledge_token_expires, status')
    .eq('acknowledge_token', token)
    .maybeSingle()
  let request = extended.data
  if (extended.error && isMissingColumn(extended.error)) {
    const basic = await db
      .from('contact_requests')
      .select('id, name, phone, note, doctor_id, acknowledged_at, contact_outcome, acknowledge_token_expires, status')
      .eq('acknowledge_token', token)
      .maybeSingle()
    request = basic.data
  }

  if (!request) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  if (request.status === 'withdrawn') return NextResponse.json({ error: 'Withdrawn' }, { status: 410 })
  if (request.acknowledge_token_expires && new Date(request.acknowledge_token_expires) < new Date()) {
    return NextResponse.json({ error: 'Token expired' }, { status: 410 })
  }
  if (request.contact_outcome === 'patient_contacted_confirmed') {
    return NextResponse.json({ ok: true, already: true })
  }

  const row = request
  const patch = outcomePatch(action, 'email_link', row.acknowledged_at || null)
  const updated = await updateContactRequest(db, row.id, patch)
  if (!updated.ok) return NextResponse.json({ error: 'Could not save your response. Please try again.' }, { status: 500 })

  await logPortalEvent({ requestId: row.id, kind: 'doctor_ack', recipient: action })

  if (action === 'unreachable') {
    const { data: doctor } = await db.from('doctors').select('first_name, last_name, clinic_name, email, phone').eq('id', row.doctor_id).maybeSingle()
    const legacy = parseLegacyNote(row.note)
    const doctorName = doctor ? `Dr. ${doctor.first_name || ''} ${doctor.last_name || ''}`.trim() : 'Unknown doctor'
    const mail: LeadMail = {
      requestId: row.id,
      patientName: row.name || '',
      patientPhone: row.phone || '',
      patientEmail: row.email || legacy.email || '',
      preferredTime: legacy.preferredTime,
      message: row.note || '',
      source: '',
      doctorName,
      practiceName: doctor?.clinic_name || doctorName,
      doctorPhone: doctor?.phone || '',
      doctorEmail: doctor?.email || '',
      doctorRecipients: doctor?.email ? [doctor.email] : [],
      acknowledgeToken: token,
      withdrawalToken: '',
      checkinToken: '',
    }
    const alert = await sendAdminAlert(mail, 'doctor marked patient unreachable')
    if (!alert.ok) console.error('[LEADS] unreachable admin alert failed:', alert.error)
  }

  return NextResponse.json({ ok: true })
}

function redirect(status: string, token?: string) {
  const url = new URL(`${siteUrl()}/contact-acknowledged`)
  url.searchParams.set('status', status)
  if (token) url.searchParams.set('token', token)
  return NextResponse.redirect(url.toString())
}
