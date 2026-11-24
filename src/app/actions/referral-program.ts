'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { readSelectedDoctor } from '@/lib/portal/selected-doctor'

export async function getOrCreateReferralCode() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // Check if doctor already has a referral code
  const { data: doctor } = await readSelectedDoctor<{
    id: string
    first_name?: string | null
    last_name?: string | null
    referral_code?: string | null
  }>(user.id, 'id, first_name, last_name, referral_code')

  if (!doctor) throw new Error("Doctor profile not found")

  if (doctor.referral_code) {
    return { code: doctor.referral_code, doctorName: `${doctor.first_name} ${doctor.last_name}` }
  }

  // Generate a unique referral code
  const code = `NC-${doctor.first_name?.substring(0, 2).toUpperCase()}${doctor.last_name?.substring(0, 2).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

  const adminClient = createAdminClient()
  await adminClient
    .from('doctors')
    .update({ referral_code: code })
    .eq('id', doctor.id)

  return { code, doctorName: `${doctor.first_name} ${doctor.last_name}` }
}

export async function getReferralStats() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: doctor } = await readSelectedDoctor<{ id: string; referral_code?: string | null }>(user.id, 'id, referral_code')

  if (!doctor?.referral_code) return { code: null, invites: 0, signups: 0, monthsFree: 0 }

  // Count how many doctors signed up with this referral code
  const adminClient = createAdminClient()
  const { count } = await adminClient
    .from('doctors')
    .select('*', { count: 'exact', head: true })
    .eq('referred_by', doctor.referral_code)

  const signups = count || 0

  return {
    code: doctor.referral_code,
    invites: 0, // Could track invite sends
    signups,
    monthsFree: signups, // 1 month free per signup
  }
}

export async function lookupReferralCode(code: string) {
  const adminClient = createAdminClient()

  const { data: doctor } = await adminClient
    .from('doctors')
    .select('first_name, last_name, clinic_name, city, state, photo_url')
    .eq('referral_code', code)
    .single()

  if (!doctor) return null

  return {
    name: `Dr. ${doctor.first_name} ${doctor.last_name}`,
    clinic: doctor.clinic_name,
    location: `${doctor.city || ''}${doctor.state ? `, ${doctor.state}` : ''}`,
    photo: doctor.photo_url,
  }
}
