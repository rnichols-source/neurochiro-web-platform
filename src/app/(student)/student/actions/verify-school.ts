'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { checkSchoolEmail, createVerificationToken, createSchoolReviewRequest } from '@/lib/school-verification'

/**
 * Send a verification email to the student's school address.
 * Called from the student dashboard or profile.
 */
export async function sendSchoolVerification(schoolEmail: string) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!schoolEmail || !schoolEmail.includes('@')) {
    return { error: 'Please enter a valid email address.' }
  }

  // Check domain
  const match = await checkSchoolEmail(schoolEmail)

  if (!match.recognized) {
    return {
      error: 'unrecognized_domain',
      domain: match.domain,
      message: `We don't recognize @${match.domain} as a chiropractic school email. If this is your school email, use the "My school isn't listed" option.`,
    }
  }

  // Generate token and store
  const token = await createVerificationToken(user.id, schoolEmail, match.schoolName!)

  // Send verification email
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://neurochiro.co'}/api/verify-school?token=${token}`

    await resend.emails.send({
      from: 'NeuroChiro <support@neurochirodirectory.com>',
      to: schoolEmail,
      subject: 'Verify your school email — NeuroChiro',
      html: `
        <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 480px; margin: 0 auto; color: #1E2D3B;">
          <p>Hi,</p>
          <p>Click below to verify your <strong>${match.schoolName}</strong> email and complete your NeuroChiro student profile.</p>
          <p style="margin: 24px 0;">
            <a href="${verifyUrl}" style="display: inline-block; padding: 14px 28px; background: #D66829; color: white; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px;">Verify My School Email</a>
          </p>
          <p style="color: #999; font-size: 12px;">This link expires in 7 days. If you didn't request this, ignore this email.</p>
          <p style="margin-top: 32px; color: #666; font-size: 13px;">NeuroChiro<br/>neurochiro.co</p>
        </div>
      `,
    })
  } catch (e) {
    console.error('Verification email error:', e)
    return { error: 'Failed to send verification email. Please try again.' }
  }

  return { success: true, schoolName: match.schoolName }
}

/**
 * Submit a manual review request when school domain isn't recognized.
 */
export async function requestSchoolReview(schoolName: string, schoolEmail: string) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!schoolName?.trim() || !schoolEmail?.trim()) {
    return { error: 'Please provide both your school name and school email.' }
  }

  await createSchoolReviewRequest(user.id, schoolEmail, schoolName)

  return { success: true }
}

/**
 * Get current verification status for the logged-in student.
 */
export async function getVerificationStatus() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await (supabase as any)
    .from('students')
    .select('school_verified, school_name, school_email, graduation_year, verified_at')
    .eq('id', user.id)
    .maybeSingle()

  // Also check profiles for grandfathered students
  if (!data) {
    const { data: profile } = await supabase.from('profiles')
      .select('school_verified, school_name')
      .eq('id', user.id)
      .single()
    if ((profile as any)?.school_verified) {
      return {
        verified: true,
        schoolName: (profile as any).school_name || 'Verified',
        schoolEmail: null,
        graduationYear: null,
      }
    }
    return { verified: false, schoolName: null, schoolEmail: null, graduationYear: null }
  }

  return {
    verified: data.school_verified || false,
    schoolName: data.school_name || null,
    schoolEmail: data.school_email || null,
    graduationYear: data.graduation_year || null,
  }
}

/**
 * Update graduation year on student profile.
 */
export async function updateGraduationYear(year: number) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (year < 2020 || year > 2035) return { error: 'Please enter a valid graduation year.' }

  const { createAdminClient } = await import('@/lib/supabase-admin')
  const admin = createAdminClient()
  await (admin as any).from('students').upsert({
    id: user.id,
    graduation_year: year,
  }, { onConflict: 'id' })

  return { success: true }
}
