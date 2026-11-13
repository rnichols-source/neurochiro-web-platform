import assert from 'node:assert/strict';
import test from 'node:test';
import { haversineDistance } from '../geo.ts';
import {
  canReceiverSet,
  canReferrerCancel,
  canSeePatientContact,
  formatReferralWhen,
  interpretLocation,
  isOpenDuplicate,
  looksLikePostal,
  chooseReferralDoctors,
  nameMatchSkipsPlace,
  nameNeedles,
  searchCountryForQuery,
  planReminders,
  referralDistance,
  referralSaveMessage,
  shouldResolvePlace,
  shouldSendPatientIntro,
  validPhone,
  validateReferralDraft,
} from './pure.ts';

test('Greenville SC keeps Dr. Raymond Nichols in Greer at 12 miles', () => {
  const far = Array.from({ length: 80 }, (_, index) => ({
    id: `far-${index}`,
    name: `Far doctor ${index}`,
    miles: 800 + index,
  }))
  const picked = chooseReferralDoctors({
    radiusMiles: 250,
    cap: 80,
    inRadius: [{ id: 'ray', name: 'Raymond Nichols', miles: 12 }],
    wide: far,
  })
  assert.equal(picked.widened, false)
  assert.equal(picked.doctors[0]?.name, 'Raymond Nichols')
  assert.equal(picked.doctors[0]?.miles, 12)
  assert.equal(picked.doctors.some((row) => (row.miles ?? 0) > 250), false)
})

test('90210 keeps Frank Kaden at 17 miles and Nicole Clark at 24 miles', () => {
  const crowd = Array.from({ length: 210 }, (_, index) => ({
    id: `crowd-${index}`,
    name: `Other doctor ${index}`,
    miles: 40 + (index % 180),
  }))
  crowd.push({ id: 'kaden', name: 'Frank Kaden', miles: 17 })
  crowd.push({ id: 'clark', name: 'Nicole Clark', miles: 24 })
  const picked = chooseReferralDoctors({
    radiusMiles: 250,
    cap: 80,
    inRadius: crowd,
    wide: [{ id: 'far', name: 'Someone in another state', miles: 1400 }],
  })
  assert.equal(picked.widened, false)
  assert.equal(picked.doctors[0]?.name, 'Frank Kaden')
  assert.equal(picked.doctors[1]?.name, 'Nicole Clark')
  assert.ok(picked.doctors.length >= 200)
  assert.equal(picked.doctors.some((row) => row.name === 'Someone in another state'), false)
})

test('an empty radius falls back to the nearest doctors outside it', () => {
  const picked = chooseReferralDoctors({
    radiusMiles: 250,
    inRadius: [],
    wide: [
      { id: 'perth', name: 'Perth doctor', miles: 2040 },
      { id: 'adelaide', name: 'Adelaide doctor', miles: 850 },
    ],
  })
  assert.equal(picked.widened, true)
  assert.equal(picked.doctors[0]?.name, 'Adelaide doctor')
})

test('a person or clinic name is not sent to the map, and a city still is', () => {
  const bruni = { firstName: 'Leanne', lastName: 'Bruni', clinicName: 'Whitby Chiropractic' }
  assert.equal(nameMatchSkipsPlace('Bruni', [bruni]), true)
  assert.equal(nameMatchSkipsPlace('Leanne Bruni', [bruni]), true)
  assert.equal(nameMatchSkipsPlace('Whitby Chiropractic', [bruni]), true)
  assert.equal(nameMatchSkipsPlace('Sydney', [bruni]), false)
  assert.equal(nameMatchSkipsPlace('London', [{ firstName: 'London', lastName: 'Smith', clinicName: null }]), false)
  assert.equal(nameMatchSkipsPlace('Toronto', [{ firstName: 'Ada', lastName: 'Toronto', clinicName: null }]), false)
})

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

test('an India PIN is a place in India and not a US ZIP', () => {
  assert.equal(looksLikePostal('110001', 'IN'), true);
  assert.equal(shouldResolvePlace('110001', 'IN'), true);
  assert.equal(looksLikePostal('110001', 'US'), true);
  assert.equal(shouldResolvePlace('110001', 'US'), true);
  assert.equal(searchCountryForQuery('US', '110001'), 'IN');
  assert.equal(searchCountryForQuery('US', '78701'), 'US');
  assert.equal(looksLikePostal('110001', 'ALL'), true);
  assert.equal(looksLikePostal('560001', 'IN'), true);
  assert.equal(looksLikePostal('78701'), true);
  assert.equal(looksLikePostal('SW1A 1AA', 'GB'), true);
  assert.equal(looksLikePostal('K1A 0B1', 'CA'), true);
});

test('an approximate place is still a place the search can use', () => {
  const pin = interpretLocation({
    resolved: { city: 'New Delhi', state: 'DL', lat: 28.61, lng: 77.21 },
    ambiguous: null,
    confidence: 'approximate',
  });
  assert.equal(pin.kind, 'resolved');
  if (pin.kind === 'resolved') assert.equal(pin.place.city, 'New Delhi');
});

test('phones keep international formatting and reject junk', () => {
  assert.equal(validPhone('+91 98765 43210'), '+91 98765 43210');
  assert.equal(validPhone('(864) 555-0100'), '(864) 555-0100');
  assert.equal(validPhone('call me'), null);
  assert.equal(validPhone('123'), null);
});

test('a referral to yourself, a duplicate, or a huge note is rejected', () => {
  const base = {
    receivingDoctorId: 'other',
    selfDoctorId: 'me',
    patientFirstName: 'Priya',
    patientLastInitial: 'S',
    patientPhone: '+91 98765 43210',
    reason: 'Closer to home',
    urgency: 'routine',
    consentConfirmed: true,
  };
  assert.equal(validateReferralDraft({ ...base, receivingDoctorId: 'me' }).ok, false);
  assert.equal(validateReferralDraft({ ...base, consentConfirmed: false }).ok, false);
  assert.equal(validateReferralDraft({ ...base, reason: 'x'.repeat(2001) }).ok, false);
  assert.equal(validateReferralDraft({ ...base, patientEmail: 'not-an-email' }).ok, false);
  const saved = validateReferralDraft(base);
  assert.equal(saved.ok, true);
  if (saved.ok) assert.equal(saved.value.phone, '+91 98765 43210');
  assert.equal(isOpenDuplicate([{ status: 'sent', phone: '+91-98765-43210' }], '+91 98765 43210'), true);
  assert.equal(isOpenDuplicate([{ status: 'declined', phone: '+91 98765 43210' }], '+91 98765 43210'), false);
  assert.equal(nameNeedles('Dr Jane Smith').last, 'Smith');
});

test('status moves only forward, and a save message needs a real save', () => {
  assert.equal(canReceiverSet('sent', 'accepted'), true);
  assert.equal(canReceiverSet('declined', 'accepted'), false);
  assert.equal(canReceiverSet('accepted', 'patient_contacted'), true);
  assert.equal(canReceiverSet('sent', 'scheduled'), false);
  assert.equal(canReferrerCancel('viewed'), true);
  assert.equal(canReferrerCancel('accepted'), false);
  assert.match(referralSaveMessage({ receiverName: 'Dr. Bea', emailed: false, inPortal: true }), /no email on file/);
  assert.match(referralSaveMessage({ receiverName: 'Dr. Bea', emailed: true, inPortal: true }), /got an email/);
});

test('evening referrals stay on the doctor local date, and a booked date does not shift', () => {
  assert.match(formatReferralWhen('2026-11-05T03:30:00.000Z', 'America/New_York'), /Nov 4, 2026/);
  assert.match(formatReferralWhen('2026-11-05T03:30:00.000Z', 'Asia/Kolkata'), /Nov 5, 2026/);
  assert.match(formatReferralWhen('2026-11-05', 'Asia/Kolkata'), /Nov 5, 2026/);
  assert.equal(formatReferralWhen(null, 'UTC'), 'Not yet');
});

test('the patient intro never sends without consent and an email', () => {
  assert.equal(shouldSendPatientIntro({ consentConfirmed: true, patientEmail: 'a@b.co', alreadySent: false }), true);
  assert.equal(shouldSendPatientIntro({ consentConfirmed: false, patientEmail: 'a@b.co', alreadySent: false }), false);
  assert.equal(shouldSendPatientIntro({ consentConfirmed: true, patientEmail: '', alreadySent: false }), false);
  assert.equal(shouldSendPatientIntro({ consentConfirmed: true, patientEmail: 'a@b.co', alreadySent: true }), false);
});
