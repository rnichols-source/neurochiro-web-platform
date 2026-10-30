import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { rateLimit, getIP } from '@/lib/rate-limit'
import { createLead } from '@/lib/leads/create-lead'

export const maxDuration = 30

const limiter = rateLimit('contact-request', { maxRequests: 3, windowMs: 60_000 })
const VALID_SOURCES = ['doctor_joined', 'dm_outreach', 'profile', 'coverage_result']

/**
 * POST /api/contact-request
 * Instagram DM and doctor-joined link target. Response shape stays { ok, doctorName, practiceName, withdrawUrl }.
 */
export async function POST(req: NextRequest) {
  const ip = getIP(req)
  const { allowed } = limiter.check(ip)
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const { doctorId, name, phone, email, note, consent, consentText, source, joinList, _hp } = body
  if (_hp) {
    return NextResponse.json({ ok: true, doctorName: '', practiceName: '', withdrawUrl: '' })
  }
  if (!consent) return NextResponse.json({ error: 'You must agree to be contacted.' }, { status: 400 })
  if (!consentText) return NextResponse.json({ error: 'Missing consent text.' }, { status: 400 })

  const validSource = VALID_SOURCES.includes(source) ? source : 'doctor_joined'
  const result = await createLead({
    doctorId,
    name,
    phone,
    email,
    message: typeof note === 'string' ? note : '',
    consentText,
    source: validSource,
    ip,
  })

  if (!result.ok) {
    const status = result.error === 'Doctor not found.' ? 404 : result.officePhone || result.error?.includes('could not save') ? 500 : 400
    return NextResponse.json({ error: result.error || 'Something went wrong. Please try again.' }, { status })
  }

  if (joinList && result.ok && email && typeof email === 'string' && email.trim()) {
    try {
      const supabase = createAdminClient() as any
      const normalizedEmail = email.trim().toLowerCase()
      const { data: existingSub } = await supabase.from('subscribers').select('id').eq('email', normalizedEmail).maybeSingle()
      if (!existingSub) {
        await supabase.from('subscribers').insert({
          email: normalizedEmail,
          status: 'pending',
          source: 'contact_request',
          ip,
        })
      }
    } catch (err) {
      console.warn('[CONTACT_REQUEST] List opt-in failed (non-blocking):', err instanceof Error ? err.message : err)
    }
  }

  return NextResponse.json({
    ok: true,
    doctorName: result.doctorName,
    practiceName: result.practiceName,
    withdrawUrl: result.withdrawUrl,
    message: result.message,
    savedForAdmin: result.savedForAdmin,
  })
}
