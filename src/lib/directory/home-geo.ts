import { toDirectoryCountry } from "../directory-countries.ts";
import { isValidCoord } from "../geo.ts";
import type { RegionCode } from "../regions.ts";

const REGIONS: RegionCode[] = ["US", "CA", "UK", "AU", "NZ", "EU"];

export interface VercelGeo {
  lat: number | null;
  lng: number | null;
  city: string | null;
  regionName: string | null;
  countryCode: string | null;
  regionCode: RegionCode | null;
}

type HeaderSource = { get(name: string): string | null };

export function decodeCity(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return decodeURIComponent(trimmed.replace(/\+/g, " ")).trim() || null;
  } catch {
    return trimmed;
  }
}

/** Map an ISO country onto the site's region chips. GB is UK, not EU. */
export function countryToRegion(iso: string | null | undefined): RegionCode | null {
  if (!iso) return null;
  const mapped = toDirectoryCountry(iso);
  return (REGIONS as string[]).includes(mapped) ? (mapped as RegionCode) : null;
}

export function parseVercelGeo(headers: HeaderSource): VercelGeo {
  const lat = Number(headers.get("x-vercel-ip-latitude"));
  const lng = Number(headers.get("x-vercel-ip-longitude"));
  const valid = isValidCoord(lat, lng);
  const countryCode = (headers.get("x-vercel-ip-country") || "").trim().toUpperCase() || null;
  return {
    lat: valid ? lat : null,
    lng: valid ? lng : null,
    city: decodeCity(headers.get("x-vercel-ip-city")),
    regionName: decodeCity(headers.get("x-vercel-ip-country-region")),
    countryCode,
    regionCode: countryToRegion(countryCode),
  };
}

export function placeLabel(city: string | null, regionName: string | null): string | null {
  if (!city) return null;
  if (regionName && regionName.length <= 3) return `${city}, ${regionName}`;
  return city;
}
