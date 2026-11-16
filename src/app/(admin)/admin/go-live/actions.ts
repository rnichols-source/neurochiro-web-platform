'use server'

import { revalidatePath } from 'next/cache'
import { checkAdminAuth } from '@/lib/admin-auth'
import { runDoctorGoLive, type GoLiveSource } from '@/lib/go-live/orchestrator'
import type { GoLiveStep } from '@/lib/go-live/log'

const STEPS: GoLiveStep[] = ['checkout', 'profile', 'portal', 'welcome', 'waitlist', 'instagram', 'summary']

export async function retryGoLiveStep(doctorId: string, step: string, resendWelcome = false): Promise<{ ok: boolean; reason: string }> {
  if (!doctorId || !STEPS.includes(step as GoLiveStep)) return { ok: false, reason: 'Unknown step.' }
  try {
    await checkAdminAuth()
    const results = await runDoctorGoLive({
      doctorId,
      source: 'retry' as GoLiveSource,
      only: [step as GoLiveStep],
      force: true,
      resendWelcome: step === 'welcome' && resendWelcome === true,
    })
    revalidatePath('/admin/go-live')
    revalidatePath('/admin/profile-builds')
    const result = results.find((item) => item.step === step) || results[0]
    return { ok: result?.status !== 'failed', reason: result?.reason || 'Retried.' }
  } catch {
    return { ok: false, reason: 'Retry did not run.' }
  }
}

export async function rebuildDoctorProfile(doctorId: string): Promise<{ ok: boolean; reason: string }> {
  if (!doctorId) return { ok: false, reason: 'Missing doctor.' }
  try {
    await checkAdminAuth()
    const results = await runDoctorGoLive({
      doctorId,
      source: 'rebuild',
      only: ['profile', 'waitlist', 'instagram', 'summary'],
      force: true,
    })
    revalidatePath('/admin/go-live')
    revalidatePath('/admin/profile-builds')
    const profile = results.find((item) => item.step === 'profile')
    return { ok: profile?.status !== 'failed', reason: profile?.reason || 'Rebuilt.' }
  } catch {
    return { ok: false, reason: 'Rebuild did not run.' }
  }
}
