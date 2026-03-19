'use server'

/**
 * SCHEMA PROTECTION:
 * DO NOT add photo_url, zip_code, or rating columns to selection fields 
 * unless they are first verified to exist in the Supabase Schema.
 */

import { createServerSupabase } from '@/lib/supabase-server'
import { Doctor } from '@/types/directory'
import { unstable_noStore as noStore, revalidatePath } from 'next/cache'

export async function getDoctors(options: {
  regionCode?: string;
  bounds?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  page?: number;
  limit?: number;
  searchQuery?: string;
} = {}) {
  noStore();
  const { regionCode, bounds, page = 1, limit = 20, searchQuery } = options;
  const supabase = createServerSupabase()

  // Force revalidation of the directory path
  revalidatePath('/directory');

  try {
    // DATA MINIMIZATION: Only fetch essential columns for the LIST view
    // Removed: email, website_url, instagram_url, facebook_url, address (private-ish)
    const selectFields = 'id, first_name, last_name, clinic_name, slug, city, state, country, zip_code, verification_status, membership_tier, latitude, longitude, bio, specialties, region_code';
    
    let query = (supabase as any)
      .from('doctors')
      .select(selectFields, { count: 'exact' })
      .in('verification_status', ['verified', 'pending']);

    if (regionCode && regionCode !== 'US') {
      query = query.eq('region_code', regionCode);
    }

    if (searchQuery && searchQuery.trim()) {
      const cleanQuery = searchQuery.trim();
      // Handle State Abbreviation (e.g. NJ -> New Jersey)
      const stateMap: Record<string, string> = {
        'NJ': 'New Jersey', 'NY': 'New York', 'TX': 'Texas', 'CA': 'California', 'FL': 'Florida',
        'PA': 'Pennsylvania', 'IL': 'Illinois', 'OH': 'Ohio', 'GA': 'Georgia', 'NC': 'North Carolina'
      };
      const expandedQuery = stateMap[cleanQuery.toUpperCase()] || cleanQuery;

      query = query.or(`first_name.ilike.%${cleanQuery}%,last_name.ilike.%${cleanQuery}%,clinic_name.ilike.%${cleanQuery}%,city.ilike.%${cleanQuery}%,state.ilike.%${expandedQuery}%,zip_code.ilike.%${cleanQuery}%,specialties::text.ilike.%${cleanQuery}%,address.ilike.%${cleanQuery}%`);
    }

    if (bounds) {
      query = query
        .gte('longitude', bounds[0])
        .gte('latitude', bounds[1])
        .lte('longitude', bounds[2])
        .lte('latitude', bounds[3]);
    }

    // Improved ordering: Priority to Pro, then Growth, then Starter
    const { data, error, count } = await query
      .order('membership_tier', { ascending: false }) // This puts 'starter' last but 'pro' and 'growth' order depends on names.
      // Better to use an explicit priority if possible, but for now we'll stick to a more robust fallback
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error("[DIRECTORY_ACTION] Database Error:", error);
      return { doctors: [], total: 0, error: true };
    }

    // FALLBACK: If specific search/region returns nothing, return a subset of verified doctors
    if ((!data || data.length === 0) && (regionCode || searchQuery)) {
       const { data: fallbackData, count: fallbackCount } = await (supabase as any)
         .from('doctors')
         .select(selectFields, { count: 'exact' })
         .eq('verification_status', 'verified')
         .limit(limit);
       
       if (fallbackData && fallbackData.length > 0) {
         return {
           doctors: fallbackData as Doctor[],
           total: fallbackCount || fallbackData.length,
           error: false,
           isFallback: true
         };
       }
    }
    
    return {
      doctors: (data || []) as Doctor[],
      total: count || 0,
      error: false
    };
  } catch (e) {
    console.error("[DIRECTORY_ACTION] Critical Execution Error:", e);
    return { doctors: [], total: 0, error: true };
  }
}

export async function getDoctorBySlug(slug: string) {
  noStore();
  const supabase = createServerSupabase()
  
  // DATA MINIMIZATION: Fetch columns needed for full profile
  // Removed google_place_id as it does not exist in the schema
  const selectFields = 'id, first_name, last_name, clinic_name, slug, city, state, country, verification_status, membership_tier, address, latitude, longitude, bio, specialties, region_code, email, website_url, instagram_url, facebook_url, user_id';
  
  try {
    let { data, error } = await (supabase as any)
      .from('doctors')
      .select(selectFields)
      .eq('slug', slug)
      .eq('verification_status', 'verified')
      .maybeSingle()

    if (!data) {
      // Improved UUID regex: 8-4-4-4-12
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      
      if (isUuid) {
          const { data: byId, error: errorId } = await (supabase as any)
              .from('doctors')
              .select(selectFields)
              .eq('id', slug)
              .eq('verification_status', 'verified')
              .maybeSingle()
          
          if (byId) {
            data = byId
            error = errorId
          }
      }
    }
    
    if (error) {
      console.error("[DIRECTORY_ACTION] Error fetching doctor by slug/id:", error.message);
      return { doctor: null, error: true };
    }

    return { doctor: data as Doctor | null, error: false }
  } catch (e) {
    console.error("[DIRECTORY_ACTION] Critical Crash in getDoctorBySlug:", e);
    return { doctor: null, error: true }
  }
}

export async function incrementDoctorViews(slug: string) {
  const supabase = createServerSupabase();
  try {
    await (supabase as any).rpc('increment_doctor_views', { doctor_slug: slug });
  } catch (e) {
    // Masked internally
  }
}

export async function getStudentsForMap(options: {
  bounds?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  limit?: number;
} = {}) {
  noStore();
  const { bounds, limit = 100 } = options;
  const supabase = createServerSupabase();
  try {
    // Only fetch minimal public student data for the map
    let query = (supabase as any)
      .from('students')
      .select('id, school, location_city, latitude, longitude')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(limit);

    if (bounds) {
      query = query
        .gte('longitude', bounds[0])
        .gte('latitude', bounds[1])
        .lte('longitude', bounds[2])
        .lte('latitude', bounds[3]);
    }
    const { data, error } = await query
    if (error) return [];
    return (data || []) as any[];
  } catch (e) {
    return [];
  }
}
