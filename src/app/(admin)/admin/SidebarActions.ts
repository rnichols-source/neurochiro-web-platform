'use server'

import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase-server'
import { checkAdminAuth } from '@/lib/admin-auth'

export async function logoutAdmin() {
  try {
    await checkAdminAuth()
  } catch {
    // A signed-in person who is not staff can still end their own session.
  }
  const supabase = createServerSupabase()
  await supabase.auth.signOut()
  const jar = await cookies()
  jar.set('nc_demo_role', '', { path: '/', maxAge: 0 })
  return { success: true }
}
