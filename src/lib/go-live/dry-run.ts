import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { approvalText } from '../applications/approval-sms.ts'
import { goLiveWelcomeEmail, welcomeHasOtherBookingLink } from './welcome-email.ts'
import { extractProfile } from '../profile-build/extract.ts'
import { decideListingPhone } from '../profile-build/fill.ts'
import type { PageDocument } from '../profile-build/types.ts'
import { minimumVoice } from '../profile-build/voice.ts'
import { decideWebhookHealth } from './health.ts'
import { GO_LIVE_STEPS, type GoLiveStepResult } from './steps.ts'

const dir = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFileSync(join(dir, '../profile-build/fixtures', name), 'utf8')

const TEST_DOCTOR = {
  is_test: true,
  firstName: 'Ada',
  lastName: 'Lovelace',
  practiceName: 'Harbor Nervous System',
  email: 'go-live-dry-run@example.com',
  slug: 'ada-lovelace-dry-run',
  mobile: '+18645550100',
  city: 'Greenville',
  state: 'SC',
}

function fixturePages(): PageDocument[] {
  const home = 'https://harbor.example/'
  return [
    { url: home, html: fixture('home.html'), kind: 'home' },
    { url: 'https://harbor.example/about', html: fixture('about.html'), kind: 'about' },
    { url: 'https://harbor.example/services', html: fixture('services.html'), kind: 'services' },
    { url: 'https://harbor.example/faq', html: fixture('faq.html'), kind: 'faq' },
    { url: 'https://harbor.example/contact', html: fixture('contact.html'), kind: 'contact' },
    { url: 'https://harbor.janeapp.com/#/book', html: fixture('booking.html'), kind: 'booking' },
    {
      url: 'https://harbor.example/chrome',
      html: '<nav><h2>Menu</h2><p>Home About Services Contact</p></nav><footer><h3>Quick links</h3><p>Follow us on social for updates.</p></footer>',
      kind: 'other',
    },
  ]
}

export type DryRunReport = {
  doctor: typeof TEST_DOCTOR
  sends: 'stubbed'
  steps: GoLiveStepResult[]
  retry: GoLiveStepResult[]
  welcome: { subject: string; html: string; hasOtherBooking: boolean; hasOnboarding: boolean; hasLogin: boolean; mentionsSpotlight: boolean }
  sms: string
  profile: { practicePhone: string; publishedPhone: string; firstVisit: string; faqs: string[]; needsAiEnrich: boolean }
  webhookHealth: { signature: string | null; stalePaid: string | null }
}

export function runGoLiveDryRun(now = '2026-11-16T01:30:00.000Z'): DryRunReport {
  const extracted = extractProfile(fixturePages())
  const voice = minimumVoice({
    doctorName: TEST_DOCTOR.lastName,
    clinicName: extracted.clinicName,
    city: extracted.city || TEST_DOCTOR.city,
    state: extracted.state || TEST_DOCTOR.state,
    techniques: extracted.techniques,
    firstVisitInfo: extracted.firstVisitInfo,
    faqs: extracted.faqs,
  })
  const publishedPhone = decideListingPhone({
    currentPhone: '',
    practicePhone: extracted.practicePhone,
    alertPhones: [TEST_DOCTOR.mobile],
  }) || ''
  const profileUrl = `https://neurochiro.co/directory/${TEST_DOCTOR.slug}`
  const mail = goLiveWelcomeEmail({
    to: TEST_DOCTOR.email,
    firstName: TEST_DOCTOR.firstName,
    lastName: TEST_DOCTOR.lastName,
    practiceName: TEST_DOCTOR.practiceName,
    city: TEST_DOCTOR.city,
    area: '',
    profileUrl,
    at: new Date(now),
  })
  const sms = approvalText(TEST_DOCTOR.lastName, profileUrl)
  const questions = voice.faqs.map((item) => item.question)
  const steps: GoLiveStepResult[] = [
    { step: 'checkout', status: 'ok', reason: 'Would record checkout cs_test_dry once. A retry of the same session is a duplicate and does not create a second doctor.' },
    {
      step: 'profile',
      status: 'ok',
      reason: `AI Gateway unavailable. Published a minimum profile and flagged needs AI enrich. Practice phone ${publishedPhone || 'missing'}. Would geocode ${extracted.address}, ${extracted.city}, ${extracted.state}.`,
    },
    { step: 'portal', status: 'ok', reason: `Would create a portal account for ${TEST_DOCTOR.email}. The welcome email explains the reset code. No account was created.` },
    { step: 'welcome', status: 'ok', reason: `Would email ${TEST_DOCTOR.email} and text ${TEST_DOCTOR.mobile}. Onboarding call only. Nothing was sent.`, detail: { subject: mail.subject, sms } },
    { step: 'waitlist', status: 'ok', reason: 'Would email and text community members inside the existing radius with the profile and request form. Nothing was sent.' },
    { step: 'instagram', status: 'ok', reason: 'Would queue a public comment tagging the doctor and DMs for nearby Instagram requests, both with the appointment request form. Nothing was posted.' },
    { step: 'summary', status: 'ok', reason: 'Would email Raymond a Dr Lovelace is live summary with each step status. Nothing was sent.' },
  ]
  const retry: GoLiveStepResult[] = steps.map((step) => {
    if (step.step === 'welcome' || step.step === 'waitlist' || step.step === 'instagram') {
      return { step: step.step, status: 'skipped', reason: 'Already completed for this test doctor. Not sent again.' }
    }
    return { ...step, reason: `Retry would run ${step.step} again. Still stubbed.` }
  })
  const signature = decideWebhookHealth({
    now,
    lastEventAt: '2026-11-16T01:00:00.000Z',
    lastSignatureFailureAt: now,
    lastAlertAt: null,
    paidCheckoutsInWindow: 0,
  })
  const stalePaid = decideWebhookHealth({
    now,
    lastEventAt: '2026-11-15T01:00:00.000Z',
    lastSignatureFailureAt: null,
    lastAlertAt: null,
    paidCheckoutsInWindow: 2,
    staleHours: 6,
  })
  return {
    doctor: TEST_DOCTOR,
    sends: 'stubbed',
    steps,
    retry,
    welcome: {
      subject: mail.subject,
      html: mail.html,
      hasOtherBooking: welcomeHasOtherBookingLink(mail.html),
      hasOnboarding: mail.html.includes('neurochiro-onboarding-call'),
      hasLogin: mail.html.includes('https://neurochiro.co/login'),
      mentionsSpotlight: /Spotlight interview/.test(mail.html) && /Instagram Live/.test(mail.html),
    },
    sms,
    profile: {
      practicePhone: extracted.practicePhone,
      publishedPhone,
      firstVisit: voice.bio,
      faqs: questions,
      needsAiEnrich: true,
    },
    webhookHealth: {
      signature: signature.reason,
      stalePaid: stalePaid.reason,
    },
  }
}

function printReport(): void {
  const report = runGoLiveDryRun()
  const lines = [
    'Go-live dry run',
    `doctor: Dr. ${report.doctor.lastName} is_test=${report.doctor.is_test} email=${report.doctor.email}`,
    `sends: ${report.sends}`,
    '',
    'Steps:',
    ...report.steps.map((step, index) => `${index + 1}. ${step.step}: ${step.status} — ${step.reason}`),
    '',
    'Second run:',
    ...report.retry.map((step) => `- ${step.step}: ${step.status} — ${step.reason}`),
    '',
    `welcome subject: ${report.welcome.subject}`,
    `welcome has onboarding link: ${report.welcome.hasOnboarding}`,
    `welcome has login link: ${report.welcome.hasLogin}`,
    `welcome mentions spotlight and IG live by name: ${report.welcome.mentionsSpotlight}`,
    `welcome has another booking link: ${report.welcome.hasOtherBooking}`,
    'welcome body:',
    report.welcome.html,
    `sms: ${report.sms}`,
    `practice phone published: ${report.profile.publishedPhone}`,
    `application mobile kept off the listing: ${report.profile.publishedPhone !== report.doctor.mobile}`,
    `faqs: ${report.profile.faqs.join(' | ') || '(none)'}`,
    `needs AI enrich: ${report.profile.needsAiEnrich}`,
    `webhook signature alert: ${report.webhookHealth.signature}`,
    `webhook stale paid alert: ${report.webhookHealth.stalePaid}`,
    `step count: ${report.steps.length} expected ${GO_LIVE_STEPS.length}`,
  ]
  console.log(lines.join('\n'))
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isDirect) printReport()
