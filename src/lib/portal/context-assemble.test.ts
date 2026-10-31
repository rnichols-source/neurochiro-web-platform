import test from 'node:test';
import assert from 'node:assert/strict';
import { assemblePortalContext, type LoadedShell } from './context-assemble.ts';

const shell: LoadedShell = {
  fullName: 'Mariya Shaeffer',
  initials: 'MS',
  profileTier: 'pro',
  role: 'doctor',
  stripeCustomerId: null,
  subscriptionStatus: null,
  doctor: {
    id: 'doc-1',
    slug: 'dr-raymond-nichols',
    clinic_name: 'NeuroChiro',
    membership_tier: 'pro',
    is_founding_member: true,
    neuros_tier: null,
    created_at: '2024-01-01T00:00:00Z',
    is_approved: true,
    onboarding_call_status: 'completed',
    profile_views: 10,
    city: 'Jacksonville',
    state: 'FL',
    country: 'US',
    specialties: ['Nervous system'],
  },
};

test('portal context calls getUser once, then the shell, then one parallel round', async () => {
  const order: string[] = [];
  let shellDone = false;
  const ctx = await assemblePortalContext({
    getUser: async () => {
      order.push('user');
      return { id: 'user-1', email: 'member@example.com' };
    },
    loadShell: async () => {
      order.push('shell');
      shellDone = true;
      return shell;
    },
    countUnread: async () => {
      order.push(shellDone ? 'unread' : 'unread-early');
      return { messages: 2, notificationsExcludingMessages: 1 };
    },
    hasPurchase: async () => {
      order.push(shellDone ? 'purchase' : 'purchase-early');
      return false;
    },
    loadCycles: async () => {
      order.push(shellDone ? 'cycles' : 'cycles-early');
      return [];
    },
    unreadReferrals: async () => {
      order.push(shellDone ? 'referrals' : 'referrals-early');
      return 3;
    },
  });

  assert.equal(order.filter((step) => step === 'user').length, 1);
  assert.deepEqual(order.slice(0, 2), ['user', 'shell']);
  assert.deepEqual(order.slice(2).sort(), ['cycles', 'purchase', 'referrals', 'unread']);
  assert.equal(ctx?.userId, 'user-1');
  assert.equal(ctx?.membership.source, 'founding');
  assert.equal(ctx?.membership.tier, 'pro');
  assert.equal(ctx?.unreadMessages, 2);
  assert.equal(ctx?.unreadReferrals, 3);
  assert.equal(ctx?.nav.some((item) => item.key === 'students'), false);
});

test('portal context stops when there is no signed-in user', async () => {
  let shellCalls = 0;
  const ctx = await assemblePortalContext({
    getUser: async () => null,
    loadShell: async () => {
      shellCalls += 1;
      return shell;
    },
    countUnread: async () => ({ messages: 0, notificationsExcludingMessages: 0 }),
    hasPurchase: async () => false,
    loadCycles: async () => [],
    unreadReferrals: async () => 0,
  });
  assert.equal(ctx, null);
  assert.equal(shellCalls, 0);
});
