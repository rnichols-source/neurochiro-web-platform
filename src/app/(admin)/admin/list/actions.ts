'use server'

import { checkAdminAuth } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-admin';

interface SubscriberStats {
  total: number;
  confirmed: number;
  pending: number;
  unsubscribed: number;
  byState: { state: string; count: number }[];
  byZipPrefix: { prefix: string; state: string | null; count: number; hasDoctors: boolean }[];
  recentSignups: {
    id: string;
    email: string;
    zip: string;
    state: string | null;
    status: string;
    created_at: string;
    confirmed_at: string | null;
  }[];
  growthByWeek: { week: string; count: number }[];
}

export async function getSubscriberStats(): Promise<SubscriberStats> {
  await checkAdminAuth();
  const supabase = createAdminClient();

  // Get all subscribers
  const { data: subscribers } = await (supabase as any)
    .from('subscribers')
    .select('id, email, zip, state, status, created_at, confirmed_at, unsubscribed_at')
    .order('created_at', { ascending: false });

  const all = subscribers || [];

  const confirmed = all.filter((s: any) => s.status === 'confirmed');
  const pending = all.filter((s: any) => s.status === 'pending');
  const unsubscribed = all.filter((s: any) => s.status === 'unsubscribed');

  // Group by state
  const stateMap = new Map<string, number>();
  for (const s of confirmed) {
    const st = s.state || 'Unknown';
    stateMap.set(st, (stateMap.get(st) || 0) + 1);
  }
  const byState = Array.from(stateMap.entries())
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count);

  // Group by 3-digit ZIP prefix
  const prefixMap = new Map<string, { count: number; state: string | null }>();
  for (const s of confirmed) {
    const prefix = s.zip?.slice(0, 3) || '???';
    const existing = prefixMap.get(prefix);
    if (existing) {
      existing.count++;
    } else {
      prefixMap.set(prefix, { count: 1, state: s.state });
    }
  }

  // Check which ZIP prefixes have doctors
  const { data: doctors } = await (supabase as any)
    .from('doctors')
    .select('city, state, address')
    .eq('verification_status', 'verified');

  // Build a set of states that have doctors
  const doctorStates = new Set(
    (doctors || []).map((d: any) => d.state).filter(Boolean)
  );

  const byZipPrefix = Array.from(prefixMap.entries())
    .map(([prefix, data]) => ({
      prefix,
      state: data.state,
      count: data.count,
      hasDoctors: data.state ? doctorStates.has(data.state) : false,
    }))
    .sort((a, b) => b.count - a.count);

  // Recent signups (last 20)
  const recentSignups = all.slice(0, 20).map((s: any) => ({
    id: s.id,
    email: s.email,
    zip: s.zip,
    state: s.state,
    status: s.status,
    created_at: s.created_at,
    confirmed_at: s.confirmed_at,
  }));

  // Growth by week (last 12 weeks)
  const weekMap = new Map<string, number>();
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const key = weekStart.toISOString().slice(0, 10);
    const count = all.filter((s: any) => {
      const created = new Date(s.created_at);
      return created >= weekStart && created < weekEnd;
    }).length;
    weekMap.set(key, count);
  }
  const growthByWeek = Array.from(weekMap.entries())
    .map(([week, count]) => ({ week, count }))
    .reverse();

  return {
    total: all.length,
    confirmed: confirmed.length,
    pending: pending.length,
    unsubscribed: unsubscribed.length,
    byState,
    byZipPrefix,
    recentSignups,
    growthByWeek,
  };
}

export async function exportSubscribersCSV(): Promise<string> {
  await checkAdminAuth();
  const supabase = createAdminClient();

  const { data } = await (supabase as any)
    .from('subscribers')
    .select('email, zip, state, status, created_at, confirmed_at, unsubscribed_at, source')
    .order('created_at', { ascending: false });

  const rows = data || [];
  const header = 'email,zip,state,status,created_at,confirmed_at,unsubscribed_at,source';
  const csvRows = rows.map((r: any) =>
    `${r.email},${r.zip},${r.state || ''},${r.status},${r.created_at},${r.confirmed_at || ''},${r.unsubscribed_at || ''},${r.source || ''}`
  );

  return [header, ...csvRows].join('\n');
}
