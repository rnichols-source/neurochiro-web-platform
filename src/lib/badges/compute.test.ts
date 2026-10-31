import test from 'node:test';
import assert from 'node:assert/strict';
import { computeEarnedBadges, type BadgeFacts } from './compute.ts';

const now = Date.parse('2026-10-31T16:00:00Z');

function facts(extra: BadgeFacts = {}): BadgeFacts {
  return {
    photo_url: null,
    bio: 'short',
    clinic_name: null,
    specialties: [],
    website_url: null,
    profile_views: 0,
    patientRequests: 0,
    seminars: [],
    jobs: [],
    certificates: [],
    chiromatch: false,
    cityPeers: [{ id: 'me', views: 5, verified: true }],
    doctorId: 'me',
    reviews: [],
    referralsSent: 0,
    now,
    ...extra,
  };
}

const complete = {
  photo_url: 'https://neurochiro.co/photo.jpg',
  bio: 'A'.repeat(50),
  clinic_name: 'NeuroChiro',
  specialties: ['Nervous system'],
  website_url: 'https://neurochiro.co',
};

test('profile_complete uses the same filled-profile rule', () => {
  assert.deepEqual(computeEarnedBadges(facts()), []);
  assert.ok(computeEarnedBadges(facts(complete)).includes('profile_complete'));
  assert.equal(computeEarnedBadges(facts({ ...complete, bio: 'too short' })).includes('profile_complete'), false);
});

test('first_100_views needs 100 profile views', () => {
  assert.equal(computeEarnedBadges(facts({ profile_views: 99 })).includes('first_100_views'), false);
  assert.ok(computeEarnedBadges(facts({ profile_views: 100 })).includes('first_100_views'));
});

test('lead_magnet needs 10 patient requests', () => {
  assert.equal(computeEarnedBadges(facts({ patientRequests: 9 })).includes('lead_magnet'), false);
  assert.ok(computeEarnedBadges(facts({ patientRequests: 10 })).includes('lead_magnet'));
});

test('seminar_host needs an approved seminar whose date has passed', () => {
  const upcoming = { dates: 'November 21-22, 2026', is_approved: true, is_past: false };
  const past = { dates: 'October 24-25, 2026', is_approved: true, is_past: false };
  const unapproved = { dates: 'October 24-25, 2026', is_approved: false, is_past: true };
  assert.equal(computeEarnedBadges(facts({ seminars: [upcoming] })).includes('seminar_host'), false);
  assert.equal(computeEarnedBadges(facts({ seminars: [unapproved] })).includes('seminar_host'), false);
  assert.ok(computeEarnedBadges(facts({ seminars: [past] })).includes('seminar_host'));
});

test('hiring_pro needs 3 published job posts', () => {
  const drafts = [{ status: 'Draft' }, { status: 'Draft' }, { status: 'Draft' }];
  const published = [{ status: 'Active' }, { status: 'open' }, { status: 'published' }];
  assert.equal(computeEarnedBadges(facts({ jobs: drafts })).includes('hiring_pro'), false);
  assert.equal(computeEarnedBadges(facts({ jobs: published.slice(0, 2) })).includes('hiring_pro'), false);
  assert.ok(computeEarnedBadges(facts({ jobs: published })).includes('hiring_pro'));
});

test('ce_champion counts deduped hours', () => {
  const duplicate = [
    { registration_id: 'r1', ce_hours: 12 },
    { registration_id: 'r1', ce_hours: 12 },
    { registration_id: 'r2', ce_hours: 7 },
  ];
  assert.equal(computeEarnedBadges(facts({ certificates: duplicate })).includes('ce_champion'), false);
  assert.ok(computeEarnedBadges(facts({
    certificates: [
      { seminar_id: 'a', user_id: 'u', ce_hours: 12 },
      { seminar_id: 'b', user_id: 'u', ce_hours: 8 },
    ],
  })).includes('ce_champion'));
});

test('chiromatch_participant is only present when the doctor took part', () => {
  assert.equal(computeEarnedBadges(facts()).includes('chiromatch_participant'), false);
  assert.ok(computeEarnedBadges(facts({ chiromatch: true })).includes('chiromatch_participant'));
});

test('a 1-doctor city does not earn top_10', () => {
  assert.equal(computeEarnedBadges(facts()).includes('top_10'), false);
  const peers = Array.from({ length: 10 }, (_, index) => ({
    id: index === 0 ? 'me' : `d${index}`,
    views: 100 - index,
    verified: true,
  }));
  assert.ok(computeEarnedBadges(facts({ cityPeers: peers, doctorId: 'me' })).includes('top_10'));
  const eleventh = [...peers, { id: 'extra', views: 200, verified: true }];
  const moved = eleventh.map((peer) => peer.id === 'me' ? { ...peer, views: 0 } : peer);
  assert.equal(computeEarnedBadges(facts({ cityPeers: moved, doctorId: 'me' })).includes('top_10'), false);
});

test('review_star needs a 4.5 average from at least 3 reviews', () => {
  assert.equal(computeEarnedBadges(facts({ reviews: [{ rating: 5 }, { rating: 5 }] })).includes('review_star'), false);
  assert.equal(computeEarnedBadges(facts({ reviews: [{ rating: 4 }, { rating: 4 }, { rating: 5 }] })).includes('review_star'), false);
  assert.ok(computeEarnedBadges(facts({ reviews: [{ rating: 5 }, { rating: 4.5 }, { rating: 4 }] })).includes('review_star'));
});

test('community_builder needs 5 referrals sent', () => {
  assert.equal(computeEarnedBadges(facts({ referralsSent: 4 })).includes('community_builder'), false);
  assert.ok(computeEarnedBadges(facts({ referralsSent: 5 })).includes('community_builder'));
});
