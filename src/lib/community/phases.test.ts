import assert from 'node:assert/strict'
import test from 'node:test'
import { planLeadTexts } from '../sms/plan.ts'
import { buildVisitOfficeAlert } from './visit-alert.ts'
import {
  SAMPLE_SET,
  FEELING_LABELS,
  formatTripRange,
  invitationFoundNotice,
  invitationMessage,
  invitationUrl,
  isInvitationToken,
  openingMatches,
  parseExerciseDraft,
  parsePlace,
  passportDoctorView,
  passportHomeLine,
  prepareInvitation,
  prepareLiveQuestion,
  preparePassportShare,
  prepareWorkInterest,
  reminderLine,
  validateTripDates,
  weekStartKey,
  showCountdown,
  weeklyShowLine,
  workConnectNotice,
} from './phases.ts'

const now = new Date('2026-11-13T15:00:00Z')

test('this week starts on Monday in Eastern time', () => {
  assert.equal(weekStartKey(now), '2026-11-09')
  assert.equal(FEELING_LABELS.doing_well, 'Doing well')
  const show = weeklyShowLine(now)
  assert.match(show.label, /8 PM ET/)
  assert.equal(show.dateKey, '2026-11-19')
  const left = showCountdown(now)
  assert.equal(left.days, 6)
  assert.equal(left.hours, 10)
  assert.equal(left.minutes, 0)
})

test('a live question is short and is not stored as a chart', () => {
  assert.equal('error' in prepareLiveQuestion('hi'), true)
  const ok = prepareLiveQuestion('What does a weekly adjustment cover for someone new?')
  assert.equal('body' in ok, true)
})

test('places cover a city, a state, a country, and the same city', () => {
  const denver = parsePlace('Denver, Colorado')
  assert.equal('error' in denver, false)
  if ('error' in denver) return
  assert.equal(denver.city, 'Denver')
  assert.equal(denver.stateCode, 'CO')
  assert.equal(denver.countryCode, 'US')
  assert.equal(denver.scope, 'city')

  const colorado = parsePlace('Colorado')
  assert.equal('error' in colorado, false)
  if ('error' in colorado) return
  assert.equal(colorado.scope, 'state')
  assert.equal(colorado.stateCode, 'CO')

  const uk = parsePlace('United Kingdom')
  assert.equal('error' in uk, false)
  if ('error' in uk) return
  assert.equal(uk.scope, 'country')
  assert.equal(uk.countryCode, 'GB')

  const london = parsePlace('London')
  assert.equal('error' in london, false)
  if ('error' in london) return
  assert.equal(london.city, 'London')
  assert.equal(london.countryCode, 'GB')

  const austin = parsePlace('Austin')
  assert.equal('error' in austin, false)
  if ('error' in austin) return
  assert.equal(austin.scope, 'city')
  assert.equal(austin.city, 'Austin')

  const greenville = parsePlace('Greenville, SC')
  assert.equal('error' in greenville, false)
  if ('error' in greenville) return
  assert.equal(greenville.city, 'Greenville')
  assert.equal(greenville.stateCode, 'SC')
})

test('trip dates and the home line stay short', () => {
  assert.equal(validateTripDates('2026-11-20', '2026-11-24', now), null)
  assert.match(validateTripDates('2026-11-24', '2026-11-20', now) || '', /end date/)
  assert.equal(formatTripRange('2026-11-20', '2026-11-24'), 'Nov 20–24')
  assert.equal(
    passportHomeLine('Denver, Colorado', '2026-11-20', '2026-11-24'),
    "You're going to Denver, Colorado Nov 20–24. Find a nervous system chiropractor while you're there.",
  )
})

test('a passport introduction keeps anything that was not chosen', () => {
  const hidden = preparePassportShare({
    shareFirstName: false,
    shareHomeClinic: false,
    shareFamily: false,
    shareExercises: false,
    firstName: 'Maya',
    homeClinicLabel: 'Dr. Priya Shah · Austin',
    familyFirstNames: ['Leo'],
    exerciseTitles: ['Sample · how a set looks'],
    note: 'Hello from the road',
  })
  assert.equal(hidden.error, null)
  assert.equal(hidden.sharedFirstName, null)
  assert.equal(hidden.homeClinicLabel, null)
  assert.equal(hidden.familyFirstNames, null)
  assert.equal(hidden.exerciseTitles, null)

  const view = passportDoctorView({
    place: 'Denver',
    when: 'Nov 20–24',
    sharedFirstName: null,
    homeClinicLabel: null,
    familyFirstNames: null,
    exerciseTitles: null,
    note: null,
  })
  assert.match(view.lines.join(' '), /community member/)
  assert.doesNotMatch(view.lines.join(' '), /Maya|Leo|Priya|patient/i)
})

test('exercise drafts are the doctor’s words and the sample is labeled', () => {
  assert.match(SAMPLE_SET.title, /Sample/)
  assert.match(SAMPLE_SET.note, /not care/)
  assert.doesNotMatch(`${SAMPLE_SET.note} ${SAMPLE_SET.steps.join(' ')}`, /diagnos|stretch|remedy/i)
  const draft = parseExerciseDraft({
    title: 'Home set from your visit',
    note: 'As we discussed.',
    stepsText: 'Do the first step I wrote\nMark it here when you have',
  })
  assert.equal('steps' in draft, true)
  const rejected = parseExerciseDraft({ title: 'Sample stretch', note: '', stepsText: 'Step one here' })
  assert.equal('error' in rejected, true)
  if ('error' in rejected) assert.match(rejected.error, /Sample/)
})

test('a care invitation is a private neurochiro.co link across places', () => {
  const invite = prepareInvitation({
    recipientWords: 'my grandson',
    place: 'London',
    note: 'You asked who to see.',
  })
  assert.equal('error' in invite, false)
  if ('error' in invite) return
  assert.equal(invite.place.countryCode, 'GB')
  const token = 'abcdefghijklmnopqrstuv'
  assert.equal(isInvitationToken(token), true)
  const message = invitationMessage({
    placeLabel: invite.place.label,
    note: invite.note,
    doctorTitle: null,
    token,
  })
  assert.match(message, new RegExp(invitationUrl(token).replace(/[.]/g, '\\.')))
  assert.match(message, /https:\/\/neurochiro\.co\/for\//)
  assert.doesNotMatch(message, /patient|neurochirodirectory/i)
  const found = invitationFoundNotice('London')
  assert.equal(found.title, 'They found someone')
  assert.doesNotMatch(found.body, /pain|symptom|patient/i)
  const blocked = prepareInvitation({ recipientWords: 'mom', place: 'Austin', note: 'her MRI results' })
  assert.equal('error' in blocked, true)
  if ('error' in blocked) assert.match(blocked.error, /health/)
})

test('work interest stays to the three paths', () => {
  const interest = prepareWorkInterest({ path: 'ca', place: 'Austin, TX', note: 'I can help at the front of the office.' })
  assert.equal('error' in interest, false)
  if ('error' in interest) return
  assert.equal(interest.path, 'ca')
  assert.equal(interest.place.stateCode, 'TX')
  assert.equal(openingMatches('ca', 'CA for a nervous system office'), true)
  assert.equal(openingMatches('front_desk', 'Front desk coordinator'), true)
  assert.equal(openingMatches('student', 'Student observer'), true)
  assert.equal(openingMatches('ca', 'Associate doctor'), false)
  const notice = workConnectNotice('Oak Nerve', 'Austin', 'front_desk')
  assert.match(notice.body, /Front desk/)
  assert.doesNotMatch(notice.body, /patient/i)
  assert.match(reminderLine('Home set'), /quiet minute/)
})

test('visit office alerts say community member and omit unchecked contact details', () => {
  const alert = buildVisitOfficeAlert({
    sharedFirstName: null,
    forFirstName: null,
    sharedEmail: null,
    callbackPhone: null,
    sharedFamilyNames: null,
    note: 'Weekday morning works',
    preferredWindow: 'Weekday morning',
    practiceName: 'Oak Nerve',
  })
  const blob = `${alert.subject}\n${alert.text}\n${alert.sms}\n${alert.html}`
  assert.match(blob, /community member/)
  assert.doesNotMatch(blob, /patient/i)
  assert.doesNotMatch(alert.text, /512/)
  assert.match(alert.text, /https:\/\/neurochiro\.co\/doctor\/visit-requests/)
  assert.match(alert.sms, /https:\/\/neurochiro\.co\/doctor\/visit-requests/)

  const open = buildVisitOfficeAlert({
    sharedFirstName: 'Maya',
    forFirstName: null,
    sharedEmail: 'maya@example.com',
    callbackPhone: '5125550100',
    sharedFamilyNames: null,
    note: null,
    preferredWindow: null,
    practiceName: 'Oak Nerve',
  })
  assert.match(open.sms, /Maya, 5125550100/)
  assert.doesNotMatch(open.sms, /patient/i)
})

test('a visit text is not stored as a public contact request', () => {
  const plans = planLeadTexts({
    requestId: 'visit-1',
    smsConsentSaved: true,
    officeBody: 'NeuroChiro: New community member visit request. Maya. Details: https://neurochiro.co/doctor/visit-requests Reply STOP to opt out.',
    doctor: {
      id: 'doc-1',
      state: 'TX',
      country: 'US',
      lastName: 'Shah',
      practice: 'Oak Nerve',
      leadAlertPhones: ['+15125550100'],
      smsAlertsEnabled: true,
      smsAlertsConsentAt: '2026-11-01T00:00:00Z',
    },
    patient: {
      name: 'Maya',
      phone: '5125550100',
      email: 'maya@example.com',
      smsPhone: '+15125550100',
      bestTime: null,
      message: null,
    },
    now,
    runtime: { enabled: true, testPhone: null, testRedirect: false },
  })
  assert.equal(plans.length, 1)
  assert.equal(plans[0].audience, 'doctor')
  assert.equal(plans[0].contactRequestId, null)
  assert.match(plans[0].body, /community member/)
  assert.doesNotMatch(plans[0].body, /patient/i)
  assert.match(plans[0].dedupeKey, /^visit:/)
})
