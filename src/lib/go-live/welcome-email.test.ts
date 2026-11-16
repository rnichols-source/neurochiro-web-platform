import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { goLiveWelcomeEmail, welcomeDayPart, welcomeHasOtherBookingLink } from './welcome-email.ts'

const AFTER_FIVE = new Date('2026-11-16T22:00:00.000Z')
const BEFORE_FIVE = new Date('2026-11-16T21:59:00.000Z')

describe('go-live welcome email', () => {
  it('uses tonight at 5 PM Eastern and today before that', () => {
    assert.equal(welcomeDayPart(AFTER_FIVE), 'tonight')
    assert.equal(welcomeDayPart(BEFORE_FIVE), 'today')
  })

  it('writes Raymond\'s note with the reset-code steps', () => {
    const mail = goLiveWelcomeEmail({
      to: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      practiceName: 'Harbor Nervous System',
      city: 'Greenville',
      area: '',
      profileUrl: 'https://neurochiro.co/directory/ada-lovelace',
      at: AFTER_FIVE,
    })
    assert.equal(mail.subject, 'Welcome to NeuroChiro, Dr. Lovelace')
    assert.match(mail.html, /Hi Dr\. Ada,/)
    assert.match(mail.html, /come through tonight/)
    assert.match(mail.html, /Harbor Nervous System/)
    assert.match(mail.html, /in Greenville and across the area/)
    assert.match(mail.html, /https:\/\/neurochiro\.co\/directory\/ada-lovelace/)
    assert.match(mail.html, /reset-password\?email=ada%40example\.com/)
    assert.match(mail.html, /Didn't get the code\? Resend it/)
    assert.match(mail.html, /8-digit code/)
    assert.match(mail.html, /support@neurochirodirectory\.com/)
    assert.match(mail.html, /15 minutes/)
    assert.match(mail.html, /https:\/\/neurochiro\.co\/login/)
    assert.match(mail.html, /neurochiro-onboarding-call/)
    assert.match(mail.html, /NeuroChiro Spotlight interview/)
    assert.match(mail.html, /Weekly Adjustment Instagram Live/)
    assert.equal(welcomeHasOtherBookingLink(mail.html), false)
    assert.doesNotMatch(mail.html, /<h1|<button/i)
    assert.doesNotMatch(mail.html, /auth\/activate/)
  })

  it('drops a missing city and escapes the practice name', () => {
    const mail = goLiveWelcomeEmail({
      to: 'ada@example.com',
      firstName: '',
      lastName: '',
      practiceName: 'Harbor <script>',
      city: '',
      area: 'Greenville County',
      profileUrl: 'https://evil.example/directory/ada',
      at: BEFORE_FIVE,
    })
    assert.equal(mail.subject, 'Welcome to NeuroChiro')
    assert.match(mail.html, /^<p>Hi,<\/p>/)
    assert.match(mail.html, /come through today/)
    assert.match(mail.html, /putting Harbor &lt;script&gt; in front of more families\./)
    assert.doesNotMatch(mail.html, /Greenville County|across the area/)
    assert.match(mail.html, /https:\/\/neurochiro\.co\/directory</)
  })

  it('uses a county when the doctor row has one', () => {
    const mail = goLiveWelcomeEmail({
      to: 'ada@example.com',
      firstName: '',
      lastName: 'Lovelace',
      practiceName: '',
      city: 'Greenville',
      area: 'Greenville County',
      profileUrl: 'https://neurochiro.co/directory/ada-lovelace',
      at: BEFORE_FIVE,
    })
    assert.match(mail.html, /Hi Dr\. Lovelace,/)
    assert.match(mail.html, /your practice/)
    assert.match(mail.html, /in Greenville and across Greenville County/)
  })

  it('fails the guard only when another Calendly link is present', () => {
    const ok = '<p>NeuroChiro Spotlight interview and Weekly Adjustment Instagram Live</p>'
    assert.equal(welcomeHasOtherBookingLink(ok), false)
    const bad = `${ok}<a href="https://calendly.com/drray-neurochirodirectory/spotlight">book</a>`
    assert.equal(welcomeHasOtherBookingLink(bad), true)
  })
})
