import assert from 'node:assert/strict';
import test from 'node:test';
import { haversineDistance } from '../geo.ts';
import {
  canSeePatientContact,
  interpretLocation,
  planReminders,
  referralDistance,
  shouldResolvePlace,
  shouldSendPatientIntro,
} from './pure.ts';

test('Austin, TX stays in Texas and a bare Austin is a choice', () => {
  const exact = interpretLocation({
    resolved: { city: 'Austin', state: 'TX', lat: 30.27, lng: -97.74 },
    ambiguous: null,
    confidence: 'exact',
  });
  assert.equal(exact.kind, 'resolved');
  if (exact.kind === 'resolved') assert.equal(exact.place.state, 'TX');

  const bare = interpretLocation({
    resolved: null,
    confidence: 'ambiguous',
    ambiguous: [
      { city: 'Austin', state: 'TX', lat: 30.27, lng: -97.74 },
      { city: 'Austin', state: 'AR', lat: 34.99, lng: -91.97 },
    ],
  });
  assert.equal(bare.kind, 'choices');
  if (bare.kind === 'choices') assert.equal(bare.choices.length, 2);

  const dominant = interpretLocation({
    resolved: { city: 'Austin', state: 'TX', lat: 30.27, lng: -97.74 },
    ambiguous: null,
    confidence: 'dominant',
    rejectedCandidates: [{ city: 'Austin', state: 'AR', lat: 34.99, lng: -91.97 }],
  });
  assert.equal(dominant.kind, 'choices');
});

test('78701 is treated as a postal code and resolves through the shared shape', () => {
  assert.equal(shouldResolvePlace('78701'), true);
  assert.equal(shouldResolvePlace('Austin, TX'), true);
  assert.equal(shouldResolvePlace('Austin'), true);
  const zip = interpretLocation({
    resolved: { city: 'Austin', state: 'TX', lat: 30.27, lng: -97.74 },
    ambiguous: null,
    confidence: 'exact',
  });
  assert.equal(zip.kind, 'resolved');
  if (zip.kind === 'resolved') {
    assert.equal(zip.place.city, 'Austin');
    assert.equal(zip.place.state, 'TX');
  }
});

test('a fixture distance matches the directory haversine', () => {
  const origin = { lat: 30.2672, lng: -97.7431 };
  const doctor = { lat: 30.3072, lng: -97.7531 };
  const miles = referralDistance(origin.lat, origin.lng, doctor.lat, doctor.lng);
  assert.equal(miles, haversineDistance(origin.lat, origin.lng, doctor.lat, doctor.lng));
  assert.ok(miles > 2 && miles < 4);
});

test('the receiver cannot see the phone before accept and can after', () => {
  const base = { viewerDoctorId: 'recv', referringDoctorId: 'from', receivingDoctorId: 'recv' };
  assert.equal(canSeePatientContact({ ...base, status: 'sent' }), false);
  assert.equal(canSeePatientContact({ ...base, status: 'pending' }), false);
  assert.equal(canSeePatientContact({ ...base, status: 'viewed' }), false);
  assert.equal(canSeePatientContact({ ...base, status: 'accepted' }), true);
  assert.equal(canSeePatientContact({ ...base, status: 'patient_contacted' }), true);
  assert.equal(canSeePatientContact({ ...base, status: 'scheduled' }), true);
  assert.equal(canSeePatientContact({ ...base, viewerDoctorId: 'from', status: 'sent' }), true);
  assert.equal(canSeePatientContact({ ...base, viewerDoctorId: 'other', status: 'accepted' }), false);
});

test('reminders fire once', () => {
  const created = '2026-11-01T12:00:00.000Z';
  const row = { status: 'sent', created_at: created, expires_at: '2026-11-08T12:00:00.000Z' };
  assert.deepEqual(planReminders(row, new Date('2026-11-01T20:00:00.000Z')), []);
  assert.deepEqual(planReminders(row, new Date('2026-11-02T12:00:00.000Z')), ['receiver_24h']);
  assert.deepEqual(
    planReminders({ ...row, receiver_reminder_1_at: '2026-11-02T12:00:00.000Z' }, new Date('2026-11-02T18:00:00.000Z')),
    [],
  );
  assert.deepEqual(planReminders(row, new Date('2026-11-08T12:00:00.000Z')), ['receiver_24h', 'referrer_7d_expire']);
  assert.deepEqual(
    planReminders({ ...row, referrer_nudge_at: '2026-11-08T12:00:00.000Z', receiver_reminder_1_at: created }, new Date('2026-11-09T12:00:00.000Z')),
    [],
  );
  const accepted = { status: 'accepted', created_at: created, responded_at: '2026-11-02T12:00:00.000Z' };
  assert.deepEqual(planReminders(accepted, new Date('2026-11-03T12:00:00.000Z')), []);
  assert.deepEqual(planReminders(accepted, new Date('2026-11-04T12:00:00.000Z')), ['receiver_48h_after_accept']);
  assert.deepEqual(
    planReminders({ ...accepted, receiver_reminder_2_at: '2026-11-04T12:00:00.000Z' }, new Date('2026-11-05T12:00:00.000Z')),
    [],
  );
});

test('the patient intro never sends without consent and an email', () => {
  assert.equal(shouldSendPatientIntro({ consentConfirmed: true, patientEmail: 'a@b.co', alreadySent: false }), true);
  assert.equal(shouldSendPatientIntro({ consentConfirmed: false, patientEmail: 'a@b.co', alreadySent: false }), false);
  assert.equal(shouldSendPatientIntro({ consentConfirmed: true, patientEmail: '', alreadySent: false }), false);
  assert.equal(shouldSendPatientIntro({ consentConfirmed: true, patientEmail: 'a@b.co', alreadySent: true }), false);
});
