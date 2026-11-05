'use server'

import { revalidatePath } from 'next/cache'
import { checkAdminAuth } from '@/lib/admin-auth'
import { deliverApprovalNotices } from '@/lib/applications/approval-sms'
import { stripeBilling } from '@/lib/applications/billing'
import { approveApplication, declineApplication } from '@/lib/applications/decide'
import { sendApplicationEmail } from '@/lib/applications/notify'
import { loadApplicationById, persistDecision, saveDoctorAlertPhone } from '@/lib/applications/store'
import { readSmsConfig } from '@/lib/sms/config'
import { quoSend } from '@/lib/sms/quo'

async function review(id: string, notes: string, kind: 'approve' | 'decline') {
  const reviewer = await checkAdminAuth()
  const application = await loadApplicationById(id)
  if (!application) return { ok: false, message: 'That application was not found.', warning: '' }
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
  if (kind === 'approve' && decision.ok && application.smsConsent && application.mobileE164) {
    await saveDoctorAlertPhone(application.doctorId, application.mobileE164, true, now)
  }
  if (kind === 'approve') {
    const delivery = await deliverApprovalNotices({
      email: decision.email,
      sms: decision.sms,
      runtime: readSmsConfig(),
      sendEmail: sendApplicationEmail,
      sendSms: (message) => quoSend(message),
    })
    if (delivery.smsReason !== 'queued' && delivery.smsReason !== 'not_requested') {
      console.info('[application] approval text not sent', delivery.smsReason)
    }
    if (delivery.warnings.length) emailNote = ` ${delivery.warnings.join(' ')}`
  } else if (decision.email) {
    const sent = await sendApplicationEmail(decision.email)
    if (!sent) emailNote = ' The email did not send. Tell them by hand that they were not charged.'
  }

  revalidatePath('/admin/applications')
  revalidatePath('/directory')
  return { ok: decision.ok, message: `${decision.message}${emailNote}`, warning: emailNote.trim() }
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
