'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { dismissBanner } from '@/lib/member-referrals/db'
import { selectedDoctorIdFor } from '@/lib/portal/selected-doctor'

export async function dismissMemberReferralBanner(): Promise<void> {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const doctorId = await selectedDoctorIdFor(user.id)
  if (!doctorId) return
  await dismissBanner(doctorId, user.id)
}
