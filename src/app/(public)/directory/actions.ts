'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { Doctor } from '@/types/directory'
import { revalidatePath } from 'next/cache'

export async function getDoctors(options: {
  regionCode?: string;
  bounds?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  page?: number;
  limit?: number;
  searchQuery?: string;
} = {}) {
  const { regionCode, bounds, page = 1, limit = 20, searchQuery } = options;
  const supabase = createServerSupabase()

  try {
    // DATA MINIMIZATION: Only fetch essential columns for the LIST view
    // Removed: email, website_url, instagram_url, facebook_url, address (private-ish)
    const selectFields = 'id, first_name, last_name, clinic_name, slug, city, state, country, verification_status, membership_tier, is_founding_member, latitude, longitude, bio, specialties, region_code, phone, photo_url';
    
    let query = supabase
      .from('doctors')
      .select(selectFields, { count: 'exact' })
      .in('verification_status', ['verified', 'pending']);

    if (regionCode && regionCode !== 'ALL') {
      query = query.eq('region_code', regionCode);
    }

    if (searchQuery && searchQuery.trim()) {
      // Sanitize: remove characters that could break the PostgREST filter syntax
      const cleanQuery = searchQuery.trim().replace(/[%_(),.*\\]/g, '');
      if (!cleanQuery) return { doctors: [], total: 0 };

      // Handle State Abbreviation (e.g. NJ -> New Jersey)
      const stateMap: Record<string, string> = {
        'NJ': 'New Jersey', 'NY': 'New York', 'TX': 'Texas', 'CA': 'California', 'FL': 'Florida',
        'PA': 'Pennsylvania', 'IL': 'Illinois', 'OH': 'Ohio', 'GA': 'Georgia', 'NC': 'North Carolina',
        'MI': 'Michigan', 'AZ': 'Arizona', 'WA': 'Washington', 'MA': 'Massachusetts', 'TN': 'Tennessee',
        'IN': 'Indiana', 'MO': 'Missouri', 'MD': 'Maryland', 'WI': 'Wisconsin', 'CO': 'Colorado',
        'MN': 'Minnesota', 'SC': 'South Carolina', 'AL': 'Alabama', 'LA': 'Louisiana', 'KY': 'Kentucky',
        'OR': 'Oregon', 'OK': 'Oklahoma', 'CT': 'Connecticut', 'UT': 'Utah', 'IA': 'Iowa',
        'NV': 'Nevada', 'AR': 'Arkansas', 'MS': 'Mississippi', 'KS': 'Kansas', 'NM': 'New Mexico',
        'NE': 'Nebraska', 'ID': 'Idaho', 'WV': 'West Virginia', 'HI': 'Hawaii', 'NH': 'New Hampshire',
        'ME': 'Maine', 'MT': 'Montana', 'RI': 'Rhode Island', 'DE': 'Delaware', 'SD': 'South Dakota',
        'ND': 'North Dakota', 'AK': 'Alaska', 'VT': 'Vermont', 'WY': 'Wyoming', 'DC': 'District of Columbia',
        'VA': 'Virginia',
        // Australian states/territories
        'VIC': 'Victoria', 'NSW': 'New South Wales', 'QLD': 'Queensland',
        'SA': 'South Australia', 'TAS': 'Tasmania', 'ACT': 'Australian Capital Territory',
        'NT': 'Northern Territory',
        // Canadian provinces
        'ON': 'Ontario', 'BC': 'British Columbia', 'AB': 'Alberta', 'QC': 'Quebec',
        'MB': 'Manitoba', 'SK': 'Saskatchewan', 'NS': 'Nova Scotia', 'NB': 'New Brunswick',
      };
      const expandedQuery = stateMap[cleanQuery.toUpperCase()] || cleanQuery;

      // Search across name, clinic, and location fields
      query = query.or(`first_name.ilike.%${cleanQuery}%,last_name.ilike.%${cleanQuery}%,clinic_name.ilike.%${cleanQuery}%,city.ilike.%${cleanQuery}%,state.ilike.%${expandedQuery}%,address.ilike.%${cleanQuery}%`);
    }

    if (bounds) {
      query = query
        .gte('longitude', bounds[0])
        .gte('latitude', bounds[1])
        .lte('longitude', bounds[2])
        .lte('latitude', bounds[3]);
    }

    // Fetch with pagination
    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error("[DIRECTORY_ACTION] Database Error:", error);
      return { doctors: [], total: 0, error: true };
    }

    // Priority sort: Founding members first, then by tier (Pro > Growth > Starter)
    const tierPriority: Record<string, number> = { pro: 1, growth: 2, starter: 3 };
    if (data) {
      data.sort((a: any, b: any) => {
        const aFounder = a.is_founding_member ? 0 : 1;
        const bFounder = b.is_founding_member ? 0 : 1;
        if (aFounder !== bFounder) return aFounder - bFounder;
        return (tierPriority[a.membership_tier] || 3) - (tierPriority[b.membership_tier] || 3);
      });
    }

    // FALLBACK: If specific search/region returns nothing, return a subset of verified doctors
    if ((!data || data.length === 0) && (regionCode || searchQuery)) {
       const { data: fallbackData, count: fallbackCount } = await supabase
         .from('doctors')
         .select(selectFields, { count: 'exact' })
         .eq('verification_status', 'verified')
         .limit(limit);
       
       if (fallbackData && fallbackData.length > 0) {
         return {
           doctors: fallbackData as unknown as Doctor[],
           total: fallbackCount || fallbackData.length,
           error: false,
           isFallback: true
         };
       }
    }
    
    return {
      doctors: (data || []) as unknown as Doctor[],
      total: count || 0,
      error: false
    };
  } catch (e) {
    console.error("[DIRECTORY_ACTION] Critical Execution Error:", e);
    return { doctors: [], total: 0, error: true };
  }
}

export async function getDoctorBySlug(slug: string) {
  const supabase = createServerSupabase()
  
  // DATA MINIMIZATION: Fetch columns needed for full profile
  // Removed google_place_id as it does not exist in the schema
  const selectFields = 'id, first_name, last_name, clinic_name, slug, city, state, country, verification_status, membership_tier, is_founding_member, address, latitude, longitude, bio, specialties, region_code, email, phone, website_url, instagram_url, facebook_url, user_id, photo_url, video_url';
  
  try {
    let { data, error } = await supabase
      .from('doctors')
      .select(selectFields)
      .eq('slug', slug)
      .eq('verification_status', 'verified')
      .maybeSingle()

    if (!data) {
      // Improved UUID regex: 8-4-4-4-12
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      
      if (isUuid) {
          const { data: byId, error: errorId } = await supabase
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

    return { doctor: data as unknown as Doctor | null, error: false }
  } catch (e) {
    console.error("[DIRECTORY_ACTION] Critical Crash in getDoctorBySlug:", e);
    return { doctor: null, error: true }
  }
}

export async function incrementDoctorViews(slug: string) {
  const supabase = createServerSupabase();
  try {
    await supabase.rpc('increment_doctor_views', { doctor_slug: slug });
  } catch (e) {
    // Masked internally
  }
}

// ── Get seminars hosted by a doctor ──
export async function getDoctorSeminars(userId: string) {
  const supabase = createServerSupabase();
  try {
    const { data } = await supabase
      .from('seminars')
      .select('id, title, dates, location, city, country, price, is_past')
      .eq('host_id', userId)
      .eq('is_approved', true)
      .order('dates', { ascending: false })
      .limit(6);
    return data || [];
  } catch { return []; }
}

// ── Get jobs posted by a doctor ──
export async function getDoctorJobs(doctorId: string) {
  const supabase = createServerSupabase();
  try {
    const { data } = await supabase
      .from('job_postings')
      .select('id, title, employment_type, salary_min, salary_max, created_at, status')
      .eq('doctor_id', doctorId)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(5);
    return data || [];
  } catch { return []; }
}

export async function getStudentsForMap(options: {
  bounds?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  limit?: number;
} = {}) {
  const { bounds, limit = 100 } = options;
  const supabase = createServerSupabase();
  try {
    // Only fetch minimal public student data for the map
    let query = supabase
      .from('students')
      .select('id, full_name, school, graduation_year, location_city, latitude, longitude')
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
