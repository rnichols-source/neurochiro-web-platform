import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getIP } from '@/lib/rate-limit'
import { createLead } from '@/lib/leads/create-lead'

export const maxDuration = 30

const limiter = rateLimit('appointment', { maxRequests: 3, windowMs: 60_000 })

/**
 * POST /api/appointment
 * Profile-page request. Response shape stays { success: true }.
 * The lead is inserted before any email is sent.
 */
export async function POST(request: NextRequest) {
  const { allowed } = limiter.check(getIP(request))
  if (!allowed) return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })

  try {
    const body = await request.json()
    const { patientName, patientEmail, patientPhone, preferredDate, message, doctorId } = body
    const result = await createLead({
      doctorId,
      name: patientName,
      phone: patientPhone,
      email: patientEmail,
      preferredTime: preferredDate,
      message,
      consentText: 'Patient submitted an appointment request form on neurochiro.co',
      source: 'appointment',
      ip: getIP(request),
    })

    if (!result.ok) {
      const status = result.error === 'Doctor not found.' ? 404 : result.officePhone || result.error?.includes('could not save') ? 500 : 400
      return NextResponse.json({ error: result.error || 'Failed to send request' }, { status })
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      savedForAdmin: result.savedForAdmin,
    })
  } catch (err) {
    console.error('[APPOINTMENT_API] Error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to send request' }, { status: 500 })
  }
}
