import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

/**
 * GET /api/contact-request/acknowledge?token=...
 * One-tap acknowledgment from doctor. No login required.
 * Token is single-purpose, tied to one contact request, expires after 30 days.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token || token.length < 32) {
    return redirectWithStatus('invalid')
  }

  const supabase = createAdminClient()

  // Look up the contact request by token
  const { data: request } = await (supabase as any)
    .from('contact_requests')
    .select('id, name, phone, note, status, acknowledged_at, acknowledge_token_expires, doctor_id')
    .eq('acknowledge_token', token)
    .single()

  if (!request) {
    return redirectWithStatus('invalid')
  }

  // Already acknowledged — show the same confirmation (idempotent)
  if (request.acknowledged_at) {
    return redirectWithStatus('already', request.id)
  }

  // Token expired
  if (request.acknowledge_token_expires && new Date(request.acknowledge_token_expires) < new Date()) {
    return redirectWithStatus('expired')
  }

  // Withdrawn by patient
  if (request.status === 'withdrawn') {
    return redirectWithStatus('withdrawn')
  }

  // Acknowledge it
  await (supabase as any)
    .from('contact_requests')
    .update({
      acknowledged_at: new Date().toISOString(),
      acknowledged_via: 'email_link',
      status: 'acknowledged',
    })
    .eq('id', request.id)

  return redirectWithStatus('success', request.id)
}

function redirectWithStatus(status: string, requestId?: string) {
  const url = new URL('https://neurochiro.co/contact-acknowledged')
  url.searchParams.set('status', status)
  if (requestId) url.searchParams.set('id', requestId)
  return NextResponse.redirect(url.toString())
}
