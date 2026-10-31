import 'server-only';
import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase-admin';
import { createServerSupabase } from '@/lib/supabase-server';
import { PORTAL_FEATURES } from '@/config/portal-features';
import { effectiveState, navFor, type PortalNavContext } from '@/lib/portal/features';
import { getMembership } from '@/lib/portal/membership-load';
import { getPortalShellData } from '@/app/(doctor)/doctor/portal-actions';
import { countUnread } from '@/lib/messaging/db';
import type { PortalContextValue } from '@/lib/portal/types';

export type PortalContext = PortalContextValue;

export function toNavContext(ctx: PortalContextValue): PortalNavContext {
  return {
    membership: ctx.membership,
    neurosTier: ctx.doctor?.neuros_tier || null,
    hasPurchase: ctx.hasPurchase,
    chiroMatchOpen: ctx.chiroMatchOpen,
    unreadMessages: ctx.unreadMessages,
    unreadNotifications: ctx.unreadNotifications,
    unreadReferrals: ctx.unreadReferrals,
  };
}

export const getPortalContext = cache(async (): Promise<PortalContext | null> => {
  const shell = await getPortalShellData();
  if (!shell) return null;
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const membership = await getMembership(user.id);
  const admin = createAdminClient() as any;
  const unread = await countUnread(user.id);

  let hasPurchase = false;
  const purchases = await admin.from('course_purchases').select('id').eq('user_id', user.id).limit(1);
  if (!purchases.error && purchases.data?.length) hasPurchase = true;

  let chiroMatchOpen = false;
  const cycles = await admin.from('match_cycles').select('id, ranking_opens_at, ranking_closes_at, status').limit(20);
  if (!cycles.error && Array.isArray(cycles.data)) {
    const now = Date.now();
    chiroMatchOpen = cycles.data.some((cycle: any) => {
      const open = cycle.ranking_opens_at ? new Date(cycle.ranking_opens_at).getTime() : 0;
      const close = cycle.ranking_closes_at ? new Date(cycle.ranking_closes_at).getTime() : 0;
      return open && close && now >= open && now <= close;
    });
  }

  let unreadReferrals = 0;
  if (shell.doctor?.id) {
    const waiting = await (supabase as any)
      .from('doctor_referrals')
      .select('id', { count: 'exact', head: true })
      .eq('receiving_doctor_id', shell.doctor.id)
      .in('status', ['pending', 'sent', 'viewed']);
    if (!waiting.error) unreadReferrals = waiting.count || 0;
  }

  const ctx = {
    membership,
    neurosTier: shell.doctor?.neuros_tier || null,
    hasPurchase,
    chiroMatchOpen,
    unreadMessages: unread.messages,
    unreadNotifications: unread.notificationsExcludingMessages,
    unreadReferrals,
  };

  const nav = navFor(ctx);
  const comingSoonCount = PORTAL_FEATURES.filter((feature) => effectiveState(feature, ctx) === 'coming_soon').length;

  return {
    userId: user.id,
    email: user.email || null,
    fullName: shell.fullName,
    initials: shell.initials,
    doctor: shell.doctor,
    membership,
    unreadNotifications: unread.notificationsExcludingMessages,
    unreadMessages: unread.messages,
    unreadReferrals,
    hasPurchase,
    chiroMatchOpen,
    nav,
    comingSoonCount,
  };
});
