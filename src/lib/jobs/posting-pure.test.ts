import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { STUDENT_CONFIG } from '../../config/students.ts';
import {
  LIMIT_MESSAGE,
  applicationTotals,
  adminQueue,
  dedupeApplications,
  descriptionOk,
  escapeHtml,
  expiryReminderVerb,
  filterBoard,
  isPublicJob,
  jobPaymentMetadata,
  metadataIsSafe,
  oneTimePriceOk,
  planApprove,
  planFeatureUpdate,
  planNonMemberPaid,
  planReject,
  postDecision,
  receivesMonthlyDigest,
  tokenFresh,
} from './posting-pure.ts';
import { viewerHash } from './hash.ts';

const NOW = new Date('2026-11-15T12:00:00.000Z');

describe('posting rules', () => {
  it('lets a member under the limit post free', () => {
    const decision = postDecision({ tier: 'pro', status: 'active', activeCount: 1, limit: 2 });
    assert.deepEqual(decision, { ok: true, mode: 'free' });
  });

  it('stops a member at the limit', () => {
    const decision = postDecision({ tier: 'pro', status: 'active', activeCount: 2, limit: 2 });
    assert.equal(decision.ok, false);
    if (!decision.ok && decision.reason === 'limit') assert.equal(decision.message, LIMIT_MESSAGE);
  });

  it('sends a non-member away from the free path', () => {
    const decision = postDecision({ tier: 'free', status: 'none', activeCount: 0, limit: 2 });
    assert.deepEqual(decision, { ok: false, reason: 'not_member' });
  });

  it('refuses a price that is not the expected amount', () => {
    assert.equal(oneTimePriceOk(4900, STUDENT_CONFIG.jobs.featured.expectCents), true);
    assert.equal(oneTimePriceOk(9900, STUDENT_CONFIG.jobs.featured.expectCents), false);
    assert.equal(oneTimePriceOk(14900, STUDENT_CONFIG.jobs.nonMember.expectCents), true);
    assert.equal(oneTimePriceOk(null, 14900), false);
  });

  it('keeps checkout metadata short and free of the description', () => {
    const meta = jobPaymentMetadata('job_post_nonmember', '11111111-1111-1111-1111-111111111111');
    assert.equal(metadataIsSafe(meta), true);
    assert.equal(descriptionOk('a'.repeat(5000)), true);
    assert.equal(descriptionOk('a'.repeat(5001)), false);
  });
});

describe('fulfill and review', () => {
  it('applies a feature session once', () => {
    const first = planFeatureUpdate({ stripe_checkout_session_id: null, featured_until: null }, 'cs_1', NOW, 30);
    assert.equal(first.apply, true);
    const second = planFeatureUpdate(
      { stripe_checkout_session_id: 'cs_1', featured_until: first.apply ? first.featured_until : null },
      'cs_1',
      NOW,
      30,
    );
    assert.deepEqual(second, { apply: false });
  });

  it('extends a feature from the later of now and the current end', () => {
    const later = planFeatureUpdate(
      { stripe_checkout_session_id: 'cs_old', featured_until: '2026-12-01T00:00:00.000Z' },
      'cs_new',
      NOW,
      30,
    );
    assert.equal(later.apply, true);
    if (later.apply) assert.equal(later.featured_until, '2026-12-31T00:00:00.000Z');
  });

  it('marks a non-member post pending once', () => {
    const reserved = planNonMemberPaid({ stripe_checkout_session_id: 'cs_1', approval_status: 'awaiting_payment' }, 'cs_1');
    assert.equal(reserved.apply, true);
    const second = planNonMemberPaid({ stripe_checkout_session_id: 'cs_1', approval_status: 'pending' }, 'cs_1');
    assert.deepEqual(second, { apply: false });
  });

  it('approves only a pending post and rejects with one refund', () => {
    assert.equal(planApprove('approved', NOW, 60).ok, false);
    const approved = planApprove('pending', NOW, 60);
    assert.equal(approved.ok, true);
    const first = planReject({ approvalStatus: 'pending', refundOnReject: true, refundId: null, paymentIntent: 'pi_1' });
    assert.equal(first.ok && first.refund, true);
    const again = planReject({ approvalStatus: 'pending', refundOnReject: true, refundId: 're_1', paymentIntent: 'pi_1' });
    assert.equal(again.ok && again.refund, false);
    assert.equal(planReject({ approvalStatus: 'approved', refundOnReject: true, refundId: null, paymentIntent: 'pi_1' }).ok, false);
  });
});

describe('views, board, and mail', () => {
  it('hashes a viewer and never returns the raw IP', () => {
    const ip = '203.0.113.10';
    const hash = viewerHash({ ip, ua: 'TestAgent' });
    assert.equal(hash.length, 64);
    assert.equal(hash.includes(ip), false);
    assert.equal(viewerHash({ ip, ua: 'TestAgent' }), hash);
    assert.notEqual(viewerHash({ ip, ua: 'Other' }), hash);
    assert.notEqual(viewerHash({ userId: 'user-1', ip, ua: 'TestAgent' }), hash);
  });

  it('hides unapproved and expired posts and pins featured ones', () => {
    assert.equal(isPublicJob({ status: 'Active', approval_status: 'pending', expires_at: null }, NOW.getTime()), false);
    assert.equal(isPublicJob({ status: 'Active', expires_at: null }, NOW.getTime()), true);
    const rows = filterBoard(
      [
        { id: 'a', state: 'GA', type: 'Associate', featured_until: null, created_at: '2026-11-14T00:00:00.000Z' },
        { id: 'b', state: 'GA', type: 'Associate', featured_until: '2026-12-01T00:00:00.000Z', created_at: '2026-11-01T00:00:00.000Z' },
        { id: 'c', state: 'TX', type: 'Intern', featured_until: null, created_at: '2026-11-15T00:00:00.000Z' },
      ],
      { state: 'GA', type: 'Associate' },
      NOW.getTime(),
    );
    assert.deepEqual(rows.map((row) => row.id), ['b', 'a']);
  });

  it('dedupes applications and counts interviews once', () => {
    const totals = applicationTotals([
      { id: '1', jobId: 'j', personId: 's', stage: 'interview', source: 'canonical' },
      { id: '2', jobId: 'j', personId: 's', stage: 'Interview', source: 'legacy' },
      { id: '3', jobId: 'j2', personId: 's', stage: 'new', source: 'legacy' },
    ]);
    assert.deepEqual(totals, { applicationsSubmitted: 2, interviewsReached: 1 });
    assert.equal(dedupeApplications([
      { id: '1', jobId: 'j', personId: 's', stage: 'new', source: 'canonical' },
      { id: '2', jobId: 'j', personId: 's', stage: 'new', source: 'legacy' },
    ]).length, 1);
  });

  it('sorts the admin queues and the monthly audience', () => {
    assert.equal(adminQueue({ approval_status: 'pending', status: 'Draft' }, NOW.getTime()), 'pending');
    assert.equal(adminQueue({ approval_status: 'approved', status: 'Active', expires_at: '2026-11-01T00:00:00.000Z' }, NOW.getTime()), 'expired');
    assert.equal(adminQueue({ approval_status: 'rejected', status: 'Draft' }, NOW.getTime()), 'rejected');
    assert.equal(receivesMonthlyDigest('member'), true);
    assert.equal(receivesMonthlyDigest('grace'), true);
    assert.equal(receivesMonthlyDigest('free'), false);
    assert.equal(expiryReminderVerb('nonmember'), 'Renew');
    assert.equal(expiryReminderVerb('member'), 'Extend');
    assert.equal(escapeHtml('<b>'), '&lt;b&gt;');
    assert.equal(tokenFresh('2026-11-01T00:00:00.000Z', NOW.getTime()), true);
    assert.equal(tokenFresh('2026-08-01T00:00:00.000Z', NOW.getTime()), false);
  });
});
