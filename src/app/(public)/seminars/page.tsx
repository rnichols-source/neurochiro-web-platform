import type { Metadata } from "next";
import Link from "next/link";
import { SEMINAR_CONFIG } from "@/config/seminars";
import { listSeminars } from "@/lib/seminars/queries";
import { formatMoney, monthKey, monthLabel } from "@/lib/seminars/format";
import { itemListJsonLd } from "@/lib/seminars/jsonld";
import { SeminarCard } from "@/components/seminars/SeminarCard";
import LeadCaptureInline from "@/components/leads/LeadCaptureInline";
import { Countdown } from "./countdown";
import { FilterSheet } from "./filter-sheet";
import { SeminarMap } from "./seminar-map";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Seminars | NeuroChiro",
  description: "Upcoming chiropractic seminars in adjusting, communication, neurology, pediatrics, and practice growth.",
  alternates: { canonical: "https://www.neurochiro.co/seminars" },
  openGraph: {
    title: "NeuroChiro Seminars",
    description: "Browse upcoming seminars and open a registration page for each event.",
    url: "https://www.neurochiro.co/seminars",
  },
};

const TOPIC_LABELS: Record<string, string> = {
  adjusting: "Adjusting",
  communication: "Communication",
  "practice-growth": "Practice growth",
  "pediatrics-prenatal": "Pediatrics",
  neurology: "Neurology",
  philosophy: "Philosophy",
  students: "Students",
  business: "Business",
};

type Search = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function hrefFor(current: Record<string, string>, patch: Record<string, string | null>): string {
  const next = { ...current };
  for (const [key, value] of Object.entries(patch)) {
    if (!value) delete next[key];
    else next[key] = value;
  }
  const params = new URLSearchParams(next);
  const query = params.toString();
  return query ? `/seminars?${query}` : "/seminars";
}

export default async function SeminarsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const raw = await searchParams;
  const current = {
    topic: one(raw.topic),
    when: one(raw.when),
    country: one(raw.country),
    format: one(raw.format),
    ce: one(raw.ce),
    price: one(raw.price),
    q: one(raw.q),
    past: one(raw.past),
    view: one(raw.view),
  };
  const past = current.past === "1" || current.when === "past";
  const seminars = await listSeminars({
    topic: current.topic || undefined,
    when: current.when || undefined,
    country: current.country || undefined,
    format: current.format || undefined,
    ce: current.ce === "1",
    price: current.price || undefined,
    q: current.q || undefined,
    past,
  });
  const featured = past ? [] : seminars.filter((seminar) => seminar.featured);
  const nextEvent = seminars.find((seminar) => seminar.startDate) || seminars[0];
  const groups = new Map<string, typeof seminars>();
  for (const seminar of seminars) {
    const key = monthKey(seminar.startDate, seminar.dates);
    groups.set(key, [...(groups.get(key) || []), seminar]);
  }
  const preserved = Object.fromEntries(Object.entries(current).filter(([, value]) => value && value !== "0"));
  const filterLinks = (
    <div className="flex flex-col gap-2">
      <Link className="min-h-11 rounded-xl px-3 py-2 text-sm font-bold text-neuro-navy hover:bg-neuro-cream" href={hrefFor(preserved, { past: null, when: null })}>Upcoming</Link>
      <Link className="min-h-11 rounded-xl px-3 py-2 text-sm font-bold text-neuro-navy hover:bg-neuro-cream" href={hrefFor(preserved, { past: "1", when: null })}>Past seminars</Link>
      <Link className="min-h-11 rounded-xl px-3 py-2 text-sm font-bold text-neuro-navy hover:bg-neuro-cream" href={hrefFor(preserved, { when: "next-3-months", past: null })}>Next 3 months</Link>
      <Link className="min-h-11 rounded-xl px-3 py-2 text-sm font-bold text-neuro-navy hover:bg-neuro-cream" href={hrefFor(preserved, { ce: current.ce === "1" ? null : "1" })}>CE hours</Link>
      <Link className="min-h-11 rounded-xl px-3 py-2 text-sm font-bold text-neuro-navy hover:bg-neuro-cream" href={hrefFor(preserved, { price: "under-500" })}>Under $500</Link>
      <Link className="min-h-11 rounded-xl px-3 py-2 text-sm font-bold text-neuro-navy hover:bg-neuro-cream" href={hrefFor(preserved, { price: "500-plus" })}>$500 and up</Link>
      {["US", "AU", "GB", "CA"].map((code) => (
        <Link key={code} className="min-h-11 rounded-xl px-3 py-2 text-sm font-bold text-neuro-navy hover:bg-neuro-cream" href={hrefFor(preserved, { country: code })}>{code}</Link>
      ))}
      {SEMINAR_CONFIG.topics.map((topic) => (
        <Link key={topic} className="min-h-11 rounded-xl px-3 py-2 text-sm font-bold text-neuro-navy hover:bg-neuro-cream" href={hrefFor(preserved, { topic })}>{TOPIC_LABELS[topic]}</Link>
      ))}
      <Link className="min-h-11 rounded-xl px-3 py-2 text-sm font-bold text-neuro-orange" href="/seminars">Clear filters</Link>
    </div>
  );

  return (
    <main data-nc-seminars="ready" className="min-h-dvh bg-neuro-cream pb-28">
      <section className="bg-neuro-navy px-5 pb-8 pt-28 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-black tracking-tight">Seminars</h1>
          <p className="mt-2 max-w-xl text-sm text-white/70">Adjusting, communication, neurology, and the rest of the work. Every event is reviewed before it is listed.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {nextEvent?.startDate && !past ? <Countdown start={nextEvent.startDate} /> : null}
            <a href="#results" className="inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-sm font-bold text-neuro-navy">Browse</a>
            <Link href="/seminars/host" className="inline-flex min-h-11 items-center rounded-xl bg-neuro-orange px-4 text-sm font-bold text-white">Host a seminar</Link>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pt-6" data-featured-rail>
          <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-neuro-orange">Featured</h2>
          <div className="flex snap-x gap-4 overflow-x-auto pb-2">
            {featured.map((seminar) => (
              <div key={seminar.id} className="w-[78%] shrink-0 snap-start sm:w-80">
                <SeminarCard seminar={seminar} />
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="sticky top-16 z-30 border-b border-black/5 bg-neuro-cream/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto">
          <FilterSheet>{filterLinks}</FilterSheet>
          <form action="/seminars" className="min-w-48 flex-1">
            {Object.entries(preserved).filter(([key]) => key !== "q").map(([key, value]) => (
              <input key={key} type="hidden" name={key} value={value} />
            ))}
            <input name="q" defaultValue={current.q} placeholder="Search seminars" className="min-h-11 w-full rounded-full border border-black/10 bg-white px-4 text-base" />
          </form>
          <Link href={hrefFor(preserved, { view: current.view === "map" ? null : "map" })} className="hidden min-h-11 items-center rounded-full border border-black/10 bg-white px-4 text-sm font-bold lg:inline-flex">
            {current.view === "map" ? "List" : "Map"}
          </Link>
        </div>
      </div>

      <div id="results" className="mx-auto grid max-w-6xl gap-8 px-5 py-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">{filterLinks}</aside>
        <div>
          {current.view === "map" && !past ? (
            <div className="h-[70vh] overflow-hidden rounded-3xl border border-black/5 bg-white">
              <SeminarMap />
            </div>
          ) : seminars.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-center">
              <h2 className="text-xl font-black text-neuro-navy">No seminars match those filters</h2>
              <div className="mt-4 flex justify-center gap-3">
                <Link href="/seminars" className="inline-flex min-h-11 items-center rounded-xl bg-neuro-navy px-4 text-sm font-bold text-white">Clear filters</Link>
                <a href="#notify" className="inline-flex min-h-11 items-center rounded-xl border border-black/10 px-4 text-sm font-bold">Get notified</a>
              </div>
            </div>
          ) : (
            <div data-seminar-list className="space-y-8">
              {[...groups.entries()].map(([key, rows]) => (
                <section key={key} data-month={key}>
                  <h2 className="mb-4 text-lg font-black text-neuro-navy">{monthLabel(key)}</h2>
                  <div className="grid gap-4 lg:grid-cols-3">
                    {rows.map((seminar) => <SeminarCard key={seminar.id} seminar={seminar} past={past} />)}
                  </div>
                </section>
              ))}
            </div>
          )}
          {!past && (
            <p className="mt-8">
              <Link href="/seminars?past=1" className="text-sm font-bold text-neuro-orange">Past seminars</Link>
            </p>
          )}
        </div>
      </div>

      <section id="notify" className="mx-auto max-w-3xl px-5 pb-8">
        <LeadCaptureInline source="seminar_newsletter" headline="New seminars, once a month" description="Dates, cities, and CE hours. No filler." buttonText="Email me" variant="card" />
      </section>

      <section className="mx-auto mb-10 max-w-6xl rounded-3xl bg-neuro-navy px-6 py-8 text-white">
        <h2 className="text-2xl font-black">Host a seminar</h2>
        <p className="mt-2 text-sm text-white/70">Everyone applies. Pro members pay to host too.</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          <li className="rounded-2xl bg-white/10 p-4"><p className="font-black">{SEMINAR_CONFIG.packages.single.name}</p><p>{formatMoney(SEMINAR_CONFIG.packages.single.priceUsd, "USD")}</p></li>
          <li className="rounded-2xl bg-white/10 p-4"><p className="font-black">{SEMINAR_CONFIG.packages.annual.name}</p><p>{formatMoney(SEMINAR_CONFIG.packages.annual.priceUsd, "USD")} / year</p></li>
          <li className="rounded-2xl bg-white/10 p-4"><p className="font-black">{SEMINAR_CONFIG.featuredAddon.name}</p><p>{formatMoney(SEMINAR_CONFIG.featuredAddon.priceUsd, "USD")}</p></li>
        </ul>
        <Link href="/seminars/host" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-neuro-orange px-5 text-sm font-bold">See host packages</Link>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd(past ? [] : seminars)) }} />
    </main>
  );
}
