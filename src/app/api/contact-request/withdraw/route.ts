import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

/**
 * GET /api/contact-request/withdraw?token=XXX
 * Patient withdraws their contact request.
 * Sets status to 'withdrawn' and emails the doctor.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token || token.length < 32) {
    return redirectWithStatus('invalid')
  }

  const supabase = createAdminClient()

  // Find the contact request by withdrawal token
  const { data: request } = await (supabase as any)
    .from('contact_requests')
    .select('id, doctor_id, name, status')
    .eq('withdrawal_token', token)
    .single()

  if (!request) {
    return redirectWithStatus('invalid')
  }

  if (request.status === 'withdrawn') {
    return redirectWithStatus('already')
  }

  // Update status to withdrawn
  await (supabase as any)
    .from('contact_requests')
    .update({
      status: 'withdrawn',
      withdrawn_at: new Date().toISOString(),
    })
    .eq('id', request.id)

  // Notify the doctor
  try {
    const { data: doctor } = await supabase
      .from('doctors')
      .select('email, first_name, last_name, clinic_name')
      .eq('id', request.doctor_id)
      .single()

    if (doctor?.email) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      const practiceName = doctor.clinic_name || `Dr. ${doctor.first_name} ${doctor.last_name}`.trim()

      await resend.emails.send({
        from: 'NeuroChiro <support@neurochirodirectory.com>',
        to: doctor.email,
        subject: `Contact request from ${request.name} has been withdrawn`,
        html: `
          <div style="font-family:-apple-system,system-ui,sans-serif;max-width:480px;margin:0 auto;color:#1E2D3B;">
            <p><strong>${request.name}</strong> has withdrawn their contact request to ${practiceName}.</p>
            <p style="font-size:13px;color:#666;">Please do not contact this person. Their consent has been revoked.</p>
          </div>
        `,
      })
    }
  } catch (e) {
    console.warn('[CONTACT_REQUEST] Withdrawal notification email failed:', e)
  }

  return redirectWithStatus('success')
}

function redirectWithStatus(status: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://neurochiro.co'
  return NextResponse.redirect(`${siteUrl}/contact-request/withdrawn?status=${status}`)
}
