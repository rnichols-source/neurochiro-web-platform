import { escapeHtml } from '../students/html.ts'

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
      <p>Your profile is live.</p>
      <p><a href="${escapeHtml(profile)}">${escapeHtml(profile)}</a></p>
      <p>${started}${receiptHtml}</p>
      <p>Next steps:</p>
      <ol>
        <li>Book your onboarding call. <a href="${escapeHtml(ONBOARDING_CALL_URL)}">Pick a time with Dr. Ray</a>.</li>
        <li>After onboarding, you will get links to book your Spotlight interview (20-30 minutes). The full episode goes on YouTube and the NeuroChiro Spotlight podcast. Clips go on Instagram, TikTok, and YouTube. You will also get a link to book your Weekly Adjustment IG Live.</li>
        <li>Patient requests arrive by text to the mobile number you gave us, and by email.</li>
      </ol>
      <p>Dr. Ray</p>
    `,
  }
}

export function approvedEmail(
  to: string,
  firstName: string,
  hostedInvoiceUrl: string | null,
  welcome?: Omit<ApprovedWelcome, 'to'> | null,
): Mail {
  if (hostedInvoiceUrl) {
    const name = escapeHtml(firstName || 'there')
    return {
      to,
      subject: 'One step left to start your NeuroChiro membership',
      html: `
        <h1>Welcome, Dr. ${name}.</h1>
        <p>Raymond approved your NeuroChiro application.</p>
        <p>Your bank needs one extra confirmation before the membership starts. Use this secure Stripe link. Nothing else is charged until that step is finished.</p>
        ${button(hostedInvoiceUrl, 'Confirm your card')}
        <p>Book a short onboarding call so he can walk you through the directory and your portal.</p>
        ${button(ONBOARDING_CALL_URL, 'Book your onboarding call')}
        <p>Questions go to support@neurochirodirectory.com.</p>
      `,
    }
  }
  return approvedWelcomeEmail({
    to,
    lastName: welcome?.lastName || firstName,
    profileUrl: welcome?.profileUrl || 'https://neurochiro.co/directory',
    plan: welcome?.plan || null,
    priceLabel: welcome?.priceLabel || null,
    amountLabel: welcome?.amountLabel || null,
    receiptUrl: welcome?.receiptUrl || null,
  })
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
