import { escapeHtml } from '../students/html.ts'
import { PORTAL_LOGIN_URL, REFERRAL_URL, REQUESTS_URL } from '../go-live/plan.ts'
import { safeApplicationUrl } from './apply-nav.ts'

export const ONBOARDING_CALL_URL = 'https://calendly.com/drray-neurochirodirectory/neurochiro-onboarding-call'

export const APPROVED_SUBJECT = "You're approved - welcome to NeuroChiro"

export type Mail = { to: string; subject: string; html: string }

export type ApprovedWelcome = {
  to: string
  lastName: string
  profileUrl: string
  plan: 'monthly' | 'annual' | null
  priceLabel: string | null
  amountLabel: string | null
  receiptUrl: string | null
  activateUrl?: string | null
}

function button(href: string, label: string): string {
  return `<p><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></p>`
}

function profileLink(value: string): string {
  const fallback = 'https://neurochiro.co/directory'
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.hostname !== 'neurochiro.co') return fallback
    if (url.pathname !== '/directory' && !url.pathname.startsWith('/directory/')) return fallback
    return `https://neurochiro.co${url.pathname.replace(/\/$/, '') || '/directory'}`
  } catch {
    return fallback
  }
}

function receiptLink(value: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return null
    const host = url.hostname
    if (host !== 'invoice.stripe.com' && host !== 'pay.stripe.com' && !host.endsWith('.stripe.com')) return null
    return url.toString()
  } catch {
    return null
  }
}

export function approvedWelcomeEmail(input: ApprovedWelcome): Mail {
  const name = escapeHtml(input.lastName || 'there')
  const profile = profileLink(input.profileUrl)
  const activate = input.activateUrl && input.activateUrl.startsWith('https://') ? input.activateUrl : PORTAL_LOGIN_URL
  const amount = input.amountLabel || input.priceLabel || ''
  const cycle = input.plan === 'annual' ? 'annual' : input.plan === 'monthly' ? 'monthly' : ''
  const started = cycle
    ? `Your ${cycle} membership has started${amount ? ` (${escapeHtml(amount)})` : ''}.`
    : `Your membership has started${amount ? ` (${escapeHtml(amount)})` : ''}.`
  const receipt = receiptLink(input.receiptUrl)
  const receiptHtml = receipt
    ? ` Your receipt from Stripe: <a href="${escapeHtml(receipt)}">view receipt</a>.`
    : ' The charge is on the card you saved, and Stripe keeps the receipt with that payment.'
  return {
    to: input.to,
    subject: APPROVED_SUBJECT,
    html: `
      <h1>You're approved.</h1>
      <p>Congratulations, Dr. ${name}.</p>
      <p>Open your portal first. This link signs you in and lets you set a password. After that, log in at <a href="${escapeHtml(PORTAL_LOGIN_URL)}">${escapeHtml(PORTAL_LOGIN_URL)}</a>.</p>
      <p><a href="${escapeHtml(activate)}">Set your password and open the portal</a></p>
      <p>Your profile is live.</p>
      <p><a href="${escapeHtml(profile)}">${escapeHtml(profile)}</a></p>
      <p>${started}${receiptHtml}</p>
      <p>New patient requests arrive by text and by email as soon as someone asks for your office. Reply to that text or email. Each request includes a one-click link: they came in, or they did not come in. The same list is in your portal: <a href="${escapeHtml(REQUESTS_URL)}">patient requests</a>.</p>
      <p>The next step is your onboarding call. <a href="${escapeHtml(ONBOARDING_CALL_URL)}">Pick a time with Dr. Ray</a>.</p>
      <p>When a colleague joins from your link, you get a free month. <a href="${escapeHtml(REFERRAL_URL)}">Your referral program</a>.</p>
      <p>Dr. Ray</p>
    `,
  }
}

export function newCardEmail(to: string, firstName: string, cardUrl: string): Mail {
  const name = escapeHtml(firstName || 'there')
  const href = safeApplicationUrl(cardUrl)
  return {
    to,
    subject: 'Save a new card for your NeuroChiro application',
    html: `
      <h1>Dr. ${name}, the card did not go through.</h1>
      <p>Nothing was charged. Save a new card in your currency and the application goes back to review. You're only charged once approved.</p>
      ${button(href, 'Update your card')}
      <p>Dr. Ray</p>
    `,
  }
}

export function unpaidEmail(to: string, firstName: string, payUrl: string, kind: 'bank' | 'failed'): Mail {
  const name = escapeHtml(firstName || 'there')
  const bank = kind === 'bank'
  return {
    to,
    subject: 'One step left to start your NeuroChiro membership',
    html: `
      <h1>Welcome, Dr. ${name}.</h1>
      <p>${bank
        ? 'Your bank needs one extra confirmation before the membership starts. Use this secure Stripe link. Nothing else is charged until that step is finished.'
        : 'The card payment did not go through, so the listing is not public. Use this secure Stripe link to start the membership.'}</p>
      ${button(payUrl, bank ? 'Confirm your card' : 'Pay with Stripe')}
      <p>Your listing stays off the directory until that payment succeeds. Reply to this email if you need help.</p>
      ${button(ONBOARDING_CALL_URL, 'Book your onboarding call')}
    `,
  }
}

export function approvedEmail(
  to: string,
  firstName: string,
  hostedInvoiceUrl: string | null,
  welcome?: Omit<ApprovedWelcome, 'to'> | null,
): Mail {
  if (hostedInvoiceUrl) return unpaidEmail(to, firstName, hostedInvoiceUrl, 'bank')
  return approvedWelcomeEmail({
    to,
    lastName: welcome?.lastName || firstName,
    profileUrl: welcome?.profileUrl || 'https://neurochiro.co/directory',
    plan: welcome?.plan || null,
    priceLabel: welcome?.priceLabel || null,
    amountLabel: welcome?.amountLabel || null,
    receiptUrl: welcome?.receiptUrl || null,
    activateUrl: welcome?.activateUrl || null,
  })
}

export function declinedEmail(to: string, firstName: string, moneyState: 'none' | 'refunded' | 'refund_failed' = 'none'): Mail {
  const name = escapeHtml(firstName || 'there')
  const money = moneyState === 'refunded'
    ? 'The membership is canceled and the payment was refunded. The listing stays off the directory.'
    : moneyState === 'refund_failed'
      ? 'The listing stays off the directory. The payment is still on the card. We will confirm the refund in Stripe before it is returned.'
      : 'Your card was not charged, and the saved card has been removed.'
  return {
    to,
    subject: 'Your NeuroChiro application',
    html: `
      <h1>Thank you, Dr. ${name}.</h1>
      <p>Thank you for applying to NeuroChiro. We are not able to add the practice to the directory right now.</p>
      <p>${money}</p>
      <p>If you think this was a mistake, reply to this email and Raymond will take another look.</p>
    `,
  }
}
