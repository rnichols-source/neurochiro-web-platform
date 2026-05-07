import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export const revalidate = 30;

export async function GET() {
  try {
    const supabase = createAdminClient() as any;
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const [searchesHour, viewsHour, viewsWeek, recentSearches] = await Promise.all([
      supabase
        .from('site_activity')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'search')
        .gte('created_at', oneHourAgo),
      supabase
        .from('site_activity')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'profile_view')
        .gte('created_at', oneHourAgo),
      supabase
        .from('site_activity')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'profile_view')
        .gte('created_at', oneWeekAgo),
      supabase
        .from('site_activity')
        .select('city, state, created_at')
        .eq('event_type', 'search')
        .not('city', 'is', null)
        .gte('created_at', oneDayAgo)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    return NextResponse.json({
      searchesLastHour: searchesHour.count || 0,
      profileViewsLastHour: viewsHour.count || 0,
      patientsConnectedThisWeek: viewsWeek.count || 0,
      recentSearchLocations: (recentSearches.data || []).map((s: any) => ({
        city: s.city,
        state: s.state,
      })),
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' }
    });
  } catch {
    return NextResponse.json({
      searchesLastHour: 0,
      profileViewsLastHour: 0,
      patientsConnectedThisWeek: 0,
      recentSearchLocations: [],
    });
  }
}
