import assert from 'node:assert/strict';
import test from 'node:test';
import { studentNavId } from './places.ts';

test('student places resolve the main routes', () => {
  assert.equal(studentNavId('/student/dashboard'), 'home');
  assert.equal(studentNavId('/student/mentorship'), 'call');
  assert.equal(studentNavId('/student/doctors'), 'match');
  assert.equal(studentNavId('/student/match'), 'match');
  assert.equal(studentNavId('/student/jobs/123'), 'jobs');
  assert.equal(studentNavId('/student/billing'), 'me');
  assert.equal(studentNavId('/student/philosophy'), null);
});
