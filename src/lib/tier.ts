'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import type { DoctorTier } from '@/types/auth'

/**
 * Fetches the authenticated doctor's membership tier from the database.
 * Returns 'starter' if no doctor record exists or user is not authenticated.
 */
export async function getDoctorTier(): Promise<{ tier: DoctorTier; isAdmin: boolean }> {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { tier: 'starter', isAdmin: false }

  const [profileRes, doctorRes] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase.from('doctors').select('membership_tier').eq('user_id', user.id).single()
  ])

  const role = profileRes.data?.role || 'doctor'
  const isAdmin = ['admin', 'super_admin', 'founder', 'regional_admin'].includes(role)
  const tier = (doctorRes.data?.membership_tier as DoctorTier) || 'starter'

  return { tier: isAdmin ? 'pro' : tier, isAdmin }
}

/**
 * Server-side tier gate. Call this at the top of any server action
 * that requires a minimum tier. Throws if the user doesn't meet the requirement.
 */
export async function requireTier(minimumTier: DoctorTier): Promise<DoctorTier> {
  const { tier, isAdmin } = await getDoctorTier()

  if (isAdmin) return tier // Admins bypass all tier restrictions

  const tierRank: Record<DoctorTier, number> = { starter: 1, growth: 2, pro: 3 }

  if (tierRank[tier] < tierRank[minimumTier]) {
    throw new Error(`This feature requires a ${minimumTier} membership or higher.`)
  }

  return tier
}
