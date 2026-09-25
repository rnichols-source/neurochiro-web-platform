import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

/**
 * POST /api/jobs/apply
 * Verified students apply to job postings.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Please log in to apply.' }, { status: 401 })

    const body = await request.json()
    const { jobId, note } = body

    if (!jobId) return NextResponse.json({ error: 'Missing job ID.' }, { status: 400 })

    const admin = createAdminClient()

    // Verify the job exists and is active
    const { data: job } = await (admin as any).from('job_postings')
      .select('id, title, doctor_id, status, expires_at, apply_email')
      .eq('id', jobId)
      .single()

    if (!job) return NextResponse.json({ error: 'Job not found.' }, { status: 404 })
    if (job.status !== 'Active') return NextResponse.json({ error: 'This position is no longer accepting applications.' }, { status: 400 })
    if (job.expires_at && new Date(job.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This position has expired.' }, { status: 400 })
    }

    // Verify the applicant is a student
    const { data: profile } = await (admin as any).from('profiles')
      .select('full_name, email, role, school_verified, school_name')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'student') {
      return NextResponse.json({ error: 'Only students can apply to job postings.' }, { status: 403 })
    }

    // Get student details
    const { data: student } = await (admin as any).from('students')
      .select('school_name, graduation_year, school_verified')
      .eq('id', user.id)
      .maybeSingle()

    const schoolVerified = student?.school_verified || (profile as any).school_verified || false
    const schoolName = student?.school_name || (profile as any).school_name || null
    const gradYear = student?.graduation_year || null

    // Check for duplicate application
    const { data: existing } = await (admin as any).from('job_applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('applicant_id', user.id)
      .maybeSingle()

    if (existing) return NextResponse.json({ error: 'You have already applied to this position.' }, { status: 400 })

    // Create application
    const { error: insertErr } = await (admin as any).from('job_applications').insert({
      job_id: jobId,
      applicant_id: user.id,
      applicant_name: profile.full_name || 'Student',
      applicant_email: profile.email,
      note: note?.trim() || null,
      school_name: schoolName,
      graduation_year: gradYear,
      school_verified: schoolVerified,
      is_legacy: false,
      stage: 'new',
    })

    if (insertErr) {
      console.error('Application insert error:', insertErr)
      return NextResponse.json({ error: 'Failed to submit application.' }, { status: 500 })
    }

    // Email the doctor about the new application
    try {
      if (job.apply_email) {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        const schoolLine = schoolVerified && schoolName
          ? `<p style="color: #22c55e; font-size: 12px; font-weight: 700;">✓ Verified: ${schoolName}${gradYear ? `, Class of ${gradYear}` : ''}</p>`
          : schoolName
          ? `<p style="color: #999; font-size: 12px;">${schoolName}${gradYear ? `, Class of ${gradYear}` : ''}</p>`
          : ''

        await resend.emails.send({
          from: 'NeuroChiro Jobs <support@neurochirodirectory.com>',
          to: job.apply_email,
          subject: `New application for "${job.title}" — ${profile.full_name}`,
          html: `
            <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 480px; margin: 0 auto; color: #1E2D3B;">
              <p><strong>${profile.full_name}</strong> applied to your job posting <strong>"${job.title}"</strong>.</p>
              ${schoolLine}
              ${note ? `<div style="background: #f5f5f5; padding: 16px; border-radius: 10px; margin: 16px 0;"><p style="font-size: 13px; color: #333; margin: 0;">"${note.trim()}"</p></div>` : ''}
              <p style="margin: 24px 0;">
                <a href="https://neurochiro.co/doctor/jobs" style="display: inline-block; padding: 14px 28px; background: #D66829; color: white; text-decoration: none; border-radius: 10px; font-weight: 700;">View Application</a>
              </p>
              <p style="color: #999; font-size: 12px;">You can message this applicant directly from your NeuroChiro dashboard.</p>
            </div>
          `,
        })
      }
    } catch (emailErr) {
      console.warn('Application notification email failed (non-blocking):', emailErr)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Job application error:', err)
    return NextResponse.json({ error: err.message || 'Application failed.' }, { status: 500 })
  }
}
