import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { haversineDistance, boundingBox, isValidCoord } from '@/lib/geo';
import { resolveStateCode } from '@/lib/resolve-state';
import { getCityCoords } from '@/lib/city-data';

export const revalidate = 60;

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
  'ON': 'Ontario', 'BC': 'British Columbia', 'AB': 'Alberta', 'QC': 'Quebec',
  'MB': 'Manitoba', 'SK': 'Saskatchewan', 'NS': 'Nova Scotia', 'NB': 'New Brunswick',
  'PE': 'Prince Edward Island', 'NL': 'Newfoundland',
  'VIC': 'Victoria', 'NSW': 'New South Wales', 'QLD': 'Queensland',
  'SA': 'South Australia', 'TAS': 'Tasmania', 'ACT': 'Australian Capital Territory',
  'NT': 'Northern Territory',
};

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

function expandQuery(raw: string): string {
  const upper = raw.toUpperCase().trim();
  if (STATE_MAP[upper]) return STATE_MAP[upper];
  const lower = raw.toLowerCase().replace(/\s+/g, '');
  if (SPELL_FIX[lower]) return SPELL_FIX[lower];
  const lowerSpaced = raw.toLowerCase().trim();
  if (SPELL_FIX[lowerSpaced]) return SPELL_FIX[lowerSpaced];
  return raw;
}

/**
 * Split "Greenville, SC" or "Greenville South Carolina" into { city, stateCode }.
 * stateCode is always a 2-letter code resolved via resolveStateCode.
 */
function splitCityState(input: string): { city: string; stateCode: string } | null {
  const trimmed = input.trim();
  if (!trimmed.includes(' ') && !trimmed.includes(',')) {
    // Single word — might be a state code or name
    const code = resolveStateCode(trimmed);
    if (code) return { city: '', stateCode: code };
    return null;
  }

  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const code = resolveStateCode(parts[parts.length - 1]);
      if (code) return { city: parts.slice(0, -1).join(', '), stateCode: code };
    }
  }

  const words = trimmed.split(/\s+/);
  for (let stateWordCount = 3; stateWordCount >= 1; stateWordCount--) {
    if (words.length <= stateWordCount) continue;
    const possibleState = words.slice(-stateWordCount).join(' ');
    const code = resolveStateCode(possibleState);
    if (code) {
      const city = words.slice(0, -stateWordCount).join(' ');
      return { city, stateCode: code };
    }
  }

  return null;
}

const SELECT_FIELDS = 'id, first_name, last_name, clinic_name, slug, city, state, country, verification_status, membership_tier, is_founding_member, latitude, longitude, bio, specialties, region_code, address, photo_url, phone, accepting_new_patients, offers_telehealth, accepts_walkins, languages, hours, booking_url, created_at';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawQuery = sanitize(searchParams.get('q') || '');
  const rawLocation = sanitize(searchParams.get('location') || '');
  const region = searchParams.get('region') || '';
  const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 500);

  // Location coordinates for distance calculation
  const userLat = parseFloat(searchParams.get('lat') || '0');
  const userLng = parseFloat(searchParams.get('lng') || '0');
  const hasUserCoords = isValidCoord(userLat, userLng);

  // Radius filter (miles) — only applies when user coords are known
  const radius = parseInt(searchParams.get('radius') || '0') || 0;

  // Filters
  const specialtiesFilter = searchParams.get('specialties')?.split(',').map(s => s.trim()).filter(Boolean) || [];
  const telehealthFilter = searchParams.get('telehealth') === 'true';
  const newPatientsFilter = searchParams.get('new_patients') === 'true';
  const walkinsFilter = searchParams.get('walkins') === 'true';
  const languageFilter = searchParams.get('language') || '';

  // Sort
  // Default to distance sort. Tier-based sorting removed from patient-facing results (2026-09-23).
  // A patient must never see a farther doctor ranked higher because that doctor paid more.
  const requestedSort = searchParams.get('sort') || 'distance';
  const sort = requestedSort === 'tier' ? 'distance' : requestedSort;

  const supabase = createAdminClient();

  try {
    let dbQuery = supabase
      .from('doctors')
      .select(SELECT_FIELDS, { count: 'exact' })
      .in('verification_status', ['verified', 'pending']);

    if (region && region !== 'ALL') {
      dbQuery = dbQuery.eq('region_code', region);
    }

    // Pre-filter by bounding box when radius is set (much faster than post-filtering all docs)
    if (hasUserCoords && radius > 0) {
      const [minLng, minLat, maxLng, maxLat] = boundingBox(userLat, userLng, radius * 1.2); // 20% buffer for accuracy
      dbQuery = dbQuery
        .gte('latitude', minLat).lte('latitude', maxLat)
        .gte('longitude', minLng).lte('longitude', maxLng);
    }

    // Apply boolean filters
    if (newPatientsFilter) dbQuery = dbQuery.eq('accepting_new_patients', true);
    if (telehealthFilter) dbQuery = dbQuery.eq('offers_telehealth', true);
    if (walkinsFilter) dbQuery = dbQuery.eq('accepts_walkins', true);

    // Language filter
    if (languageFilter) {
      dbQuery = dbQuery.contains('languages', [languageFilter]);
    }

    // Specialty filter (any match)
    if (specialtiesFilter.length > 0) {
      dbQuery = dbQuery.overlaps('specialties', specialtiesFilter);
    }

    // Text search — state is always queried as 2-letter code via resolveStateCode
    const query = expandQuery(rawQuery);
    const locationInput = rawLocation || '';
    const splitFromQuery = !locationInput ? splitCityState(query) : null;
    const splitFromLocation = splitCityState(locationInput);

    // Resolve coordinates from static city lookup for distance calculation
    let searchLat = userLat;
    let searchLng = userLng;
    let hasSearchCoords = hasUserCoords;
    const resolvedSplit = splitFromLocation || splitFromQuery;
    if (!hasSearchCoords && resolvedSplit?.city && resolvedSplit?.stateCode) {
      const { cityToSlug } = await import('@/lib/city-data');
      const slug = cityToSlug(resolvedSplit.city, resolvedSplit.stateCode);
      const coords = getCityCoords(slug);
      if (coords) {
        searchLat = coords.lat;
        searchLng = coords.lng;
        hasSearchCoords = true;
      }
    }

    function applyLocationFilter(q: typeof dbQuery, split: { city: string; stateCode: string } | null, rawLoc: string) {
      if (split) {
        if (split.city) q = q.or(`city.ilike.%${split.city}%,address.ilike.%${split.city}%`);
        q = q.eq('state', split.stateCode);
      } else {
        const stateCode = resolveStateCode(rawLoc);
        if (stateCode) {
          q = q.eq('state', stateCode);
        } else {
          q = q.or(`city.ilike.%${rawLoc}%,address.ilike.%${rawLoc}%`);
        }
      }
      return q;
    }

    if (splitFromQuery) {
      if (splitFromQuery.city) dbQuery = dbQuery.or(`city.ilike.%${splitFromQuery.city}%,address.ilike.%${splitFromQuery.city}%`);
      dbQuery = dbQuery.eq('state', splitFromQuery.stateCode);
    } else if (query && locationInput) {
      const nameConditions = [
        `first_name.ilike.%${query}%`,
        `last_name.ilike.%${query}%`,
        `clinic_name.ilike.%${query}%`,
        `bio.ilike.%${query}%`,
      ];
      dbQuery = dbQuery.or(nameConditions.join(','));
      dbQuery = applyLocationFilter(dbQuery, splitFromLocation, locationInput);
    } else if (query) {
      const stateCode = resolveStateCode(query);
      if (stateCode) {
        dbQuery = dbQuery.eq('state', stateCode);
      } else {
        const allConditions = [
          `first_name.ilike.%${query}%`,
          `last_name.ilike.%${query}%`,
          `clinic_name.ilike.%${query}%`,
          `city.ilike.%${query}%`,
          `address.ilike.%${query}%`,
          `bio.ilike.%${query}%`,
        ];
        dbQuery = dbQuery.or(allConditions.join(','));
      }
    } else if (locationInput) {
      dbQuery = applyLocationFilter(dbQuery, splitFromLocation, locationInput);
    }

    const { data, error, count } = await dbQuery.limit(limit);

    if (error || !data || data.length === 0) {
      // Smart cascading fallback: try progressively broader searches
      let fallbackData: any[] = [];
      let fallbackHint = '';

      // Step 1: If both query + location were used, try just location
      const locationTerm = rawLocation || (splitFromQuery ? `${splitFromQuery.city}, ${splitFromQuery.stateCode}` : '');
      if (rawQuery && locationTerm) {
        const locSplit = splitCityState(locationTerm);
        let locQuery = supabase.from('doctors').select(SELECT_FIELDS).in('verification_status', ['verified', 'pending']);
        if (locSplit) {
          if (locSplit.city) locQuery = locQuery.or(`city.ilike.%${locSplit.city}%,address.ilike.%${locSplit.city}%`);
          locQuery = locQuery.eq('state', locSplit.stateCode);
        } else {
          const stateCode = resolveStateCode(locationTerm);
          if (stateCode) { locQuery = locQuery.eq('state', stateCode); }
          else { locQuery = locQuery.or(`city.ilike.%${locationTerm}%,address.ilike.%${locationTerm}%`); }
        }
        const { data: locFallback } = await locQuery.limit(20);
        if (locFallback?.length) { fallbackData = locFallback; fallbackHint = `Showing all doctors near ${locationTerm}`; }
      }

      // Step 2: Try just the state
      if (!fallbackData.length) {
        const stateCode = splitFromQuery?.stateCode || splitFromLocation?.stateCode || resolveStateCode(rawLocation || rawQuery);
        if (stateCode) {
          const { data: stateFallback } = await supabase
            .from('doctors')
            .select(SELECT_FIELDS)
            .in('verification_status', ['verified', 'pending'])
            .eq('state', stateCode)
            .limit(20);
          if (stateFallback?.length) { fallbackData = stateFallback; fallbackHint = `Showing doctors in ${stateCode}`; }
        }
      }

      // Step 2b: Try city name as a broad search
      if (!fallbackData.length) {
        const cityTerm = splitFromQuery?.city || rawQuery || rawLocation;
        if (cityTerm) {
          const { data: cityFallback } = await supabase
            .from('doctors')
            .select(SELECT_FIELDS)
            .in('verification_status', ['verified', 'pending'])
            .or(`city.ilike.%${cityTerm}%,address.ilike.%${cityTerm}%`)
            .limit(20);
          if (cityFallback?.length) { fallbackData = cityFallback; fallbackHint = `Showing doctors near ${cityTerm}`; }
        }
      }

      // Step 3: If query was a specialty, try just that specialty nationwide
      if (!fallbackData.length && rawQuery) {
        const { data: specFallback } = await supabase
          .from('doctors')
          .select(SELECT_FIELDS)
          .in('verification_status', ['verified', 'pending'])
          .or(`bio.ilike.%${rawQuery}%,clinic_name.ilike.%${rawQuery}%`)
          .limit(20);
        if (specFallback?.length) { fallbackData = specFallback; fallbackHint = `Showing "${rawQuery}" doctors nationwide`; }
      }

      // Step 4: Last resort — top verified doctors in region
      if (!fallbackData.length) {
        let fallbackQuery = supabase
          .from('doctors')
          .select(SELECT_FIELDS)
          .eq('verification_status', 'verified')
          .limit(20);
        if (region && region !== 'ALL') fallbackQuery = fallbackQuery.eq('region_code', region);
        const { data: regionFallback } = await fallbackQuery;
        fallbackData = regionFallback || [];
        fallbackHint = 'Showing featured doctors';
      }

      // Add distance to fallback results
      const enriched = enrichWithDistance(fallbackData, userLat, userLng, hasUserCoords);
      const sorted = sortResults(enriched, sort);

      return NextResponse.json({
        doctors: sorted,
        total: sorted.length,
        isFallback: true,
        error: !!error,
        searchedFor: rawQuery || rawLocation || '',
        fallbackHint: fallbackHint,
      });
    }

    // Enrich with distance using resolved coordinates (user geolocation or city lookup)
    let enriched = enrichWithDistance(data, searchLat, searchLng, hasSearchCoords);

    // Apply radius: default 50mi for location searches, expand progressively
    if (hasSearchCoords) {
      const defaultRadius = radius > 0 ? radius : 50;
      const nearby = enriched.filter((d: any) => d.distance_miles != null && d.distance_miles <= defaultRadius);

      if (nearby.length >= 3) {
        enriched = nearby;
      } else {
        // Progressive expansion: 50 → 100 → 250
        for (const expandedRadius of [100, 250]) {
          const expanded = enriched.filter((d: any) => d.distance_miles != null && d.distance_miles <= expandedRadius);
          if (expanded.length >= 3) { enriched = expanded; break; }
        }
        // If still under 3, keep all results with distance
        if (enriched.filter((d: any) => d.distance_miles != null).length < 3) {
          // Keep all, they'll be sorted by distance
        }
      }
    }

    // Exact radius filter (bounding box was approximate)
    if (hasUserCoords && radius > 0) {
      enriched = enriched.filter((d: any) => d.distance_miles == null || d.distance_miles <= radius + 0.1);
    }

    // Sort
    const sorted = sortResults(enriched, sort);

    return NextResponse.json({
      doctors: sorted,
      total: count || sorted.length,
      isFallback: false,
      error: false,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }
    });

  } catch (err) {
    console.error("[SEARCH_API] Critical Error:", err);

    const { data: emergencyData } = await supabase
      .from('doctors')
      .select(SELECT_FIELDS)
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

function enrichWithDistance(doctors: any[], userLat: number, userLng: number, hasCoords: boolean): any[] {
  return doctors.map(d => {
    let distance_miles: number | null = null;
    if (hasCoords && isValidCoord(d.latitude, d.longitude)) {
      distance_miles = haversineDistance(userLat, userLng, d.latitude, d.longitude);
    }
    return { ...d, distance_miles };
  });
}

function sortResults(doctors: any[], sort: string): any[] {
  const tierPriority: Record<string, number> = { pro: 1, growth: 1, basic: 2, starter: 2, free: 2 };

  return [...doctors].sort((a, b) => {
    if (sort === 'distance') {
      // Distance first, then tier
      const aDist = a.distance_miles ?? 99999;
      const bDist = b.distance_miles ?? 99999;
      if (aDist !== bDist) return aDist - bDist;
      return (tierPriority[a.membership_tier] || 4) - (tierPriority[b.membership_tier] || 4);
    }
    if (sort === 'name') {
      const aName = `${a.last_name || ''} ${a.first_name || ''}`.trim().toLowerCase();
      const bName = `${b.last_name || ''} ${b.first_name || ''}`.trim().toLowerCase();
      return aName.localeCompare(bName);
    }
    // Default: tier priority (founding → pro → growth → free)
    const aFounder = a.is_founding_member ? 0 : 1;
    const bFounder = b.is_founding_member ? 0 : 1;
    if (aFounder !== bFounder) return aFounder - bFounder;
    return (tierPriority[a.membership_tier] || 4) - (tierPriority[b.membership_tier] || 4);
  });
}
