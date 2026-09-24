'use server'

import { createAdminClient } from '@/lib/supabase-admin';
import { haversineDistance } from '@/lib/geo';
import { cityToSlug, EMPTY_METROS } from '@/lib/city-data';

const SEARCH_RADIUS_MILES = 30;
const NEAREST_FALLBACK_COUNT = 5;

export interface CityDoctor {
  id: string;
  first_name: string;
  last_name: string;
  slug: string;
  clinic_name: string;
  city: string;
  state: string;
  phone: string | null;
  website_url: string | null;
  booking_url: string | null;
  photo_url: string | null;
  bio: string | null;
  specialties: string[];
  accepting_new_patients: boolean;
  latitude: number;
  longitude: number;
  distance_miles: number;
  hours: string | null;
  accepted_payment: string[] | null;
  offers_telehealth: boolean;
  accepts_walkins: boolean;
}

/**
 * Get doctors within radius of a city center, sorted by distance.
 * Returns both in-city and nearby doctors with distance labels.
 */
export async function getDoctorsNearCity(
  lat: number,
  lng: number,
  radiusMiles: number = SEARCH_RADIUS_MILES,
): Promise<CityDoctor[]> {
  const supabase = createAdminClient();

  // Bounding box pre-filter
  const latDelta = radiusMiles / 69;
  const lngDelta = radiusMiles / (69 * Math.cos(lat * Math.PI / 180));

  const { data } = await (supabase as any)
    .from('doctors')
    .select('id, first_name, last_name, slug, clinic_name, city, state, phone, website_url, booking_url, photo_url, bio, specialties, accepting_new_patients, latitude, longitude, hours, accepted_payment, offers_telehealth, accepts_walkins')
    .eq('verification_status', 'verified')
    .eq('country', 'US')
    .gte('latitude', lat - latDelta)
    .lte('latitude', lat + latDelta)
    .gte('longitude', lng - lngDelta)
    .lte('longitude', lng + lngDelta);

  if (!data || data.length === 0) return [];

  return data
    .map((d: any) => ({
      ...d,
      distance_miles: haversineDistance(lat, lng, d.latitude, d.longitude),
    }))
    .filter((d: any) => d.distance_miles <= radiusMiles)
    .sort((a: any, b: any) => a.distance_miles - b.distance_miles);
}

/**
 * Get the nearest doctors nationwide when there are none in radius.
 */
export async function getNearestDoctors(
  lat: number,
  lng: number,
  limit: number = NEAREST_FALLBACK_COUNT,
): Promise<CityDoctor[]> {
  const supabase = createAdminClient();

  const { data } = await (supabase as any)
    .from('doctors')
    .select('id, first_name, last_name, slug, clinic_name, city, state, phone, website_url, booking_url, photo_url, bio, specialties, accepting_new_patients, latitude, longitude, hours, accepted_payment, offers_telehealth, accepts_walkins')
    .eq('verification_status', 'verified')
    .eq('country', 'US')
    .gt('latitude', 0);

  if (!data || data.length === 0) return [];

  return data
    .map((d: any) => ({
      ...d,
      distance_miles: haversineDistance(lat, lng, d.latitude, d.longitude),
    }))
    .sort((a: any, b: any) => a.distance_miles - b.distance_miles)
    .slice(0, limit);
}

/**
 * Get nearby city pages for internal linking.
 * Returns cities within ~150 miles that have their own page.
 */
export async function getNearbyCityPages(
  lat: number,
  lng: number,
  currentSlug: string,
  limit: number = 6,
): Promise<{ city: string; state: string; slug: string; distance: number }[]> {
  const supabase = createAdminClient();

  // Get all doctor cities
  const { data: docs } = await (supabase as any)
    .from('doctors')
    .select('city, state, latitude, longitude')
    .eq('verification_status', 'verified')
    .eq('country', 'US')
    .gt('latitude', 0);

  if (!docs) return [];

  // Unique city/state combos with averaged coords
  const cityMap = new Map<string, { city: string; state: string; lat: number; lng: number }>();
  for (const d of docs) {
    if (!d.city || !d.state) continue;
    const slug = cityToSlug(d.city, d.state);
    if (slug === currentSlug) continue;
    if (!cityMap.has(slug)) {
      cityMap.set(slug, { city: d.city, state: d.state, lat: d.latitude, lng: d.longitude });
    }
  }

  // Also include empty metros
  for (const m of EMPTY_METROS) {
    if (m.slug === currentSlug || cityMap.has(m.slug)) continue;
    cityMap.set(m.slug, { city: m.city, state: m.state, lat: m.lat, lng: m.lng });
  }

  // Calculate distances and sort
  return Array.from(cityMap.entries())
    .map(([slug, c]) => ({
      city: c.city,
      state: c.state,
      slug,
      distance: haversineDistance(lat, lng, c.lat, c.lng),
    }))
    .filter(c => c.distance < 150 && c.distance > 0)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

/**
 * Submit a "help me find someone" request.
 */
export async function submitFindRequest(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const name = (formData.get('name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim();
  const zip = (formData.get('zip') as string)?.trim();
  const note = (formData.get('note') as string)?.trim() || null;
  const citySearched = formData.get('city_searched') as string || null;
  const stateSearched = formData.get('state_searched') as string || null;

  if (!name || !email || !zip) {
    return { ok: false, error: 'Name, email, and ZIP are required.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }
  if (!/^\d{5}$/.test(zip)) {
    return { ok: false, error: 'Please enter a valid 5-digit ZIP code.' };
  }

  const supabase = createAdminClient();

  const { error } = await (supabase as any)
    .from('find_requests')
    .insert({ name, email, zip, note, city_searched: citySearched, state_searched: stateSearched });

  if (error) {
    console.error('[FIND REQUEST]', error);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }

  // Send email notification to Dr. Ray
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY || '');
    await resend.emails.send({
      from: 'NeuroChiro <support@neurochirodirectory.com>',
      to: ['rnichols@alignlife.com'],
      subject: `Help Me Find a Chiropractor — ${name} (${zip})`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:500px;">
          <h2 style="color:#1E2D3B;">New "Help Me Find Someone" Request</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>ZIP:</strong> ${zip}</p>
          <p><strong>Searched:</strong> ${citySearched || 'N/A'}, ${stateSearched || 'N/A'}</p>
          ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
          <p style="margin-top:20px;"><a href="https://neurochiro.co/admin/find-requests" style="background:#D66829;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">View in Admin</a></p>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error('[FIND REQUEST] Email notification failed:', emailErr);
  }

  return { ok: true };
}
