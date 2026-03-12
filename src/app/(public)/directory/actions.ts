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
    // Live Supabase query: Order by is_featured then created_at
    query = query
      .order('is_featured', { ascending: false })
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
        ? MOCK_DOCTORS.filter((d: any) => d.region_code === regionCode)
        : MOCK_DOCTORS;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filteredMock = filteredMock.filter((d: any) => 
          d.first_name.toLowerCase().includes(q) || 
          d.last_name.toLowerCase().includes(q) || 
          d.clinic_name.toLowerCase().includes(q)
        );
      }

      // Ensure mock doctors have valid coordinates if they are 0
      // This is crucial for the map display
      filteredMock = filteredMock.map(d => {
        if (d.latitude === 0 && d.longitude === 0) {
          // Provide distinct fallback coordinates within the US if they are 0
          // This avoids everything stacking at 0,0 and being filtered out
          const seed = parseInt(d.id, 36) || 0;
          return {
            ...d,
            latitude: 35 + (seed % 10),
            longitude: -100 + (seed % 20)
          };
        }
        return d;
      });

      // Filter by bounds if provided
      if (bounds) {
        filteredMock = filteredMock.filter(d => 
          d.longitude >= bounds[0] && 
          d.latitude >= bounds[1] && 
          d.longitude <= bounds[2] && 
          d.latitude <= bounds[3]
        );
      }

      // Tiered Ranking + Daily Rotation for Mock Data
      const today = new Date().toISOString().split('T')[0];
      const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0);
      
      const sortedMock = [...filteredMock].sort((a: any, b: any) => {
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

  // Final fallback to mock data
  if (!data) {
    console.log("Doctor not found in DB, checking mock data for slug:", slug);
    const mockDoctor = MOCK_DOCTORS.find(d => d.slug === slug || d.id === slug);
    if (mockDoctor) {
      return { doctor: mockDoctor as Doctor, error: null };
    }
  }

  return { doctor: data as Doctor | null, error }
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

    if (error || !data || data.length === 0) {
      // Mock Data Fallback for students
      const mockStudents = [
        {
          id: 'student-1',
          full_name: 'Sarah Jenkins',
          school: 'Palmer College',
          location_city: 'Davenport',
          graduation_year: 2026,
          latitude: 41.5236,
          longitude: -90.5776,
          interests: ['Pediatrics', 'Tonal']
        },
        {
          id: 'student-2',
          full_name: 'David Chen',
          school: 'Life University',
          location_city: 'Marietta',
          graduation_year: 2027,
          latitude: 33.9526,
          longitude: -84.5499,
          interests: ['Sports', 'Family Care']
        },
        {
          id: 'student-3',
          full_name: 'Emma Rossi',
          school: 'Parker University',
          location_city: 'Dallas',
          graduation_year: 2025,
          latitude: 32.7767,
          longitude: -96.7970,
          interests: ['Prenatal', 'Nervous System']
        }
      ];

      // Filter by bounds if provided
      if (bounds) {
        return mockStudents.filter(s => 
          s.longitude >= bounds[0] && 
          s.latitude >= bounds[1] && 
          s.longitude <= bounds[2] && 
          s.latitude <= bounds[3]
        );
      }

      return mockStudents;
    }

    return data;
  } catch (e) {
    console.error("Error fetching students:", e);
    return [];
  }
}
