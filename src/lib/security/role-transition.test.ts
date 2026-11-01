import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canAutoCorrectToDoctor,
  canTransitionStudentToDoctor,
  canTransitionToVendor,
} from './role-transition.ts'

const blocked = ['admin', 'super_admin', 'founder', 'regional_admin', 'owner', '']

for (const role of blocked) {
  test(`vendor transition rejects ${role || 'blank'}`, () => {
    assert.equal(canTransitionToVendor(role), false)
  })
  test(`student to doctor rejects ${role || 'blank'}`, () => {
    assert.equal(canTransitionStudentToDoctor(role), false)
  })
}

for (const role of ['admin', 'super_admin', 'founder', 'regional_admin', 'vendor', 'student', 'doctor']) {
  test(`login auto-correct rejects ${role}`, () => {
    assert.equal(canAutoCorrectToDoctor(role, true), false)
  })
}

test('login auto-correct allows patient or blank only with a doctors row', () => {
  assert.equal(canAutoCorrectToDoctor('patient', true), true)
  assert.equal(canAutoCorrectToDoctor('', true), true)
  assert.equal(canAutoCorrectToDoctor(null, true), true)
  assert.equal(canAutoCorrectToDoctor('patient', false), false)
  assert.equal(canAutoCorrectToDoctor('', false), false)
})

test('vendor transition allows doctor, student, and patient', () => {
  assert.equal(canTransitionToVendor('doctor'), true)
  assert.equal(canTransitionToVendor('student'), true)
  assert.equal(canTransitionToVendor('patient'), true)
})

test('student to doctor allows student and student_paid', () => {
  assert.equal(canTransitionStudentToDoctor('student'), true)
  assert.equal(canTransitionStudentToDoctor('student_paid'), true)
  assert.equal(canTransitionStudentToDoctor('patient'), false)
})
