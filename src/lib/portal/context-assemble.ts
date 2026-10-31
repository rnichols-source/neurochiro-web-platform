import { PORTAL_FEATURES } from '../../config/portal-features.ts';
import { effectiveState, navFor } from './features.ts';
import { deriveMembership, type MembershipStatus } from './membership.ts';
import type { PortalContextValue, PortalDoctor } from './types.ts';

const STATUSES = new Set(['active', 'trialing', 'past_due', 'canceled', 'none']);

export type ShellUser = { id: string; email?: string | null };

export type LoadedShell = {
  fullName: string | null;
  initials: string;
  doctor: PortalDoctor | null;
  profileTier: string | null;
  role: string | null;
  stripeCustomerId: string | null;
  subscriptionStatus: string | null;
};

export type PortalContextDeps = {
  getUser: () => Promise<ShellUser | null>;
  loadShell: (user: ShellUser) => Promise<LoadedShell>;
  countUnread: (userId: string) => Promise<{ messages: number; notificationsExcludingMessages: number }>;
  hasPurchase: (userId: string) => Promise<boolean>;
  loadCycles: () => Promise<{ ranking_opens_at?: string | null; ranking_closes_at?: string | null }[]>;
  unreadReferrals: (doctorId: string | null) => Promise<number>;
  now?: () => number;
};

function stripeStatus(raw: string | null, hasCustomer: boolean): MembershipStatus | null {
  const parsed = raw && STATUSES.has(raw) ? (raw as MembershipStatus) : null;
  return hasCustomer ? parsed || 'active' : parsed;
}

function matchOpen(
  cycles: { ranking_opens_at?: string | null; ranking_closes_at?: string | null }[],
  now: number,
): boolean {
  return cycles.some((cycle) => {
    const open = cycle.ranking_opens_at ? new Date(cycle.ranking_opens_at).getTime() : 0;
    const close = cycle.ranking_closes_at ? new Date(cycle.ranking_closes_at).getTime() : 0;
    return open && close && now >= open && now <= close;
  });
}

/**
 * One auth read, one shell read, then a single parallel round.
 * Callers pass the real clients. This function does not touch Supabase itself.
 */
export async function assemblePortalContext(deps: PortalContextDeps): Promise<PortalContextValue | null> {
  const user = await deps.getUser();
  if (!user) return null;
  const shell = await deps.loadShell(user);
  const [unread, hasPurchase, cycles, unreadReferrals] = await Promise.all([
    deps.countUnread(user.id),
    deps.hasPurchase(user.id),
    deps.loadCycles(),
    deps.unreadReferrals(shell.doctor?.id || null),
  ]);
  const hasStripeCustomer = Boolean(shell.stripeCustomerId);
  const membership = deriveMembership({
    membershipTier: shell.doctor?.membership_tier,
    profileTier: shell.profileTier,
    isFoundingMember: shell.doctor?.is_founding_member,
    neurosTier: shell.doctor?.neuros_tier,
    createdAt: shell.doctor?.created_at,
    hasStripeCustomer,
    stripeStatus: stripeStatus(shell.subscriptionStatus, hasStripeCustomer),
  });
  const navContext = {
    membership,
    neurosTier: shell.doctor?.neuros_tier || null,
    hasPurchase,
    chiroMatchOpen: matchOpen(cycles, deps.now ? deps.now() : Date.now()),
    unreadMessages: unread.messages,
    unreadNotifications: unread.notificationsExcludingMessages,
    unreadReferrals,
  };
  return {
    userId: user.id,
    email: user.email || null,
    fullName: shell.fullName,
    initials: shell.initials,
    role: shell.role,
    doctor: shell.doctor,
    membership,
    unreadNotifications: unread.notificationsExcludingMessages,
    unreadMessages: unread.messages,
    unreadReferrals,
    hasPurchase,
    chiroMatchOpen: navContext.chiroMatchOpen,
    nav: navFor(navContext),
    comingSoonCount: PORTAL_FEATURES.filter((feature) => effectiveState(feature, navContext) === 'coming_soon').length,
  };
}
