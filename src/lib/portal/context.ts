import 'server-only';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { createAdminClient } from '@/lib/supabase-admin';
import { createServerSupabase } from '@/lib/supabase-server';
import { countWaitingVisits } from '@/lib/doctor/portal-data';
import { loadApplicationGate } from '@/lib/applications/gate';
import { isApplicationFlowEnabled } from '@/lib/applications/flag';
import { countUnread } from '@/lib/messaging/db';
import { assemblePortalContext, type ShellUser } from '@/lib/portal/context-assemble';
import { loadShell } from '@/lib/portal/shell';
import { portalTimer } from '@/lib/portal/timing';
import type { PortalContextValue } from '@/lib/portal/types';
import type { PortalNavContext } from '@/lib/portal/features';

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

const loadMatchCycles = unstable_cache(
  async () => {
    const admin = createAdminClient() as any;
    const cycles = await admin.from('match_cycles').select('id, ranking_opens_at, ranking_closes_at, status').limit(20);
    if (cycles.error || !Array.isArray(cycles.data)) return [];
    return cycles.data.map((cycle: { ranking_opens_at?: string | null; ranking_closes_at?: string | null }) => ({
      ranking_opens_at: cycle.ranking_opens_at ?? null,
      ranking_closes_at: cycle.ranking_closes_at ?? null,
    }));
  },
  ['match-cycles'],
  { revalidate: 300, tags: ['match-cycles'] },
);

async function hasCoursePurchase(userId: string): Promise<boolean> {
  const admin = createAdminClient() as any;
  const purchases = await admin.from('course_purchases').select('id', { count: 'exact', head: true }).eq('user_id', userId);
  if (purchases.error) return false;
  return (purchases.count || 0) > 0;
}

async function lookupStaffOffice(userId: string): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return false;
  const admin = createAdminClient() as any;
  const result = await admin.from('kpi_office_members').select('id').eq('member_user_id', userId).eq('status', 'active').limit(1);
  return !result.error && Array.isArray(result.data) && result.data.length > 0;
}

async function loadSavedItems(userId: string): Promise<Record<string, unknown> | null> {
  const admin = createAdminClient() as any;
  const row = await admin.from('doctor_tool_data').select('data').eq('user_id', userId).eq('tool', 'saved_items').maybeSingle();
  if (row.error) return null;
  if (!row.data?.data || typeof row.data.data !== 'object') return {};
  return row.data.data as Record<string, unknown>;
}

async function countWaitingReferrals(doctorId: string | null): Promise<number> {
  if (!doctorId) return 0;
  const supabase = createServerSupabase() as any;
  const waiting = await supabase
    .from('doctor_referrals')
    .select('id', { count: 'exact', head: true })
    .eq('receiving_doctor_id', doctorId)
    .in('status', ['pending', 'sent', 'viewed']);
  if (waiting.error) return 0;
  return waiting.count || 0;
}

export const getPortalContext = cache(async (): Promise<PortalContext | null> => {
  const done = portalTimer('context');
  try {
    return await assemblePortalContext({
      getUser: async () => {
        const supabase = createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        const shellUser: ShellUser = { id: user.id, email: user.email };
        return shellUser;
      },
      loadShell,
      countUnread,
      hasPurchase: hasCoursePurchase,
      loadCycles: loadMatchCycles,
      unreadReferrals: countWaitingReferrals,
      countWaiting: countWaitingVisits,
      lookupStaff: lookupStaffOffice,
      loadGate: async (doctorId: string) => {
        if (!doctorId || !isApplicationFlowEnabled()) return null;
        return loadApplicationGate(doctorId);
      },
      loadSaved: loadSavedItems,
    });
  } finally {
    done();
  }
});
