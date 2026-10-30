import { wrapEmail } from '@/lib/email-template'
import { siteUrl } from './config'
import { escapeHtml, sourceLabel, telHref } from './validate'

export type LeadTemplateInput = {
  patientName: string
  patientPhone: string
  patientEmail: string
  preferredTime: string
  message: string
  source: string
  doctorName: string
  practiceName: string
  doctorPhone: string
  doctorEmail: string
  acknowledgeToken?: string
  withdrawalToken?: string
  checkinToken?: string
  requestId?: string | null
  hoursWaiting?: number
  history?: Array<{ kind: string; channel?: string; status: string; recipient?: string | null; at?: string | null }>
  reason?: string
  whichReminder?: 1 | 2
}

function ackUrl(token: string | undefined): string {
  return `${siteUrl()}/api/contact-request/acknowledge?token=${token || ''}`
}

function withdrawUrl(token: string | undefined): string {
  return `${siteUrl()}/api/contact-request/withdraw?token=${token || ''}`
}

function checkinUrl(token: string | undefined, answer: 'reached' | 'not_yet'): string {
  return `${siteUrl()}/api/contact-request/checkin?token=${encodeURIComponent(token || '')}&answer=${answer}`
}

function adminFocusUrl(id: string | null | undefined): string {
  return `${siteUrl()}/admin/contact-requests${id ? `?focus=${encodeURIComponent(id)}` : ''}`
}

function button(href: string, label: string, color = '#22c55e'): string {
  return `<p style="margin:24px 0;"><a href="${href}" style="display:inline-block;padding:16px 28px;background:${color};color:white;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;">${label}</a></p>`
}

function row(label: string, value: string): string {
  if (!value) return ''
  return `<p style="margin:0 0 8px;font-size:15px;"><strong>${label}:</strong> ${value}</p>`
}

function phoneLine(phone: string): string {
  if (!phone) return ''
  const href = telHref(phone)
  const safe = escapeHtml(phone)
  const linked = href ? `<a href="${href}" style="color:#D66829;font-weight:700;font-size:18px;">${safe}</a>` : safe
  return row('Phone', linked)
}

function emailLine(email: string): string {
  if (!email) return ''
  const safe = escapeHtml(email)
  return row('Email', `<a href="mailto:${safe}" style="color:#D66829;font-weight:700;">${safe}</a>`)
}

function detailCard(inner: string): string {
  return `<div style="background:#F5F3EF;padding:16px;border-radius:10px;margin:16px 0;">${inner}</div>`
}



function patientBlock(input: LeadTemplateInput): string {
  return detailCard(
    `<p style="margin:0 0 8px;font-size:22px;font-weight:900;color:#1E2D3B;">${escapeHtml(input.patientName)}</p>`
    + phoneLine(input.patientPhone)
    + emailLine(input.patientEmail)
    + row('Best time', escapeHtml(input.preferredTime))
    + (input.message ? row('Message', escapeHtml(input.message)) : ''),
  )
}

function patientText(input: LeadTemplateInput): string {
  return [
    input.patientName,
    input.patientPhone ? `Phone: ${input.patientPhone}` : '',
    input.patientEmail ? `Email: ${input.patientEmail}` : '',
    input.preferredTime ? `Best time: ${input.preferredTime}` : '',
    input.message ? `Message: ${input.message}` : '',
  ].filter(Boolean).join('\n')
}

export function doctorNewRequest(input: LeadTemplateInput): { subject: string; html: string; text: string } {
  const url = ackUrl(input.acknowledgeToken)
  const where = sourceLabel(input.source)
  const inner = `
    <h1 style="font-size:22px;margin:0 0 12px;">New patient request</h1>
    <p><strong>${escapeHtml(input.patientName)}</strong> asked ${escapeHtml(input.practiceName)} to reach out, ${escapeHtml(where)}.</p>
    ${patientBlock(input)}
    ${button(url, "I've contacted this patient")}
    <p style="font-size:14px;">We'll remind you until you tap this.</p>
    <p style="font-size:13px;color:#6b7280;">One tap lets us know you handled it. You can also confirm from the link in this email. No login is required.</p>
  `
  const text = [
    `New patient request for ${input.practiceName}.`,
    `${input.patientName} asked your office to reach out, ${where}.`,
    patientText(input),
    `I've contacted this patient: ${url}`,
    `We'll remind you until you tap this.`,
  ].join('\n\n')
  return { subject: `Contact request from ${input.patientName} — wants your office to reach out`, html: wrapEmail(inner), text }
}

export function doctorReminder(input: LeadTemplateInput): { subject: string; html: string; text: string } {
  const which = input.whichReminder === 2 ? 2 : 1
  const url = ackUrl(input.acknowledgeToken)
  const hours = input.hoursWaiting ?? (which === 1 ? 2 : 24)
  const inner = `
    <h1 style="font-size:22px;margin:0 0 12px;">${escapeHtml(input.patientName)} is still waiting</h1>
    <p>This request came in about ${hours} hours ago. Please call or email them, then tap the button so we can stop reminding you.</p>
    ${patientBlock(input)}
    ${button(url, "I've contacted this patient")}
    <p style="font-size:14px;">We'll remind you until you tap this.${which === 2 ? ' Dr. Ray is copied on this reminder.' : ''}</p>
  `
  const text = [
    `${input.patientName} is still waiting (about ${hours} hours).`,
    patientText(input),
    `I've contacted this patient: ${url}`,
    `We'll remind you until you tap this.`,
  ].join('\n\n')
  const subject = which === 1
    ? `${input.patientName} is still waiting to hear from your office`
    : `Second reminder: ${input.patientName} is still waiting`
  return { subject, html: wrapEmail(inner), text }
}

export function adminCopy(input: LeadTemplateInput): { subject: string; html: string; text: string } {
  const inner = `
    <h1 style="font-size:22px;margin:0 0 12px;">New lead copy</h1>
    <p>${escapeHtml(input.patientName)} requested contact from ${escapeHtml(input.practiceName)} (${escapeHtml(sourceLabel(input.source))}).</p>
    ${patientBlock(input)}
    <p style="font-size:14px;"><strong>Doctor:</strong> ${escapeHtml(input.doctorName)}<br>
    <strong>Doctor phone:</strong> ${escapeHtml(input.doctorPhone) || 'none'}<br>
    <strong>Doctor email:</strong> ${escapeHtml(input.doctorEmail) || 'none'}</p>
    <p><a href="${adminFocusUrl(input.requestId)}">Open in admin</a></p>
  `
  const text = [
    `New lead: ${input.patientName} → ${input.practiceName}`,
    patientText(input),
    `Doctor: ${input.doctorName}`,
    `Doctor phone: ${input.doctorPhone || 'none'}`,
    `Doctor email: ${input.doctorEmail || 'none'}`,
    adminFocusUrl(input.requestId),
  ].join('\n')
  return { subject: `New lead: ${input.patientName} → ${input.practiceName}`, html: wrapEmail(inner), text }
}

export function adminEscalation(input: LeadTemplateInput): { subject: string; html: string; text: string } {
  const hours = input.hoursWaiting ?? 48
  const history = (input.history || []).map((item) =>
    `<li>${escapeHtml(item.kind)} · ${escapeHtml(item.channel || 'email')} · ${escapeHtml(item.status)} · ${escapeHtml(item.recipient || '')} · ${escapeHtml(item.at || '')}</li>`,
  ).join('')
  const historyText = (input.history || []).map((item) =>
    `${item.kind} ${item.status} ${item.recipient || ''} ${item.at || ''}`,
  ).join('\n')
  const inner = `
    <h1 style="font-size:22px;margin:0 0 12px;">Lead needs you</h1>
    <p>${escapeHtml(input.patientName)} has been waiting about ${hours} hours. ${escapeHtml(input.practiceName)} has not confirmed contact.</p>
    ${patientBlock(input)}
    <p style="font-size:14px;"><strong>Doctor:</strong> ${escapeHtml(input.doctorName)}<br>
    <strong>Doctor phone:</strong> ${escapeHtml(input.doctorPhone) || 'none'}<br>
    <strong>Doctor email:</strong> ${escapeHtml(input.doctorEmail) || 'none'}</p>
    ${history ? `<p style="font-size:14px;font-weight:700;">Send history</p><ul>${history}</ul>` : ''}
    ${button(adminFocusUrl(input.requestId), 'Open this lead', '#D66829')}
  `
  const text = [
    `ESCALATION: ${input.patientName} has waited about ${hours} hours for ${input.practiceName}.`,
    patientText(input),
    `Doctor: ${input.doctorName} ${input.doctorPhone || ''} ${input.doctorEmail || ''}`,
    historyText,
    adminFocusUrl(input.requestId),
  ].filter(Boolean).join('\n\n')
  return { subject: `Escalation: ${input.patientName} is still waiting on ${input.practiceName}`, html: wrapEmail(inner), text }
}

export function adminAlert(input: LeadTemplateInput): { subject: string; html: string; text: string } {
  const reason = input.reason || 'Lead needs attention'
  const inner = `
    <h1 style="font-size:22px;margin:0 0 12px;">Lead alert</h1>
    <p><strong>${escapeHtml(reason)}</strong></p>
    <p>${escapeHtml(input.patientName)} → ${escapeHtml(input.practiceName || input.doctorName || 'unknown doctor')}</p>
    ${patientBlock(input)}
    <p style="font-size:14px;"><strong>Doctor phone:</strong> ${escapeHtml(input.doctorPhone) || 'none'}<br>
    <strong>Doctor email:</strong> ${escapeHtml(input.doctorEmail) || 'none'}</p>
    ${input.requestId ? `<p><a href="${adminFocusUrl(input.requestId)}">Open in admin</a></p>` : '<p>This lead could not be saved in the database. The details above are the only copy.</p>'}
  `
  const text = [
    `ALERT: ${reason}`,
    `${input.patientName} → ${input.practiceName || input.doctorName}`,
    patientText(input),
    `Doctor phone: ${input.doctorPhone || 'none'}`,
    `Doctor email: ${input.doctorEmail || 'none'}`,
    input.requestId ? adminFocusUrl(input.requestId) : 'Lead was not saved in the database.',
  ].join('\n')
  return { subject: `Lead alert: ${reason}`, html: wrapEmail(inner), text }
}

export function patientConfirmation(input: LeadTemplateInput): { subject: string; html: string; text: string } {
  const url = withdrawUrl(input.withdrawalToken)
  const inner = `
    <h1 style="font-size:22px;margin:0 0 12px;">Your request is in</h1>
    <p>Hi ${escapeHtml(input.patientName)},</p>
    <p>Your request has been sent to <strong>${escapeHtml(input.practiceName)}</strong>. They have the contact details you shared and will reach out.</p>
    <p style="font-size:14px;">Changed your mind? <a href="${url}">Withdraw this request</a>. The office is told only after you confirm.</p>
  `
  const text = [
    `Hi ${input.patientName},`,
    `Your request has been sent to ${input.practiceName}.`,
    `Withdraw this request: ${url}`,
    `The office is told only after you confirm.`,
  ].join('\n\n')
  return { subject: `Your contact request to ${input.practiceName} is confirmed`, html: wrapEmail(inner), text }
}

export function patientCheckin(input: LeadTemplateInput): { subject: string; html: string; text: string } {
  const yes = checkinUrl(input.checkinToken, 'reached')
  const no = checkinUrl(input.checkinToken, 'not_yet')
  const inner = `
    <h1 style="font-size:22px;margin:0 0 12px;">Did the office reach you?</h1>
    <p>Hi ${escapeHtml(input.patientName)},</p>
    <p>You asked <strong>${escapeHtml(input.practiceName)}</strong> to contact you. Did someone from the office reach you?</p>
    ${button(yes, 'Yes, they reached me')}
    ${button(no, 'Not yet', '#1E2D3B')}
  `
  const text = [
    `Hi ${input.patientName},`,
    `Did ${input.practiceName} reach you?`,
    `Yes, they reached me: ${yes}`,
    `Not yet: ${no}`,
  ].join('\n\n')
  return { subject: `Did ${input.practiceName} reach you?`, html: wrapEmail(inner), text }
}

export function doctorWithdrawn(input: LeadTemplateInput): { subject: string; html: string; text: string } {
  const inner = `
    <h1 style="font-size:22px;margin:0 0 12px;">Request withdrawn</h1>
    <p><strong>${escapeHtml(input.patientName)}</strong> withdrew their contact request to ${escapeHtml(input.practiceName)}.</p>
    <p>Please do not contact this person. Their consent has been revoked.</p>
  `
  const text = `${input.patientName} withdrew their contact request to ${input.practiceName}. Please do not contact this person.`
  return { subject: `Contact request from ${input.patientName} has been withdrawn`, html: wrapEmail(inner), text }
}
