import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

// One-time fix: Re-geocode all doctors whose lat/lng is missing, zero, or likely wrong
// Trigger: GET /api/cron/fix-geocodes?secret=YOUR_CRON_SECRET
// Also callable manually for specific doctor: ?doctor_id=UUID

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const specificDoctor = req.nextUrl.searchParams.get("doctor_id");

  try {
    // Fetch doctors that need geocoding
    let query = supabase
      .from("doctors")
      .select("id, user_id, first_name, last_name, address, city, state, country, latitude, longitude");

    if (specificDoctor) {
      query = query.eq("id", specificDoctor);
    }

    const { data: doctors, error } = await query;
    if (error || !doctors) {
      return NextResponse.json({ error: "Failed to fetch doctors" }, { status: 500 });
    }

    let fixed = 0;
    let skipped = 0;
    let failed = 0;
    const results: any[] = [];

    for (const doc of doctors) {
      // Build the best search query from available data
      const parts = [doc.address, doc.city, doc.state, doc.country || "United States"].filter(Boolean);
      if (parts.length < 2) {
        // Not enough location data to geocode
        skipped++;
        continue;
      }

      const searchQuery = parts.join(", ");

      // Check if current coords seem reasonable for the state
      const hasCoords = doc.latitude && doc.longitude && doc.latitude !== 0 && doc.longitude !== 0;

      // If they have coords and we're not targeting a specific doctor, validate them
      if (hasCoords && !specificDoctor) {
        // Quick validation: check if state matches approximate lat/lng
        const stateValid = isCoordReasonableForState(doc.latitude, doc.longitude, doc.state);
        if (stateValid) {
          skipped++;
          continue;
        }
        // If not valid, re-geocode
      }

      // Rate limit: 1 request per second for Nominatim
      await new Promise((r) => setTimeout(r, 1100));

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=us,au,ca,gb,nz`,
          { headers: { "User-Agent": "NeuroChiro/1.0 (support@neurochirodirectory.com)" } }
        );
        const data = await response.json();

        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);

          await supabase
            .from("doctors")
            .update({ latitude: lat, longitude: lng })
            .eq("id", doc.id);

          results.push({
            name: `${doc.first_name} ${doc.last_name}`,
            city: doc.city,
            state: doc.state,
            oldLat: doc.latitude,
            oldLng: doc.longitude,
            newLat: lat,
            newLng: lng,
            search: searchQuery,
          });
          fixed++;
        } else {
          // Try with just city + state
          const fallbackQuery = [doc.city, doc.state, doc.country || "United States"].filter(Boolean).join(", ");
          await new Promise((r) => setTimeout(r, 1100));

          const fallbackRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery)}&limit=1`,
            { headers: { "User-Agent": "NeuroChiro/1.0 (support@neurochirodirectory.com)" } }
          );
          const fallbackData = await fallbackRes.json();

          if (fallbackData && fallbackData.length > 0) {
            const lat = parseFloat(fallbackData[0].lat);
            const lng = parseFloat(fallbackData[0].lon);

            await supabase
              .from("doctors")
              .update({ latitude: lat, longitude: lng })
              .eq("id", doc.id);

            results.push({
              name: `${doc.first_name} ${doc.last_name}`,
              city: doc.city,
              state: doc.state,
              oldLat: doc.latitude,
              oldLng: doc.longitude,
              newLat: lat,
              newLng: lng,
              search: fallbackQuery + " (fallback)",
            });
            fixed++;
          } else {
            failed++;
            results.push({
              name: `${doc.first_name} ${doc.last_name}`,
              city: doc.city,
              state: doc.state,
              error: "No geocode results",
            });
          }
        }
      } catch (e) {
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      total: doctors.length,
      fixed,
      skipped,
      failed,
      results,
    });
  } catch (err: any) {
    console.error("Fix geocodes error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Rough bounding boxes for US states to detect obviously wrong coordinates
function isCoordReasonableForState(lat: number, lng: number, state: string | null): boolean {
  if (!state) return true; // Can't validate without state

  const bounds: Record<string, [number, number, number, number]> = {
    // [minLat, maxLat, minLng, maxLng]
    "Alabama": [30.2, 35.0, -88.5, -84.9],
    "Alaska": [51.2, 71.4, -179.2, -129.9],
    "Arizona": [31.3, 37.0, -114.8, -109.0],
    "Arkansas": [33.0, 36.5, -94.6, -89.6],
    "California": [32.5, 42.0, -124.4, -114.1],
    "Colorado": [37.0, 41.0, -109.1, -102.0],
    "Connecticut": [41.0, 42.1, -73.7, -71.8],
    "Delaware": [38.5, 39.8, -75.8, -75.0],
    "Florida": [24.5, 31.0, -87.6, -80.0],
    "Georgia": [30.4, 35.0, -85.6, -80.8],
    "Hawaii": [18.9, 22.2, -160.2, -154.8],
    "Idaho": [42.0, 49.0, -117.2, -111.0],
    "Illinois": [37.0, 42.5, -91.5, -87.5],
    "Indiana": [37.8, 41.8, -88.1, -84.8],
    "Iowa": [40.4, 43.5, -96.6, -90.1],
    "Kansas": [37.0, 40.0, -102.1, -94.6],
    "Kentucky": [36.5, 39.1, -89.6, -82.0],
    "Louisiana": [29.0, 33.0, -94.0, -89.0],
    "Maine": [43.1, 47.5, -71.1, -66.9],
    "Maryland": [38.0, 39.7, -79.5, -75.0],
    "Massachusetts": [41.2, 42.9, -73.5, -69.9],
    "Michigan": [41.7, 48.3, -90.4, -82.4],
    "Minnesota": [43.5, 49.4, -97.2, -89.5],
    "Mississippi": [30.2, 35.0, -91.7, -88.1],
    "Missouri": [36.0, 40.6, -95.8, -89.1],
    "Montana": [44.4, 49.0, -116.1, -104.0],
    "Nebraska": [40.0, 43.0, -104.1, -95.3],
    "Nevada": [35.0, 42.0, -120.0, -114.0],
    "New Hampshire": [42.7, 45.3, -72.6, -70.7],
    "New Jersey": [38.9, 41.4, -75.6, -73.9],
    "New Mexico": [31.3, 37.0, -109.1, -103.0],
    "New York": [40.5, 45.0, -79.8, -71.9],
    "North Carolina": [33.8, 36.6, -84.3, -75.5],
    "North Dakota": [45.9, 49.0, -104.1, -96.6],
    "Ohio": [38.4, 42.0, -84.8, -80.5],
    "Oklahoma": [33.6, 37.0, -103.0, -94.4],
    "Oregon": [42.0, 46.3, -124.6, -116.5],
    "Pennsylvania": [39.7, 42.3, -80.5, -74.7],
    "Rhode Island": [41.1, 42.0, -71.9, -71.1],
    "South Carolina": [32.0, 35.2, -83.4, -78.5],
    "South Dakota": [42.5, 46.0, -104.1, -96.4],
    "Tennessee": [35.0, 36.7, -90.3, -81.6],
    "Texas": [25.8, 36.5, -106.7, -93.5],
    "Utah": [37.0, 42.0, -114.1, -109.0],
    "Vermont": [42.7, 45.0, -73.4, -71.5],
    "Virginia": [36.5, 39.5, -83.7, -75.2],
    "Washington": [45.5, 49.0, -124.8, -116.9],
    "West Virginia": [37.2, 40.6, -82.6, -77.7],
    "Wisconsin": [42.5, 47.1, -92.9, -86.8],
    "Wyoming": [41.0, 45.0, -111.1, -104.1],
  };

  const stateName = state.trim();
  const box = bounds[stateName];
  if (!box) return true; // Unknown state, assume valid

  const [minLat, maxLat, minLng, maxLng] = box;
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}
