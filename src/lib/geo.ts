/**
 * Calculate the distance between two points on Earth using the Haversine formula.
 * @returns Distance in miles
 */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Calculate a bounding box around a point for a given radius.
 * Used to pre-filter with SQL before doing exact haversine.
 * @returns [minLng, minLat, maxLng, maxLat]
 */
export function boundingBox(lat: number, lng: number, radiusMiles: number): [number, number, number, number] {
  const latDelta = radiusMiles / 69.0; // ~69 miles per degree of latitude
  const lngDelta = radiusMiles / (69.0 * Math.cos(toRad(lat)));
  return [
    lng - lngDelta, // minLng
    lat - latDelta, // minLat
    lng + lngDelta, // maxLng
    lat + latDelta, // maxLat
  ];
}

/**
 * Format distance for display
 */
export function formatDistance(miles: number): string {
  if (miles < 0.1) return '< 0.1 mi';
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

/**
 * Check if coordinates are valid (not 0,0 or null/undefined)
 */
export function isValidCoord(lat: number | null | undefined, lng: number | null | undefined): boolean {
  if (lat == null || lng == null) return false;
  if (lat === 0 && lng === 0) return false;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;
  return true;
}
