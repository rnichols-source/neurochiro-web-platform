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
function splitCityState(input: string, country: string = 'US'): { city: string; stateCode: string } | null {
  const trimmed = input.trim();

  // Try the search country first, then fall back to US
  const tryResolve = (s: string) => resolveStateCode(s, country) || (country !== 'US' ? resolveStateCode(s, 'US') : null);

  if (!trimmed.includes(' ') && !trimmed.includes(',')) {
    const code = tryResolve(trimmed);
    if (code) return { city: '', stateCode: code };
    return null;
  }

  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const code = tryResolve(parts[parts.length - 1]);
      if (code) return { city: parts.slice(0, -1).join(', '), stateCode: code };
    }
  }

  const words = trimmed.split(/\s+/);
  for (let stateWordCount = 3; stateWordCount >= 1; stateWordCount--) {
    if (words.length <= stateWordCount) continue;
    const possibleState = words.slice(-stateWordCount).join(' ');
    const code = tryResolve(possibleState);
    if (code) {
      const city = words.slice(0, -stateWordCount).join(' ');
      return { city, stateCode: code };
    }
  }

  return null;
}

/**
 * Detect and extract a postal code from input. Handles US ZIP, CA FSA, UK outward, NZ postcode.
 * Returns { code, country } or null.
 */
function extractPostalCode(input: string, regionHint: string = 'US'): { code: string; country: string } | null {
  const cleaned = input.replace(/\s+/g, '').trim()
  if (!cleaned) return null

  // US: 5-digit ZIP, optionally +4
  const usMatch = cleaned.match(/^(\d{5})(?:-\d{4})?$/)
  if (usMatch) return { code: usMatch[1], country: 'US' }

  // CA: full postal code A1A1A1 or FSA A1A
  const caFull = cleaned.toUpperCase().match(/^([A-Z]\d[A-Z])\d[A-Z]\d$/)
  if (caFull) return { code: caFull[1], country: 'CA' } // use FSA for lookup
  const caFsa = cleaned.toUpperCase().match(/^([A-Z]\d[A-Z])$/)
  if (caFsa) return { code: caFsa[1], country: 'CA' }

  // UK: outward code (1-2 letters + digit + optional letter/digit), optionally with inward
  const withSpace = input.trim().toUpperCase()
  const ukFull = withSpace.match(/^([A-Z]{1,2}\d[A-Z\d]?)\s?\d[A-Z]{2}$/)
  if (ukFull) return { code: ukFull[1], country: 'GB' }
  const ukOutward = withSpace.match(/^([A-Z]{1,2}\d[A-Z\d]?)$/)
  if (ukOutward) return { code: ukOutward[1], country: 'GB' }

  // NZ: 4-digit (only if region hint is NZ, since 4 digits could be a partial US ZIP)
  if (/^\d{4}$/.test(cleaned) && regionHint === 'NZ') {
    return { code: cleaned, country: 'NZ' }
  }

  return null
}

/**
 * Look up postal code coordinates from the zip_codes table.
 * Country-aware: uses the country column for disambiguation.
 */
async function lookupPostalCode(supabase: any, code: string, country: string): Promise<{ city: string; state: string; lat: number; lng: number } | null> {
  const { data } = await (supabase as any)
    .from('zip_codes')
    .select('city, state, lat, lng')
    .eq('country', country)
    .eq('zip', code)
    .maybeSingle()
  return data || null
}

const SELECT_FIELDS = 'id, first_name, last_name, clinic_name, slug, city, state, country, verification_status, membership_tier, is_founding_member, latitude, longitude, bio, specialties, region_code, address, photo_url, phone, accepting_new_patients, offers_telehealth, accepts_walkins, languages, hours, booking_url, created_at';

// Map region codes to ISO country codes for doctor filtering
const REGION_TO_COUNTRY: Record<string, string> = {
  'US': 'US', 'CA': 'CA', 'UK': 'GB', 'NZ': 'NZ', 'AU': 'AU',
}

/** Country-aware doctors query: filters verified/pending + correct country */
function doctorsQuery(sb: any, countryCode: string) {
  let q = sb
    .from('doctors')
    .select(SELECT_FIELDS)
    .in('verification_status', ['verified', 'pending'])
  // US includes NULL country (legacy data)
  if (countryCode === 'US') {
    q = q.or('country.is.null,country.eq.US')
  } else {
    q = q.eq('country', countryCode)
  }
  return q
}

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

  // Resolve region to country code for filtering
  const searchCountry = REGION_TO_COUNTRY[region] || 'US'

  try {
    let dbQuery = doctorsQuery(supabase, searchCountry);

    // region_code filter only for legacy region-based routing (US sub-regions)
    if (region && region !== 'ALL' && searchCountry === 'US') {
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

    // Postal code detection — handles US ZIP, CA FSA, UK outward, NZ postcode
    const locationInput = rawLocation || '';
    const postalMatch = extractPostalCode(locationInput, region) || extractPostalCode(rawQuery, region);
    let zipResolved: { city: string; state: string; lat: number; lng: number } | null = null;
    let locationLabel = '';

    if (postalMatch) {
      zipResolved = await lookupPostalCode(supabase, postalMatch.code, postalMatch.country);
      if (!zipResolved) {
        return NextResponse.json({
          doctors: [],
          total: 0,
          isFallback: false,
          error: false,
          locationLabel: `We couldn't find postal code ${postalMatch.code}. Try a city name or check the code.`,
        });
      }
      locationLabel = `Showing doctors near ${zipResolved.city}, ${zipResolved.state}`;
    }

    // Text search — state is always queried as 2-letter code via resolveStateCode
    const query = expandQuery(rawQuery);
    const splitFromQuery = (!locationInput || postalMatch) ? (!postalMatch ? splitCityState(query, searchCountry) : null) : null;
    const splitFromLocation = postalMatch ? null : splitCityState(locationInput, searchCountry);

    // Resolve coordinates: ZIP > user geolocation > city lookup
    let searchLat = userLat;
    let searchLng = userLng;
    let hasSearchCoords = hasUserCoords;

    if (zipResolved) {
      searchLat = Number(zipResolved.lat);
      searchLng = Number(zipResolved.lng);
      hasSearchCoords = true;
    }

    const resolvedSplit = splitFromLocation || splitFromQuery;
    if (!hasSearchCoords && resolvedSplit?.city && resolvedSplit?.stateCode) {
      const { cityToSlug } = await import('@/lib/city-data');
      const slug = cityToSlug(resolvedSplit.city, resolvedSplit.stateCode);
      const coords = getCityCoords(slug);
      if (coords) {
        searchLat = coords.lat;
        locationLabel = `Showing doctors near ${resolvedSplit.city}, ${resolvedSplit.stateCode}`;
        searchLng = coords.lng;
        hasSearchCoords = true;
      }
    }

    // Single city name without state (e.g. "Atlanta", "London") — geocode via zip_codes table
    // so we can do distance-based search instead of text matching
    const bareLocationTerm = (!resolvedSplit && !postalMatch) ? (locationInput || '').trim() : '';
    if (!hasSearchCoords && bareLocationTerm && !resolveStateCode(bareLocationTerm, searchCountry)) {
      // Look up in zip_codes table for a city match, filtered by country
      const { data: cityMatch } = await (supabase as any)
        .from('zip_codes')
        .select('city, state, lat, lng')
        .eq('country', searchCountry)
        .ilike('city', bareLocationTerm)
        .limit(1);
      if (cityMatch && cityMatch.length > 0) {
        searchLat = Number(cityMatch[0].lat);
        searchLng = Number(cityMatch[0].lng);
        hasSearchCoords = true;
        locationLabel = `Showing doctors near ${cityMatch[0].city}, ${cityMatch[0].state}`;
      }
    }

    function applyLocationFilter(q: typeof dbQuery, split: { city: string; stateCode: string } | null, rawLoc: string) {
      if (split) {
        if (split.city) q = q.or(`city.ilike.%${split.city}%,address.ilike.%${split.city}%`);
        q = q.eq('state', split.stateCode);
      } else {
        const stateCode = resolveStateCode(rawLoc, searchCountry);
        if (stateCode) {
          q = q.eq('state', stateCode);
        } else {
          q = q.or(`city.ilike.%${rawLoc}%,address.ilike.%${rawLoc}%`);
        }
      }
      return q;
    }

    if (zipResolved) {
      // ZIP search: use bounding box for the radius query, no text filtering needed
      const searchRadius = radius > 0 ? radius : 250; // wide initial fetch, radius applied post-query
      const [minLng, minLat, maxLng, maxLat] = boundingBox(searchLat, searchLng, searchRadius * 1.2);
      dbQuery = dbQuery
        .gte('latitude', minLat).lte('latitude', maxLat)
        .gte('longitude', minLng).lte('longitude', maxLng);
    } else if (splitFromQuery) {
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
      const stateCode = resolveStateCode(query, searchCountry);
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
    } else if (locationInput && hasSearchCoords && bareLocationTerm) {
      // Bare city name resolved to coordinates — use distance-based search, not text matching
      // This catches "Atlanta" finding Marietta doctors 15mi away
      const searchRadius = radius > 0 ? radius : 250;
      const [minLng, minLat, maxLng, maxLat] = boundingBox(searchLat, searchLng, searchRadius * 1.2);
      dbQuery = dbQuery
        .gte('latitude', minLat).lte('latitude', maxLat)
        .gte('longitude', minLng).lte('longitude', maxLng);
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
        const locSplit = splitCityState(locationTerm, searchCountry);
        let locQuery = doctorsQuery(supabase, searchCountry);
        if (locSplit) {
          if (locSplit.city) locQuery = locQuery.or(`city.ilike.%${locSplit.city}%,address.ilike.%${locSplit.city}%`);
          locQuery = locQuery.eq('state', locSplit.stateCode);
        } else {
          const stateCode = resolveStateCode(locationTerm, searchCountry);
          if (stateCode) { locQuery = locQuery.eq('state', stateCode); }
          else { locQuery = locQuery.or(`city.ilike.%${locationTerm}%,address.ilike.%${locationTerm}%`); }
        }
        const { data: locFallback } = await locQuery.limit(20);
        if (locFallback?.length) { fallbackData = locFallback; fallbackHint = `Showing all doctors near ${locationTerm}`; }
      }

      // Step 2: Try just the state
      if (!fallbackData.length) {
        const stateCode = splitFromQuery?.stateCode || splitFromLocation?.stateCode || resolveStateCode(rawLocation || rawQuery, searchCountry);
        if (stateCode) {
          const { data: stateFallback } = await doctorsQuery(supabase, searchCountry)
            .eq('state', stateCode)
            .limit(20);
          if (stateFallback?.length) { fallbackData = stateFallback; fallbackHint = `Showing doctors in ${stateCode}`; }
        }
      }

      // Step 2b: Try city name as a broad search
      if (!fallbackData.length) {
        const cityTerm = splitFromQuery?.city || rawQuery || rawLocation;
        if (cityTerm) {
          const { data: cityFallback } = await doctorsQuery(supabase, searchCountry)
            .or(`city.ilike.%${cityTerm}%,address.ilike.%${cityTerm}%`)
            .limit(20);
          if (cityFallback?.length) { fallbackData = cityFallback; fallbackHint = `Showing doctors near ${cityTerm}`; }
        }
      }

      // GUARD: If location was resolved to coordinates, NEVER fall back to nationwide.
      // An empty result is honest. A nationwide list pretending to be local is not.
      if (!fallbackData.length && hasSearchCoords) {
        // Location was resolved but no doctors found — return empty with location label
        return NextResponse.json({
          doctors: [],
          total: 0,
          isFallback: false,
          error: false,
          locationLabel: locationLabel || `No doctors found near ${rawLocation || rawQuery}`,
        });
      }

      // Step 3: Only if NO location was specified — try specialty or nationwide
      if (!fallbackData.length && !rawLocation && rawQuery) {
        const { data: specFallback } = await doctorsQuery(supabase, searchCountry)
          .or(`bio.ilike.%${rawQuery}%,clinic_name.ilike.%${rawQuery}%`)
          .limit(20);
        if (specFallback?.length) { fallbackData = specFallback; fallbackHint = `Showing "${rawQuery}" doctors nationwide`; }
      }

      // Step 4: Only if NO location — last resort
      if (!fallbackData.length && !rawLocation) {
        let fallbackQuery = doctorsQuery(supabase, searchCountry)
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
      locationLabel: locationLabel || undefined,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }
    });

  } catch (err) {
    console.error("[SEARCH_API] Critical Error:", err);

    const { data: emergencyData } = await doctorsQuery(supabase, searchCountry)
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
