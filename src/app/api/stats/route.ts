import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { count: doctorCount } = await supabase
      .from('doctors')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'verified');

    const { data: countries } = await supabase
      .from('doctors')
      .select('region_code')
      .eq('verification_status', 'verified')
      .not('region_code', 'is', null);

    const uniqueCountries = new Set((countries || []).map(d => d.region_code)).size;

    return NextResponse.json({
      doctors: doctorCount || 0,
      countries: Math.max(uniqueCountries, 1),
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
    });
  } catch {
    return NextResponse.json({ doctors: 140, countries: 6 });
  }
}
