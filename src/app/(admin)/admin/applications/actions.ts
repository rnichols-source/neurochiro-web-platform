'use server'

import { revalidatePath } from 'next/cache'
import { checkAdminAuth } from '@/lib/admin-auth'
import { stripeBilling } from '@/lib/applications/billing'
import { approveApplication, declineApplication } from '@/lib/applications/decide'
import { ONBOARDING_CALL_URL } from '@/lib/applications/emails'
import { sendApplicationEmail } from '@/lib/applications/notify'
import { loadApplicationById, persistDecision } from '@/lib/applications/store'

async function review(id: string, notes: string, kind: 'approve' | 'decline') {
  const reviewer = await checkAdminAuth()
  const application = await loadApplicationById(id)
  if (!application) return { ok: false, message: 'That application was not found.' }
  const now = new Date().toISOString()
  const billing = stripeBilling()
  const decision = kind === 'approve'
    ? await approveApplication(application, billing, now, notes)
    : await declineApplication(application, billing, now, notes)

  if (decision.application || decision.doctor) {
    await persistDecision({
      applicationId: application.id,
      doctorId: application.doctorId,
      reviewerId: reviewer.id,
      application: decision.application,
      doctor: decision.doctor,
    })
  }

  let emailNote = ''
  if (decision.email) {
    const sent = await sendApplicationEmail(decision.email)
    if (!sent) {
      emailNote = kind === 'approve'
        ? ` The email did not send. Send them this call link: ${ONBOARDING_CALL_URL}`
        : ' The email did not send. Tell them by hand that they were not charged.'
    }
  }

  revalidatePath('/admin/applications')
  revalidatePath('/directory')
  return { ok: decision.ok, message: `${decision.message}${emailNote}` }
}

export async function approveDoctorApplication(id: string, notes: string) {
  try {
    return await review(id, notes, 'approve')
  } catch (error) {
    console.error('[application] approve failed', error instanceof Error ? error.name : 'error')
    return { ok: false, message: 'Could not approve. Check that you are signed in as an admin and try again.' }
  }
}

export async function declineDoctorApplication(id: string, notes: string) {
  try {
    return await review(id, notes, 'decline')
  } catch (error) {
    console.error('[application] decline failed', error instanceof Error ? error.name : 'error')
    return { ok: false, message: 'Could not decline. Nothing was charged. Try again.' }
  }
}
