import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export const revalidate = 60;

// State/province abbreviation → full name mapping
const STATE_MAP: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'DC': 'District of Columbia',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois',
  'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana',
  'ME': 'Maine', 'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota',
  'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma', 'OR': 'Oregon',
  'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina', 'SD': 'South Dakota',
  'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia',
  'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
  // Canadian provinces
  'ON': 'Ontario', 'BC': 'British Columbia', 'AB': 'Alberta', 'QC': 'Quebec',
  'MB': 'Manitoba', 'SK': 'Saskatchewan', 'NS': 'Nova Scotia', 'NB': 'New Brunswick',
  'PE': 'Prince Edward Island', 'NL': 'Newfoundland',
  // Australian states
  'VIC': 'Victoria', 'NSW': 'New South Wales', 'QLD': 'Queensland',
  'SA': 'South Australia', 'TAS': 'Tasmania', 'ACT': 'Australian Capital Territory',
  'NT': 'Northern Territory', 'WA_AU': 'Western Australia',
};

// Common misspellings → correct spelling
const SPELL_FIX: Record<string, string> = {
  'conneticut': 'Connecticut', 'connecticut': 'Connecticut', 'massachucetts': 'Massachusetts',
  'massachusets': 'Massachusetts', 'pensylvania': 'Pennsylvania', 'pensilvania': 'Pennsylvania',
  'californai': 'California', 'flordia': 'Florida', 'goergia': 'Georgia', 'illnois': 'Illinois',
  'michagan': 'Michigan', 'minesota': 'Minnesota', 'misouri': 'Missouri', 'missisipi': 'Mississippi',
  'tennesee': 'Tennessee', 'tennesse': 'Tennessee', 'virgina': 'Virginia', 'wiscosin': 'Wisconsin',
  'arizonia': 'Arizona', 'colorodo': 'Colorado', 'louisianna': 'Louisiana', 'oklohoma': 'Oklahoma',
  'oregeon': 'Oregon', 'washingon': 'Washington', 'newyork': 'New York', 'newjersey': 'New Jersey',
  'northcarolina': 'North Carolina', 'southcarolina': 'South Carolina',
  'ft lauderdale': 'Fort Lauderdale', 'ft. lauderdale': 'Fort Lauderdale',
  'ft worth': 'Fort Worth', 'ft. worth': 'Fort Worth',
  'st louis': 'Saint Louis', 'st. louis': 'Saint Louis',
};

function sanitize(s: string): string {
  return s.replace(/[%_(),.*\\'";\[\]{}]/g, '').trim().slice(0, 100);
}

// Expand abbreviations and fix misspellings
function expandQuery(raw: string): string {
  const upper = raw.toUpperCase().trim();
  if (STATE_MAP[upper]) return STATE_MAP[upper];
  const lower = raw.toLowerCase().replace(/\s+/g, '');
  if (SPELL_FIX[lower]) return SPELL_FIX[lower];
  // Also check with spaces preserved
  const lowerSpaced = raw.toLowerCase().trim();
  if (SPELL_FIX[lowerSpaced]) return SPELL_FIX[lowerSpaced];
  return raw;
}

// Split "Hartford Connecticut" into ["Hartford", "Connecticut"]
// Split "New York" into ["New York"] (keep known multi-word states together)
function splitCityState(input: string): { city: string; state: string } | null {
  const trimmed = input.trim();
  if (!trimmed.includes(' ') && !trimmed.includes(',')) return null;

  // Handle comma-separated: "Hartford, CT" or "Hartford, Connecticut"
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return { city: parts[0], state: expandQuery(parts[1]) };
    }
  }

  // Handle space-separated: try to match a known state at the end
  const words = trimmed.split(/\s+/);
  // Try last 3 words, then 2, then 1 as state
  for (let stateWordCount = 3; stateWordCount >= 1; stateWordCount--) {
    if (words.length <= stateWordCount) continue;
    const possibleState = words.slice(-stateWordCount).join(' ');
    const expanded = expandQuery(possibleState);
    // Check if it resolved to something different (meaning it's a known state)
    if (expanded !== possibleState || Object.values(STATE_MAP).some(s => s.toLowerCase() === possibleState.toLowerCase())) {
      const city = words.slice(0, -stateWordCount).join(' ');
      return { city, state: expanded };
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawQuery = sanitize(searchParams.get('q') || '');
  const rawLocation = sanitize(searchParams.get('location') || '');
  const region = searchParams.get('region') || '';
  const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 500);

  const supabase = createAdminClient();

  try {
    const selectFields = 'id, first_name, last_name, clinic_name, slug, city, state, country, verification_status, membership_tier, is_founding_member, latitude, longitude, bio, specialties, region_code, address, photo_url, phone';

    let dbQuery = supabase
      .from('doctors')
      .select(selectFields, { count: 'exact' })
      .in('verification_status', ['verified', 'pending']);

    if (region && region !== 'ALL') {
      dbQuery = dbQuery.eq('region_code', region);
    }

    // Determine search terms
    const query = expandQuery(rawQuery);
    const locationInput = rawLocation || '';

    // Try to split combined "city state" input from either field
    const splitFromQuery = !locationInput ? splitCityState(query) : null;
    const splitFromLocation = splitCityState(locationInput);

    if (splitFromQuery) {
      // User typed "Hartford Connecticut" in the search box
      // Search for city AND state separately
      const cityExpanded = expandQuery(splitFromQuery.city);
      const stateExpanded = splitFromQuery.state;
      dbQuery = dbQuery.or(`city.ilike.%${cityExpanded}%,address.ilike.%${cityExpanded}%`);
      dbQuery = dbQuery.ilike('state', `%${stateExpanded}%`);
    } else if (query && locationInput) {
      // User filled both fields: query = name/specialty, location = place
      // Query searches name/clinic/specialty/bio
      const nameConditions = [
        `first_name.ilike.%${query}%`,
        `last_name.ilike.%${query}%`,
        `clinic_name.ilike.%${query}%`,
        `bio.ilike.%${query}%`,
      ];
      dbQuery = dbQuery.or(nameConditions.join(','));

      // Location narrows results (AND, not OR)
      const locExpanded = expandQuery(locationInput);
      const locSplit = splitFromLocation;
      if (locSplit) {
        const cityExp = expandQuery(locSplit.city);
        dbQuery = dbQuery.or(`city.ilike.%${cityExp}%,address.ilike.%${cityExp}%`);
        dbQuery = dbQuery.ilike('state', `%${locSplit.state}%`);
      } else {
        dbQuery = dbQuery.or(`city.ilike.%${locExpanded}%,state.ilike.%${locExpanded}%,address.ilike.%${locExpanded}%`);
      }
    } else if (query) {
      // Only search query, no location — search everything
      const expanded = expandQuery(query);
      const allConditions = [
        `first_name.ilike.%${query}%`,
        `last_name.ilike.%${query}%`,
        `clinic_name.ilike.%${query}%`,
        `city.ilike.%${expanded}%`,
        `state.ilike.%${expanded}%`,
        `address.ilike.%${expanded}%`,
        `bio.ilike.%${query}%`,
      ];
      dbQuery = dbQuery.or(allConditions.join(','));
    } else if (locationInput) {
      // Only location, no query
      const locExpanded = expandQuery(locationInput);
      const locSplit = splitFromLocation;
      if (locSplit) {
        const cityExp = expandQuery(locSplit.city);
        dbQuery = dbQuery.or(`city.ilike.%${cityExp}%,address.ilike.%${cityExp}%`);
        dbQuery = dbQuery.ilike('state', `%${locSplit.state}%`);
      } else {
        dbQuery = dbQuery.or(`city.ilike.%${locExpanded}%,state.ilike.%${locExpanded}%,address.ilike.%${locExpanded}%`);
      }
    }

    const { data, error, count } = await dbQuery.limit(limit);

    // Priority sort: Founding → Pro → Growth → Free
    const tierPriority: Record<string, number> = { pro: 1, growth: 2, basic: 3, starter: 3, free: 4 };
    if (data) {
      data.sort((a: any, b: any) => {
        const aFounder = a.is_founding_member ? 0 : 1;
        const bFounder = b.is_founding_member ? 0 : 1;
        if (aFounder !== bFounder) return aFounder - bFounder;
        return (tierPriority[a.membership_tier] || 4) - (tierPriority[b.membership_tier] || 4);
      });
    }

    if (error || !data || data.length === 0) {
      // Smarter fallback: try broader search before giving up
      let fallbackData: any[] = [];

      // If they searched a location, try just the state
      const searchedState = splitFromQuery?.state || splitFromLocation?.state || expandQuery(rawLocation || rawQuery);
      if (searchedState) {
        const { data: stateFallback } = await supabase
          .from('doctors')
          .select(selectFields)
          .in('verification_status', ['verified', 'pending'])
          .ilike('state', `%${searchedState}%`)
          .limit(20);
        if (stateFallback?.length) fallbackData = stateFallback;
      }

      // If still nothing, show top verified doctors in the region
      if (!fallbackData.length) {
        let fallbackQuery = supabase
          .from('doctors')
          .select(selectFields)
          .eq('verification_status', 'verified')
          .limit(20);
        if (region && region !== 'ALL') {
          fallbackQuery = fallbackQuery.eq('region_code', region);
        }
        const { data: regionFallback } = await fallbackQuery;
        fallbackData = regionFallback || [];
      }

      // Sort fallback too
      fallbackData.sort((a: any, b: any) => (tierPriority[a.membership_tier] || 4) - (tierPriority[b.membership_tier] || 4));

      return NextResponse.json({
        doctors: fallbackData,
        total: fallbackData.length,
        isFallback: true,
        error: !!error,
        searchedFor: rawQuery || rawLocation || '',
      });
    }

    return NextResponse.json({
      doctors: data,
      total: count || data.length,
      isFallback: false,
      error: false,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }
    });

  } catch (err) {
    console.error("[SEARCH_API] Critical Error:", err);

    const { data: emergencyData } = await supabase
      .from('doctors')
      .select('id, first_name, last_name, clinic_name, slug, city, state, country, latitude, longitude, specialties, photo_url, membership_tier, region_code')
      .eq('verification_status', 'verified')
      .limit(20);

    return NextResponse.json({
      doctors: emergencyData || [],
      total: emergencyData?.length || 0,
      isFallback: true,
      error: true,
    });
  }
}
