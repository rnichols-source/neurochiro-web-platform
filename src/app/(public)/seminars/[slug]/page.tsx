import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import { getRelated, getSeminarBySlug } from "@/lib/seminars/queries";
import { isUuid, slugify } from "@/lib/seminars/slug";
import { displayVenueName, formatDateRange, formatSeminarAddress, formatSeminarLocation, priceLabel, seatsLeftLabel, seminarMetaTitle } from "@/lib/seminars/format";
import { extractSponsors, normalizeAgenda } from "@/lib/seminars/agenda";
import { resolveSeminarCoordinates } from "@/lib/seminars/geo";
import { resolveSeminarHost } from "@/lib/seminars/host";
import { breadcrumbJsonLd, seminarJsonLd } from "@/lib/seminars/jsonld";
import { googleCalendarUrl } from "@/lib/seminars/ics";
import { SeminarCard } from "@/components/seminars/SeminarCard";
import { SeminarImage } from "@/components/seminars/SeminarImage";
import { SEMINAR_CONFIG } from "@/config/seminars";
import { memberTicketPrice } from "@/lib/seminars/utm";
import SeminarReviews from "./seminar-reviews";
import { ShareBar } from "./share-bar";
import { StickyRegister } from "./sticky-cta";
import { RsvpForm } from "./rsvp-form";

type Params = { slug: string };

function rows(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item && typeof item === "object") as Record<string, unknown>[];
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const seminar = await getSeminarBySlug(slug);
  if (!seminar) return { title: "Seminar | NeuroChiro" };
  const when = formatDateRange(seminar.startDate, seminar.endDate, seminar.timeZone, seminar.dates);
  const place = formatSeminarLocation(seminar);
  const title = seminarMetaTitle(seminar.title, place, when);
  const description = (seminar.tagline || seminar.description || `${seminar.title} on NeuroChiro.`).replace(/\s+/g, " ").slice(0, 155);
  const image = `https://www.neurochiro.co/api/og/seminar/${seminar.slug}`;
  return {
    title,
    description,
    alternates: { canonical: `https://www.neurochiro.co/seminars/${seminar.slug}` },
    openGraph: { title, description, url: `https://www.neurochiro.co/seminars/${seminar.slug}`, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function SeminarLanding({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { slug } = await params;
  const query = await searchParams;
  const seminar = await getSeminarBySlug(slug);
  if (!seminar) notFound();
  if (isUuid(slug)) permanentRedirect(`/seminars/${seminar.slug}`);

  const related = await getRelated(seminar);
  const when = formatDateRange(seminar.startDate, seminar.endDate, seminar.timeZone, seminar.dates);
  const price = priceLabel({ price: seminar.price, priceFrom: seminar.priceFrom, currency: seminar.currency, country: seminar.countryCode });
  const seats = seatsLeftLabel(seminar.capacity, seminar.seatsSold);
  const host = resolveSeminarHost(seminar);
  const hostName = host.name;
  const place = formatSeminarLocation(seminar);
  const registerHref = seminar.registrationLink ? `/go/seminar/${seminar.slug}` : "#tickets";
  const calendar = googleCalendarUrl(seminar);
  const outcomes = seminar.outcomes || [];
  const included = seminar.whatsIncluded || [];
  const agenda = normalizeAgenda(seminar.schedule);
  const sponsors = extractSponsors(seminar.schedule, seminar.sponsors);
  const speakers = rows(seminar.speakers);
  const faqs = rows(seminar.faq);
  const audiences = strings(seminar.audiences).concat(strings(seminar.raw.target_audience));
  const coords = resolveSeminarCoordinates(seminar);
  const venueLabel = displayVenueName(seminar.venueName, seminar.city);
  const mapQuery = venueLabel === "Venue TBA" ? place : formatSeminarAddress(seminar);
  const staticKey = process.env.GOOGLE_MAPS_STATIC_KEY;
  const staticMap = staticKey && coords
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${coords.lat},${coords.lng}&zoom=12&size=640x320&scale=2&markers=color:0xD66829|${coords.lat},${coords.lng}&key=${staticKey}`
    : null;
  const fallbackMap = !staticMap && coords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - 0.08}%2C${coords.lat - 0.05}%2C${coords.lng + 0.08}%2C${coords.lat + 0.05}&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`
    : null;
  const days = seminar.startDate ? Math.ceil((new Date(`${seminar.startDate}T12:00:00Z`).getTime() - Date.now()) / 86400000) : null;
  const member = memberTicketPrice({
    price: Number(seminar.priceFrom || seminar.price || 0),
    isMember: true,
    discountPct: SEMINAR_CONFIG.defaultMemberDiscountPct,
  });
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const shareUrl = `https://www.neurochiro.co/seminars/${seminar.slug}`;

  return (
    <main data-nc-seminars="ready" className="min-h-dvh bg-neuro-cream pb-28">
      <section className="bg-neuro-navy text-white">
        <div className="relative mx-auto aspect-[16/9] max-h-[520px] max-w-6xl overflow-hidden bg-neuro-navy">
          <SeminarImage src={seminar.heroImageUrl} alt="" priority />
        </div>
        <div className="mx-auto max-w-3xl px-5 pb-10 pt-6">
          <p className="text-xs font-bold uppercase tracking-widest text-white">{when}{place ? ` · ${place}` : ""}</p>
          <h1 className="mt-2 text-3xl font-black leading-tight text-white md:text-5xl">{seminar.title}</h1>
          {seminar.tagline ? <p className="mt-3 text-lg text-white/80">{seminar.tagline}</p> : null}
          {host.verified && host.profileSlug ? (
            <Link href={`/directory/${host.profileSlug}`} className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-white">{hostName}</Link>
          ) : hostName ? <p className="mt-3 text-sm font-bold text-white">{hostName}</p> : null}
          <p className="mt-4 text-xl font-black text-white">{price}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {seminar.upcoming && seminar.registrationLink ? <a id="hero-register" href={registerHref} className="inline-flex min-h-11 items-center rounded-xl bg-neuro-orange-ink px-5 text-sm font-bold text-white">Register</a> : null}
            <ShareBar title={seminar.title} url={shareUrl} />
            {calendar ? <a href={calendar} className="inline-flex min-h-11 items-center rounded-xl border border-white/20 px-4 text-sm font-bold">Google Calendar</a> : null}
            {seminar.startDate ? <a href={`/seminars/${seminar.slug}/calendar.ics`} className="inline-flex min-h-11 items-center rounded-xl border border-white/20 px-4 text-sm font-bold">Add to calendar</a> : null}
          </div>
          {query.canceled ? <p className="mt-4 text-sm text-white/80">Checkout was canceled. Your seat was not reserved.</p> : null}
        </div>
      </section>

      <section className="mx-auto grid max-w-3xl gap-3 px-5 py-6 sm:grid-cols-2">
        {seminar.ceHours ? <p className="rounded-2xl bg-white p-4 text-sm font-bold text-neuro-navy">{seminar.ceHours} CE hours{seminar.ceApprovingBody ? ` · ${seminar.ceApprovingBody}` : ""}</p> : null}
        {seats ? <p className="rounded-2xl bg-white p-4 text-sm font-bold text-neuro-navy">{seats}</p> : null}
        {seminar.upcoming && days != null && days >= 0 ? <p className="rounded-2xl bg-white p-4 text-sm font-bold text-neuro-navy">{days} days to go</p> : null}
        {host.verified ? <p className="rounded-2xl bg-white p-4 text-sm font-bold text-neuro-navy">Verified host</p> : null}
      </section>

      <div className="mx-auto max-w-3xl space-y-10 px-5">
        {seminar.description ? <section><h2 className="text-2xl font-black text-neuro-navy">About</h2><p className="mt-3 whitespace-pre-wrap text-gray-700">{seminar.description}</p></section> : null}
        {outcomes.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-neuro-navy">What you&apos;ll learn</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-700">{outcomes.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
        )}
        {audiences.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-neuro-navy">Who it&apos;s for</h2>
            <ul className="mt-3 flex flex-wrap gap-2">{audiences.map((item) => <li key={item} className="rounded-full bg-white px-3 py-2 text-sm font-bold text-neuro-navy">{item}</li>)}</ul>
          </section>
        )}
        {agenda.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-neuro-navy">Agenda</h2>
            <div className="mt-3 space-y-6">
              {agenda.map((day) => (
                <div key={day.label}>
                  <h3 className="text-sm font-black uppercase tracking-widest text-neuro-orange-ink">{day.label}</h3>
                  <ol className="mt-3 space-y-3 border-l-2 border-neuro-orange/20 pl-4">
                    {day.items.map((item) => (
                      <li key={`${day.label}-${item.time}-${item.title}`} className="rounded-2xl bg-white p-4">
                        {item.time ? <p className="text-xs font-bold uppercase tracking-wide text-neuro-orange-ink">{item.time}</p> : null}
                        <p className="font-black text-neuro-navy">{item.title}</p>
                        {item.description ? <p className="mt-1 text-sm text-gray-600">{item.description}</p> : null}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </section>
        )}
        {sponsors.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-neuro-navy">Sponsors</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {sponsors.map((sponsor) => (
                <li key={sponsor.name} className="rounded-2xl bg-white p-4">
                  <p className="font-black text-neuro-navy">{sponsor.name}</p>
                  <p className="text-sm text-gray-600">{sponsor.context}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
        {speakers.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-neuro-navy">Speakers</h2>
            <ul className="mt-3 space-y-3">
              {speakers.map((speaker) => {
                const name = String(speaker.name || "Speaker");
                return (
                  <li key={name}>
                    <Link href={`/seminars/${seminar.slug}/speakers/${slugify(name)}`} className="block rounded-2xl bg-white p-4">
                      <p className="font-black text-neuro-navy">{name}</p>
                      {speaker.title ? <p className="text-sm text-gray-600">{String(speaker.title)}</p> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
        {hostName && (
          <section className="rounded-3xl bg-white p-5">
            <h2 className="text-2xl font-black text-neuro-navy">Host</h2>
            <p className="mt-2 font-bold">{hostName}</p>
            {host.verified && seminar.hostDoctor?.clinic_name ? <p className="text-sm text-gray-600">{seminar.hostDoctor.clinic_name}</p> : null}
            {seminar.instructorBio ? <p className="mt-3 text-sm text-gray-700">{seminar.instructorBio}</p> : null}
            {host.verified && host.profileSlug ? <Link href={`/directory/${host.profileSlug}`} className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-neuro-orange-ink">View profile</Link> : null}
          </section>
        )}
        {included.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-neuro-navy">What&apos;s included</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-700">{included.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
        )}

        <section id="tickets" className="rounded-3xl bg-white p-5">
          <h2 className="text-2xl font-black text-neuro-navy">{seminar.upcoming ? "Tickets" : "This event has ended"}</h2>
          {seminar.priceNote ? <p className="mt-2 text-sm text-gray-600">{seminar.priceNote}</p> : null}
          <p className="mt-3 text-lg font-black text-neuro-orange-ink">{price}</p>
          {seminar.upcoming && Number(seminar.priceFrom || 0) > 0 ? (
            <p className="mt-2 text-sm text-gray-600">Members save about {formatMemberSave(seminar.priceFrom, member.amount, seminar.currency)}. <Link href={`/pricing/doctors?return=/seminars/${seminar.slug}`} className="font-bold text-neuro-orange-ink">Join NeuroChiro</Link></p>
          ) : null}
          {seminar.upcoming && seminar.registrationLink ? (
            <a href={registerHref} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-neuro-orange-ink px-5 text-sm font-bold text-white">Register</a>
          ) : null}
          {seminar.upcoming ? (
            <div className="mt-6 border-t border-black/5 pt-4">
              <h3 className="font-black text-neuro-navy">I&apos;m going — remind me</h3>
              <div className="mt-3"><RsvpForm slug={seminar.slug} email={user?.email} /></div>
            </div>
          ) : null}
        </section>

        {(seminar.venueName || seminar.venueAddress || seminar.city) && seminar.format !== "virtual" && (
          <section>
            <h2 className="text-2xl font-black text-neuro-navy">Venue</h2>
            <p className="mt-2 text-gray-700">{venueLabel === "Venue TBA" ? `Venue TBA${place ? ` · ${place}` : ""}` : formatSeminarAddress(seminar)}</p>
            {staticMap ? <img src={staticMap} alt={`Map of ${venueLabel === "Venue TBA" ? seminar.city : venueLabel}`} className="mt-4 w-full rounded-2xl" /> : null}
            {fallbackMap ? <iframe title={`Map of ${seminar.city || "the venue"}`} src={fallbackMap} className="mt-4 h-56 w-full rounded-2xl border-0" loading="lazy" /> : null}
            {mapQuery ? (
              <p className="mt-3 flex gap-4 text-sm font-bold">
                <a className="inline-flex min-h-11 items-center text-neuro-orange-ink" href={`https://maps.apple.com/?q=${encodeURIComponent(mapQuery)}`}>Apple Maps</a>
                <a className="inline-flex min-h-11 items-center text-neuro-orange-ink" href={`https://maps.google.com/?q=${encodeURIComponent(mapQuery)}`}>Google Maps</a>
              </p>
            ) : null}
            {typeof seminar.travelInfo === "string" && seminar.travelInfo ? <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{seminar.travelInfo}</p> : null}
          </section>
        )}

        {(seminar.ceHours || seminar.ceNotes || seminar.ceStates) && (
          <section>
            <h2 className="text-2xl font-black text-neuro-navy">CE</h2>
            {seminar.ceHours ? <p className="mt-2 text-gray-700">{seminar.ceHours} hours{seminar.ceApprovingBody ? ` · ${seminar.ceApprovingBody}` : ""}</p> : null}
            {seminar.ceStates?.length ? <p className="mt-2 text-sm text-gray-600">{seminar.ceStates.join(", ")}</p> : null}
            {seminar.ceNotes ? <p className="mt-2 text-sm text-gray-700">{seminar.ceNotes}</p> : null}
          </section>
        )}

        {(faqs.length > 0 || seminar.refundPolicy || seminar.transferPolicy) && (
          <section>
            <h2 className="text-2xl font-black text-neuro-navy">Questions</h2>
            <div className="mt-3 space-y-3">
              {faqs.map((item, index) => (
                <details key={index} className="rounded-2xl bg-white p-4">
                  <summary className="cursor-pointer font-bold text-neuro-navy">{String(item.question || item.q || "Question")}</summary>
                  <p className="mt-2 text-sm text-gray-700">{String(item.answer || item.a || "")}</p>
                </details>
              ))}
            </div>
            {seminar.refundPolicy ? <p className="mt-4 text-sm text-gray-700"><strong>Refunds. </strong>{seminar.refundPolicy}</p> : null}
            {seminar.transferPolicy ? <p className="mt-2 text-sm text-gray-700"><strong>Transfers. </strong>{seminar.transferPolicy}</p> : null}
          </section>
        )}

        <section id="reviews">
          <h2 className="mb-3 text-2xl font-black text-neuro-navy">Reviews</h2>
          <SeminarReviews seminarId={seminar.id} />
        </section>

        {related.length > 0 && (
          <section>
            <h2 className="mb-4 text-2xl font-black text-neuro-navy">Related seminars</h2>
            <div className="grid gap-4">{related.map((item) => <SeminarCard key={item.id} seminar={item} />)}</div>
          </section>
        )}
      </div>

      {seminar.upcoming ? <StickyRegister href={registerHref} price={price} label={seminar.registrationLink ? "Register" : "Remind me"} /> : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(seminarJsonLd(seminar)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(seminar)) }} />
    </main>
  );
}

function formatMemberSave(from: number | null, memberAmount: number, currency: string): string {
  const base = Number(from || 0);
  const saved = Math.max(0, Math.round((base - memberAmount) * 100) / 100);
  if (saved <= 0) return "on the member price";
  return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: Number.isInteger(saved) ? 0 : 2 }).format(saved);
}
