import { ONBOARDING_CONFIG } from '../onboarding-config.ts'
import {
  PORTAL_HOME_URL,
  PORTAL_LOGIN_URL,
  REFERRAL_URL,
  REQUESTS_URL,
  type NudgePlan,
} from './plan.ts'

export function nudgeCopy(plan: NudgePlan, input: { name: string; requestCount: number; activateUrl: string }): { subject: string; body: string; sms: string } {
  const name = input.name.trim() || 'there'
  const portal = input.activateUrl || PORTAL_LOGIN_URL
  if (plan.kind === 'checkin') {
    const count = input.requestCount
    const subject = count === 0
      ? 'How are community member requests going?'
      : `You have ${count} community member request${count === 1 ? '' : 's'}`
    const body = [
      `Dr. ${name}, checking in on day ${plan.day}.`,
      count === 0
        ? 'No community member requests are on your account yet.'
        : `${count} community member request${count === 1 ? ' is' : 's are'} on your account.`,
      'Did any of them come in? Each request has a one-click link: they came in, or they did not come in.',
      `Open them here: ${REQUESTS_URL}`,
    ].join(' ')
    return { subject, body, sms: `${body} Reply STOP to opt out.`.slice(0, 320) }
  }
  const step = plan.step
  if (step === 'activate_login') {
    return {
      subject: 'Activate your NeuroChiro portal',
      body: `Dr. ${name}, your listing is live. Activate your login so you can answer community member requests: ${portal}`,
      sms: `Dr. ${name}, activate your NeuroChiro portal: ${portal} Reply STOP to opt out.`.slice(0, 320),
    }
  }
  if (step === 'finish_profile') {
    return {
      subject: 'Finish your NeuroChiro profile',
      body: `Dr. ${name}, add your photo and the rest of your profile so people can find the practice: ${PORTAL_HOME_URL.replace('/dashboard', '/profile')}`,
      sms: `Dr. ${name}, finish your NeuroChiro photo and profile: https://neurochiro.co/doctor/profile Reply STOP to opt out.`.slice(0, 320),
    }
  }
  if (step === 'book_spotlight') {
    return {
      subject: 'Book your Spotlight interview',
      body: `Dr. ${name}, book your Spotlight interview: ${ONBOARDING_CONFIG.CALENDLY_SPOTLIGHT}`,
      sms: `Dr. ${name}, book your NeuroChiro Spotlight interview: ${ONBOARDING_CONFIG.CALENDLY_SPOTLIGHT} Reply STOP to opt out.`.slice(0, 320),
    }
  }
  if (step === 'book_ig_live') {
    return {
      subject: 'Book your IG Live',
      body: `Dr. ${name}, book your Weekly Adjustment IG Live: ${ONBOARDING_CONFIG.CALENDLY_IG_LIVE}`,
      sms: `Dr. ${name}, book your Weekly Adjustment IG Live: ${ONBOARDING_CONFIG.CALENDLY_IG_LIVE} Reply STOP to opt out.`.slice(0, 320),
    }
  }
  return {
    subject: 'Add the mobile number for request texts',
    body: `Dr. ${name}, add a US or Canadian mobile so community member requests can reach you by text: https://neurochiro.co/doctor/settings`,
    sms: `Dr. ${name}, add your mobile for NeuroChiro request texts: https://neurochiro.co/doctor/settings Reply STOP to opt out.`.slice(0, 320),
  }
}

export function referralLine(): string {
  return REFERRAL_URL
}
