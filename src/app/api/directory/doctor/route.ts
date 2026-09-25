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

  const { data: doctor } = await supabase
    .from('doctors')
    .select('id, first_name, last_name, clinic_name, city, state, photo_url, slug')
    .eq('verification_status', 'verified')
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .single()

  if (!doctor) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  return NextResponse.json(doctor)
}
