import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { resolveStateCode } from '@/lib/resolve-state';
import { EUROPEAN_ISO } from '@/lib/directory-countries';
import { excludeDemo } from '@/lib/directory/exclude-demo';

export const revalidate = 300; // Cache 5 min

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').replace(/[%_(),.*\\'";\[\]{}]/g, '').trim().slice(0, 50);
  const type = searchParams.get('type') || 'all'; // all, location, name
  const country = (searchParams.get('country') || '').toUpperCase();

  if (!q || q.length < 2) {
    return NextResponse.json({ cities: [], doctors: [], specialties: [] });
  }

  const supabase = createAdminClient();

  try {
    const results: { cities: any[]; doctors: any[]; specialties: string[] } = {
      cities: [],
      doctors: [],
      specialties: [],
    };

    if (type === 'all' || type === 'location') {
      // Get matching cities with count
      let cityQuery = excludeDemo(supabase
        .from('doctors')
        .select('city, state, country')
        .ilike('city', `${q}%`)
        .eq('verification_status', 'verified'));
      if (country === 'EU') cityQuery = cityQuery.in('country', EUROPEAN_ISO);
      else if (country === 'US') cityQuery = cityQuery.or('country.is.null,country.eq.US');
      else if (country && country !== 'ALL') cityQuery = cityQuery.eq('country', country === 'UK' ? 'GB' : country);
      const { data: cityData } = await cityQuery.limit(50);

      if (cityData) {
        // Deduplicate and count
        const cityMap = new Map<string, { city: string; state: string; country: string; count: number }>();
        cityData.forEach(d => {
          const key = `${d.city}|${d.state}`;
          if (cityMap.has(key)) {
            cityMap.get(key)!.count++;
          } else {
            cityMap.set(key, { city: d.city, state: d.state, country: d.country, count: 1 });
          }
        });
        results.cities = Array.from(cityMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
      }

      // Also try state match
      if (results.cities.length === 0) {
        const { data: stateData } = await excludeDemo(supabase
          .from('doctors')
          .select('state, country')
          .eq('state', resolveStateCode(q) || q)
          .eq('verification_status', 'verified'))
          .limit(20);

        if (stateData) {
          const stateMap = new Map<string, { city: string; state: string; country: string; count: number }>();
          stateData.forEach(d => {
            const key = d.state;
            if (stateMap.has(key)) {
              stateMap.get(key)!.count++;
            } else {
              stateMap.set(key, { city: '', state: d.state, country: d.country, count: 1 });
            }
          });
          results.cities = Array.from(stateMap.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        }
      }
    }

    if (type !== 'location') {
      // Get matching doctor names (skip when searching by location only)
      let nameQuery = excludeDemo(supabase
        .from('doctors')
        .select('first_name, last_name, slug, clinic_name, city, state, photo_url')
        .eq('verification_status', 'verified')
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,clinic_name.ilike.%${q}%`));
      if (country === 'EU') nameQuery = nameQuery.in('country', EUROPEAN_ISO);
      else if (country === 'US') nameQuery = nameQuery.or('country.is.null,country.eq.US');
      else if (country && country !== 'ALL') nameQuery = nameQuery.eq('country', country === 'UK' ? 'GB' : country);
      const { data: nameData } = await nameQuery.limit(5);

      results.doctors = (nameData || []).map(d => ({
        name: `Dr. ${d.first_name} ${d.last_name}`,
        slug: d.slug,
        clinic: d.clinic_name,
        location: [d.city, d.state].filter(Boolean).join(', '),
        photo_url: d.photo_url,
      }));
    }

    if (type !== 'location') {
      // Get matching specialties
      const COMMON_SPECIALTIES = [
        'Pediatric', 'Prenatal', 'Sports', 'Neurologically-Focused', 'Upper Cervical',
        'Gonstead', 'Network Spinal', 'Activator', 'Torque Release', 'Functional Neurology',
        'Family', 'Pregnancy', 'Diversified', 'SOT', 'Thompson', 'CBP',
        'Webster', 'Corrective Care', 'Spinal Decompression', 'Auto Injury',
      ];
      results.specialties = COMMON_SPECIALTIES
        .filter(s => s.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 4);
    }

    return NextResponse.json(results, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
    });

  } catch (err) {
    console.error("[AUTOCOMPLETE] Error:", err);
    return NextResponse.json({ cities: [], doctors: [], specialties: [] });
  }
}
