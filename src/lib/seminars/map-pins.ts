import type { SeminarRecord } from "./types";
import { resolveSeminarCoordinates } from "./geo";
import { formatDateRange, formatSeminarLocation, priceLabel } from "./format";

export type SeminarMapPin = {
  id: string;
  slug: string;
  title: string;
  city: string | null;
  region: string | null;
  country: string | null;
  startDate: string | null;
  endDate: string | null;
  priceFrom: number | null;
  ceHours: number | null;
  imageUrl: string | null;
  lat: number;
  lng: number;
  featured: boolean;
  dateLabel: string;
  cityLabel: string;
  priceLabel: string;
};

export function seminarMapPin(seminar: Pick<
  SeminarRecord,
  "id" | "slug" | "title" | "city" | "state" | "country" | "countryCode" | "location" | "latitude" | "longitude" | "startDate" | "endDate" | "timeZone" | "dates" | "price" | "priceFrom" | "currency" | "ceHours" | "imageUrl" | "heroImageUrl" | "featured" | "format"
>): SeminarMapPin | null {
  const point = resolveSeminarCoordinates({
    latitude: seminar.latitude,
    longitude: seminar.longitude,
    city: seminar.city,
    state: seminar.state,
    country: seminar.country,
    countryCode: seminar.countryCode,
    location: seminar.location,
  });
  if (!point) return null;
  const price = priceLabel({
    price: seminar.price,
    priceFrom: seminar.priceFrom,
    currency: seminar.currency,
    country: seminar.countryCode,
  });
  return {
    id: seminar.id,
    slug: seminar.slug,
    title: seminar.title,
    city: seminar.city,
    region: seminar.state,
    country: seminar.country,
    startDate: seminar.startDate,
    endDate: seminar.endDate,
    priceFrom: seminar.priceFrom,
    ceHours: seminar.ceHours,
    imageUrl: seminar.heroImageUrl || seminar.imageUrl,
    lat: point.lat,
    lng: point.lng,
    featured: seminar.featured,
    dateLabel: formatDateRange(seminar.startDate, seminar.endDate, seminar.timeZone, seminar.dates),
    cityLabel: formatSeminarLocation(seminar),
    priceLabel: price,
  };
}

export function pinsToFeatures(pins: SeminarMapPin[]) {
  return pins.map((pin) => ({
    type: "Feature" as const,
    geometry: { type: "Point" as const, coordinates: [pin.lng, pin.lat] as [number, number] },
    properties: {
      kind: "seminar",
      doctorId: pin.id,
      slug: pin.slug,
      title: pin.title,
      name: pin.title,
      dateLabel: pin.dateLabel,
      cityLabel: pin.cityLabel,
      city: pin.city || "",
      priceLabel: pin.priceLabel,
      ceHours: pin.ceHours ?? "",
      featured: pin.featured ? 1 : 0,
    },
  }));
}
