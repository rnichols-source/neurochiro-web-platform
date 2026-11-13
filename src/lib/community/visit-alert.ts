import { wrapEmail } from '../email-template.ts'
import { escapeHtml } from '../leads/validate.ts'
import { communityVisitOfficeText } from '../sms/templates.ts'
import { PUBLIC_ORIGIN } from './phases.ts'

export type VisitOfficeAlert = {
  subject: string
  html: string
  text: string
  sms: string
}

function row(label: string, value: string | null): string {
  if (!value) return ''
  return `<p style="margin:0 0 8px;font-size:15px;"><strong>${label}:</strong> ${escapeHtml(value)}</p>`
}

/**
 * Office email and text for a Your NeuroChiro visit request.
 * Only the fields the community member checked are included.
 */
export function buildVisitOfficeAlert(input: {
  sharedFirstName: string | null
  forFirstName: string | null
  sharedEmail: string | null
  callbackPhone: string | null
  sharedFamilyNames: string | null
  note: string | null
  preferredWindow: string | null
  practiceName: string
}): VisitOfficeAlert {
  const who = input.sharedFirstName || 'A community member'
  const practice = input.practiceName.trim() || 'your office'
  const opening = input.forFirstName
    ? `${who} requested a visit for ${input.forFirstName} at ${practice}.`
    : `${who} requested a visit at ${practice} through Your NeuroChiro.`
  const details = [
    row('Name', input.sharedFirstName),
    row('Visit for', input.forFirstName),
    row('Email', input.sharedEmail),
    row('Phone', input.callbackPhone),
    row('Household first names', input.sharedFamilyNames),
    row('Preferred time', input.preferredWindow),
    row('Note', input.note),
  ].join('')
  const withheld = !input.sharedEmail && !input.callbackPhone
    ? '<p style="margin:0;font-size:14px;">They did not share an email or phone.</p>'
    : ''
  const url = `${PUBLIC_ORIGIN}/doctor/visit-requests`
  const inner = `
    <h1 style="font-size:22px;margin:0 0 12px;">Visit request from a community member</h1>
    <p>${escapeHtml(opening)} They only shared what they chose.</p>
    <div style="background:#F5F3EF;padding:16px;border-radius:10px;margin:16px 0;">${details}${withheld}</div>
    <p style="margin:24px 0;"><a href="${url}" style="display:inline-block;padding:16px 28px;background:#D66829;color:white;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;">Open visit requests</a></p>
    <p style="font-size:13px;color:#6b7280;">This is not a chart. Your NeuroChiro does not send anything they left unchecked.</p>
  `
  const text = [
    'Visit request from a community member.',
    opening,
    'They only shared what they chose.',
    input.sharedFirstName ? `Name: ${input.sharedFirstName}` : 'Name: not shared',
    input.forFirstName ? `Visit for: ${input.forFirstName}` : '',
    input.sharedEmail ? `Email: ${input.sharedEmail}` : '',
    input.callbackPhone ? `Phone: ${input.callbackPhone}` : '',
    input.sharedFamilyNames ? `Household first names: ${input.sharedFamilyNames}` : '',
    input.preferredWindow ? `Preferred time: ${input.preferredWindow}` : '',
    input.note ? `Note: ${input.note}` : '',
    !input.sharedEmail && !input.callbackPhone ? 'They did not share an email or phone.' : '',
    url,
  ].filter(Boolean).join('\n')
  return {
    subject: input.sharedFirstName
      ? `Visit request from ${input.sharedFirstName}`
      : 'Visit request from a community member',
    html: wrapEmail(inner),
    text,
    sms: communityVisitOfficeText({
      name: input.sharedFirstName,
      phone: input.callbackPhone,
      email: input.sharedEmail,
      bestTime: input.preferredWindow,
      note: input.note,
    }),
  }
}
