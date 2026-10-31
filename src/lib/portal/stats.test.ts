import test from 'node:test';
import assert from 'node:assert/strict';
import { countPatientRequests, marketRank } from './stats.ts';

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

test('market rank needs at least 3 verified doctors', () => {
  assert.equal(marketRank([{ id: 'a', views: 10 }, { id: 'b', views: 4 }], 'a'), null);
  assert.deepEqual(
    marketRank([{ id: 'a', views: 10 }, { id: 'b', views: 30 }, { id: 'c', views: 20 }], 'a'),
    { rank: 3, total: 3, avgViews: 20 },
  );
});
