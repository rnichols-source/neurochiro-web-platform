'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { Doctor } from '@/types/directory'
import { unstable_noStore as noStore } from 'next/cache'

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

  try {
    // 🛡️ Optimized Direct Query
    const selectFields = 'id, first_name, last_name, clinic_name, specialties, slug, bio, rating, review_count, latitude, longitude, membership_tier, verification_status, city, state, country, region_code, photo_url';
    
    let query = supabase
      .from('doctors')
      .select(selectFields, { count: 'exact' })
      .eq('verification_status', 'verified');

    if (searchQuery) {
      query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,clinic_name.ilike.%${searchQuery}%`);
    }

    if (bounds) {
      query = query
        .gte('longitude', bounds[0])
        .gte('latitude', bounds[1])
        .lte('longitude', bounds[2])
        .lte('latitude', bounds[3]);
    }

    const { data, error, count } = await query
      .order('membership_tier', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error("[DIRECTORY_ACTIONS] Direct Query Error:", error);
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
}

export async function getDoctorBySlug(slug: string) {
  noStore();
  const supabase = createServerSupabase()
  
  const selectFields = 'id, first_name, last_name, clinic_name, specialties, slug, bio, rating, review_count, latitude, longitude, membership_tier, verification_status, city, state, country, region_code, photo_url, website_url, instagram_url, facebook_url';
  
  // Try to find by slug first
  let { data, error } = await supabase
    .from('doctors')
    .select(selectFields)
    .eq('slug', slug)
    .single()

  // Fallback to finding by ID if slug is actually a UUID
  if (error || !data) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    if (isUuid) {
        const { data: byId, error: errorId } = await supabase
            .from('doctors')
            .select(selectFields)
            .eq('id', slug)
            .single()
        data = byId
        error = errorId
    }
  }

  return { doctor: data as Doctor | null, error }
}

export async function incrementDoctorViews(slug: string) {
  const supabase = createServerSupabase();
  try {
    await (supabase as any).rpc('increment_doctor_views', { doctor_slug: slug });
  } catch (e) {
    console.error("Failed to increment views:", e);
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
