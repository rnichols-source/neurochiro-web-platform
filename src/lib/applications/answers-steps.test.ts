import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  applicationStopLabel,
  composeHeardAbout,
  firstUnfinishedStep,
  parseHeardAbout,
  validateAnswers,
  validateStep1,
} from './answers.ts'

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
  smsConsent: false,
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
      assert.equal(other.value.smsConsent, false)
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
    assert.equal(applicationStopLabel({ status: 'draft', cardOnFile: false, answers: {} }), 'Step 1 of 3')
    assert.equal(applicationStopLabel({
      status: 'draft',
      cardOnFile: false,
      answers: { practiceApproach: practice, heardAbout: 'Event', whyJoin: '' },
    }), 'Step 2 of 3')
    assert.equal(applicationStopLabel({ status: 'under_review', cardOnFile: true, answers: {} }), 'Submitted')
  })
})
