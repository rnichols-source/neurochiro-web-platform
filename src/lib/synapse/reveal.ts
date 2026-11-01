import 'server-only'
import { createAdminClient } from '@/lib/supabase-admin'
import { getMembership } from '@/lib/portal/membership-load'
import { asLooseDb, asRow } from './loose-db.ts'

type PerkCodeRow = {
  id: string
  vendor_id: string
  code: string | null
  active: boolean
  audience: string | null
}

function payingDoctor(status: string, tier: string): boolean {
  return tier !== 'free' && (status === 'active' || status === 'trialing')
}

/** Returns the perk code only after the caller is allowed to see it. */
export async function revealPerkForUser(userId: string, perkId: string, audience: 'doctor' | 'student'): Promise<{ code: string } | { error: string }> {
  if (audience === 'doctor') {
    const membership = await getMembership(userId)
    if (!payingDoctor(membership.status, membership.tier)) {
      return { error: 'An active membership is required to reveal a member code.' }
    }
  }

  const admin = asLooseDb(createAdminClient())
  const { data, error } = await admin.from('vendor_perks').select('id, vendor_id, code, active, audience').eq('id', perkId).maybeSingle()
  if (error) return { error: 'This perk is not available yet.' }
  const perk = asRow<PerkCodeRow>(data)
  if (!perk?.active || !perk.code) return { error: 'This perk is not available.' }
  const perkAudience = perk.audience || 'doctor'
  if (audience === 'student' && perkAudience !== 'student' && perkAudience !== 'both') {
    return { error: 'This perk is for doctor members.' }
  }
  if (audience === 'doctor' && perkAudience === 'student') {
    return { error: 'This perk is for students.' }
  }

  const usage = await admin.from('vendor_usage').insert({ vendor_id: perk.vendor_id, doctor_user_id: userId })
  if (usage.error && usage.error.code !== '23505') {
    return { error: 'Could not record that you opened this perk.' }
  }
  return { code: perk.code }
}
