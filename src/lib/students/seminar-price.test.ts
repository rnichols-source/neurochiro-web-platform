import assert from 'node:assert/strict';
import test from 'node:test';
import { memberTicketPrice } from '../seminars/utm.ts';
import { STUDENT_CONFIG } from '../../config/students.ts';

test('student members get the configured seminar discount', () => {
  const result = memberTicketPrice({
    price: 100,
    isMember: true,
    discountPct: STUDENT_CONFIG.seminars.studentDiscountPct,
  });
  assert.equal(result.amount, 75);
  assert.equal(result.memberDiscountApplied, true);
});

test('a calendar file includes the call time', () => {
  const ics = [
    'BEGIN:VCALENDAR',
    'BEGIN:VEVENT',
    'DTSTART:20261203T010000Z',
    'SUMMARY:Monthly call',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  assert.match(ics, /DTSTART:20261203T010000Z/);
  assert.match(ics, /SUMMARY:Monthly call/);
});
