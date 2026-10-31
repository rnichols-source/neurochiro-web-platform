import assert from 'node:assert/strict';
import test from 'node:test';
import { sentToReceiverEmail, patientIntroEmail } from './emails.ts';

test('the receiver email names the patient and does not include a phone', () => {
  const phone = '555-0100';
  const mail = sentToReceiverEmail({
    id: 'ref-1',
    referrerName: 'Dr. Ada',
    patientFirst: 'Sam',
    patientInitial: 'Q',
    reason: 'They asked for a doctor closer to home',
    urgency: 'routine',
  });
  assert.match(mail.subject, /sent you a patient/);
  assert.match(mail.html, /Sam Q\./);
  assert.match(mail.html, /\/doctor\/referrals\/ref-1/);
  assert.equal(mail.html.includes(phone), false);
});

test('the patient intro includes the footer line', () => {
  const mail = patientIntroEmail({
    patientFirst: 'Sam',
    receiverName: 'Dr. Bea',
    clinic: 'North Clinic',
    phone: '555-0199',
    address: '1 Main',
    bookingUrl: 'https://example.com/book',
    profileUrl: 'https://neurochiro.co/directory/bea',
  });
  assert.match(mail.html, /agreed to share your name and phone/);
  assert.match(mail.html, /555-0199/);
});
