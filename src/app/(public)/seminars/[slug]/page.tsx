import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import { getRelated, getSeminarBySlug } from "@/lib/seminars/queries";
import { isUuid, slugify } from "@/lib/seminars/slug";
import { flagEmoji, formatDateRange, priceLabel, seatsLeftLabel } from "@/lib/seminars/format";
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
  const place = seminar.city || (seminar.format === "virtual" ? "Virtual" : "");
  const title = `${seminar.title} — ${[place, when].filter(Boolean).join(" · ")} | NeuroChiro Seminars`;
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
  const hostName = seminar.hostDoctor
    ? [seminar.hostDoctor.first_name, seminar.hostDoctor.last_name].filter(Boolean).join(" ")
    : seminar.instructorName;
  const place = seminar.format === "virtual" ? "Virtual" : [seminar.city, seminar.state, flagEmoji(seminar.countryCode)].filter(Boolean).join(" ");
  const registerHref = seminar.registrationLink ? `/go/seminar/${seminar.slug}` : "#tickets";
  const calendar = googleCalendarUrl(seminar);
  const outcomes = seminar.outcomes || [];
  const included = seminar.whatsIncluded || [];
  const schedule = rows(seminar.schedule);
  const speakers = rows(seminar.speakers);
  const faqs = rows(seminar.faq);
  const audiences = strings(seminar.audiences).concat(strings(seminar.raw.target_audience));
  const mapQuery = [seminar.venueName, seminar.venueAddress, seminar.city, seminar.country].filter(Boolean).join(", ");
  const staticKey = process.env.GOOGLE_MAPS_STATIC_KEY;
  const staticMap = staticKey && seminar.latitude && seminar.longitude
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${seminar.latitude},${seminar.longitude}&zoom=13&size=640x320&scale=2&key=${staticKey}`
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
          <p className="text-xs font-bold uppercase tracking-widest text-neuro-orange">{when}{place ? ` · ${place}` : ""}</p>
          <h1 className="mt-2 text-3xl font-black leading-tight md:text-5xl">{seminar.title}</h1>
          {seminar.tagline ? <p className="mt-3 text-lg text-white/80">{seminar.tagline}</p> : null}
          {hostName && seminar.hostDoctor?.slug ? (
            <Link href={`/directory/${seminar.hostDoctor.slug}`} className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-white">{hostName}</Link>
          ) : hostName ? <p className="mt-3 text-sm font-bold">{hostName}</p> : null}
          <p className="mt-4 text-xl font-black text-neuro-orange">{price}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {seminar.upcoming && seminar.registrationLink ? <a href={registerHref} className="inline-flex min-h-11 items-center rounded-xl bg-neuro-orange px-5 text-sm font-bold">Register</a> : null}
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
        {seminar.hostDoctor ? <p className="rounded-2xl bg-white p-4 text-sm font-bold text-neuro-navy">Verified host</p> : null}
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
        {schedule.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-neuro-navy">Agenda</h2>
            <ol className="mt-3 space-y-3">
              {schedule.map((item, index) => (
                <li key={index} className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-neuro-orange">{String(item.time || item.day || item.date || "")}</p>
                  <p className="font-black text-neuro-navy">{String(item.title || item.name || "Session")}</p>
                  {item.description ? <p className="mt-1 text-sm text-gray-600">{String(item.description)}</p> : null}
                </li>
              ))}
            </ol>
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
        {seminar.hostDoctor && (
          <section className="rounded-3xl bg-white p-5">
            <h2 className="text-2xl font-black text-neuro-navy">Host</h2>
            <p className="mt-2 font-bold">{hostName}</p>
            {seminar.hostDoctor.clinic_name ? <p className="text-sm text-gray-600">{seminar.hostDoctor.clinic_name}</p> : null}
            {seminar.instructorBio ? <p className="mt-3 text-sm text-gray-700">{seminar.instructorBio}</p> : null}
            <Link href={`/directory/${seminar.hostDoctor.slug}`} className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-neuro-orange">View profile</Link>
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
          <p className="mt-3 text-lg font-black text-neuro-orange">{price}</p>
          {seminar.upcoming && Number(seminar.priceFrom || 0) > 0 ? (
            <p className="mt-2 text-sm text-gray-600">Members save about {formatMemberSave(seminar.priceFrom, member.amount, seminar.currency)}. <Link href={`/pricing/doctors?return=/seminars/${seminar.slug}`} className="font-bold text-neuro-orange">Join NeuroChiro</Link></p>
          ) : null}
          {seminar.upcoming && seminar.registrationLink ? (
            <a href={registerHref} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-neuro-orange px-5 text-sm font-bold text-white">Register</a>
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
            <p className="mt-2 text-gray-700">{[seminar.venueName, seminar.venueAddress, seminar.city, seminar.country].filter(Boolean).join(", ")}</p>
            {staticMap ? <img src={staticMap} alt={`Map of ${seminar.venueName || seminar.city}`} className="mt-4 w-full rounded-2xl" /> : null}
            {mapQuery ? (
              <p className="mt-3 flex gap-4 text-sm font-bold">
                <a className="min-h-11 text-neuro-orange" href={`https://maps.apple.com/?q=${encodeURIComponent(mapQuery)}`}>Apple Maps</a>
                <a className="min-h-11 text-neuro-orange" href={`https://maps.google.com/?q=${encodeURIComponent(mapQuery)}`}>Google Maps</a>
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
