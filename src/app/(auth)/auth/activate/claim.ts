'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { createServerSupabase } from '@/lib/supabase-server'

/**
 * After the emailed recovery link is verified, attach the listing to that login.
 * A session alone is not enough: the pending id is set only by the server, and the
 * doctor email must match the confirmed auth email.
 */
export async function finishListingClaim(): Promise<void> {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) return
  const admin = createAdminClient()
  const full = await admin.auth.admin.getUserById(user.id)
  const record = full.data.user
  if (!record?.email) return
  const confirmed = Boolean(record.email_confirmed_at || record.confirmed_at)
  if (!confirmed) return
  const pending = record.app_metadata?.pending_listing_doctor_id
  if (typeof pending !== 'string' || !pending) return

  const doctors = admin.from('doctors') as any
  const found = await doctors.select('id, email, user_id').eq('id', pending).maybeSingle()
  const doctor = found.data as { id?: string; email?: string; user_id?: string | null } | null
  if (!doctor?.id) return
  if ((doctor.email || '').trim().toLowerCase() !== record.email.trim().toLowerCase()) return
  if (doctor.user_id && doctor.user_id !== record.id) return
  if (!doctor.user_id) {
    const linked = await doctors.update({ user_id: record.id }).eq('id', doctor.id).is('user_id', null)
    if (linked.error) return
  }
  await (admin.from('profiles') as any).upsert({
    id: record.id,
    email: record.email,
    full_name: typeof record.user_metadata?.full_name === 'string' ? record.user_metadata.full_name : '',
    role: 'doctor',
    tier: 'pro',
  })
  const meta = { ...(record.app_metadata || {}) }
  delete meta.pending_listing_doctor_id
  await admin.auth.admin.updateUserById(record.id, { app_metadata: meta })
}
