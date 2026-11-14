'use server'

import { revalidatePath } from 'next/cache'
import { checkAdminAuth } from '@/lib/admin-auth'
import { stripeBilling } from '@/lib/applications/billing'
import { approveApplication, declineApplication } from '@/lib/applications/decide'
import { loadApplicationById } from '@/lib/applications/store'
import { finishDecision } from '@/lib/go-live/finish'

async function review(id: string, notes: string, kind: 'approve' | 'decline') {
  const reviewer = await checkAdminAuth()
  const application = await loadApplicationById(id)
  if (!application) return { ok: false, message: 'That application was not found.', warning: '' }
  const now = new Date().toISOString()
  const billing = stripeBilling()
  const decision = kind === 'approve'
    ? await approveApplication(application, billing, now, notes)
    : await declineApplication(application, billing, now, notes)

  const finished = await finishDecision({
    application,
    decision,
    reviewerId: reviewer.id,
  })

  revalidatePath('/admin/applications')
  revalidatePath('/directory')
  return { ok: finished.ok, message: finished.message, warning: '' }
}

export async function approveDoctorApplication(id: string, notes: string) {
  try {
    return await review(id, notes, 'approve')
  } catch (error) {
    console.error('[application] approve failed', error instanceof Error ? error.name : 'error')
    return { ok: false, message: 'Could not approve. Check that you are signed in as an admin and try again.', warning: '' }
  }
}

export async function declineDoctorApplication(id: string, notes: string) {
  try {
    return await review(id, notes, 'decline')
  } catch (error) {
    console.error('[application] decline failed', error instanceof Error ? error.name : 'error')
    return { ok: false, message: 'Could not decline. Nothing was charged. Try again.', warning: '' }
  }
}
