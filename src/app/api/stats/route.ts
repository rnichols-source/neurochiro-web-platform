import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  try {
    const supabase = createAdminClient();

    const [doctorsRes, locationsRes] = await Promise.all([
      supabase.from('doctors').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
      supabase.from('doctors').select('city, state, region_code').eq('verification_status', 'verified'),
    ]);

    const rows = locationsRes.data || [];
    const doctorCount = doctorsRes.count || 0;
    const uniqueCities = new Set(rows.filter(d => d.city).map(d => d.city)).size;
    const uniqueStates = new Set(rows.filter(d => d.state).map(d => d.state)).size;
    const uniqueCountries = new Set(rows.filter(d => d.region_code).map(d => d.region_code)).size;

    return NextResponse.json({
      doctors: doctorCount,
      cities: uniqueCities,
      states: uniqueStates,
      countries: Math.max(uniqueCountries, 1),
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
    });
  } catch {
    return NextResponse.json({ doctors: 140, cities: 30, states: 25, countries: 6 });
  }
}
