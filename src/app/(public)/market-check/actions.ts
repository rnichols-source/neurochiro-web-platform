'use server'

import { createAdminClient } from '@/lib/supabase-admin'

export async function getMarketData(city: string, state: string) {
  const supabase = createAdminClient();

  // Count doctors in this city
  const { count: cityCount } = await supabase
    .from('doctors')
    .select('id', { count: 'exact', head: true })
    .ilike('city', city)
    .ilike('state', state)
    .in('verification_status', ['verified', 'pending']);

  // Count doctors in this state
  const { count: stateCount } = await supabase
    .from('doctors')
    .select('id', { count: 'exact', head: true })
    .ilike('state', state)
    .in('verification_status', ['verified', 'pending']);

  // Total nationwide
  const { count: totalCount } = await supabase
    .from('doctors')
    .select('id', { count: 'exact', head: true })
    .in('verification_status', ['verified', 'pending']);

  return {
    cityCount: cityCount || 0,
    stateCount: stateCount || 0,
    totalCount: totalCount || 0,
    cityName: city,
    stateName: state,
  };
}

export async function getLocationSuggestions(query: string) {
  if (!query || query.length < 2) return [];

  const supabase = createAdminClient();
  const { data } = await supabase
    .from('doctors')
    .select('city, state')
    .or(`city.ilike.%${query}%,state.ilike.%${query}%`)
    .in('verification_status', ['verified', 'pending'])
    .limit(50);

  if (!data) return [];

  // Deduplicate city/state pairs
  const seen = new Set<string>();
  return data.filter(d => {
    if (!d.city || !d.state) return false;
    const key = `${d.city}|${d.state}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map(d => ({ city: d.city!, state: d.state! })).slice(0, 10);
}
