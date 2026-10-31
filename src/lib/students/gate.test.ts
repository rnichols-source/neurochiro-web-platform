import assert from 'node:assert/strict';
import test from 'node:test';
import { memberGateDecision, aiUsageAllowed } from './gate.ts';
import { studentGreetingName } from './greeting.ts';
import { buildCallIcs } from './ics.ts';

test('gate opens for members, grace, and past_due', () => {
  assert.equal(memberGateDecision({ requiresMember: true, status: 'member' }), 'open');
  assert.equal(memberGateDecision({ requiresMember: true, status: 'grace' }), 'open');
  assert.equal(memberGateDecision({ requiresMember: true, status: 'past_due' }), 'open');
  assert.equal(memberGateDecision({ requiresMember: true, status: 'free' }), 'locked');
  assert.equal(memberGateDecision({ requiresMember: false, status: 'free' }), 'open');
});

test('ai cap allows fewer uses than the limit', () => {
  assert.equal(aiUsageAllowed(4, 5), true);
  assert.equal(aiUsageAllowed(5, 5), false);
});

test('placeholder names greet with Welcome', () => {
  assert.equal(studentGreetingName('New Member'), 'Welcome');
  assert.equal(studentGreetingName(''), 'Welcome');
  assert.equal(studentGreetingName('Ada Lovelace'), 'Ada');
});

test('call ics uses UTC stamps', () => {
  const ics = buildCallIcs({
    id: 'abc',
    title: 'Monthly call',
    startsAt: '2026-12-01T16:00:00.000Z',
    durationMin: 60,
  });
  assert.match(ics, /DTSTART:20261201T160000Z/);
  assert.match(ics, /DTEND:20261201T170000Z/);
  assert.match(ics, /SUMMARY:Monthly call/);
});
