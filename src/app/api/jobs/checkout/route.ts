import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

/**
 * POST /api/jobs/checkout
 * Creates a draft job posting and redirects to Stripe checkout.
 * On payment success, the webhook activates the post.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { title, description, employmentType, compensationMin, compensationMax, compensationType, city, state, whatLookingFor, applyEmail } = body

    // Validate required fields
    if (!title?.trim()) return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
    if (!description?.trim()) return NextResponse.json({ error: 'Description is required.' }, { status: 400 })
    if (!compensationMin || !compensationMax) return NextResponse.json({ error: 'Compensation range is required.' }, { status: 400 })
    if (compensationMin < 0 || compensationMax < compensationMin) return NextResponse.json({ error: 'Invalid compensation range.' }, { status: 400 })

    const admin = createAdminClient()

    // Verify the user is a verified doctor
    const { data: doctor } = await admin.from('doctors')
      .select('id, first_name, last_name, clinic_name, city, state, verification_status')
      .eq('user_id', user.id)
      .eq('verification_status', 'verified')
      .maybeSingle()

    if (!doctor) return NextResponse.json({ error: 'Only verified doctors can post jobs.' }, { status: 403 })

    // Create draft job posting
    const { data: job, error: insertError } = await (admin as any).from('job_postings').insert({
      doctor_id: user.id,
      title: title.trim(),
      description: description.trim(),
      employment_type: employmentType || 'Full-time',
      compensation_min: compensationMin,
      compensation_max: compensationMax,
      compensation_type: compensationType || 'salary',
      city: city?.trim() || doctor.city || null,
      state: state?.trim() || doctor.state || null,
      what_looking_for: whatLookingFor?.trim() || null,
      apply_email: applyEmail?.trim() || user.email || null,
      status: 'Draft',
      is_paid: false,
    }).select('id').single()

    if (insertError || !job) {
      console.error('Job insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create job posting.' }, { status: 500 })
    }

    // Create Stripe checkout session
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Job Posting — 30 Days',
            description: `"${title.trim()}" on NeuroChiro Job Board`,
          },
          unit_amount: 9900, // $99.00
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://neurochiro.co'}/doctor/jobs?posted=success&job_id=${job.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://neurochiro.co'}/doctor/jobs?posted=cancelled`,
      metadata: {
        job_posting_id: job.id,
        doctor_user_id: user.id,
        type: 'job_posting',
      },
      customer_email: user.email || undefined,
    })

    return NextResponse.json({ checkoutUrl: session.url, jobId: job.id })
  } catch (err: any) {
    console.error('Job checkout error:', err)
    return NextResponse.json({ error: err.message || 'Checkout failed.' }, { status: 500 })
  }
}
