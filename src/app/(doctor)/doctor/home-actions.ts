'use server'

import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerSupabase } from '@/lib/supabase-server'
import { isMissingColumn } from '@/lib/leads/schema'

export async function skipProfileStep() {
  const jar = await cookies()
  jar.set('nc_doctor_skip_profile', '1', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 18,
  })
}

export async function dismissGettingStarted() {
  const jar = await cookies()
  jar.set('nc_getting_started_dismissed', '1', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const admin = createAdminClient() as any
  const doctor = await admin.from('doctors').select('id').eq('user_id', user.id).maybeSingle()
  if (!doctor.data?.id) return
  const saved = await admin.from('doctors').update({ getting_started_dismissed_at: new Date().toISOString() }).eq('id', doctor.data.id)
  if (isMissingColumn(saved.error)) return
}
