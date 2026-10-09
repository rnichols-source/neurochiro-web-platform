import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

/**
 * GET /api/contact-request/acknowledge?token=...
 * Validates the token and redirects to the confirmation page.
 * Does NOT mark as acknowledged yet — the confirmation page asks the question.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token || token.length < 32) {
    return redirect('invalid')
  }

  const supabase = createAdminClient()

  const { data: request } = await (supabase as any)
    .from('contact_requests')
    .select('id, status, acknowledged_at, acknowledge_token_expires, contact_outcome')
    .eq('acknowledge_token', token)
    .single()

  if (!request) return redirect('invalid')

  // Already fully confirmed (called the patient)
  if (request.contact_outcome === 'patient_contacted_confirmed') {
    return redirect('already', token)
  }

  // Token expired
  if (request.acknowledge_token_expires && new Date(request.acknowledge_token_expires) < new Date()) {
    return redirect('expired')
  }

  // Withdrawn
  if (request.status === 'withdrawn') return redirect('withdrawn')

  // Valid — send to the confirmation page with the token
  return redirect('confirm', token)
}

/**
 * POST /api/contact-request/acknowledge
 * Records the doctor's response: called or will call.
 */
export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { token, action } = body
  if (!token || !action) {
    return NextResponse.json({ error: 'Missing token or action' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: request } = await (supabase as any)
    .from('contact_requests')
    .select('id, acknowledged_at, contact_outcome, acknowledge_token_expires, status')
    .eq('acknowledge_token', token)
    .single()

  if (!request) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  if (request.status === 'withdrawn') return NextResponse.json({ error: 'Withdrawn' }, { status: 410 })
  if (request.acknowledge_token_expires && new Date(request.acknowledge_token_expires) < new Date()) {
    return NextResponse.json({ error: 'Token expired' }, { status: 410 })
  }

  // Already fully confirmed — idempotent
  if (request.contact_outcome === 'patient_contacted_confirmed') {
    return NextResponse.json({ ok: true, already: true })
  }

  const now = new Date().toISOString()

  if (action === 'called') {
    await (supabase as any)
      .from('contact_requests')
      .update({
        acknowledged_at: request.acknowledged_at || now,
        acknowledged_via: 'email_link',
        contact_outcome: 'patient_contacted_confirmed',
        status: 'acknowledged',
      })
      .eq('id', request.id)
  } else if (action === 'will_call') {
    // Record that they saw it, but keep it open. It comes back in 24h.
    await (supabase as any)
      .from('contact_requests')
      .update({
        acknowledged_at: request.acknowledged_at || now,
        acknowledged_via: 'email_link',
        contact_outcome: 'will_call_today',
        // status stays 'new' so it remains on the overdue list
      })
      .eq('id', request.id)
  }

  return NextResponse.json({ ok: true })
}

function redirect(status: string, token?: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://neurochiro.co'
  const url = new URL(`${siteUrl}/contact-acknowledged`)
  url.searchParams.set('status', status)
  if (token) url.searchParams.set('token', token)
  return NextResponse.redirect(url.toString())
}
