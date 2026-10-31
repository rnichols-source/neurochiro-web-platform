import { STUDENT_CONFIG } from '../../config/students.ts';

export type StudentStatus = 'member' | 'grace' | 'free' | 'past_due';
export type StudentSource = 'stripe' | 'comped' | 'grandfathered' | 'grace' | 'none';
export type StudentPlan = 'monthly' | 'annual' | null;

export type StudentMembership = {
  status: StudentStatus;
  source: StudentSource;
  plan: StudentPlan;
  priceLabel: string;
  renewsAt: string | null;
  isFounding: boolean;
};

export type StudentMembershipInput = {
  role?: string | null;
  tier?: string | null;
  createdAt?: string | null;
  now?: string;
  launchAt?: string | null;
  graceDays?: number;
  subscriptionStatus?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none' | null;
  priceCents?: number | null;
  plan?: StudentPlan;
  renewsAt?: string | null;
  isFounding?: boolean;
  pastDueSince?: string | null;
};

const DAY = 24 * 60 * 60 * 1000;
const ADMINS = new Set(['admin', 'super_admin', 'founder', 'regional_admin']);

export function deriveStudentMembership(input: StudentMembershipInput): StudentMembership {
  const now = Date.parse(input.now || new Date().toISOString());
  const role = (input.role || '').toLowerCase();
  if (ADMINS.has(role)) {
    return { status: 'member', source: 'comped', plan: null, priceLabel: 'Included', renewsAt: null, isFounding: false };
  }
  if (input.tier === 'student_comped') {
    return { status: 'member', source: 'comped', plan: input.plan ?? null, priceLabel: 'Scholarship', renewsAt: null, isFounding: false };
  }

  if (input.subscriptionStatus === 'past_due') {
    const since = input.pastDueSince ? Date.parse(input.pastDueSince) : now;
    if (now - since <= 7 * DAY) {
      return {
        status: 'past_due',
        source: 'stripe',
        plan: input.plan ?? null,
        priceLabel: 'Payment failed. You still have access for 7 days.',
        renewsAt: input.renewsAt ?? null,
        isFounding: false,
      };
    }
  } else {
    const paid = input.tier === 'student_paid' || input.subscriptionStatus === 'active' || input.subscriptionStatus === 'trialing';
    if (paid && input.priceCents === STUDENT_CONFIG.grandfatherCents) {
      return {
        status: 'member',
        source: 'grandfathered',
        plan: 'monthly',
        priceLabel: 'Your plan: $12/month (original rate)',
        renewsAt: input.renewsAt ?? null,
        isFounding: false,
      };
    }
    if (paid) {
      const plan = input.priceCents === STUDENT_CONFIG.membership.annual.expectCents
        ? 'annual'
        : input.priceCents === STUDENT_CONFIG.membership.monthly.expectCents
          ? 'monthly'
          : input.plan ?? 'monthly';
      return {
        status: 'member',
        source: 'stripe',
        plan,
        priceLabel: plan === 'annual' ? '$333/year' : '$33/month',
        renewsAt: input.renewsAt ?? null,
        isFounding: Boolean(input.isFounding),
      };
    }
  }

  const launchAt = input.launchAt === undefined ? STUDENT_CONFIG.launchAt : input.launchAt;
  if (launchAt && input.createdAt) {
    const launch = Date.parse(launchAt);
    const created = Date.parse(input.createdAt);
    const graceDays = input.graceDays ?? STUDENT_CONFIG.freeAccessGraceDays;
    if (created < launch && now < launch + graceDays * DAY) {
      return {
        status: 'grace',
        source: 'grace',
        plan: null,
        priceLabel: 'Grace period',
        renewsAt: new Date(launch + graceDays * DAY).toISOString(),
        isFounding: false,
      };
    }
  }

  return { status: 'free', source: 'none', plan: null, priceLabel: '$33/month', renewsAt: null, isFounding: false };
}

export function hasMemberAccess(membership: Pick<StudentMembership, 'status'>): boolean {
  return membership.status === 'member' || membership.status === 'grace' || membership.status === 'past_due';
}
