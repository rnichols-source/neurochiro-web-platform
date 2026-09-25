/**
 * School email verification for student registration.
 *
 * Flow:
 * 1. Student registers with a school email
 * 2. System checks domain against chiro_schools table
 * 3. If recognized: send verification link to school email
 * 4. If unrecognized: create manual review request
 * 5. Student clicks link → school_verified = true, school_name stored
 * 6. Grace path: once verified, stays verified even after email lapses
 */

import { createAdminClient } from '@/lib/supabase-admin'
import crypto from 'crypto'

export interface SchoolMatch {
  recognized: boolean
  schoolName: string | null
  domain: string
}

/**
 * Check if an email domain matches a recognized chiropractic school.
 */
export async function checkSchoolEmail(email: string): Promise<SchoolMatch> {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return { recognized: false, schoolName: null, domain: '' }

  const supabase = createAdminClient()

  // Check exact domain match
  const { data } = await (supabase as any)
    .from('chiro_schools')
    .select('name, domain')
    .eq('domain', domain)
    .eq('is_active', true)
    .maybeSingle()

  if (data) {
    return { recognized: true, schoolName: data.name, domain }
  }

  // Check if it's a subdomain of a recognized school (e.g. mail.palmer.edu)
  const parts = domain.split('.')
  for (let i = 1; i < parts.length; i++) {
    const parent = parts.slice(i).join('.')
    const { data: parentMatch } = await (supabase as any)
      .from('chiro_schools')
      .select('name, domain')
      .eq('domain', parent)
      .eq('is_active', true)
      .maybeSingle()
    if (parentMatch) {
      return { recognized: true, schoolName: parentMatch.name, domain: parent }
    }
  }

  return { recognized: false, schoolName: null, domain }
}

/**
 * Generate a verification token and store it on the student record.
 */
export async function createVerificationToken(userId: string, schoolEmail: string, schoolName: string): Promise<string> {
  const supabase = createAdminClient()
  const token = crypto.randomBytes(32).toString('hex')

  await (supabase as any).from('students').upsert({
    id: userId,
    school_email: schoolEmail,
    school_name: schoolName,
    verification_token: token,
    school_verified: false,
  }, { onConflict: 'id' })

  return token
}

/**
 * Verify a student's school email using their token.
 * Grace path: once verified, stays verified permanently.
 */
export async function verifySchoolToken(token: string): Promise<{ success: boolean; schoolName?: string; error?: string }> {
  if (!token) return { success: false, error: 'Missing token' }

  const supabase = createAdminClient()

  const { data: student } = await (supabase as any)
    .from('students')
    .select('id, school_name, verification_token, school_verified')
    .eq('verification_token', token)
    .maybeSingle()

  if (!student) return { success: false, error: 'Invalid or expired verification link' }
  if (student.school_verified) return { success: true, schoolName: student.school_name }

  // Mark as verified
  await (supabase as any).from('students').update({
    school_verified: true,
    verified_at: new Date().toISOString(),
    verification_token: null, // consume the token
  }).eq('id', student.id)

  // Also update profiles for display to doctors
  await supabase.from('profiles').update({
    school_verified: true,
    school_name: student.school_name,
  } as any).eq('id', student.id)

  return { success: true, schoolName: student.school_name }
}

/**
 * Create a manual review request for unrecognized school domains.
 */
export async function createSchoolReviewRequest(
  userId: string,
  email: string,
  schoolName: string,
  proofUrl?: string,
): Promise<void> {
  const supabase = createAdminClient()

  await (supabase as any).from('automation_queue').insert({
    event_type: 'school_review_request',
    payload: {
      userId,
      email,
      schoolName,
      domain: email.split('@')[1],
      proofUrl: proofUrl || null,
      requestedAt: new Date().toISOString(),
    },
  })

  // Store the claimed school on the student record (unverified)
  await (supabase as any).from('students').upsert({
    id: userId,
    school_email: email,
    school_name: schoolName + ' (pending review)',
    school_verified: false,
  }, { onConflict: 'id' })
}
