'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { Doctor } from '@/types/directory'
import { unstable_noStore as noStore, revalidatePath } from 'next/cache'

export async function getDoctors(options: {
  regionCode?: string;
  bounds?: [number, number, number, number];
  page?: number;
  limit?: number;
  searchQuery?: string;
} = {}) {
  noStore();
  const { page = 1, limit = 20 } = options;
  
  console.log('📡 [DIRECTORY_DEBUG] ENV_CHECK:', {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'PRESENT' : 'MISSING',
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'PRESENT' : 'MISSING',
    url_start: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 15)
  });

  try {
    const supabase = createServerSupabase();
    const selectFields = 'id, first_name, last_name, clinic_name, slug, city, state, country, verification_status, membership_tier, address, latitude, longitude, bio, specialties, region_code, email';
    
    console.log('📡 [DIRECTORY_DEBUG] Executing query...');
    const { data, error, count } = await (supabase as any)
      .from('doctors')
      .select(selectFields, { count: 'exact' })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error("❌ [DIRECTORY_DEBUG] Supabase Error:", error);
      return { doctors: [], total: 0, error: error.message };
    }

    console.log('📡 [DIRECTORY_DEBUG] Query Success. Count:', count, 'Length:', data?.length);

    if (!data || data.length === 0) {
      console.log('⚠️ [DIRECTORY_DEBUG] No data from DB, returning Mock Doctor.');
      return {
        doctors: [{
          id: 'debug-id-123',
          first_name: 'Debug',
          last_name: 'Physician',
          clinic_name: 'Database Connection Active',
          city: 'System',
          state: 'OK',
          slug: 'debug-doctor',
          verification_status: 'verified',
          membership_tier: 'pro',
          bio: 'If you see this, the server action is working but the database table returned 0 results.',
          specialties: ['Connectivity', 'Diagnostics']
        }] as Doctor[],
        total: 1
      };
    }
    
    return {
      doctors: data as Doctor[],
      total: count || 0
    };
  } catch (e: any) {
    console.error("❌ [DIRECTORY_DEBUG] Critical Crash:", e);
    return { 
      doctors: [{
        id: 'error-id',
        first_name: 'Server',
        last_name: 'Error',
        clinic_name: 'Action Crashed',
        city: 'Error',
        slug: 'error',
        bio: `Error: ${e.message || 'Unknown error'}. Check server logs.`,
        verification_status: 'verified',
        membership_tier: 'pro'
      }] as Doctor[], 
      total: 1,
      criticalError: e.message 
    };
  }
}

export async function getDoctorBySlug(slug: string) {
  noStore();
  const supabase = createServerSupabase()
  const selectFields = 'id, first_name, last_name, clinic_name, slug, city, state, country, verification_status, membership_tier, address, latitude, longitude, website_url, instagram_url, facebook_url, bio, specialties, region_code, email';
  
  let { data, error } = await (supabase as any)
    .from('doctors')
    .select(selectFields)
    .eq('slug', slug)
    .single()

  if (error || !data) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    if (isUuid) {
        const { data: byId, error: errorId } = await (supabase as any)
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
    let query = (supabase as any)
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
    if (error) return [];
    return (data || []) as any[];
  } catch (e) {
    return [];
  }
}
