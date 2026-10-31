import Link from "next/link";
import type { SeminarRecord } from "@/lib/seminars/types";
import { flagEmoji, formatDateRange, priceLabel, seatsLeftLabel } from "@/lib/seminars/format";
import { SeminarImage } from "./SeminarImage";

export function SeminarCard({ seminar, past = false }: { seminar: SeminarRecord; past?: boolean }) {
  const when = formatDateRange(seminar.startDate, seminar.endDate, seminar.timeZone, seminar.dates);
  const host = seminar.hostDoctor
    ? [seminar.hostDoctor.first_name, seminar.hostDoctor.last_name].filter(Boolean).join(" ")
    : seminar.instructorName;
  const place = seminar.format === "virtual" ? "Virtual" : [seminar.city, flagEmoji(seminar.countryCode)].filter(Boolean).join(" ");
  const seats = seatsLeftLabel(seminar.capacity, seminar.seatsSold);
  const day = seminar.startDate ? seminar.startDate.slice(8, 10).replace(/^0/, "") : "";
  const month = seminar.startDate
    ? new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(new Date(`${seminar.startDate}T12:00:00Z`))
    : "";

  return (
    <article data-seminar-card data-featured={seminar.featured ? "1" : "0"} className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
      <Link href={`/seminars/${seminar.slug}`} className="block min-h-11">
        <div className="relative aspect-video bg-neuro-navy">
          <SeminarImage src={seminar.heroImageUrl} alt="" />
          {month && (
            <div className="absolute left-3 top-3 rounded-xl bg-white px-3 py-2 text-center shadow">
              <p className="text-[10px] font-black uppercase tracking-widest text-neuro-orange">{month}</p>
              <p className="text-lg font-black leading-none text-neuro-navy">{day}</p>
            </div>
          )}
        </div>
        <div className="space-y-2 p-4">
          <h3 className="line-clamp-2 text-base font-black text-neuro-navy">{seminar.title}</h3>
          <p className="text-sm text-gray-500">{when}</p>
          <p className="text-sm text-gray-600">{place || "Location to be announced"}</p>
          {host && <p className="text-sm font-semibold text-neuro-navy">{host}</p>}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {seminar.ceHours ? <span className="rounded-full bg-neuro-cream px-2 py-1 text-xs font-bold text-neuro-navy">{seminar.ceHours} CE</span> : null}
            <span className="text-sm font-black text-neuro-orange">{priceLabel({ price: seminar.price, priceFrom: seminar.priceFrom, currency: seminar.currency, country: seminar.countryCode })}</span>
            {seats ? <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-900">{seats}</span> : null}
            {!past && seminar.registrationLink ? <span className="text-xs font-bold uppercase tracking-wide text-neuro-navy">Register</span> : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
