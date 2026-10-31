import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { canPostFree, insertMemberPost } from '@/lib/jobs/posting'
import { LIMIT_MESSAGE } from '@/lib/jobs/posting-pure'

/**
 * POST /api/jobs/checkout
 * Members under the limit post free. Everyone else is sent to /jobs/post.
 * This route no longer creates a $99 Checkout session.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { title, description, employmentType, compensationMin, compensationMax, city, state, whatLookingFor, applyEmail } = body

    if (!title?.trim()) return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
    if (!description?.trim()) return NextResponse.json({ error: 'Description is required.' }, { status: 400 })

    const admin = createAdminClient()
    const { data: doctor } = await admin.from('doctors')
      .select('id, clinic_name, city, state')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!doctor) return NextResponse.json({ error: 'Only doctors can post jobs.' }, { status: 403 })

    const decision = await canPostFree(user.id)
    if (!decision.ok && decision.reason === 'limit') {
      return NextResponse.json({ error: LIMIT_MESSAGE }, { status: 409 })
    }
    if (!decision.ok) {
      return NextResponse.json({ href: '/jobs/post' })
    }

    const posted = await insertMemberPost({
      doctorUserId: user.id,
      title,
      description,
      employmentType,
      salaryMin: Number(compensationMin) || null,
      salaryMax: Number(compensationMax) || null,
      city: city?.trim() || doctor.city || null,
      state: state?.trim() || doctor.state || null,
      clinicName: doctor.clinic_name,
      applyEmail: applyEmail?.trim() || user.email || null,
      whatLookingFor: whatLookingFor?.trim() || null,
    })
    if ('error' in posted) return NextResponse.json({ error: posted.error }, { status: 400 })
    return NextResponse.json({ posted: true, jobId: posted.jobId })
  } catch (err: unknown) {
    console.error('Job post error')
    const message = err instanceof Error ? err.message : 'Post failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
