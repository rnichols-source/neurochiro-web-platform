import assert from 'node:assert/strict';
import test from 'node:test';
import { BLOCKED_MESSAGE, decideAccess, type AccessParty } from './access.ts';

function party(over: Partial<AccessParty> & Pick<AccessParty, 'id' | 'role'>): AccessParty {
  return {
    verified: true,
    membershipActive: true,
    acceptsStudentMessages: false,
    ...over,
  };
}

const doctor = (id: string, over: Partial<AccessParty> = {}) => party({ id, role: 'doctor', ...over });
const student = (id: string) => party({ id, role: 'student', verified: false, membershipActive: false });
const patient = (id: string) => party({ id, role: 'patient', verified: false, membershipActive: false });
const admin = (id: string) => party({ id, role: 'admin', verified: false, membershipActive: false });

test('admin can message anyone, including a patient', () => {
  const decision = decideAccess(admin('a'), patient('p'), { blocked: false, existingThread: false });
  assert.equal(decision.allowed, true);
});

test('a patient cannot message, and nobody messages a patient', () => {
  assert.equal(decideAccess(patient('p'), doctor('d'), { blocked: false, existingThread: false }).allowed, false);
  assert.equal(decideAccess(doctor('d'), patient('p'), { blocked: false, existingThread: false }).allowed, false);
});

test('doctor to doctor requires verification and an active membership on a new thread', () => {
  assert.equal(decideAccess(doctor('a'), doctor('b'), { blocked: false, existingThread: false }).allowed, true);
  const unverified = decideAccess(doctor('a', { verified: false }), doctor('b'), { blocked: false, existingThread: false });
  assert.equal(unverified.allowed, false);
  if (!unverified.allowed) assert.equal(unverified.code, 'unverified');
  const recipient = decideAccess(doctor('a'), doctor('b', { verified: false }), { blocked: false, existingThread: true });
  assert.equal(recipient.allowed, false);
  const lapsedNew = decideAccess(doctor('a', { membershipActive: false }), doctor('b'), { blocked: false, existingThread: false });
  assert.equal(lapsedNew.allowed, false);
  if (!lapsedNew.allowed) assert.equal(lapsedNew.code, 'membership');
});

test('a lapsed member can reply in an existing thread', () => {
  const decision = decideAccess(doctor('a', { membershipActive: false }), doctor('b'), { blocked: false, existingThread: true });
  assert.equal(decision.allowed, true);
});

test('doctor to student and student to student are open', () => {
  assert.equal(decideAccess(doctor('a'), student('s'), { blocked: false, existingThread: false }).allowed, true);
  assert.equal(decideAccess(student('s1'), student('s2'), { blocked: false, existingThread: false }).allowed, true);
});

test('a student can message a doctor only when that doctor accepts student messages', () => {
  const closed = decideAccess(student('s'), doctor('d'), { blocked: false, existingThread: false });
  assert.equal(closed.allowed, false);
  const open = decideAccess(student('s'), doctor('d', { acceptsStudentMessages: true }), { blocked: false, existingThread: false });
  assert.equal(open.allowed, true);
});

test('a block in either direction refuses with the public sentence', () => {
  const decision = decideAccess(doctor('a'), doctor('b'), { blocked: true, existingThread: true });
  assert.equal(decision.allowed, false);
  if (!decision.allowed) assert.equal(decision.userMessage, BLOCKED_MESSAGE);
});
