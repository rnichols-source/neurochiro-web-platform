import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countIntroductions,
  countPatientRequests,
  marketRank,
  patientRequestSources,
  rangeStart,
  sourceLabel,
  summarizeLeads,
} from './stats.ts';

const now = new Date('2026-10-31T12:00:00Z');
const recent = '2026-10-20T12:00:00Z';
const old = '2026-01-01T12:00:00Z';

test('dashboard and leads use the same patient-request count', () => {
  const leads = [
    { id: 'l1', stage: 'new', created_at: recent },
    { id: 'l2', stage: 'contacted', created_at: recent },
    { id: 'l3', stage: 'scheduled', created_at: old },
  ];
  const contacts = [
    { id: 'c1', stage: 'new', created_at: recent },
    { id: 'c2', stage: 'converted', created_at: recent },
  ];
  const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const dashboard = countPatientRequests(leads, contacts, start);
  const leadsPage = countPatientRequests(leads, contacts, start);
  assert.deepEqual(dashboard, leadsPage);
  assert.deepEqual(dashboard, { total: 4, new: 2, contacted: 1, booked: 1 });
});

test('request sources add up to patient requests', () => {
  const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const leads = [
    { id: 'l1', stage: 'new', created_at: recent, email: 'a@example.com', source: 'appointment_request' },
    { id: 'l2', stage: 'contacted', created_at: recent, email: 'a@example.com', source: 'quiz' },
    { id: 'l3', stage: 'new', created_at: recent, source: 'dm_outreach' },
    { id: 'l4', stage: 'new', created_at: old, source: 'quiz' },
  ];
  const contacts = [
    { id: 'c1', stage: 'new', created_at: recent, source: null },
  ];
  const counts = countPatientRequests(leads, contacts, start);
  const sources = patientRequestSources(leads, contacts, start);
  assert.equal(sourceLabel('dm_outreach'), 'NeuroChiro introduction');
  assert.equal(sourceLabel(null), 'Directory profile');
  assert.equal(sourceLabel('appointment_request'), 'Appointment request');
  assert.equal(sources.reduce((sum, row) => sum + row.count, 0), counts.total);
  assert.equal(sources.find((row) => row.label === 'NeuroChiro introduction')?.count, 1);
  assert.equal(sources.find((row) => row.label === 'Quiz')?.count, 1);
});

test('market rank needs at least 3 verified doctors', () => {
  assert.equal(marketRank([{ id: 'a', views: 10 }, { id: 'b', views: 4 }], 'a'), null);
  assert.deepEqual(
    marketRank([{ id: 'a', views: 10 }, { id: 'b', views: 30 }, { id: 'c', views: 20 }], 'a'),
    { rank: 3, total: 3, avgViews: 20 },
  );
});

test('a lead in both tables is counted once at the furthest stage', () => {
  const leads = [{ id: 'l', stage: 'new', email: 'A@Example.com', phone: '(555) 111-2222', created_at: recent }];
  const contacts = [{ id: 'c', stage: 'scheduled', email: 'a@example.com', created_at: recent }];
  assert.deepEqual(countPatientRequests(leads, contacts, null), {
    total: 1,
    new: 0,
    contacted: 0,
    booked: 1,
  });
});

test('the same phone with or without a country code is one person', () => {
  const leads = [{ id: 'l', stage: 'new', phone: '+1 555-111-2222', created_at: recent }];
  const contacts = [{ id: 'c', stage: 'contacted', phone: '5551112222', created_at: recent }];
  assert.equal(countPatientRequests(leads, contacts, null).total, 1);
  assert.equal(countPatientRequests(leads, contacts, null).contacted, 1);
});

test('a lead at Oct 31 11 PM Eastern counts in October, not November', () => {
  const leadAt = '2026-11-01T03:00:00.000Z';
  const duringOctober = new Date('2026-11-01T03:00:00.000Z');
  const duringNovember = new Date('2026-11-15T15:00:00.000Z');
  const octoberStart = rangeStart('month', duringOctober, 'America/New_York');
  const novemberStart = rangeStart('month', duringNovember, 'America/New_York');
  const utcStart = rangeStart('month', duringOctober, 'UTC');
  assert.ok(octoberStart);
  assert.ok(novemberStart);
  assert.ok(utcStart);
  assert.ok(new Date(leadAt).getTime() >= octoberStart.getTime());
  assert.ok(new Date(leadAt).getTime() < novemberStart.getTime());
  assert.ok(new Date(leadAt).getTime() >= utcStart.getTime());
  const row = [{ id: 'late', stage: 'new', email: 'late@example.com', created_at: leadAt }];
  assert.equal(countPatientRequests(row, [], octoberStart).total, 1);
  assert.equal(countPatientRequests(row, [], novemberStart).total, 0);
});

test('follow_up counts as contacted', () => {
  assert.deepEqual(
    countPatientRequests([{ id: 'a', stage: 'follow_up', created_at: recent }], [], null),
    { total: 1, new: 0, contacted: 1, booked: 0 },
  );
});

test('summarizeLeads header totals stay at or under the all-time tab totals', () => {
  const leads = [
    { id: '1', stage: 'new', created_at: recent, email: 'a@x.com' },
    { id: '2', stage: 'contacted', created_at: old, email: 'b@x.com' },
    { id: '3', stage: 'follow_up', created_at: recent, email: 'a@x.com' },
  ];
  const summary = summarizeLeads(leads, 'month', 'America/New_York', now);
  assert.ok(summary.header.total <= summary.tabs.total);
  assert.equal(summary.header.total, 1);
  assert.equal(summary.header.contacted, 1);
  assert.equal(summary.tabs.total, 2);
});

test('an errored reply_logs query is null, not zero', () => {
  assert.equal(countIntroductions({ data: null, error: { message: 'column does not exist' } }, null), null);
  assert.equal(
    countIntroductions({
      data: [
        { template_id: 'waitlist_comment', created_at: recent },
        { template_id: 'waitlist_dm', created_at: recent },
        { template_id: 'sent_to_patient', created_at: recent },
      ],
      error: null,
    }, null),
    1,
  );
});
