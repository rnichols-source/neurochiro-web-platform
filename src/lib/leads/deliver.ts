import { adminLeadEmails } from './config'
import { sendTracked, type SendTrackedResult } from './send'
import {
  adminAlert,
  adminCopy,
  adminEscalation,
  doctorNewRequest,
  doctorReminder,
  doctorWithdrawn,
  patientCheckin,
  patientConfirmation,
  type LeadTemplateInput,
} from './templates'

export type LeadMail = LeadTemplateInput & {
  requestId: string | null
  doctorRecipients: string[]
  acknowledgeToken: string
  withdrawalToken: string
  checkinToken: string
  existingId?: string
  attempt?: number
}

function tracked(
  mail: LeadMail,
  kind: string,
  to: string[],
  built: { subject: string; html: string; text: string },
  cc?: string[],
): Promise<SendTrackedResult> {
  return sendTracked({
    requestId: mail.requestId,
    kind,
    channel: 'email',
    to,
    cc,
    subject: built.subject,
    html: built.html,
    text: built.text,
    existingId: mail.existingId,
    attempt: mail.attempt,
  })
}

export function sendDoctorInitial(mail: LeadMail): Promise<SendTrackedResult> {
  return tracked(mail, 'doctor_initial', mail.doctorRecipients, doctorNewRequest(mail))
}

export function sendDoctorReminder(mail: LeadMail, which: 1 | 2): Promise<SendTrackedResult> {
  const built = doctorReminder({ ...mail, whichReminder: which })
  const cc = which === 2 ? adminLeadEmails() : undefined
  return tracked(mail, which === 1 ? 'doctor_reminder_1' : 'doctor_reminder_2', mail.doctorRecipients, built, cc)
}

export function sendAdminCopy(mail: LeadMail): Promise<SendTrackedResult> {
  return tracked(mail, 'admin_copy', adminLeadEmails(), adminCopy(mail))
}

export function sendAdminEscalation(mail: LeadMail): Promise<SendTrackedResult> {
  return tracked(mail, 'admin_escalation', adminLeadEmails(), adminEscalation(mail))
}

export function sendAdminAlert(mail: LeadMail, reason: string): Promise<SendTrackedResult> {
  return tracked(mail, 'admin_alert', adminLeadEmails(), adminAlert({ ...mail, reason }))
}

export function sendPatientConfirmation(mail: LeadMail): Promise<SendTrackedResult> {
  if (!mail.patientEmail) return Promise.resolve({ ok: false, error: 'No patient email' })
  return tracked(mail, 'patient_confirmation', [mail.patientEmail], patientConfirmation(mail))
}

export function sendPatientCheckin(mail: LeadMail): Promise<SendTrackedResult> {
  if (!mail.patientEmail) return Promise.resolve({ ok: false, error: 'No patient email' })
  return tracked(mail, 'patient_checkin', [mail.patientEmail], patientCheckin(mail))
}

export function sendDoctorWithdrawn(mail: LeadMail): Promise<SendTrackedResult> {
  return tracked(mail, 'doctor_withdrawn', mail.doctorRecipients, doctorWithdrawn(mail))
}
