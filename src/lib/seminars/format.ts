export function countryCode(country?: string | null): string {
  const value = (country || "").trim().toLowerCase();
  if (value === "au" || value === "australia") return "AU";
  if (value === "us" || value === "usa" || value === "united states") return "US";
  if (value === "gb" || value === "uk" || value === "united kingdom") return "GB";
  if (value === "nz" || value === "new zealand") return "NZ";
  if (value === "ca" || value === "canada") return "CA";
  return value.length === 2 ? value.toUpperCase() : "";
}

export function currencyForCountry(country?: string | null): string {
  const code = countryCode(country);
  if (code === "AU") return "AUD";
  if (code === "GB") return "GBP";
  if (code === "NZ") return "NZD";
  if (code === "CA") return "CAD";
  if (code === "EU") return "EUR";
  return "USD";
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency.toUpperCase()} ${amount}`;
  }
}

export function priceLabel(input: {
  price?: number | null;
  priceFrom?: number | null;
  currency?: string | null;
  country?: string | null;
  tickets?: { price: number }[];
}): string {
  const tickets = input.tickets || [];
  const from = input.priceFrom ?? input.price;
  const allFree = tickets.length > 0 && tickets.every((ticket) => Number(ticket.price) === 0);
  if (allFree && Number(from) === 0) return "Free";
  if (from == null || Number(from) <= 0) return "See pricing";
  const currency = (input.currency || currencyForCountry(input.country)).toUpperCase();
  return `from ${formatMoney(Number(from), currency)}`;
}

export function formatDateRange(start: string | null, end: string | null, timeZone: string, fallback?: string | null): string {
  if (!start) return fallback || "Date to be announced";
  const startDate = new Date(`${start}T12:00:00Z`);
  const endDate = new Date(`${(end || start)}T12:00:00Z`);
  const day = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone });
  const full = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone });
  if (start === end || !end) return full.format(startDate);
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  if (sameMonth) return `${day.format(startDate)}–${full.format(endDate).replace(/^[A-Za-z]+ /, "")}`;
  return `${full.format(startDate)} – ${full.format(endDate)}`;
}

export function monthKey(start: string | null, fallback?: string | null): string {
  if (start) return start.slice(0, 7);
  const parsed = (fallback || "").match(/(\d{4})/);
  return parsed ? `${parsed[1]}-01` : "upcoming";
}

export function monthLabel(key: string, timeZone = "UTC"): string {
  if (!/^\d{4}-\d{2}$/.test(key)) return "Upcoming";
  const date = new Date(`${key}-01T12:00:00Z`);
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone }).format(date);
}

export function flagEmoji(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return "";
  return String.fromCodePoint(...code.split("").map((char) => 127397 + char.charCodeAt(0)));
}

const REGION_LABELS: Record<string, string> = {
  ia: "IA", iowa: "IA",
  fl: "FL", florida: "FL",
  ga: "GA", georgia: "GA",
  ca: "CA", california: "CA",
  de: "DE", delaware: "DE",
  nj: "NJ", "new jersey": "NJ",
};

const COUNTRY_LABELS: Record<string, string> = {
  US: "United States",
  AU: "Australia",
  GB: "United Kingdom",
  CA: "Canada",
  NZ: "New Zealand",
};

function tidyToken(value?: string | null): string {
  return (value || "").trim().replace(/\s+/g, " ");
}

function tokenKey(value: string): string {
  return value.toLowerCase().replace(/\./g, "");
}

function pushUnique(parts: string[], seen: Set<string>, value?: string | null) {
  const token = tidyToken(value);
  if (!token) return;
  const key = tokenKey(token);
  if (seen.has(key)) return;
  seen.add(key);
  parts.push(token);
}

export function regionLabel(region?: string | null, location?: string | null, city?: string | null): string {
  const direct = tidyToken(region);
  const source = direct || (() => {
    const parts = (location || "").split(",").map((part) => part.trim()).filter(Boolean);
    if (parts.length < 2) return "";
    const last = parts[parts.length - 1];
    if (tokenKey(last) === tokenKey(city || "")) return "";
    if (["united states", "usa", "us", "australia", "united kingdom", "uk"].includes(tokenKey(last))) return "";
    return last;
  })();
  if (!source) return "";
  return REGION_LABELS[tokenKey(source)] || source;
}

export function formatSeminarLocation(input: {
  city?: string | null;
  region?: string | null;
  state?: string | null;
  country?: string | null;
  countryCode?: string | null;
  location?: string | null;
  format?: string | null;
}): string {
  if (input.format === "virtual") return "Virtual";
  const city = tidyToken(input.city);
  const region = regionLabel(input.region || input.state, input.location, city);
  const code = countryCode(input.countryCode || input.country);
  const country = code === "US" && region ? "" : (COUNTRY_LABELS[code] || tidyToken(input.country));
  const parts: string[] = [];
  const seen = new Set<string>();
  pushUnique(parts, seen, city);
  pushUnique(parts, seen, region);
  if (country && tokenKey(country) !== tokenKey(city) && tokenKey(country) !== "united states") pushUnique(parts, seen, country);
  else if (country && !region) pushUnique(parts, seen, country);
  if (!parts.length && input.location) {
    for (const part of input.location.split(",")) pushUnique(parts, seen, part);
  }
  return parts.join(", ");
}

export function isPlaceholderVenue(name?: string | null, city?: string | null): boolean {
  const venue = tidyToken(name);
  if (!venue) return false;
  if (/event venue$/i.test(venue)) return true;
  return Boolean(city && tokenKey(venue) === tokenKey(`${city} Event Venue`));
}

export function displayVenueName(name?: string | null, city?: string | null): string {
  if (!tidyToken(name) || isPlaceholderVenue(name, city)) return "Venue TBA";
  return tidyToken(name);
}

export function formatSeminarAddress(input: {
  city?: string | null;
  region?: string | null;
  state?: string | null;
  country?: string | null;
  countryCode?: string | null;
  location?: string | null;
  venueName?: string | null;
  venueAddress?: string | null;
  format?: string | null;
}): string {
  const place = formatSeminarLocation(input);
  const venue = tidyToken(input.venueName);
  const showVenue = venue && !isPlaceholderVenue(venue, input.city);
  const placeKeys = new Set(place.split(",").map((part) => tokenKey(part.trim())).filter(Boolean));
  if (input.city) placeKeys.add(tokenKey(input.city));
  const addressParts = isPlaceholderVenue(input.venueAddress, input.city)
    ? []
    : (input.venueAddress || "").split(",").map((part) => part.trim()).filter((part) => part && !placeKeys.has(tokenKey(part)) && tokenKey(part) !== tokenKey(venue));
  const parts: string[] = [];
  const seen = new Set<string>();
  if (showVenue) pushUnique(parts, seen, venue);
  for (const part of addressParts) pushUnique(parts, seen, part);
  if (place) pushUnique(parts, seen, place);
  return parts.join(", ");
}

export function seminarMetaTitle(title: string, place: string, when: string): string {
  const city = place.split(",")[0]?.trim().toLowerCase() || "";
  const includePlace = Boolean(place) && Boolean(city) && !title.toLowerCase().includes(city);
  const suffix = [includePlace ? place : "", when].filter(Boolean).join(" · ");
  return suffix ? `${title} — ${suffix} | NeuroChiro Seminars` : `${title} | NeuroChiro Seminars`;
}

export function seatsLeftLabel(capacity?: number | null, sold?: number | null): string | null {
  if (!capacity || capacity <= 0) return null;
  const left = capacity - (sold || 0);
  if (left <= 0) return "Sold out";
  if (left / capacity < 0.2) return `${left} seats left`;
  return null;
}
