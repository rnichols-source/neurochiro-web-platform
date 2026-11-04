import assert from 'node:assert/strict'
import { test } from 'node:test'
import { doctorNewLead, patientRequestConfirm, waitlistDoctorJoinedText } from './templates.ts'

const patient = patientRequestConfirm({
  patientFirst: 'Jamie',
  doctorLast: 'Adams',
  practice: 'Harbor Family',
})

const doctor = doctorNewLead({
  patientName: 'Jamie Lee',
  patientPhone: '+18645550100',
  patientEmail: 'jamie@example.com',
  bestTime: 'Mornings',
  note: 'Please call after 9',
})

function assertAscii(value: string) {
  for (const char of value) {
    assert.ok(char.charCodeAt(0) <= 127, `non-ascii ${char.charCodeAt(0)}`)
  }
}

test('patient and doctor texts use the exact wording', () => {
  assert.equal(
    patient,
    'NeuroChiro: Hi Jamie, your request was sent to Dr. Adams at Harbor Family. Their office will reach out soon, usually within 1 business day. Reply STOP to opt out, HELP for help.',
  )
  assert.equal(
    doctor,
    'NeuroChiro: New patient request. Jamie Lee, +18645550100. Best time: Mornings. Note: Please call after 9. Please reach out within 24 hrs. Details: https://neurochiro.co/doctor/leads Reply STOP to opt out.',
  )
})

test('both texts are plain ascii transactional messages', () => {
  for (const body of [patient, doctor]) {
    assert.ok(body.startsWith('NeuroChiro:'))
    assert.ok(body.includes('Reply STOP to opt out'))
    assertAscii(body)
    assert.equal(body.toLowerCase().includes('neurochirodirectory'), false)
    assert.equal(body.includes('Perfect Storm'), false)
  }
  assert.ok(doctor.includes('https://neurochiro.co/doctor/leads'))
  assert.ok(doctor.startsWith('NeuroChiro:'))
})

test('empty practice, empty details, health words, and long fields are cleaned up', () => {
  assert.equal(
    patientRequestConfirm({ patientFirst: 'Jamie', doctorLast: 'Adams', practice: '' }),
    'NeuroChiro: Hi Jamie, your request was sent to Dr. Adams. Their office will reach out soon, usually within 1 business day. Reply STOP to opt out, HELP for help.',
  )
  assert.equal(
    patientRequestConfirm({ patientFirst: 'Jamie', doctorLast: 'Adams', practice: 'Dr. Adams' }).includes(' at '),
    false,
  )

  const bare = doctorNewLead({
    patientName: 'Jamie Lee',
    patientPhone: '+18645550100',
    patientEmail: 'jamie@example.com',
    bestTime: '',
    note: '',
  })
  assert.equal(bare.includes('Best time:'), false)
  assert.equal(bare.includes('Note:'), false)
  assert.equal(
    bare,
    'NeuroChiro: New patient request. Jamie Lee, +18645550100. Please reach out within 24 hrs. Details: https://neurochiro.co/doctor/leads Reply STOP to opt out.',
  )

  const emailOnly = doctorNewLead({
    patientName: 'Jamie Lee',
    patientPhone: '',
    patientEmail: 'jamie@example.com',
    bestTime: 'After 3',
    note: '',
  })
  assert.ok(emailOnly.includes('Jamie Lee, jamie@example.com. Best time: After 3.'))
  assert.equal(emailOnly.includes('Note:'), false)

  const health = doctorNewLead({
    patientName: 'Jamie Lee',
    patientPhone: '+18645550100',
    patientEmail: '',
    bestTime: 'Mornings',
    note: 'My pain level is high',
  })
  assert.equal(health.includes('Note:'), false)
  assert.equal(health.includes('pain'), false)
  assert.ok(health.includes('Best time: Mornings.'))

  const longPractice = patientRequestConfirm({
    patientFirst: 'JamieWithAVeryLongFirst',
    doctorLast: 'AdamsWithAVeryLongLast',
    practice: 'Harbor Family Chiropractic Office Name',
  })
  assert.ok(longPractice.includes('Hi JamieWithAVeryLongFi,'))
  assert.ok(longPractice.includes('Dr. AdamsWithAVeryLongLa at Harbor Family Chiropractic Off.'))
  assert.equal(longPractice.includes('Harbor Family Chiropractic Office Name'), false)

  const longNote = doctorNewLead({
    patientName: 'Jamie Lee',
    patientPhone: '+18645550100',
    patientEmail: '',
    bestTime: '',
    note: 'Please call the front desk after lunch and ask for the new patient coordinator today',
  })
  assert.ok(longNote.includes('Note: Please call the front desk after lunch and ask for the ne...'))
  assert.equal(longNote.includes('coordinator'), false)
})

test('waitlist doctor-joined text points at neurochiro.co and includes STOP', () => {
  const body = waitlistDoctorJoinedText(
    'Dr. Priya Shah',
    'Mumbai',
    'https://neurochiro.co/directory/priya-shah',
  )
  assert.equal(
    body,
    'NeuroChiro: Good news! A nervous system chiropractor just joined near you: Dr. Priya Shah, Mumbai. See their profile: https://neurochiro.co/directory/priya-shah. Reply STOP to opt out.',
  )
  assert.equal(body.includes('neurochirodirectory.com'), false)
  const foreign = waitlistDoctorJoinedText('Dr. Priya Shah', 'Mumbai', 'https://example.com/nope')
  assert.ok(foreign.includes('https://neurochiro.co'))
  assert.equal(foreign.includes('example.com'), false)
})
