import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildNextSteps,
  communityMemberCopy,
  doctorGreetingName,
  doctorNavId,
  profileChecklist,
  usesOwnChrome,
} from './places.ts'

test('nav keeps today, people, care, network, and practice apart', () => {
  assert.equal(doctorNavId('/doctor'), 'today')
  assert.equal(doctorNavId('/doctor/dashboard'), 'today')
  assert.equal(doctorNavId('/doctor/people'), 'people')
  assert.equal(doctorNavId('/doctor/leads'), 'people')
  assert.equal(doctorNavId('/doctor/care-sets/si-joint'), 'care')
  assert.equal(doctorNavId('/doctor/network/students'), 'network')
  assert.equal(doctorNavId('/doctor/seminars'), 'network')
  assert.equal(doctorNavId('/doctor/marketplace'), 'network')
  assert.equal(doctorNavId('/doctor/practice'), 'practice')
  assert.equal(doctorNavId('/doctor/kpi'), 'practice')
  assert.equal(doctorNavId('/doctor/care-plan-closer'), 'practice')
  assert.equal(doctorNavId('/doctor/messages'), 'messages')
  assert.equal(doctorNavId('/doctor/coming-soon'), 'soon')
})

test('new places use their own chrome and older tools stay inside the shell', () => {
  assert.equal(usesOwnChrome('/doctor/profile'), true)
  assert.equal(usesOwnChrome('/doctor/network'), true)
  assert.equal(usesOwnChrome('/doctor/seminars'), false)
  assert.equal(usesOwnChrome('/doctor/tools'), false)
})

test('greeting uses the last name', () => {
  assert.equal(doctorGreetingName('Priya Shah'), 'Dr. Shah')
  assert.equal(doctorGreetingName('Dr. Priya Shah'), 'Dr. Shah')
  assert.equal(doctorGreetingName(''), 'Doctor')
})

test('profile checklist counts six sections and names what is left', () => {
  const open = profileChecklist({
    photoUrl: 'https://neurochiro.co/photo.jpg',
    bio: 'Short.',
    shortIntro: null,
    listingFormat: 'practice',
    coOwnerCount: 2,
    city: 'Austin',
    address: '1 Oak St',
    techniques: 0,
    hours: '',
  })
  assert.equal(open.complete, false)
  assert.equal(open.remaining.includes('bio'), true)
  assert.equal(open.remaining.includes('techniques'), true)
  assert.equal(open.remaining.includes('hours'), true)
  assert.equal(open.steps.find((step) => step.key === 'co_owners')?.done, true)

  const done = profileChecklist({
    photoUrl: 'https://neurochiro.co/photo.jpg',
    bio: 'We help Austin families build a calmer nervous system. Visits are unhurried.',
    shortIntro: null,
    listingFormat: 'lead',
    coOwnerCount: 0,
    city: 'Austin',
    address: null,
    techniques: 1,
    hours: 'Mon–Thu 9–5',
  })
  assert.equal(done.complete, true)
  assert.equal(done.percent, 100)
})

test('the next step is the profile until it is finished or skipped', () => {
  const checklist = profileChecklist({
    photoUrl: null,
    bio: null,
    shortIntro: null,
    listingFormat: 'lead',
    coOwnerCount: 0,
    city: null,
    address: null,
    techniques: 0,
    hours: null,
  })
  const first = buildNextSteps({ checklist, skipProfile: false, waiting: 2, referrals: 1, unread: 3 })
  assert.equal(first[0].id, 'profile')
  assert.equal(first[0].skip, true)
  assert.equal(first.length, 4)
  const skipped = buildNextSteps({ checklist, skipProfile: true, waiting: 2, referrals: 0, unread: 0 })
  assert.equal(skipped[0].id, 'people')
  const clear = buildNextSteps({
    checklist: profileChecklist({
      photoUrl: 'x',
      bio: 'One sentence here. Another sentence here.',
      shortIntro: null,
      listingFormat: 'lead',
      coOwnerCount: 0,
      city: 'Austin',
      address: null,
      techniques: 1,
      hours: '9–5',
    }),
    skipProfile: false,
    waiting: 0,
    referrals: 0,
    unread: 0,
  })
  assert.equal(clear[0].id, 'clear')
})

test('referral errors say community member', () => {
  assert.equal(communityMemberCopy('Patient consent is required.'), 'Consent is required.')
  assert.equal(communityMemberCopy("Enter the patient's first name."), "Enter the community member's first name.")
  assert.equal(communityMemberCopy('You already sent this patient to that doctor.'), 'You already sent this community member to that doctor.')
  assert.match(communityMemberCopy('You cannot refer a patient to yourself.'), /community member/)
  assert.equal(communityMemberCopy('You cannot refer a patient to yourself.').includes('patient'), false)
})
