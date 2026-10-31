import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { EUROPEAN_ISO, countryMeta, toDirectoryCountry } from '@/lib/directory-countries';

export const revalidate = 300;

export async function GET(request: NextRequest) {
  const country = (request.nextUrl.searchParams.get('country') || '').toUpperCase();
  const supabase = createAdminClient();

  if (request.nextUrl.searchParams.get('cities') === '1') {
    const iso = country === 'UK' ? 'GB' : country;
    let query = supabase
      .from('doctors')
      .select('city, state, country')
      .in('verification_status', ['verified', 'pending']);
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

  const { data } = await supabase
    .from('doctors')
    .select('country')
    .in('verification_status', ['verified', 'pending']);

  const counts = new Map<string, number>();
  for (const row of data || []) {
    const code = toDirectoryCountry(row.country || 'US');
    counts.set(code, (counts.get(code) || 0) + 1);
    if (EUROPEAN_ISO.includes((row.country || '').toUpperCase()) || row.country === 'GB') {
      counts.set('EU', (counts.get('EU') || 0) + 1);
    }
    counts.set('ALL', (counts.get('ALL') || 0) + 1);
  }

  const countries = [...counts.entries()]
    .filter(([, count]) => count > 0)
    .map(([code, count]) => {
      const meta = countryMeta(code);
      return { code, label: meta.label, flag: meta.flag, count };
    })
    .sort((a, b) => b.count - a.count);

  return NextResponse.json(countries);
}
