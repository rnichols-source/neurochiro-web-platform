import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { EUROPEAN_ISO } from '@/lib/directory-countries';
import { excludeDemo } from '@/lib/directory/exclude-demo';
import { countryChipPayload, getPublicDirectoryCounts } from '@/lib/directory/public-counts';

export const revalidate = 300;

export async function GET(request: NextRequest) {
  const country = (request.nextUrl.searchParams.get('country') || '').toUpperCase();
  const supabase = createAdminClient();

  if (request.nextUrl.searchParams.get('cities') === '1') {
    const iso = country === 'UK' ? 'GB' : country;
    let query = excludeDemo(supabase
      .from('doctors')
      .select('city, state, country')
      .in('verification_status', ['verified', 'pending']));
    if (country === 'EU') query = query.in('country', EUROPEAN_ISO);
    else if (country === 'US' || !country) query = query.or('country.is.null,country.eq.US');
    else if (country !== 'ALL') query = query.eq('country', iso);
    const { data } = await query.limit(1000);
    const counts = new Map<string, number>();
    for (const row of data || []) {
      if (!row.city) continue;
      const label = [row.city, row.state].filter(Boolean).join(', ');
      counts.set(label, (counts.get(label) || 0) + 1);
    }
    const cities = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, count]) => ({ label, count }));
    return NextResponse.json({ cities });
  }

  const counts = await getPublicDirectoryCounts();
  return NextResponse.json(countryChipPayload(counts));
}
