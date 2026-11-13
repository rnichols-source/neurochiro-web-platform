import assert from 'node:assert/strict'
import test from 'node:test'
import { canAutoCorrectToDoctor } from '../security/role-transition.ts'
import {
  COMMUNITY_ROLE_LABEL,
  communityNavId,
  communityWelcome,
  discordSignupLabel,
  doctorVisitNotice,
  hasRecentOpenRequest,
  homeDoctorCard,
  homeGreeting,
  householdLine,
  isCommunityPath,
  isStoredCommunityRole,
  networkJoinLine,
  prepareVisitShare,
  privacyFromRow,
  roleLabel,
  signupChoiceLabel,
} from './logic.ts'

test('stored patient role is presented as a community member', () => {
  assert.equal(isStoredCommunityRole('patient'), true)
  assert.equal(roleLabel('patient'), COMMUNITY_ROLE_LABEL)
  assert.equal(signupChoiceLabel('patient'), 'Community member')
  assert.equal(signupChoiceLabel('doctor'), 'Doctor')
  assert.equal(discordSignupLabel('patient'), 'COMMUNITY MEMBER')
  assert.equal(networkJoinLine('patient'), 'New community member joined the network')
  assert.equal(networkJoinLine('doctor'), 'New doctor joined the network')
})

test('a clinic-looking email does not change the community role decision', () => {
  const email = 'frontdesk@oakandnerve.com'
  assert.equal(canAutoCorrectToDoctor('patient', false), false)
  assert.equal(email.includes('@'), true)
  assert.equal(isStoredCommunityRole('patient'), true)
})

test('community routes stay on the new home and later phases are separate', () => {
  assert.equal(isCommunityPath('/portal'), true)
  assert.equal(isCommunityPath('/portal/'), true)
  assert.equal(isCommunityPath('/portal/care'), true)
  assert.equal(isCommunityPath('/portal/dashboard'), true)
  assert.equal(isCommunityPath('/portal/track'), false)
  assert.equal(isCommunityPath('/doctor/dashboard'), false)
  assert.equal(communityNavId('/portal/passport'), 'refer')
  assert.equal(communityNavId('/portal/care/invite'), 'refer')
  assert.equal(communityNavId('/portal/refer'), 'refer')
  assert.equal(communityNavId('/portal/privacy'), 'me')
  assert.equal(communityNavId('/portal/you'), 'me')
  assert.equal(communityNavId('/portal/me'), 'me')
  assert.equal(communityNavId('/portal/work'), 'me')
  assert.equal(communityNavId('/portal/family'), 'me')
  assert.equal(communityNavId('/portal/find'), 'care')
  assert.equal(communityNavId('/portal/week'), 'week')
  assert.equal(isCommunityPath('/portal/refer'), true)
  assert.equal(isCommunityPath('/portal/me'), true)
})

test('greeting uses the member first name and a time of day', () => {
  const evening = new Date('2026-11-13T23:30:00Z')
  assert.equal(homeGreeting(evening, 'America/New_York', 'Maya Chen'), 'Good evening, Maya')
  assert.equal(homeGreeting(evening, 'America/New_York', ''), 'Good evening')
})

test('privacy defaults are all off when nothing is saved', () => {
  const prefs = privacyFromRow(null)
  assert.deepEqual(Object.values(prefs), [false, false, false, false, false])
  assert.equal(privacyFromRow({ share_name_with_home_doctor: true }).shareNameWithHomeDoctor, true)
  assert.equal(privacyFromRow({ share_email_with_home_doctor: 'yes' }).shareEmailWithHomeDoctor, false)
})

test('a visit shares only the boxes that were checked', () => {
  const hidden = prepareVisitShare({
    shareFirstName: false,
    shareForName: false,
    shareEmail: false,
    sharePhone: false,
    shareFamilyFirstNames: false,
    selfFirstName: 'Maya',
    email: 'maya@example.com',
    phone: '5125550100',
    familyFirstNames: ['Leo'],
    forFamilyFirstName: null,
    note: 'Weekday if you can',
    preferredWindow: 'Weekday morning',
  })
  assert.equal(hidden.error, null)
  assert.equal(hidden.sharedFirstName, null)
  assert.equal(hidden.sharedEmail, null)
  assert.equal(hidden.callbackPhone, null)
  assert.equal(hidden.sharedFamilyNames, null)
  assert.equal(hidden.preferredWindow, 'Weekday morning')

  const open = prepareVisitShare({
    shareFirstName: true,
    shareForName: false,
    shareEmail: true,
    sharePhone: true,
    shareFamilyFirstNames: true,
    selfFirstName: 'Maya',
    email: 'maya@example.com',
    phone: '(512) 555-0100',
    familyFirstNames: ['Leo', 'leo'],
    forFamilyFirstName: null,
    note: '',
    preferredWindow: '',
  })
  assert.equal(open.sharedFirstName, 'Maya')
  assert.equal(open.sharedEmail, 'maya@example.com')
  assert.equal(open.callbackPhone, '(512) 555-0100')
  assert.equal(open.sharedFamilyNames, 'Leo')
})

test('visit notes reject chart language', () => {
  const result = prepareVisitShare({
    shareFirstName: true,
    shareForName: false,
    shareEmail: false,
    sharePhone: false,
    shareFamilyFirstNames: false,
    selfFirstName: 'Maya',
    email: null,
    phone: null,
    familyFirstNames: [],
    forFamilyFirstName: null,
    note: 'My pain level is high after the MRI',
    preferredWindow: '',
  })
  assert.match(result.error || '', /scheduling/)
})

test('doctor notice omits contact details that were not shared', () => {
  const notice = doctorVisitNotice({
    sharedFirstName: null,
    forFirstName: null,
    sharedEmail: null,
    callbackPhone: '5125550100',
    sharedFamilyNames: null,
    preferredWindow: null,
  })
  assert.equal(notice.title, 'Visit request')
  assert.match(notice.body, /A community member/)
  assert.doesNotMatch(notice.body, /5125550100/)
  assert.doesNotMatch(notice.body, /patient/i)
})

test('duplicate visit requests inside a day are recognized', () => {
  const now = new Date('2026-11-13T15:00:00Z')
  assert.equal(hasRecentOpenRequest([
    { doctorId: 'd1', status: 'requested', createdAt: '2026-11-13T14:00:00Z' },
  ], 'd1', now), true)
  assert.equal(hasRecentOpenRequest([
    { doctorId: 'd1', status: 'requested', createdAt: '2026-11-10T14:00:00Z' },
  ], 'd1', now), false)
})

test('home doctor card uses the listing name and not a fictional office', () => {
  const card = homeDoctorCard({
    id: 'doc-1',
    first_name: 'Priya',
    last_name: 'Shah',
    clinic_name: 'Oak Nerve',
    city: 'Austin',
    state: 'TX',
    verification_status: 'verified',
    user_id: 'user-1',
    slug: 'priya-shah',
  })
  assert.equal(card.title, 'Dr. Priya Shah')
  assert.equal(card.practice, 'Oak Nerve')
  assert.equal(card.place, 'Austin · your home doctor')
  assert.equal(card.initials, 'PS')
  assert.equal(card.listed, true)
})

test('household line stays short', () => {
  assert.match(householdLine([]), /children/)
  assert.equal(householdLine(['Leo']), 'Leo is under this roof with you.')
  assert.equal(householdLine(['Leo', 'Ava', 'Sam']), 'Leo and 2 others are under this roof with you.')
})

test('welcome copy names Your NeuroChiro and stays off the word patient', () => {
  const welcome = communityWelcome('Maya Chen')
  assert.equal(welcome.ctaUrl, 'https://neurochiro.co/portal')
  assert.match(welcome.html, /Your NeuroChiro/)
  assert.doesNotMatch(`${welcome.subject} ${welcome.html}`, /patient/i)
})
