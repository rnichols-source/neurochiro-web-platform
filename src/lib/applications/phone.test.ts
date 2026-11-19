import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { validateAnswers } from './answers.ts'
import { APPLICATION_SMS_CONSENT, applicationSmsConsentError } from './consent.ts'
import { applicationMobileHelper, toApplicationE164 } from './phone.ts'

describe('application mobile numbers', () => {
  it('normalizes each application country to E.164', () => {
    assert.equal(toApplicationE164('(864) 555-0100', 'US'), '+18645550100')
    assert.equal(toApplicationE164('864-555-0100', 'CA'), '+18645550100')
    assert.equal(toApplicationE164('0412 345 678', 'AU'), '+61412345678')
    assert.equal(toApplicationE164('+61 412 345 678', 'AU'), '+61412345678')
    assert.equal(toApplicationE164('07911 123456', 'GB'), '+447911123456')
    assert.equal(toApplicationE164('021 123 4567', 'NZ'), '+64211234567')
    assert.equal(toApplicationE164('050 123 4567', 'AE'), '+971501234567')
    assert.equal(toApplicationE164('087 123 4567', 'IE'), '+353871234567')
    assert.equal(toApplicationE164('98765 43210', 'IN'), '+919876543210')
    assert.equal(toApplicationE164('+91 87654 32109', 'IN'), '+918765432109')
    assert.equal(toApplicationE164('076543 21098', 'IN'), '+917654321098')
    assert.equal(toApplicationE164('0091 6123456789', 'IN'), '+916123456789')
    assert.equal(toApplicationE164('0151 23456789', 'DE'), '+4915123456789')
    assert.equal(toApplicationE164('06 12 34 56 78', 'FR'), '+33612345678')
    assert.equal(toApplicationE164('06 12345678', 'NL'), '+31612345678')
    assert.equal(toApplicationE164('612 345 678', 'ES'), '+34612345678')
    assert.equal(toApplicationE164('333 123 4567', 'IT'), '+393331234567')
    assert.equal(toApplicationE164('+61412345678', 'OTHER'), '+61412345678')
  })

  it('rejects landlines, the wrong country, and numbers with no country', () => {
    assert.equal(toApplicationE164('02 9374 4000', 'AU'), null)
    assert.equal(toApplicationE164('5123456789', 'IN'), null)
    assert.equal(toApplicationE164('987654321', 'IN'), null)
    assert.equal(toApplicationE164('022 2345 6789', 'IN'), null)
    assert.equal(toApplicationE164('+447911123456', 'US'), null)
    assert.equal(toApplicationE164('0412345678', 'OTHER'), null)
    assert.equal(toApplicationE164('', 'US'), null)
    assert.equal(toApplicationE164('nope', 'GB'), null)
    assert.equal(toApplicationE164('0645550100', 'US'), null)
  })

  it('rejects an email or other text in the mobile field', () => {
    assert.equal(toApplicationE164('ada@example.com', 'US'), null)
    assert.equal(toApplicationE164('user@8645550100.com', 'US'), null)
    assert.equal(toApplicationE164('call me', 'CA'), null)
  })

  it('requires a valid mobile and treats text consent as optional', () => {
    const base = {
      practiceApproach: 'We focus on the nervous system and how the body adapts.',
      techniques: 'Toggle',
      usesNervousSystemScans: false,
      scanTypes: '',
      yearsInPractice: 8,
      officeAddress: '123 Main Street',
      city: 'Greenville',
      state: 'SC',
      country: 'US',
      website: '',
      instagram: '',
      heardAbout: 'Instagram',
      whyJoin: 'I want community members who are looking for nervous system care.',
      mobile: '(864) 555-0100',
      smsConsent: true,
    }
    const ok = validateAnswers(base)
    assert.equal(ok.ok, true)
    if (ok.ok) {
      assert.equal(ok.value.mobileE164, '+18645550100')
      assert.equal(ok.value.smsConsent, true)
    }
    const noConsent = validateAnswers({ ...base, smsConsent: false, whyJoin: '' })
    assert.equal(noConsent.ok, true)
    if (noConsent.ok) assert.equal(noConsent.value.smsConsent, false)
    const badPhone = validateAnswers({ ...base, mobile: '123' })
    assert.equal(badPhone.ok, false)
    assert.equal(APPLICATION_SMS_CONSENT.includes('Reply STOP to opt out'), true)
  })

  it('keeps the mobile helper and still requires the text box before the card', () => {
    assert.equal(applicationMobileHelper('IN'), 'Use a mobile number in the country you selected.')
    assert.equal(applicationMobileHelper('GB'), 'Use a mobile number in the country you selected.')
    assert.equal(applicationMobileHelper('OTHER'), 'Start with + and the country code.')
    assert.equal(applicationSmsConsentError(false), 'Check the box so we can text you about new community member requests.')
    assert.equal(applicationSmsConsentError(true), null)
  })
})
