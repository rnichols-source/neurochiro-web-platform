import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { siteUrl } from '@/lib/leads/config'
import { sendAdminEscalation, type LeadMail } from '@/lib/leads/deliver'
import { isMissingColumn, updateContactRequest } from '@/lib/leads/schema'
import { parseLegacyNote } from '@/lib/leads/validate'

export const maxDuration = 30

const SELECT = 'id, name, phone, note, email, preferred_time, message, source, doctor_id, status, created_at, patient_checkin_response, patient_checkin_token'

/**
 * GET /api/contact-request/checkin?token=&answer=
 * Does not record the answer. Link scanners stop on the confirm page.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || ''
  const answer = req.nextUrl.searchParams.get('answer')
  if (!token || token.length < 32 || (answer !== 'reached' && answer !== 'not_yet')) {
    return NextResponse.redirect(`${siteUrl()}/contact-request/checkin?status=invalid`)
  }
  const url = new URL(`${siteUrl()}/contact-request/checkin`)
  url.searchParams.set('token', token)
  url.searchParams.set('answer', answer)
  return NextResponse.redirect(url.toString())
}

/** POST /api/contact-request/checkin — records reached or not_yet. */
export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const token = typeof body.token === 'string' ? body.token : ''
  const response = body.response === 'reached' || body.response === 'not_yet' ? body.response : null
  if (!token || token.length < 32 || !response) {
    return NextResponse.json({ error: 'Invalid token or response' }, { status: 400 })
  }

  const db = createAdminClient() as any
  const extended = await db.from('contact_requests').select(SELECT).eq('patient_checkin_token', token).maybeSingle()
  if (extended.error && isMissingColumn(extended.error)) {
    console.error('[LEADS] patient check-in columns are missing. Apply migration 20261030000000_lead_followup.sql.', extended.error.message)
    return NextResponse.json({ error: 'Check-in is not available yet. Please reply to the email.' }, { status: 503 })
  }
  if (extended.error) {
    console.error('[LEADS] check-in lookup failed:', extended.error.message)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
  const request = extended.data
  if (!request) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  if (request.status === 'withdrawn') return NextResponse.json({ error: 'Withdrawn' }, { status: 410 })
  if (request.patient_checkin_response) return NextResponse.json({ ok: true, already: true, response: request.patient_checkin_response })

  const updated = await updateContactRequest(db, request.id, {
    patient_checkin_response: response,
    patient_checkin_responded_at: new Date().toISOString(),
    ...(response === 'not_yet' ? { needs_admin_attention: true, attention_reason: 'patient says not contacted' } : {}),
  })
  if (!updated.ok) return NextResponse.json({ error: 'Could not save your answer.' }, { status: 500 })

  if (response === 'not_yet') {
    const { data: doctor } = await db.from('doctors').select('first_name, last_name, clinic_name, email, phone').eq('id', request.doctor_id).maybeSingle()
    const legacy = parseLegacyNote(request.note)
    const doctorName = doctor ? `Dr. ${doctor.first_name || ''} ${doctor.last_name || ''}`.trim() : 'Unknown doctor'
    const hours = Math.max(0, Math.round((Date.now() - new Date(request.created_at).getTime()) / 3_600_000))
    const mail: LeadMail = {
      requestId: request.id,
      patientName: request.name || '',
      patientPhone: request.phone || '',
      patientEmail: request.email || legacy.email || '',
      preferredTime: request.preferred_time || legacy.preferredTime || '',
      message: request.message || request.note || '',
      source: request.source || '',
      doctorName,
      practiceName: doctor?.clinic_name || doctorName,
      doctorPhone: doctor?.phone || '',
      doctorEmail: doctor?.email || '',
      doctorRecipients: doctor?.email ? [doctor.email] : [],
      acknowledgeToken: '',
      withdrawalToken: '',
      checkinToken: token,
      hoursWaiting: hours,
      reason: 'patient says not contacted',
    }
    const sent = await sendAdminEscalation(mail)
    if (!sent.ok) console.error('[LEADS] patient not-yet escalation failed:', sent.error)
  }

  return NextResponse.json({ ok: true, response })
}
