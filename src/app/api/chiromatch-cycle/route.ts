import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export const revalidate = 300;

export async function GET() {
  try {
    const sb = createAdminClient() as any;
    const { data } = await sb
      .from('match_cycles')
      .select('name, status, ranking_opens_at, ranking_closes_at, match_day')
      .in('status', ['upcoming', 'ranking_open', 'ranking_closed', 'matched'])
      .order('match_day', { ascending: true })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ cycle: data || null });
  } catch {
    return NextResponse.json({ cycle: null });
  }
}
