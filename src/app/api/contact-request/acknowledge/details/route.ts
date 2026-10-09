import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

/**
 * GET /api/contact-request/acknowledge/details?token=...
 * Returns patient name, phone, note for the confirmation page.
 * Token serves as auth — only someone with the token can see the data.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token || token.length < 32) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data } = await (supabase as any)
    .from('contact_requests')
    .select('name, phone, note')
    .eq('acknowledge_token', token)
    .single()

  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ name: data.name, phone: data.phone, note: data.note || '' })
}
