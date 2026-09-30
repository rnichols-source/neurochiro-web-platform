import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

/**
 * GET /api/directory/doctor?slug=SLUG
 * Returns minimal doctor info for the contact request page.
 */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Missing slug.' }, { status: 400 })

  const supabase = createAdminClient()

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)

  let query = supabase
    .from('doctors')
    .select('id, first_name, last_name, clinic_name, city, state, photo_url, slug')
    .eq('verification_status', 'verified')

  if (isUuid) {
    query = query.eq('id', slug)
  } else {
    query = query.eq('slug', slug)
  }

  const { data: doctor } = await query.single()

  if (!doctor) {
    // Check for slug redirect
    const { data: redir } = await (supabase as any)
      .from('slug_redirects')
      .select('new_slug')
      .eq('old_slug', slug)
      .maybeSingle()
    if (redir?.new_slug) {
      // Re-fetch with the new slug
      const { data: redirected } = await supabase
        .from('doctors')
        .select('id, first_name, last_name, clinic_name, city, state, photo_url, slug')
        .eq('verification_status', 'verified')
        .eq('slug', redir.new_slug)
        .single()
      if (redirected) return NextResponse.json(redirected)
    }
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }

  return NextResponse.json(doctor)
}
