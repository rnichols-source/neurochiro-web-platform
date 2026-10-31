import type { SeminarRecord } from "./types";
import { zonedIso } from "./dates";
import { displayVenueName, regionLabel } from "./format";
import { resolveSeminarHost } from "./host";

function records(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item && typeof item === "object") as Record<string, unknown>[];
}

export function seminarJsonLd(seminar: SeminarRecord): Record<string, unknown> {
  const zone = seminar.timeZone || "America/New_York";
  const start = seminar.startDate ? zonedIso(seminar.startDate, "09:00", zone) : undefined;
  const end = seminar.endDate ? zonedIso(seminar.endDate, "17:00", zone) : start;
  const url = `https://www.neurochiro.co/seminars/${seminar.slug}`;
  const cancelled = seminar.status === "cancelled";
  const attendance = seminar.format === "virtual"
    ? "https://schema.org/OnlineEventAttendanceMode"
    : seminar.format === "hybrid"
      ? "https://schema.org/MixedEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode";
  const venueName = displayVenueName(seminar.venueName, seminar.city);
  const place = seminar.format === "virtual"
    ? { "@type": "VirtualLocation", url }
    : {
        "@type": "Place",
        name: venueName === "Venue TBA" ? (seminar.city || seminar.title) : venueName,
        address: {
          "@type": "PostalAddress",
          streetAddress: venueName === "Venue TBA" ? undefined : (seminar.venueAddress || undefined),
          addressLocality: seminar.city || undefined,
          addressRegion: regionLabel(seminar.state, seminar.location, seminar.city) || undefined,
          addressCountry: seminar.countryCode || undefined,
        },
      };
  const price = seminar.priceFrom && seminar.priceFrom > 0 ? seminar.priceFrom : null;
  const soldOut = seminar.capacity != null && seminar.seatsSold >= seminar.capacity;
  const host = resolveSeminarHost(seminar);
  const hostName = host.name;
  const offers = price == null ? undefined : {
    "@type": "Offer",
    price,
    priceCurrency: seminar.currency || "USD",
    availability: soldOut ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
    url,
    validFrom: seminar.raw.created_at || undefined,
  };
  const performers = records(seminar.speakers).map((speaker) => ({
    "@type": "Person",
    name: speaker.name || speaker.title,
  })).filter((person) => person.name);

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: seminar.title,
    startDate: start,
    endDate: end,
    eventStatus: cancelled ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    eventAttendanceMode: attendance,
    location: place,
    image: seminar.heroImageUrl ? [seminar.heroImageUrl] : undefined,
    description: (seminar.tagline || seminar.description || "").slice(0, 500) || undefined,
    offers,
    organizer: hostName ? {
      "@type": host.verified ? "Person" : "Organization",
      name: hostName,
      url: host.profileSlug ? `https://www.neurochiro.co/directory/${host.profileSlug}` : "https://www.neurochiro.co",
    } : { "@type": "Organization", name: "NeuroChiro", url: "https://www.neurochiro.co" },
    performer: performers.length ? performers : undefined,
    url,
  };
}

export function breadcrumbJsonLd(seminar: SeminarRecord): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Seminars", item: "https://www.neurochiro.co/seminars" },
      { "@type": "ListItem", position: 2, name: seminar.title, item: `https://www.neurochiro.co/seminars/${seminar.slug}` },
    ],
  };
}

export function itemListJsonLd(seminars: SeminarRecord[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: seminars.map((seminar, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `https://www.neurochiro.co/seminars/${seminar.slug}`,
      name: seminar.title,
    })),
  };
}
