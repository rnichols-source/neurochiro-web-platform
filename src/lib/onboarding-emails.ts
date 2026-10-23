/**
 * Onboarding email sequence for new NeuroChiro members.
 *
 * Email 1:  Payment Received (welcome + next steps)
 * Email 1B: Join Packet (agreement + call booking + payment info)
 * Email 2:  Profile Live (profile card + login link + remaining steps)
 * Email 3:  Post-Call (spotlight interview + IG live + social assets)
 * Nudge A:  Agreement reminder
 * Nudge B:  Call booking reminder
 */

import { Resend } from 'resend'
import { wrapEmail } from '@/lib/email-template'
import { createAdminClient } from '@/lib/supabase-admin'
import { ONBOARDING_CONFIG } from '@/lib/onboarding-config'

// ── Resend client (transactional) ──

let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || '')
  }
  return _resend
}

const FROM = 'Dr. Ray <ray@neurochirodirectory.com>'

// ── Types ──

export interface OnboardingDoctor {
  first_name: string
  last_name: string
  clinic_name: string | null
  city: string | null
  state: string | null
  country: string | null
  specialties: string[] | null
  slug: string | null
  photo_url: string | null
  email: string
  agreement_signed_at: string | null
  onboarding_call_booked_at: string | null
}

// ── Helpers ──

function orangeButton(url: string, text: string): string {
  return `<div style="text-align:center;margin:24px 0;">
  <a href="${url}" style="display:inline-block;background-color:#D66829;color:#FFFFFF;padding:16px 32px;text-decoration:none;border-radius:12px;font-weight:900;font-size:14px;letter-spacing:1px;text-transform:uppercase;">${text}</a>
</div>`
}

function profileCard(doctor: OnboardingDoctor): string {
  const specialties = doctor.specialties?.join(' &middot; ') || ''
  const location = [doctor.city, doctor.state].filter(Boolean).join(', ')
  const profileUrl = doctor.slug ? `https://neurochiro.co/directory/${doctor.slug}` : '#'

  return `<div style="background:#F9FAFB;border-radius:16px;padding:24px;margin:24px 0;">
  <p style="font-weight:900;color:#0B1118;font-size:18px;margin:0 0 4px;">${doctor.clinic_name || 'Your Practice'}</p>
  <p style="color:#6B7280;font-size:14px;margin:0;">Led by Dr. ${doctor.first_name} ${doctor.last_name}</p>
  ${location ? `<p style="color:#6B7280;font-size:14px;margin:4px 0 0;">${location}</p>` : ''}
  ${specialties ? `<p style="color:#6B7280;font-size:14px;margin:4px 0 0;">${specialties}</p>` : ''}
  <p style="margin:12px 0 0;"><a href="${profileUrl}" style="color:#D66829;font-weight:700;text-decoration:underline;">View Your Profile</a></p>
</div>`
}

function getPaymentLinks(country: string | null): { monthly: { url: string; label: string }; annual: { url: string; label: string } } {
  const code = (country || 'US').toUpperCase()
  return ONBOARDING_CONFIG.PAYMENT_LINKS[code] || ONBOARDING_CONFIG.PAYMENT_LINKS['US']
}

async function isFirstInCountry(country: string | null): Promise<boolean> {
  if (!country) return false
  const supabase = createAdminClient()
  const { count } = await supabase
    .from('doctors')
    .select('id', { count: 'exact', head: true })
    .eq('country', country)
    .eq('verification_status', 'verified')
  return (count || 0) <= 1
}

async function sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResend()
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
    })
    if (error) {
      console.error('[onboarding-email] Send failed:', error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err: any) {
    console.error('[onboarding-email] Exception:', err)
    return { success: false, error: err.message || 'Unknown error' }
  }
}

// ── Email 1: Payment Received ──

export async function sendPaymentReceivedEmail(doctor: OnboardingDoctor) {
  const firstName = doctor.first_name || 'Doctor'
  const firstInCountry = await isFirstInCountry(doctor.country)

  let body = `<h1>Welcome to NeuroChiro, Dr. ${firstName}.</h1>

<p>Your payment just came through. You're officially part of the only global directory built exclusively for nervous system chiropractors.</p>`

  if (firstInCountry && doctor.country && doctor.country !== 'US') {
    body += `<p><strong>You're the first verified member in ${doctor.country}.</strong> That means every patient search in your country will show you first. We're going to make sure people know you're here.</p>`
  }

  body += `<p>Here is what happens next:</p>

<ol>
  <li><strong>Your profile goes live within ${ONBOARDING_CONFIG.PROFILE_BUILD_SLA_HOURS} hours.</strong> We build it by hand so it actually looks good. You will get an email as soon as it is ready.</li>
  <li><strong>Sign the membership agreement</strong> so we can feature you across our platforms.</li>
  <li><strong>Book your onboarding call</strong> with me. This is a real conversation, not a webinar. I want to know your story and figure out how to get you the most visibility.</li>
</ol>

${orangeButton(ONBOARDING_CONFIG.AGREEMENT_PDF_URL, 'Review & Sign Agreement')}

${orangeButton(ONBOARDING_CONFIG.CALENDLY_ONBOARDING, 'Book Your Onboarding Call')}

<p>Talk soon.</p>

<p>Dr. Ray</p>`

  const html = wrapEmail(body)
  return sendEmail(doctor.email, `Welcome to NeuroChiro, Dr. ${firstName}`, html)
}

// ── Email 1B: Join Packet ──

export async function sendJoinPacketEmail(doctor: OnboardingDoctor) {
  const firstName = doctor.first_name || 'Doctor'
  const payment = getPaymentLinks(doctor.country)

  let body = `<h1>Your NeuroChiro Join Packet</h1>

<p>Dr. ${firstName}, here is everything you need to get fully set up.</p>

<h2>Step 1: Payment</h2>
<p>Choose the plan that works for you:</p>

<div style="text-align:center;margin:24px 0;">`

  if (payment.monthly.url) {
    body += `<a href="${payment.monthly.url}" style="display:inline-block;background-color:#D66829;color:#FFFFFF;padding:16px 32px;text-decoration:none;border-radius:12px;font-weight:900;font-size:14px;letter-spacing:1px;text-transform:uppercase;margin:8px;">${payment.monthly.label}</a>`
  }

  if (payment.annual.url) {
    body += `<br><a href="${payment.annual.url}" style="display:inline-block;background-color:#1E2D3B;color:#FFFFFF;padding:16px 32px;text-decoration:none;border-radius:12px;font-weight:900;font-size:14px;letter-spacing:1px;text-transform:uppercase;margin:8px;">${payment.annual.label}</a>`
  }

  body += `</div>

<h2>Step 2: Sign the Agreement</h2>
<p>This is a simple membership agreement. It covers what we provide, what you get, and how we promote you. No surprises.</p>

${orangeButton(ONBOARDING_CONFIG.AGREEMENT_PDF_URL, 'Review & Sign Agreement')}

<h2>Step 3: Book Your Onboarding Call</h2>
<p>This is a 1-on-1 call with me. I want to hear your story, understand your practice, and map out how we are going to get you in front of more patients.</p>

${orangeButton(ONBOARDING_CONFIG.CALENDLY_ONBOARDING, 'Book Your Onboarding Call')}

<p>Once all three steps are done, your account is fully activated and we start promoting you.</p>

<p>Dr. Ray</p>`

  const html = wrapEmail(body)
  return sendEmail(doctor.email, `Your NeuroChiro Join Packet, Dr. ${firstName}`, html)
}

// ── Email 2: Profile Live ──

export async function sendProfileLiveEmail(doctor: OnboardingDoctor) {
  const firstName = doctor.first_name || 'Doctor'
  const supabase = createAdminClient()

  // Generate a magic link for password-free login
  let loginUrl = 'https://neurochiro.co/login'
  try {
    const { data } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: doctor.email,
      options: { redirectTo: 'https://neurochiro.co/doctor/dashboard' },
    })
    if (data?.properties?.action_link) {
      loginUrl = data.properties.action_link
    }
  } catch (err) {
    console.warn('[onboarding-email] Could not generate magic link, falling back to login page:', err)
  }

  let body = `<h1>Your profile is live, Dr. ${firstName}.</h1>

<p>We just finished building your NeuroChiro profile. Take a look:</p>

${profileCard(doctor)}

<p>This is what patients see when they search for a nervous system chiropractor in your area. If anything needs updating, you can edit it from your dashboard.</p>

${orangeButton(loginUrl, 'Log In to Your Dashboard')}`

  // Show agreement section only if not yet signed
  if (!doctor.agreement_signed_at) {
    body += `
<h2>Still needed: Sign your agreement</h2>
<p>We cannot feature you on social media or in our newsletter until this is signed. It takes about two minutes.</p>

${orangeButton(ONBOARDING_CONFIG.AGREEMENT_PDF_URL, 'Review & Sign Agreement')}`
  }

  // Show call booking section only if not yet booked
  if (!doctor.onboarding_call_booked_at) {
    body += `
<h2>Still needed: Book your onboarding call</h2>
<p>This is how I learn your story and figure out the best way to promote your practice. It is a real conversation, not a pitch.</p>

${orangeButton(ONBOARDING_CONFIG.CALENDLY_ONBOARDING, 'Book Your Onboarding Call')}`
  }

  body += `

<p>Dr. Ray</p>`

  const html = wrapEmail(body)
  return sendEmail(doctor.email, `Your NeuroChiro profile is live, Dr. ${firstName}`, html)
}

// ── Email 3: Post-Call ──

export async function sendPostCallEmail(doctor: OnboardingDoctor) {
  const firstName = doctor.first_name || 'Doctor'
  const followerCount = ONBOARDING_CONFIG.FOLLOWER_COUNT

  let body = `<h1>Great talking with you, Dr. ${firstName}.</h1>

<p>That call was awesome. I have a much better sense of your practice now and I am already working on how to feature you.</p>

<p>Here is what is coming your way:</p>

<h2>Spotlight Interview</h2>
<p>This is a short recorded conversation where you tell your story. We edit it, add graphics, and publish it across our platforms to ${followerCount} followers. Patients find you through these.</p>

${orangeButton(ONBOARDING_CONFIG.CALENDLY_SPOTLIGHT, 'Book Your Spotlight Interview')}

<h2>The Weekly Adjustment (IG Live)</h2>
<p>Thursday nights at 8pm EST, we go live on Instagram. You join for a segment, we talk about what you do, and our audience gets to meet you. It is casual and fun.</p>

${orangeButton(ONBOARDING_CONFIG.CALENDLY_IG_LIVE, 'Book Your IG Live Slot')}

<h2>Social Media Features</h2>
<p>We are going to create content featuring your practice and share it with our audience. You do not need to do anything for this, we handle it all. Just keep an eye on your notifications.</p>

<p>If you need anything at all, just reply to this email. I read every one.</p>

<p>Dr. Ray</p>`

  const html = wrapEmail(body)
  return sendEmail(doctor.email, `Next steps after our call, Dr. ${firstName}`, html)
}

// ── Nudge A: Agreement Reminder ──

export async function sendNudgeAgreementEmail(doctor: OnboardingDoctor) {
  const firstName = doctor.first_name || 'Doctor'

  const body = `<h1>Quick reminder, Dr. ${firstName}</h1>

<p>I noticed you have not signed the membership agreement yet. No rush, but we cannot feature you on social media or in our directory promotions until it is done.</p>

<p>It is a straightforward document. Takes about two minutes to review and sign.</p>

${orangeButton(ONBOARDING_CONFIG.AGREEMENT_PDF_URL, 'Review & Sign Agreement')}

<p>If you have any questions about it, just reply to this email and I will walk you through it.</p>

<p>Dr. Ray</p>`

  const html = wrapEmail(body)
  return sendEmail(doctor.email, `Your agreement is waiting, Dr. ${firstName}`, html)
}

// ── Nudge B: Call Booking Reminder ──

export async function sendNudgeCallEmail(doctor: OnboardingDoctor) {
  const firstName = doctor.first_name || 'Doctor'

  const body = `<h1>Let's get your call on the books, Dr. ${firstName}</h1>

<p>You are set up and your profile looks great. The last step is our onboarding call. This is where I learn about your practice and we map out your promotion strategy together.</p>

<p>It is a real conversation, not a sales pitch. Most doctors say it is the best part of joining.</p>

${orangeButton(ONBOARDING_CONFIG.CALENDLY_ONBOARDING, 'Book Your Onboarding Call')}

<p>If none of the available times work for you, reply to this email and we will find something that fits your schedule.</p>

<p>Dr. Ray</p>`

  const html = wrapEmail(body)
  return sendEmail(doctor.email, `Let's get your call booked, Dr. ${firstName}`, html)
}
