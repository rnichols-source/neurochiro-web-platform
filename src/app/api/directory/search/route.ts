import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

// Cache search results for 60 seconds at the edge
export const revalidate = 60;

const SEARCHABLE_NAME_COLUMNS = ['first_name', 'last_name', 'clinic_name'];
const SEARCHABLE_LOCATION_COLUMNS = ['city', 'state', 'address'];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  // Sanitize inputs: remove characters that could break PostgREST filter syntax
  const query = (searchParams.get('q') || '').replace(/[%_(),.*\\]/g, '').trim();
  const location = (searchParams.get('location') || '').replace(/[%_(),.*\\]/g, '').trim();
  const region = searchParams.get('region') || ''; // This is Country Code (US/AU)
  const limit = parseInt(searchParams.get('limit') || '20');
  
  const supabase = createAdminClient();

  try {
    const selectFields = 'id, first_name, last_name, clinic_name, slug, city, state, country, verification_status, membership_tier, latitude, longitude, bio, specialties, region_code, address';
    
    let dbQuery = supabase
      .from('doctors')
      .select(selectFields, { count: 'exact' })
      .eq('verification_status', 'verified');

    // region_code is Country (US, AU, etc.)
    if (region && region !== 'US') {
      dbQuery = dbQuery.eq('region_code', region);
    }

    if (query) {
      const nameConditions = SEARCHABLE_NAME_COLUMNS.map(col => `${col}.ilike.%${query}%`);
      const locationConditions = SEARCHABLE_LOCATION_COLUMNS.map(col => `${col}.ilike.%${query}%`);
      const specialtyCondition = `specialties::text.ilike.%${query}%`;
      dbQuery = dbQuery.or([...nameConditions, ...locationConditions, specialtyCondition].join(','));
    }

    if (location) {
      const locationConditions = SEARCHABLE_LOCATION_COLUMNS.map(col => `${col}.ilike.%${location}%`);
      dbQuery = dbQuery.or(locationConditions.join(','));
    }

    const { data, error, count } = await dbQuery
      .limit(limit);

    // Priority sort: Pro first, then Growth, then Starter
    const tierPriority: Record<string, number> = { pro: 1, growth: 2, starter: 3 };
    if (data) {
      data.sort((a: any, b: any) => (tierPriority[a.membership_tier] || 3) - (tierPriority[b.membership_tier] || 3));
    }

    if (error || !data || data.length === 0) {
      console.log("[SEARCH_API] No results or error, triggered FALLBACK FETCH (Location Ignored)");
      
      // [FALLBACK FIX]: Ignore location filter entirely for fallback
      let fallbackQuery = supabase
        .from('doctors')
        .select(selectFields)
        .or('membership_tier.eq.pro,verification_status.eq.verified')
        .order('membership_tier', { ascending: false })
        .limit(20);
      
      // Still filter by country if provided to keep it somewhat relevant
      if (region && region !== 'US') {
        fallbackQuery = fallbackQuery.eq('region_code', region);
      }

      const { data: fallbackData, error: fallbackError } = await fallbackQuery;

      return NextResponse.json({
        doctors: fallbackData || [],
        total: fallbackData?.length || 0,
        isFallback: true,
        error: !!fallbackError
      });
    }

    return NextResponse.json({
      doctors: data,
      total: count || data.length,
      isFallback: false,
      error: false
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }
    });

  } catch (err) {
    console.error("[SEARCH_API] Critical Error:", err);
    
    // Emergency Fallback on total crash
    const { data: emergencyData } = await supabase
      .from('doctors')
      .select('id, first_name, last_name, clinic_name, slug, city, state, country')
      .eq('verification_status', 'verified')
      .limit(20);

    return NextResponse.json({
      doctors: emergencyData || [],
      total: emergencyData?.length || 0,
      isFallback: true,
      error: true
    });
  }
}
