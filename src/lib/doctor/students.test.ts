import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { mapListedStudent, sameCity, studentBucket } from './students.ts'

describe('student directory rows', () => {
  it('reads the profile first and uses the students row for school verification', () => {
    const listed = mapListedStudent({
      id: 'student-1',
      full_name: 'Avery Cole',
      chiropractic_school: 'Life University',
      school_name: 'Other school',
      graduation_year: '2027',
      areas_of_interest: ['Wants to shadow', 'Pediatric'],
      practice_city: 'Greenville',
      practice_state: 'SC',
      current_year_in_school: 'Tri 8',
    }, {
      id: 'student-1',
      school_name: 'Verification school',
      graduation_year: 2028,
      school_verified: true,
    })
    assert.equal(listed.name, 'Avery Cole')
    assert.equal(listed.userId, 'student-1')
    assert.equal(listed.school, 'Life University')
    assert.equal(listed.graduationYear, 2027)
    assert.equal(listed.bucket, 'shadowing')
    assert.equal(listed.location, 'Greenville, SC')
    assert.equal(listed.detail, 'class of 2027 · Greenville, SC · Tri 8 · School verified')
  })

  it('falls back to the verification school and year when the profile is blank', () => {
    const listed = mapListedStudent({
      id: 'student-2',
      full_name: '  ',
      areas_of_interest: ['Looking for an associate role'],
    }, {
      id: 'student-2',
      school_name: 'Palmer',
      graduation_year: 2026,
      school_verified: false,
    })
    assert.equal(listed.name, 'Student')
    assert.equal(listed.school, 'Palmer')
    assert.equal(listed.graduationYear, 2026)
    assert.equal(listed.bucket, 'associate')
    assert.equal(listed.schoolVerified, false)
    assert.equal(listed.detail, 'class of 2026')
  })

  it('treats mentoring interest and a matching city as their own facts', () => {
    assert.equal(studentBucket(['Mentorship']), 'mentoring')
    assert.equal(studentBucket(['Technique']), 'other')
    assert.equal(sameCity(' Austin ', 'austin'), true)
    assert.equal(sameCity('', 'Austin'), false)
    assert.equal(sameCity('Austin', 'Round Rock'), false)
  })
})
