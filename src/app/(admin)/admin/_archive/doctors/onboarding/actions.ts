'use server'

import { createAdminClient, fetchAllRows } from '@/lib/supabase-admin'
import { checkAdminAuth } from '@/lib/admin-auth'
import { unstable_noStore as noStore } from 'next/cache'
import {
  sendPaymentReceivedEmail,
  sendJoinPacketEmail,
  sendProfileLiveEmail,
  sendPostCallEmail,
  sendNudgeAgreementEmail,
  sendNudgeCallEmail,
  type OnboardingDoctor,
} from '@/lib/onboarding-emails'

// ── Types ──

export type OnboardingStatus = 'not_started' | 'paid' | 'profile_live' | 'call_booked' | 'call_done' | 'complete'

export type EmailType =
  | 'payment_received'
  | 'join_packet'
  | 'profile_live'
  | 'post_call'
  | 'nudge_agreement'
  | 'nudge_call'

export interface OnboardingDoctorRow {
  id: string
  first_name: string
  last_name: string
  email: string
  clinic_name: string | null
  city: string | null
  state: string | null
  country: string | null
  specialties: string[] | null
  slug: string | null
  photo_url: string | null
  membership_tier: string | null
  onboarding_status: OnboardingStatus
  agreement_signed_at: string | null
  onboarding_call_booked_at: string | null
  onboarding_call_done_at: string | null
  profile_built_at: string | null
  onboarding_completed_at: string | null
  last_onboarding_email_sent_at: string | null
  last_onboarding_email_type: string | null
  created_at: string
}

// ── Queries ──

const SELECT_FIELDS = 'id, first_name, last_name, email, clinic_name, city, state, country, specialties, slug, photo_url, membership_tier, onboarding_status, agreement_signed_at, onboarding_call_booked_at, onboarding_call_done_at, profile_built_at, onboarding_completed_at, last_onboarding_email_sent_at, last_onboarding_email_type, created_at'

export async function getOnboardingDoctors(): Promise<OnboardingDoctorRow[]> {
  noStore()
  await checkAdminAuth()

  const supabase = createAdminClient()
  const rows = await fetchAllRows(
    supabase,
    'doctors',
    SELECT_FIELDS,
    (q: any) => q.neq('onboarding_status', 'complete'),
    'created_at',
    false, // newest first
  )

  return rows as OnboardingDoctorRow[]
}

// ── Status Updates ──

export async function updateOnboardingStatus(
  doctorId: string,
  newStatus: OnboardingStatus,
  additionalFields?: Record<string, any>,
): Promise<{ success: boolean; error?: string }> {
  await checkAdminAuth()

  const supabase = createAdminClient()

  const updates: Record<string, any> = {
    onboarding_status: newStatus,
    ...additionalFields,
  }

  // Auto-set timestamps based on status
  if (newStatus === 'call_booked' && !additionalFields?.onboarding_call_booked_at) {
    updates.onboarding_call_booked_at = new Date().toISOString()
  }
  if (newStatus === 'call_done' && !additionalFields?.onboarding_call_done_at) {
    updates.onboarding_call_done_at = new Date().toISOString()
  }
  if (newStatus === 'complete' && !additionalFields?.onboarding_completed_at) {
    updates.onboarding_completed_at = new Date().toISOString()
  }

  // Cast to any — new onboarding columns are not yet in generated types
  const { error } = await (supabase.from('doctors') as any)
    .update(updates)
    .eq('id', doctorId)

  if (error) {
    console.error('[onboarding] Status update error:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function markAgreementSigned(doctorId: string): Promise<{ success: boolean; error?: string }> {
  await checkAdminAuth()
  const supabase = createAdminClient()

  // Cast to any — new onboarding columns are not yet in generated types
  const { error } = await (supabase.from('doctors') as any)
    .update({ agreement_signed_at: new Date().toISOString() })
    .eq('id', doctorId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ── Email Triggers ──

export async function triggerOnboardingEmail(
  doctorId: string,
  emailType: EmailType,
): Promise<{ success: boolean; error?: string }> {
  await checkAdminAuth()

  const supabase = createAdminClient()

  // Fetch doctor data — cast to any, new onboarding columns not in generated types
  const { data: doctor, error: fetchError } = await (supabase.from('doctors') as any)
    .select(SELECT_FIELDS)
    .eq('id', doctorId)
    .single()

  if (fetchError || !doctor) {
    return { success: false, error: fetchError?.message || 'Doctor not found' }
  }

  const doc: OnboardingDoctor = {
    first_name: doctor.first_name,
    last_name: doctor.last_name,
    clinic_name: doctor.clinic_name,
    city: doctor.city,
    state: doctor.state,
    country: doctor.country,
    specialties: doctor.specialties,
    slug: doctor.slug,
    photo_url: doctor.photo_url,
    email: doctor.email,
    agreement_signed_at: doctor.agreement_signed_at,
    onboarding_call_booked_at: doctor.onboarding_call_booked_at,
  }

  // Dispatch to correct email function
  let result: { success: boolean; error?: string }

  switch (emailType) {
    case 'payment_received':
      result = await sendPaymentReceivedEmail(doc)
      break
    case 'join_packet':
      result = await sendJoinPacketEmail(doc)
      break
    case 'profile_live':
      result = await sendProfileLiveEmail(doc)
      break
    case 'post_call':
      result = await sendPostCallEmail(doc)
      break
    case 'nudge_agreement':
      result = await sendNudgeAgreementEmail(doc)
      break
    case 'nudge_call':
      result = await sendNudgeCallEmail(doc)
      break
    default:
      return { success: false, error: `Unknown email type: ${emailType}` }
  }

  // Record the send — cast to any, new onboarding columns not in generated types
  if (result.success) {
    await (supabase.from('doctors') as any)
      .update({
        last_onboarding_email_sent_at: new Date().toISOString(),
        last_onboarding_email_type: emailType,
      })
      .eq('id', doctorId)
  }

  return result
}
