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

export function seatsLeftLabel(capacity?: number | null, sold?: number | null): string | null {
  if (!capacity || capacity <= 0) return null;
  const left = capacity - (sold || 0);
  if (left <= 0) return "Sold out";
  if (left / capacity < 0.2) return `${left} seats left`;
  return null;
}
