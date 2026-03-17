import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const SEARCHABLE_COLUMNS = ['first_name', 'last_name', 'clinic_name', 'region_code'];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const region = searchParams.get('region') || '';
  const limit = parseInt(searchParams.get('limit') || '20');
  
  const supabase = createAdminClient();

  try {
    const selectFields = 'id, first_name, last_name, clinic_name, slug, city, state, country, zip_code, verification_status, membership_tier, latitude, longitude, bio, specialties, region_code';
    
    let dbQuery = (supabase as any)
      .from('doctors')
      .select(selectFields, { count: 'exact' })
      .eq('verification_status', 'verified');

    if (region && region !== 'US') {
      dbQuery = dbQuery.eq('region_code', region);
    }

    if (query) {
      // Use only SEARCHABLE_COLUMNS for the text search
      const orConditions = SEARCHABLE_COLUMNS.map(col => `${col}.ilike.%${query}%`).join(',');
      dbQuery = dbQuery.or(orConditions);
    }

    const { data, error, count } = await dbQuery
      .order('membership_tier', { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) {
      console.log("[SEARCH_API] No results or error, triggered FALLBACK FETCH");
      
      // FALLBACK: SELECT * FROM doctors WHERE membership_tier = 'pro' OR is_verified = true LIMIT 20
      // Note: mapping 'is_verified' to 'verification_status' = 'verified' based on schema
      const { data: fallbackData, error: fallbackError } = await (supabase as any)
        .from('doctors')
        .select(selectFields)
        .or('membership_tier.eq.pro,verification_status.eq.verified')
        .order('membership_tier', { ascending: false })
        .limit(20);

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
    });

  } catch (err) {
    console.error("[SEARCH_API] Critical Error:", err);
    
    // Emergency Fallback on total crash
    const { data: emergencyData } = await (supabase as any)
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
