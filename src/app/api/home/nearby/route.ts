import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { searchDirectory } from "@/lib/directory/search";
import { excludeDemo } from "@/lib/directory/exclude-demo";
import { isValidCoord } from "@/lib/geo";
import { parseVercelGeo, placeLabel } from "@/lib/directory/home-geo";

export const dynamic = "force-dynamic";

const VARY = "x-vercel-ip-latitude, x-vercel-ip-longitude, x-vercel-ip-city, x-vercel-ip-country-region, x-vercel-ip-country";

const FEATURED_FIELDS = "id, first_name, last_name, clinic_name, slug, city, state, country, verification_status, photo_url, phone, accepting_new_patients, specialties, booking_url, latitude, longitude";

async function runSearch(params: Record<string, string>, trust: boolean) {
  const url = new URL("https://www.neurochiro.co/api/directory/search");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const headers = new Headers();
  if (trust) headers.set("x-nc-trust-coords", "1");
  const response = await searchDirectory(new NextRequest(url, { headers }));
  return response.json();
}

type DoctorChain = {
  select(columns: string): DoctorChain;
  eq(column: string, value: string): DoctorChain;
  not(column: string, operator: string, value: string | null): DoctorChain;
  order(column: string, options: { ascending: boolean }): DoctorChain;
  limit(count: number): DoctorChain;
};

async function featuredDoctors() {
  const supabase = createAdminClient();
  // Generated doctor types omit accepting_new_patients. The live table still has it.
  const doctors = supabase.from("doctors") as unknown as DoctorChain;
  const { data } = await (excludeDemo(
    doctors
      .select(FEATURED_FIELDS)
      .eq("verification_status", "verified")
      .not("photo_url", "is", null)
      .order("accepting_new_patients", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6),
  ) as unknown as Promise<{ data: { photo_url?: string | null }[] | null }>);
  return (data || []).filter((doctor) => doctor.photo_url);
}

function json(body: unknown) {
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "private, max-age=300",
      Vary: VARY,
    },
  });
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const clientLat = Number(params.get("lat"));
  const clientLng = Number(params.get("lng"));
  const clientCity = params.get("city")?.trim() || null;
  const geo = parseVercelGeo(request.headers);
  const hasClientCoords = isValidCoord(clientLat, clientLng);
  const lat = hasClientCoords ? clientLat : geo.lat;
  const lng = hasClientCoords ? clientLng : geo.lng;
  const regionCode = geo.regionCode;
  const countryCode = geo.countryCode;
  const unit = regionCode === "US" || !regionCode ? "mi" : "km";
  const city = clientCity || placeLabel(geo.city, geo.regionName);

  if (lat == null || lng == null) {
    if (clientCity) {
      const found = await runSearch({
        location: clientCity,
        country: regionCode || "US",
        limit: "6",
        sort: "distance",
      }, false);
      const doctors = (found.doctors || []).slice(0, 6);
      return json({
        city: clientCity,
        regionCode,
        countryCode,
        unit,
        source: "saved-city",
        doctors,
        nearest: doctors.length ? undefined : found.nearest?.[0],
      });
    }
    const doctors = await featuredDoctors();
    return json({ city: null, regionCode: null, countryCode: null, unit: "mi", source: "featured", doctors });
  }

  const radiusMiles = unit === "km" ? 160 / 1.60934 : 100;
  const country = hasClientCoords ? "ALL" : (regionCode || "ALL");
  const found = await runSearch({
    lat: String(lat),
    lng: String(lng),
    country,
    limit: "200",
    sort: "distance",
    radius: String(radiusMiles),
    loc_src: "gps",
  }, true);

  const doctors = (found.doctors || []).slice(0, 6);
  let nearest = found.nearest?.[0];
  if (!doctors.length && !nearest) {
    const wider = await runSearch({
      lat: String(lat),
      lng: String(lng),
      country,
      limit: "50",
      sort: "distance",
      radius: "4000",
      loc_src: "gps",
    }, true);
    nearest = wider.doctors?.[0] || wider.nearest?.[0];
  }

  return json({
    city,
    regionCode,
    countryCode,
    unit,
    source: hasClientCoords ? "saved" : "geo",
    doctors,
    nearest: doctors.length ? undefined : nearest,
  });
}
