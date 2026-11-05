import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { APPLICATION_SMS_CONSENT } from './consent.ts'
import {
  applicationContactPatch,
  contactFromApplicationRow,
  doctorAlertPatch,
  humanAdminNotes,
  mergeLeadAlertPhones,
  packAdminNotes,
} from './contact.ts'

const NOW = '2026-11-04T16:00:00.000Z'

describe('application consent storage', () => {
  it('stores the number, consent, and the time they agreed', () => {
    const patch = applicationContactPatch({
      mobileE164: '+18645550100',
      smsConsent: true,
      now: NOW,
    })
    assert.equal(patch.mobile_e164, '+18645550100')
    assert.equal(patch.sms_consent, true)
    assert.equal(patch.sms_consent_at, NOW)
    assert.equal(patch.sms_consent_text, APPLICATION_SMS_CONSENT)
  })

  it('does not turn doctor texts on without consent, and does not duplicate phones', () => {
    assert.equal(doctorAlertPatch({
      existingPhones: ['+18645550100'],
      phone: '+18645550100',
      consent: false,
      now: NOW,
    }), null)

    const enabled = doctorAlertPatch({
      existingPhones: ['+18645550111', '+18645550100', '+18645550122'],
      phone: '+18645550100',
      consent: true,
      now: NOW,
    })
    assert.equal(enabled?.sms_alerts_enabled, true)
    assert.equal(enabled?.sms_alerts_consent_at, NOW)
    assert.equal(enabled?.sms_alerts_consent_text, APPLICATION_SMS_CONSENT)
    assert.deepEqual(enabled?.lead_alert_phones, ['+18645550100', '+18645550111', '+18645550122'])

    const capped = mergeLeadAlertPhones(
      ['+18645550111', '+18645550122', '+18645550133'],
      '+18645550100',
    )
    assert.equal(capped.length, 3)
    assert.equal(capped[0], '+18645550100')
    assert.equal(capped.includes('+18645550133'), false)
    assert.equal(new Set(capped).size, 3)
  })

  it('keeps consent in the notes fallback when the new columns are not there yet', () => {
    const packed = packAdminNotes('Looks like a fit', {
      mobileE164: '+61412345678',
      smsConsent: true,
      smsConsentAt: NOW,
    })
    assert.equal(humanAdminNotes(packed), 'Looks like a fit')
    const read = contactFromApplicationRow({ admin_notes: packed })
    assert.equal(read.mobileE164, '+61412345678')
    assert.equal(read.smsConsent, true)
    assert.equal(read.smsConsentAt, NOW)

    const columns = contactFromApplicationRow({
      mobile_e164: '+18645550100',
      sms_consent: true,
      sms_consent_at: NOW,
      admin_notes: packed,
    })
    assert.equal(columns.mobileE164, '+18645550100')
    assert.equal(columns.smsConsent, true)
  })
})
