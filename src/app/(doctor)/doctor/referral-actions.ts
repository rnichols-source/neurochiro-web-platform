'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { dismissBanner } from '@/lib/member-referrals/db'

export async function dismissMemberReferralBanner(): Promise<void> {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const admin = createAdminClient()
  const { data: doctor } = await admin.from('doctors').select('id').eq('user_id', user.id).maybeSingle()
  if (!doctor?.id) return
  await dismissBanner(doctor.id, user.id)
}
