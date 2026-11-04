import { escapeHtml } from '../students/html.ts'

export const ONBOARDING_CALL_URL = 'https://calendly.com/drray-neurochirodirectory/neurochiro-onboarding-call'

export type Mail = { to: string; subject: string; html: string }

function button(href: string, label: string): string {
  return `<p><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></p>`
}

export function approvedEmail(to: string, firstName: string, hostedInvoiceUrl: string | null): Mail {
  const name = escapeHtml(firstName || 'there')
  const payment = hostedInvoiceUrl
    ? `<p>Your bank needs one extra confirmation before the membership starts. Use this secure Stripe link. Nothing else is charged until that step is finished.</p>${button(hostedInvoiceUrl, 'Confirm your card')}`
    : '<p>Your membership is active. You will see the charge on the card you saved.</p>'
  return {
    to,
    subject: hostedInvoiceUrl ? 'One step left to start your NeuroChiro membership' : 'You are approved. Book your onboarding call.',
    html: `
      <h1>Welcome, Dr. ${name}.</h1>
      <p>Raymond approved your NeuroChiro application.</p>
      ${payment}
      <p>Book a short onboarding call so he can walk you through the directory and your portal.</p>
      ${button(ONBOARDING_CALL_URL, 'Book your onboarding call')}
      <p>Questions go to support@neurochirodirectory.com.</p>
    `,
  }
}

export function declinedEmail(to: string, firstName: string): Mail {
  const name = escapeHtml(firstName || 'there')
  return {
    to,
    subject: 'Your NeuroChiro application',
    html: `
      <h1>Thank you, Dr. ${name}.</h1>
      <p>Thank you for applying to NeuroChiro. We are not able to add the practice to the directory right now.</p>
      <p>Your card was not charged, and the saved card has been removed.</p>
      <p>If you think this was a mistake, reply to this email and Raymond will take another look.</p>
    `,
  }
}
