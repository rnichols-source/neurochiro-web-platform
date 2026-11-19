import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  applicationResumePath,
  applicationResumeUrl,
  applicationStopLabel,
  composeHeardAbout,
  firstUnfinishedStep,
  formStepFromRequest,
  normalizeWebsite,
  officeAddressWithPostal,
  parseHeardAbout,
  parseYearsInPractice,
  validateAnswers,
  validateStep1,
  validateStep2,
} from './answers.ts'
import { applyStepPath } from './apply-nav.ts'
import { clientGapMessage, gapsBeforeCard } from './checklist.ts'
import { ACCOUNT_CONTINUE_PATH } from './resume-path.ts'

const office = {
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
  mobile: '(864) 555-0100',
  smsConsent: true,
}

describe('application steps', () => {
  it('keeps how you practice required and why you join optional', () => {
    const short = validateStep1({ practiceApproach: 'Too short', heardAbout: 'Instagram', whyJoin: '' })
    assert.equal(short.ok, false)
    const ok = validateStep1({
      practiceApproach: 'We focus on the nervous system and how the body adapts.',
      heardAbout: 'Podcast/YouTube',
      whyJoin: '',
    })
    assert.equal(ok.ok, true)
    if (ok.ok) assert.equal(ok.value.whyJoin, '')
  })

  it('turns how they heard about us into a short list, with a box for Other', () => {
    assert.equal(composeHeardAbout('Instagram', ''), 'Instagram')
    assert.equal(composeHeardAbout('Other', 'A colleague'), 'Other: A colleague')
    assert.deepEqual(parseHeardAbout('A colleague'), { choice: 'Other', other: 'A colleague' })
    const other = validateAnswers({
      practiceApproach: 'We focus on the nervous system and how the body adapts.',
      heardAbout: 'Other: A colleague',
      whyJoin: 'hi',
      ...office,
    })
    assert.equal(other.ok, true)
    if (other.ok) {
      assert.equal(other.value.heardAbout, 'Other: A colleague')
      assert.equal(other.value.smsConsent, true)
      assert.equal(other.value.whyJoin, 'hi')
    }
    const missing = validateStep1({
      practiceApproach: 'We focus on the nervous system and how the body adapts.',
      heardAbout: '',
      whyJoin: '',
    })
    assert.equal(missing.ok, false)
  })

  it('returns people to the first step that is not saved', () => {
    const practice = 'We focus on the nervous system and how the body adapts.'
    assert.equal(firstUnfinishedStep({}), 1)
    assert.equal(firstUnfinishedStep({ practiceApproach: practice, heardAbout: 'Google', whyJoin: '' }), 2)
    assert.equal(firstUnfinishedStep({
      practiceApproach: practice,
      heardAbout: 'Google',
      whyJoin: '',
      ...office,
    }), 3)
    assert.equal(applicationStopLabel({ status: 'draft', cardOnFile: false, answers: {} }), 'Step 2 of 4 · How you practice')
    assert.equal(applicationStopLabel({
      status: 'draft',
      cardOnFile: false,
      answers: { practiceApproach: practice, heardAbout: 'Event', whyJoin: '' },
    }), 'Step 3 of 4 · Your office')
    assert.equal(applicationStopLabel({
      status: 'draft',
      cardOnFile: false,
      answers: { practiceApproach: practice, heardAbout: 'Event', whyJoin: '', ...office },
    }), 'Step 4 of 4 · Plan and card')
    assert.equal(applicationStopLabel({ status: 'under_review', cardOnFile: true, answers: {} }), 'Submitted')
  })

  it('sends a returning doctor to the screen they still owe, without skipping or rewinding', () => {
    const practice = 'We focus on the nervous system and how the body adapts.'
    const started = { practiceApproach: practice, heardAbout: 'Google', whyJoin: '' }
    const ready = { ...started, ...office }
    assert.equal(applicationResumePath({}), '/doctor/apply?step=2&resume=1')
    assert.equal(ACCOUNT_CONTINUE_PATH, '/doctor/apply?step=2')
    assert.equal(applicationResumePath(started), '/doctor/apply?step=2&part=2&resume=1')
    assert.equal(applicationResumePath(ready), '/doctor/apply?step=3&resume=1')
    assert.equal(applicationResumeUrl({}), 'https://neurochiro.co/doctor/apply?step=2&resume=1')
    assert.equal(applicationResumeUrl(ready).includes('neurochirodirectory.com'), false)
    assert.equal(formStepFromRequest({}, { step: '2' }), 1)
    assert.equal(formStepFromRequest({}, { step: '3' }), 1)
    assert.equal(formStepFromRequest(started, { step: '2', part: '2' }), 2)
    assert.equal(formStepFromRequest(started, { step: '2' }), 1)
    assert.equal(formStepFromRequest(ready, { step: '2', part: '2' }), 2)
    assert.equal(formStepFromRequest(ready, { step: '3' }), 3)
    assert.equal(formStepFromRequest(ready, {}), 3)
    const officeNoCity = { ...office, city: '', mobile: '' }
    assert.equal(firstUnfinishedStep({ ...started, ...officeNoCity }), 2)
    assert.equal(applicationResumePath({ ...started, ...officeNoCity }), '/doctor/apply?step=2&part=2&resume=1')
    const officeNoMobile = { ...office, mobile: '', smsConsent: false }
    assert.equal(firstUnfinishedStep({ ...started, ...officeNoMobile }), 3)
    assert.equal(applicationResumePath({ ...started, ...officeNoMobile }), '/doctor/apply?step=3&resume=1')
    assert.equal(applyStepPath('/doctor/apply', 'step=3&resume=1', 2), '/doctor/apply?step=2&resume=1&part=2')
    assert.equal(applyStepPath('/doctor/apply', '?step=2&part=2', 1), '/doctor/apply?step=2')
  })

  it('accepts years like 15+ and a website without https', () => {
    assert.equal(parseYearsInPractice('15+'), 15)
    assert.equal(parseYearsInPractice('15 years'), 15)
    assert.equal(parseYearsInPractice(''), null)
    assert.equal(normalizeWebsite('example.com'), 'https://example.com')
    assert.equal(officeAddressWithPostal('123 Main Street', '29601'), '123 Main Street 29601')
    const saved = validateStep2({ ...office, yearsInPractice: '15+', website: 'example.com' })
    assert.equal(saved.ok, true)
    if (saved.ok) {
      assert.equal(saved.value.yearsInPractice, 15)
      assert.equal(saved.value.website, 'https://example.com')
    }
    const practice = 'We focus on the nervous system and how the body adapts.'
    const gaps = gapsBeforeCard({
      practiceApproach: practice,
      heardAbout: 'Google',
      techniques: 'Toggle',
      usesNervousSystemScans: false,
      yearsInPractice: '81 years',
      officeAddress: '123 Main Street',
      city: 'Greenville',
      country: 'US',
      website: 'example.com',
      email: 'ada@example.com',
      mobile: '(864) 555-0100',
      plan: 'monthly',
    })
    assert.match(clientGapMessage(gaps), /Years in practice should be a whole number from 0 to 80/)
    assert.equal(clientGapMessage(gaps).includes('Missing: Years in practice'), false)
    const blank = gapsBeforeCard({
      practiceApproach: '',
      heardAbout: '',
      techniques: '',
      yearsInPractice: '',
      officeAddress: '',
      city: '',
      country: 'US',
      email: 'ada@example.com',
      mobile: '(864) 555-0100',
      plan: 'monthly',
    })
    assert.match(clientGapMessage(blank), /Missing: How you practice/)
  })
})
