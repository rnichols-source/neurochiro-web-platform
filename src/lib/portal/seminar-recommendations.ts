import { isUpcoming, parseSeminarDates } from "../seminars/dates.ts";

export type SeminarRecommendationRow = {
  dates?: string | null;
  is_past?: boolean | null;
  city?: string | null;
  country?: string | null;
  location?: string | null;
  ce_hours?: number | null;
  title?: string | null;
  description?: string | null;
  tags?: string[] | null;
  relevance?: number | null;
};

export type DoctorFocus = {
  city?: string | null;
  state?: string | null;
  specialties?: string[] | null;
};

/** Keep seminars whose end date is still ahead, soonest first. Unparsed dates are dropped. */
export function filterUpcomingRecommendations<T extends SeminarRecommendationRow>(rows: T[], now: number): T[] {
  return rows
    .filter((row) => {
      const parsed = parseSeminarDates(row.dates);
      if (!parsed) return false;
      return isUpcoming(parsed.end, row.is_past, now);
    })
    .sort((a, b) => {
      const startA = parseSeminarDates(a.dates)?.start || "";
      const startB = parseSeminarDates(b.dates)?.start || "";
      if (startA !== startB) return startA < startB ? -1 : 1;
      return (b.relevance || 0) - (a.relevance || 0);
    })
    .slice(0, 3);
}

function placeText(row: SeminarRecommendationRow): string {
  return `${row.city || ""} ${row.location || ""} ${row.country || ""}`.toLowerCase();
}

export function recommendationChips(row: SeminarRecommendationRow, doctor: DoctorFocus): string[] {
  const chips: string[] = [];
  const city = (row.city || "").trim().toLowerCase();
  const doctorCity = (doctor.city || "").trim().toLowerCase();
  const doctorState = (doctor.state || "").trim().toLowerCase();
  const place = placeText(row);
  const sameCity = Boolean(doctorCity && city && city === doctorCity);
  const sameState = Boolean(
    doctorState &&
      (doctorState.length <= 3
        ? new RegExp(`\\b${doctorState.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(place)
        : place.includes(doctorState)),
  );
  if (sameCity || sameState) chips.push("Near you");

  const hours = Number(row.ce_hours);
  if (Number.isFinite(hours) && hours > 0) chips.push(`${hours} CE hours`);

  const haystack = `${row.title || ""} ${row.description || ""} ${(row.tags || []).join(" ")}`.toLowerCase();
  const specialty = (doctor.specialties || []).find((item) => {
    const name = item.trim();
    return name.length > 0 && haystack.includes(name.toLowerCase());
  });
  if (specialty) chips.push(`Matches your focus: ${specialty.trim()}`);

  return chips.slice(0, 2);
}

export function seminarStatRows(stats: {
  totalSeminars: number;
  totalAttendees: number;
  avgRating: number;
  reviewCount: number;
  totalCEDelivered: number;
}): { label: string; value: string; hint: string }[] {
  const seminars = stats.totalSeminars === 1 ? "1 seminar" : `${stats.totalSeminars} seminars`;
  const attendees = stats.totalAttendees === 1 ? "1 attendee" : `${stats.totalAttendees} attendees`;
  const reviews =
    stats.reviewCount === 0
      ? "No reviews yet"
      : `${stats.avgRating} average from ${stats.reviewCount} review${stats.reviewCount === 1 ? "" : "s"}`;
  const hours = Number(stats.totalCEDelivered) || 0;
  const delivered = hours === 1 ? "1 CE hour delivered" : `${hours} CE hours delivered`;
  return [
    { label: "Seminars", value: seminars, hint: "Seminars you host on NeuroChiro" },
    { label: "Attendees", value: attendees, hint: "People registered for your seminars" },
    { label: "Reviews", value: reviews, hint: "Average rating from seminar reviews" },
    { label: "CE delivered", value: delivered, hint: "CE hours recorded for people who attended" },
  ];
}
