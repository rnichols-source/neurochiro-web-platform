'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function deleteAccount() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()
  // Delete profile data
  await admin.from('profiles').delete().eq('id', user.id)
  // Delete auth user
  await admin.auth.admin.deleteUser(user.id)

  return { success: true }
}
