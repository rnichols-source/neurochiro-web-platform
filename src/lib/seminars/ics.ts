import type { SeminarRecord } from "./types";

function icsEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function icsStamp(date: string, time: string): string {
  const [y, m, d] = date.split("-");
  const [hh, mm] = time.split(":");
  return `${y}${m}${d}T${hh}${mm}00`;
}

export function buildIcs(seminar: Pick<SeminarRecord, "slug" | "title" | "startDate" | "endDate" | "timeZone" | "city" | "venueName" | "venueAddress" | "location" | "description">): string {
  const start = seminar.startDate;
  if (!start) return "";
  const end = seminar.endDate || start;
  const zone = seminar.timeZone || "America/New_York";
  const startStamp = icsStamp(start, "09:00");
  const endStamp = icsStamp(end, "17:00");
  const place = [seminar.venueName, seminar.venueAddress, seminar.city, seminar.location].filter(Boolean).join(", ");
  const url = `https://www.neurochiro.co/seminars/${seminar.slug}`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NeuroChiro//Seminars//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${seminar.slug}@neurochiro.co`,
    `DTSTAMP:${icsStamp(start, "09:00")}Z`,
    `DTSTART;TZID=${zone}:${startStamp}`,
    `DTEND;TZID=${zone}:${endStamp}`,
    `SUMMARY:${icsEscape(seminar.title)}`,
    place ? `LOCATION:${icsEscape(place)}` : "",
    `URL:${url}`,
    seminar.description ? `DESCRIPTION:${icsEscape(seminar.description.slice(0, 400))}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n") + "\r\n";
}

export function googleCalendarUrl(seminar: Pick<SeminarRecord, "title" | "startDate" | "endDate" | "timeZone" | "city" | "slug">): string | null {
  if (!seminar.startDate) return null;
  const zone = seminar.timeZone || "America/New_York";
  const start = icsStamp(seminar.startDate, "09:00");
  const end = icsStamp(seminar.endDate || seminar.startDate, "17:00");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: seminar.title,
    dates: `${start}/${end}`,
    ctz: zone,
    location: seminar.city || "",
    details: `https://www.neurochiro.co/seminars/${seminar.slug}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
