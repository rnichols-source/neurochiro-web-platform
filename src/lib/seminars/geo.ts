export type GeoPoint = { lat: number; lng: number };

type LookupInput = {
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  region?: string | null;
  state?: string | null;
  country?: string | null;
  countryCode?: string | null;
  location?: string | null;
};

const CITY_COORDS: Record<string, GeoPoint> = {
  "davenport|ia|us": { lat: 41.5236, lng: -90.5776 },
  "oakland|ca|us": { lat: 37.8044, lng: -122.2712 },
  "fort lauderdale|fl|us": { lat: 26.1224, lng: -80.1373 },
  "atlanta|ga|us": { lat: 33.749, lng: -84.388 },
  "wilmington|de|us": { lat: 39.7391, lng: -75.5398 },
  "delaware|de|us": { lat: 39.7391, lng: -75.5398 },
  "asbury park|nj|us": { lat: 40.2204, lng: -74.0121 },
  "adelaide||au": { lat: -34.9285, lng: 138.6007 },
  "perth||au": { lat: -31.9523, lng: 115.8613 },
  "birmingham||gb": { lat: 52.4862, lng: -1.8904 },
};

const REGION_ALIASES: Record<string, string> = {
  iowa: "ia",
  ia: "ia",
  florida: "fl",
  fl: "fl",
  georgia: "ga",
  ga: "ga",
  california: "ca",
  ca: "ca",
  delaware: "de",
  de: "de",
  "new jersey": "nj",
  nj: "nj",
  "south australia": "sa",
  sa: "sa",
  "western australia": "wa",
  wa: "wa",
};

const logged = new Set<string>();

function tidy(value?: string | null): string {
  return (value || "").trim().toLowerCase().replace(/\./g, "").replace(/\s+/g, " ");
}

export function countryKey(country?: string | null): string {
  const value = tidy(country);
  if (value === "us" || value === "usa" || value === "united states") return "us";
  if (value === "au" || value === "australia") return "au";
  if (value === "gb" || value === "uk" || value === "united kingdom") return "gb";
  if (value === "ca" || value === "canada") return "ca";
  if (value === "nz" || value === "new zealand") return "nz";
  return value.length === 2 ? value : value;
}

export function regionKey(region?: string | null): string {
  const value = tidy(region);
  return REGION_ALIASES[value] || value;
}

export function inferRegion(location?: string | null, city?: string | null): string {
  const parts = (location || "").split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return "";
  const last = parts[parts.length - 1];
  if (tidy(last) === tidy(city)) return "";
  if (["united states", "usa", "us", "australia", "united kingdom", "uk"].includes(tidy(last))) return "";
  return regionKey(last);
}

function lookupKeys(input: LookupInput): string[] {
  const city = tidy(input.city);
  const country = countryKey(input.countryCode || input.country);
  const region = regionKey(input.region || input.state) || inferRegion(input.location, input.city);
  const keys = [
    `${city}|${region}|${country}`,
    `${city}||${country}`,
    `${city}|${region}|`,
  ];
  const blob = `${city} ${region} ${tidy(input.location)}`;
  if (blob.includes("wilmington") || blob.includes("delaware")) keys.push("wilmington|de|us");
  return keys;
}

export function resolveSeminarCoordinates(input: LookupInput): GeoPoint | null {
  const lat = input.latitude == null ? null : Number(input.latitude);
  const lng = input.longitude == null ? null : Number(input.longitude);
  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    if (!(lat === 0 && lng === 0) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
  }
  const keys = lookupKeys(input);
  for (const key of keys) {
    const hit = CITY_COORDS[key];
    if (hit) return hit;
  }
  const label = keys[0] || tidy(input.city) || "unknown";
  if (label && !logged.has(label)) {
    logged.add(label);
    console.warn(`[seminars] no coordinates for ${label}`);
  }
  return null;
}
