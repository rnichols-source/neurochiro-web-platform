import assert from 'node:assert/strict';
import test from 'node:test';
import { parseStudentOnboarding, studentProfileComplete, knownTechniques } from './onboarding-fields.ts';

const COMPLETE = {
  school: 'Life University',
  yearInSchool: 'Tri 8',
  graduationYear: '2028',
  city: 'Marietta',
  state: 'Georgia',
  techniques: ['Diversified', 'Not a technique', 'Diversified', 'Gonstead'],
};

test('a complete student profile keeps only real technique names and a state code', () => {
  const parsed = parseStudentOnboarding(COMPLETE);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.value.state, 'GA');
  assert.deepEqual(parsed.value.techniques, ['Diversified', 'Gonstead']);
  assert.equal(parsed.value.graduationYear, 2028);
  assert.equal(studentProfileComplete(parsed.value), true);
});

test('missing school, trimester, city, state, or technique is an error', () => {
  assert.equal(parseStudentOnboarding({ ...COMPLETE, school: ' ' }).ok, false);
  assert.equal(parseStudentOnboarding({ ...COMPLETE, yearInSchool: 'Year 2' }).ok, false);
  assert.equal(parseStudentOnboarding({ ...COMPLETE, city: 'A' }).ok, false);
  assert.equal(parseStudentOnboarding({ ...COMPLETE, state: 'Not a state' }).ok, false);
  assert.equal(parseStudentOnboarding({ ...COMPLETE, techniques: ['Not a technique'] }).ok, false);
  assert.equal(parseStudentOnboarding({ ...COMPLETE, graduationYear: '1990' }).ok, false);
  assert.deepEqual(knownTechniques('Diversified'), []);
  assert.equal(studentProfileComplete({ school: 'Life University' }), false);
});
