import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { siteUrl } from '@/lib/leads/config'
import { sendDoctorWithdrawn, type LeadMail } from '@/lib/leads/deliver'
import { getDoctorRecipients } from '@/lib/leads/recipients'
import { updateContactRequest } from '@/lib/leads/schema'

export const maxDuration = 30

/**
 * GET /api/contact-request/withdraw?token=...
 * Does not change the request. Email link scanners stop here.
 * The confirm page POSTs after the patient taps "Yes, withdraw".
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token || token.length < 32) return redirectStatus('invalid')

  const db = createAdminClient() as any
  const { data: request } = await db
    .from('contact_requests')
    .select('id, status')
    .eq('withdrawal_token', token)
    .maybeSingle()

  if (!request) return redirectStatus('invalid')
  if (request.status === 'withdrawn') return redirectStatus('already')

  const url = new URL(`${siteUrl()}/contact-request/withdrawn`)
  url.searchParams.set('token', token)
  url.searchParams.set('confirm', '1')
  return NextResponse.redirect(url.toString())
}

/** POST /api/contact-request/withdraw — the only path that withdraws a request. */
export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const token = typeof body.token === 'string' ? body.token : ''
  if (!token || token.length < 32) return NextResponse.json({ error: 'Invalid token' }, { status: 400 })

  const db = createAdminClient() as any
  const { data: request } = await db
    .from('contact_requests')
    .select('id, doctor_id, name, phone, note, status')
    .eq('withdrawal_token', token)
    .maybeSingle()

  if (!request) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  if (request.status === 'withdrawn') return NextResponse.json({ ok: true, already: true })

  const updated = await updateContactRequest(db, request.id, {
    status: 'withdrawn',
    withdrawn_at: new Date().toISOString(),
  })
  if (!updated.ok) return NextResponse.json({ error: 'Could not withdraw this request. Please try again.' }, { status: 500 })

  try {
    const { data: doctor } = await db
      .from('doctors')
      .select('id, email, user_id, first_name, last_name, clinic_name, phone')
      .eq('id', request.doctor_id)
      .maybeSingle()
    if (doctor) {
      const recipients = await getDoctorRecipients(doctor)
      if (recipients.length) {
        const doctorName = `Dr. ${doctor.first_name || ''} ${doctor.last_name || ''}`.trim()
        const mail: LeadMail = {
          requestId: request.id,
          patientName: request.name || '',
          patientPhone: request.phone || '',
          patientEmail: '',
          preferredTime: '',
          message: request.note || '',
          source: '',
          doctorName,
          practiceName: doctor.clinic_name || doctorName,
          doctorPhone: doctor.phone || '',
          doctorEmail: recipients[0] || '',
          doctorRecipients: recipients,
          acknowledgeToken: '',
          withdrawalToken: token,
          checkinToken: '',
        }
        const sent = await sendDoctorWithdrawn(mail)
        if (!sent.ok) console.error('[LEADS] withdraw notice failed:', sent.error)
      }
    }
  } catch (err) {
    console.error('[LEADS] withdraw notice threw:', err instanceof Error ? err.message : err)
  }

  return NextResponse.json({ ok: true })
}

function redirectStatus(status: string) {
  return NextResponse.redirect(`${siteUrl()}/contact-request/withdrawn?status=${status}`)
}
