'use server'

import { revalidatePath } from 'next/cache'
import { checkAdminAuth } from '@/lib/admin-auth'
import { profileDb } from '@/lib/profile-build/db'

export async function requeueProfileBuild(jobId: string): Promise<{ ok: boolean }> {
  if (!jobId) return { ok: false }
  try {
    await checkAdminAuth()
    const admin = profileDb()
    const now = new Date().toISOString()
    const { error } = await admin
      .from('profile_build_jobs')
      .update({
        status: 'pending',
        attempts: 0,
        last_error: null,
        next_run_at: now,
        finished_at: null,
        started_at: null,
        updated_at: now,
      })
      .eq('id', jobId)
      .in('status', ['failed', 'pending'])
    revalidatePath('/admin/profile-builds')
    revalidatePath('/admin')
    return { ok: !error }
  } catch {
    return { ok: false }
  }
}
