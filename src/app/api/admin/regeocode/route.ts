import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

// Simple land bounds check for known regions
function isLikelyOnLand(lat: number, lng: number): boolean {
  // Continental US rough bounds
  if (lat >= 24 && lat <= 50 && lng >= -125 && lng <= -66) {
    // Check for obvious ocean areas
    // Atlantic Ocean east of coast (rough coastline)
    if (lng > -73 && lat < 40 && lat > 25) {
      // Could be coastal — check if too far east
      if (lng > -70) return false; // Definitely ocean
    }
    // Gulf of Mexico
    if (lat < 30 && lat > 25 && lng > -97 && lng < -81) {
      if (lat < 27 && lng > -90 && lng < -83) return false; // Deep gulf
    }
    return true;
  }
  // Hawaii
  if (lat >= 18 && lat <= 23 && lng >= -161 && lng <= -154) return true;
  // Alaska
  if (lat >= 51 && lat <= 72 && lng >= -180 && lng <= -130) return true;
  // Canada
  if (lat >= 42 && lat <= 84 && lng >= -141 && lng <= -52) return true;
  // UK / Europe
  if (lat >= 36 && lat <= 72 && lng >= -11 && lng <= 40) return true;
  // Australia
  if (lat >= -44 && lat <= -10 && lng >= 112 && lng <= 154) return true;
  // Central America / Caribbean (could be valid)
  if (lat >= 7 && lat <= 24 && lng >= -120 && lng <= -59) return true;
  // South America
  if (lat >= -56 && lat <= 13 && lng >= -82 && lng <= -34) return true;
  // Asia
  if (lat >= -11 && lat <= 55 && lng >= 60 && lng <= 150) return true;
  // Africa
  if (lat >= -35 && lat <= 37 && lng >= -18 && lng <= 52) return true;

  // If none matched, it might be ocean
  return false;
}

async function geocodeAddress(city: string, state: string, country: string): Promise<{ lat: number; lng: number } | null> {
  const query = [city, state, country].filter(Boolean).join(', ');
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=${country === 'United States' ? 'us' : ''}`,
      { headers: { 'User-Agent': 'NeuroChiro/1.0 (admin@neurochiro.co)' } }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (e) {
    console.error('Geocode failed for:', query, e);
  }
  return null;
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Fetch all doctors with coordinates
  const { data: doctors, error } = await supabase
    .from('doctors')
    .select('id, first_name, last_name, city, state, country, latitude, longitude')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: any[] = [];
  let fixed = 0;
  let skipped = 0;
  let failed = 0;

  for (const doc of doctors || []) {
    const lat = Number(doc.latitude);
    const lng = Number(doc.longitude);

    // Skip if coordinates are valid and on land
    if (lat && lng && isLikelyOnLand(lat, lng)) {
      skipped++;
      continue;
    }

    // Bad coordinates — try to re-geocode
    if (!doc.city) {
      results.push({ id: doc.id, name: `${doc.first_name} ${doc.last_name}`, status: 'no_city', old: { lat, lng } });
      failed++;
      continue;
    }

    // Rate limit: 1 req/sec for Nominatim
    await new Promise(r => setTimeout(r, 1100));

    const coords = await geocodeAddress(doc.city, doc.state || '', doc.country || 'United States');

    if (coords && isLikelyOnLand(coords.lat, coords.lng)) {
      const { error: updateError } = await supabase
        .from('doctors')
        .update({ latitude: coords.lat, longitude: coords.lng })
        .eq('id', doc.id);

      if (!updateError) {
        results.push({
          id: doc.id,
          name: `${doc.first_name} ${doc.last_name}`,
          city: doc.city,
          state: doc.state,
          status: 'fixed',
          old: { lat, lng },
          new: coords
        });
        fixed++;
      } else {
        results.push({ id: doc.id, name: `${doc.first_name} ${doc.last_name}`, status: 'update_failed', error: updateError.message });
        failed++;
      }
    } else {
      results.push({
        id: doc.id,
        name: `${doc.first_name} ${doc.last_name}`,
        city: doc.city,
        state: doc.state,
        status: 'geocode_failed',
        old: { lat, lng },
        attempted: coords
      });
      failed++;
    }
  }

  return NextResponse.json({
    total: doctors?.length || 0,
    fixed,
    skipped,
    failed,
    details: results
  });
}
