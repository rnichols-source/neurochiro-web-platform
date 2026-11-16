'use server'

import { revalidatePath } from 'next/cache'
import { checkAdminAuth } from '@/lib/admin-auth'
import { profileDb } from '@/lib/profile-build/db'
import { runDoctorGoLive } from '@/lib/go-live/orchestrator'

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

export async function rebuildProfile(doctorId: string): Promise<{ ok: boolean; reason: string }> {
  if (!doctorId) return { ok: false, reason: 'Missing doctor.' }
  try {
    await checkAdminAuth()
    const results = await runDoctorGoLive({
      doctorId,
      source: 'rebuild',
      only: ['profile', 'waitlist', 'instagram', 'summary'],
      force: true,
    })
    revalidatePath('/admin/profile-builds')
    revalidatePath('/admin/go-live')
    const profile = results.find((item) => item.step === 'profile')
    return { ok: profile?.status !== 'failed', reason: profile?.reason || 'Rebuilt.' }
  } catch {
    return { ok: false, reason: 'Rebuild did not run.' }
  }
}
