'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { createServerSupabase } from '@/lib/supabase-server'

export async function getMyJobApplicationStages(): Promise<{ job_id: string; stage: string | null }[]> {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  if (!/^[0-9a-f-]{36}$/i.test(user.id)) return []

  const admin = createAdminClient()
  const primary = await admin
    .from('job_applications')
    .select('job_id, stage')
    .or(`applicant_id.eq.${user.id},student_user_id.eq.${user.id}`)
  if (!primary.error) {
    return (primary.data || []) as unknown as { job_id: string; stage: string | null }[]
  }

  const fallback = await admin
    .from('job_applications')
    .select('job_id, stage')
    .eq('applicant_id', user.id)
  return ((fallback.data || []) as unknown as { job_id: string; stage?: string | null }[]).map((row) => ({
    job_id: row.job_id,
    stage: row.stage ?? null,
  }))
}
