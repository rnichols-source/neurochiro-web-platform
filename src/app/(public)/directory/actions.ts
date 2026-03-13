'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { Doctor } from '@/types/directory'
import { cache } from 'react'

export const getDoctors = cache(async function getDoctors(options: {
  regionCode?: string;
  bounds?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  page?: number;
  limit?: number;
  searchQuery?: string;
} = {}) {
  const { regionCode, bounds, page = 1, limit = 100, searchQuery } = options;
  const supabase = createServerSupabase()

  try {
    let query = supabase
      .from('doctors')
      .select('*', { count: 'exact' })
      .eq('verification_status', 'verified')

    // 1. Search Query (Simple ILIKE on name/clinic)
    if (searchQuery) {
      query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,clinic_name.ilike.%${searchQuery}%`);
    }

    // 2. Filter by Region if provided
    if (regionCode) {
      query = query.eq('region_code', regionCode)
    }

    // 3. Filter by Bounding Box (Map Viewport)
    if (bounds) {
      query = query
        .gte('longitude', bounds[0])
        .gte('latitude', bounds[1])
        .lte('longitude', bounds[2])
        .lte('latitude', bounds[3]);
    }

    // 4. Apply Ranking & Order
    query = query
      .order('membership_tier', { ascending: false }) // pro > growth > starter
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    // 5. Apply Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
    
    const { data, error, count } = await query

    if (error) {
      console.error("[DIRECTORY_ACTIONS] Database query error:", error);
      return { doctors: [], total: 0 };
    }

    return {
      doctors: (data || []) as Doctor[],
      total: count || 0
    };
  } catch (e) {
    console.error("[DIRECTORY_ACTIONS] Critical error fetching doctors:", e);
    return { doctors: [], total: 0 };
  }
});

export const getDoctorBySlug = cache(async function getDoctorBySlug(slug: string) {
  const supabase = createServerSupabase()
  
  // Try to find by slug first
  let { data, error } = await supabase
    .from('doctors')
    .select('*')
    .eq('slug', slug)
    .single()

  // Fallback to finding by ID if slug is actually a UUID
  if (error || !data) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    if (isUuid) {
        const { data: byId, error: errorId } = await supabase
            .from('doctors')
            .select('*')
            .eq('id', slug)
            .single()
        data = byId
        error = errorId
    }
  }

  return { doctor: data as Doctor | null, error }
});

export async function incrementDoctorViews(slug: string) {
  const supabase = createServerSupabase();
  try {
    await supabase.rpc('increment_doctor_views', { doctor_slug: slug });
  } catch (e) {
    console.error("Failed to increment views:", e);
  }
}

export async function getStudentsForMap(options: {
  bounds?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  limit?: number;
} = {}) {
  const { bounds, limit = 100 } = options;
  const supabase = createServerSupabase();

  try {
    let query = supabase
      .from('students')
      .select('id, full_name, school, location_city, graduation_year, interests, is_looking_for_mentorship, latitude, longitude')
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

    if (error) {
      console.error("[DIRECTORY_ACTIONS] Error fetching students:", error);
      return [];
    }

    return (data || []) as any[];
  } catch (e) {
    console.error("[DIRECTORY_ACTIONS] Critical error fetching students:", e);
    return [];
  }
}
