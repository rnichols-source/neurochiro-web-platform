'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { MOCK_DOCTORS } from '@/lib/mock-data'
import { Doctor } from '@/types/directory'
export async function getDoctors(options: {
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
      .select('*, profiles!user_id(full_name, email, role, subscription_status)', { count: 'exact' })
      .eq('verification_status', 'verified')

    // 1. Search Query (Simple ILIKE on name/clinic)
    if (searchQuery) {
      query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,clinic_name.ilike.%${searchQuery}%`);
    }

    // 2. Filter by Region if provided
    if (regionCode) {
      query = query.eq('region_code', regionCode)
    }

    // 2. Filter by Bounding Box (Map Viewport)
    if (bounds) {
      query = query
        .gte('longitude', bounds[0])
        .gte('latitude', bounds[1])
        .lte('longitude', bounds[2])
        .lte('latitude', bounds[3]);
    }

    // 3. Apply Ranking & Order
    // Live Supabase query: Order by tier (pro > growth > starter) then created_at
    query = query
      .order('membership_tier', { ascending: false })
      .order('created_at', { ascending: false });

    // 4. Apply Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
    
    const { data, error, count } = await query

    if (error || !data || data.length === 0) {
      console.log("No DB results, returning mock subset")
      
      // Filter mock data
      let filteredMock = regionCode 
        ? MOCK_DOCTORS.filter(d => d.region_code === regionCode)
        : MOCK_DOCTORS;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filteredMock = filteredMock.filter(d => 
          d.first_name.toLowerCase().includes(q) || 
          d.last_name.toLowerCase().includes(q) || 
          d.clinic_name.toLowerCase().includes(q)
        );
      }

      // Tiered Ranking + Daily Rotation for Mock Data
      const today = new Date().toISOString().split('T')[0];
      const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0);
      
      const sortedMock = [...filteredMock].sort((a, b) => {
        const tiers: Record<string, number> = { pro: 3, growth: 2, starter: 1 };
        if (tiers[b.membership_tier] !== tiers[a.membership_tier]) {
          return tiers[b.membership_tier] - tiers[a.membership_tier];
        }
        // Daily pseudo-random rotation within tiers
        const valA = (parseInt(a.id, 36) || 0) + seed;
        const valB = (parseInt(b.id, 36) || 0) + seed;
        return (valA % 100) - (valB % 100);
      });

      return {
        doctors: sortedMock.slice(from, from + limit),
        total: sortedMock.length
      };
    }

    return {
      doctors: data as Doctor[],
      total: count || 0
    };
  } catch (e) {
    console.error("Error fetching doctors:", e)
    return { doctors: MOCK_DOCTORS.slice(0, 100), total: MOCK_DOCTORS.length };
  }
}

export async function getDoctorBySlug(slug: string) {
  const supabase = createServerSupabase()
  
  // Try to find by slug first
  let { data, error } = await supabase
    .from('doctors')
    .select('*, profiles!user_id(full_name, email, role, subscription_status)')
    .eq('slug', slug)
    .single()

  // Fallback to finding by ID if slug is actually a UUID
  if (error || !data) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    if (isUuid) {
        const { data: byId, error: errorId } = await supabase
            .from('doctors')
            .select('*, profiles!user_id(full_name, email, role, subscription_status)')
            .eq('id', slug)
            .single()
        data = byId
    }
  }

  return { doctor: data as Doctor | null, error }
}
