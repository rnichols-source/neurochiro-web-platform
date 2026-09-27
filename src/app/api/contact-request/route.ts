import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getIP } from '@/lib/rate-limit'
import crypto from 'crypto'

/**
 * POST /api/contact-request
 * Patient requests a specific doctor's office to contact them.
 * Requires explicit consent naming the doctor.
 */
export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const { doctorId, name, phone, note, consent, consentText, source } = body

  if (!doctorId) return NextResponse.json({ error: 'Missing doctor.' }, { status: 400 })
  if (!name?.trim()) return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 })
  if (!phone?.trim() || !/^\+?[\d\s\-().]{7,20}$/.test(phone.trim())) {
    return NextResponse.json({ error: 'Please enter a valid phone number.' }, { status: 400 })
  }
  if (!consent) return NextResponse.json({ error: 'You must agree to be contacted.' }, { status: 400 })
  if (!consentText) return NextResponse.json({ error: 'Missing consent text.' }, { status: 400 })

  // Reject notes containing health/medical details
  if (note && /diagnos|symptom|condition|medication|treatment|surgery|pain level|MRI|x-ray|prescription/i.test(note)) {
    return NextResponse.json({ error: 'Please do not include medical or health details in your note. Share those directly with the doctor.' }, { status: 400 })
  }

  const ip = getIP(req)
  const supabase = createAdminClient()
  const withdrawalToken = crypto.randomBytes(32).toString('hex')

  // Verify the doctor exists
  const { data: doctor } = await supabase
    .from('doctors')
    .select('id, first_name, last_name, clinic_name, email, city, state')
    .eq('id', doctorId)
    .eq('verification_status', 'verified')
    .single()

  if (!doctor) return NextResponse.json({ error: 'Doctor not found.' }, { status: 404 })

  // Validate source
  const VALID_SOURCES = ['doctor_joined', 'dm_outreach', 'profile', 'coverage_result']
  const validSource = VALID_SOURCES.includes(source) ? source : 'doctor_joined'

  // Insert contact request
  const { error: insertErr } = await (supabase as any).from('contact_requests').insert({
    doctor_id: doctorId,
    name: name.trim(),
    phone: phone.trim(),
    note: note?.trim() || null,
    consent_text: consentText,
    consented_at: new Date().toISOString(),
    ip,
    status: 'new',
    withdrawal_token: withdrawalToken,
    source: validSource,
  })

  if (insertErr) {
    console.error('[CONTACT_REQUEST] Insert error:', insertErr)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }

  const doctorName = `Dr. ${doctor.first_name} ${doctor.last_name}`.trim()
  const practiceName = doctor.clinic_name || doctorName

  // Email the doctor
  try {
    const doctorEmail = doctor.email
    if (doctorEmail) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'NeuroChiro <support@neurochirodirectory.com>',
        to: doctorEmail,
        subject: `Contact request from ${name.trim()} — wants your office to reach out`,
        html: `
          <div style="font-family:-apple-system,system-ui,sans-serif;max-width:480px;margin:0 auto;color:#1E2D3B;">
            <p><strong>${name.trim()}</strong> found your NeuroChiro profile and is asking your office to contact them.</p>
            <div style="background:#f5f5f5;padding:16px;border-radius:10px;margin:16px 0;">
              <p style="margin:0 0 8px;font-size:14px;"><strong>Name:</strong> ${name.trim()}</p>
              <p style="margin:0 0 8px;font-size:14px;"><strong>Phone:</strong> <a href="tel:${phone.trim()}" style="color:#D66829;font-weight:700;">${phone.trim()}</a></p>
              ${note ? `<p style="margin:0;font-size:14px;"><strong>Note:</strong> ${note.trim()}</p>` : ''}
            </div>
            <p style="font-size:13px;color:#666;">This patient explicitly requested contact from ${practiceName}. Their consent is recorded.</p>
            <p style="margin:24px 0;">
              <a href="https://neurochiro.co/doctor/dashboard" style="display:inline-block;padding:14px 28px;background:#D66829;color:white;text-decoration:none;border-radius:10px;font-weight:700;">View in Dashboard</a>
            </p>
          </div>
        `,
      })
    }
  } catch (e) {
    console.warn('[CONTACT_REQUEST] Doctor email failed (non-blocking):', e)
  }

  // Confirmation email to the patient (using the note's absence of email means we can't email them directly)
  // We don't have the patient's email here. The confirmation will need to come via the page UI.

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://neurochiro.co'
  const withdrawUrl = `${siteUrl}/api/contact-request/withdraw?token=${withdrawalToken}`

  return NextResponse.json({
    ok: true,
    doctorName,
    practiceName,
    withdrawUrl,
  })
}
