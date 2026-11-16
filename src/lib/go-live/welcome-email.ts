import { escapeHtml } from '../students/html.ts'
import { ONBOARDING_CALL_URL } from '../applications/emails.ts'

export const GO_LIVE_WELCOME_SUBJECT_PREFIX = 'Welcome to NeuroChiro'

const RESET_PAGE = 'https://neurochiro.co/reset-password'
const LOGIN_URL = 'https://neurochiro.co/login'
const CODE_FROM = 'support@neurochirodirectory.com'

export type GoLiveWelcomeInput = {
  to: string
  firstName: string
  lastName: string
  practiceName: string
  city: string
  /** County or other area. Empty means the city line says "across the area". */
  area: string
  profileUrl: string
  /** When the membership checkout happened. */
  at: Date
}

export type GoLiveWelcome = { to: string; subject: string; html: string }

export function welcomeDayPart(at: Date): 'today' | 'tonight' {
  const hour = Number(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    hourCycle: 'h23',
  }).format(at))
  return hour >= 17 ? 'tonight' : 'today'
}

export function welcomeHasOtherBookingLink(html: string): boolean {
  const found = html.match(/https:\/\/calendly\.com\/[^\s"'<>]+/gi) || []
  return found.some((url) => {
    const clean = url.replace(/[.,)]+$/, '')
    return !clean.startsWith(ONBOARDING_CALL_URL)
  })
}

function safeProfileUrl(value: string): string {
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

function greeting(firstName: string, lastName: string): string {
  const first = firstName.trim()
  const last = lastName.trim()
  if (first) return `Hi Dr. ${escapeHtml(first)},`
  if (last) return `Hi Dr. ${escapeHtml(last)},`
  return 'Hi,'
}

function subjectFor(lastName: string, firstName: string): string {
  const name = lastName.trim() || firstName.trim()
  if (!name) return GO_LIVE_WELCOME_SUBJECT_PREFIX
  return `${GO_LIVE_WELCOME_SUBJECT_PREFIX}, Dr. ${name}`
}

function locationSentence(practice: string, city: string, area: string): string {
  const name = escapeHtml(practice.trim() || 'your practice')
  const place = city.trim()
  if (!place) return `I'm excited to start putting ${name} in front of more families.`
  const region = area.trim() ? escapeHtml(area.trim()) : 'the area'
  return `I'm excited to start putting ${name} in front of more families in ${escapeHtml(place)} and across ${region}.`
}

export function goLiveWelcomeEmail(input: GoLiveWelcomeInput): GoLiveWelcome {
  const when = welcomeDayPart(input.at)
  const profile = safeProfileUrl(input.profileUrl)
  const email = input.to.trim()
  const reset = `${RESET_PAGE}?email=${encodeURIComponent(email)}`
  const resetHref = escapeHtml(reset)
  const profileHref = escapeHtml(profile)
  const hello = greeting(input.firstName, input.lastName)
  const html = `
<p>${hello}</p>
<p>Welcome to NeuroChiro! I saw your membership come through ${when}, and ${locationSentence(input.practiceName, input.city, input.area)}</p>
<p>Your directory profile is live here: <a href="${profileHref}">${profileHref}</a></p>
<p>To get into your doctor portal, here's how to set your password:</p>
<ol>
<li>Go to <a href="${resetHref}">${resetHref}</a></li>
<li>On that page, click "Didn't get the code? Resend it". You'll get an 8-digit code at this email, sent from ${CODE_FROM}. It expires in 15 minutes.</li>
<li>Enter the code and set your password.</li>
<li>Then log in at <a href="${LOGIN_URL}">${LOGIN_URL}</a></li>
</ol>
<p>When you have a minute, book a short onboarding call with me here: <a href="${ONBOARDING_CALL_URL}">${ONBOARDING_CALL_URL}</a></p>
<p>On that call, we'll dial in anything on your profile you'd like changed, and we'll also schedule your NeuroChiro Spotlight interview and Weekly Adjustment Instagram Live. The Spotlight is a relaxed 20 to 30 minute conversation. The full episode goes on YouTube and the NeuroChiro Spotlight podcast, and clips get shared on Instagram, TikTok, and YouTube.</p>
<p>Excited to have you on board!</p>
<p>Talk soon,<br>Dr. Ray</p>
`.trim()
  return {
    to: email,
    subject: subjectFor(input.lastName, input.firstName),
    html,
  }
}
