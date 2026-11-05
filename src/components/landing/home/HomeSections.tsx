import Image from "next/image";
import { ArrowRight, Brain, Heart, Users, Play } from "lucide-react";
import { doctorJoinMenuLabel } from "@/lib/applications/flag";
import { patientSpotlightEpisodes } from "@/app/(public)/spotlight/spotlight-data";
import type { PublicDirectoryCounts } from "@/lib/directory/public-counts";
import { LocaleLink as Link } from "@/i18n/LocaleLink";
import { fill } from "@/i18n/config";
import { getRequestDictionary } from "@/i18n/get-locale";

function joinLabel(label: string, apply: string, join: string) {
  if (label === "Apply to join") return apply;
  if (label === "Join NeuroChiro") return join;
  return label;
}

export async function WhatIsNSC() {
  const { t } = await getRequestDictionary();
  const rows = [
    { icon: Brain, title: t.home.what1Title, body: t.home.what1Body },
    { icon: Heart, title: t.home.what2Title, body: t.home.what2Body },
    { icon: Users, title: t.home.what3Title, body: t.home.what3Body },
  ];
  return (
    <section className="bg-white px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-heading font-black text-neuro-navy">{t.home.whatTitle}</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-gray-700">{t.home.whatBody}</p>
        <ul className="mt-8 space-y-6">
          {rows.map((row) => (
            <li key={row.title} className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neuro-cream text-neuro-orange-ink">
                <row.icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h3 className="text-base font-bold text-neuro-navy">{row.title}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-gray-700">{row.body}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-col gap-1 sm:flex-row sm:gap-6">
          <Link href="/learn/foundations" className="inline-flex min-h-11 items-center text-sm font-bold text-neuro-orange-ink">
            {t.home.learnBasics}
          </Link>
          <Link href="/learn/experience" className="inline-flex min-h-11 items-center text-sm font-bold text-neuro-orange-ink">
            {t.home.firstVisitLink}
          </Link>
        </div>
      </div>
    </section>
  );
}

export async function HowItWorks() {
  const { t } = await getRequestDictionary();
  const steps = [
    { n: "1", title: t.home.step1Title, body: t.home.step1Body },
    { n: "2", title: t.home.step2Title, body: t.home.step2Body },
    { n: "3", title: t.home.step3Title, body: t.home.step3Body },
  ];
  return (
    <section className="bg-neuro-cream px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-heading font-black text-neuro-navy">{t.home.howTitle}</h2>
        <ol className="mt-8 space-y-6">
          {steps.map((step) => (
            <li key={step.n} className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neuro-navy text-base font-bold text-white">
                {step.n}
              </span>
              <div>
                <h3 className="text-base font-bold text-neuro-navy">{step.title}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-gray-700">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <a
          href="#hero-location"
          className="mt-8 inline-flex h-[52px] items-center justify-center rounded-xl bg-neuro-orange-ink px-6 text-base font-bold text-white"
        >
          {t.home.findNear}
        </a>
      </div>
    </section>
  );
}

export async function QuizCard() {
  const { t } = await getRequestDictionary();
  return (
    <section className="bg-white px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-gray-100 bg-neuro-cream p-6 sm:p-8">
        <h2 className="text-2xl font-heading font-black text-neuro-navy">{t.home.quizTitle}</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-gray-700">{t.home.quizBody}</p>
        <Link
          href="/quiz?source=homepage"
          className="mt-6 inline-flex h-[52px] items-center justify-center rounded-xl bg-neuro-orange-ink px-6 text-base font-bold text-white"
        >
          {t.home.quizButton}
        </Link>
      </div>
    </section>
  );
}

export async function MeetTheDoctors() {
  const { t } = await getRequestDictionary();
  const episodes = patientSpotlightEpisodes(3);
  return (
    <section className="bg-neuro-cream px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-neuro-orange-ink">{t.home.meetEyebrow}</p>
        <h2 className="mt-2 text-2xl font-heading font-black text-neuro-navy">{t.home.meetTitle}</h2>
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {episodes.map((episode) => (
            <Link
              key={episode.id}
              href={`/spotlight#ep-${episode.episodeNumber}`}
              className="group overflow-hidden rounded-2xl border border-gray-100 bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neuro-orange-ink"
            >
              <span className="relative block aspect-video bg-gray-100">
                <Image
                  src={episode.thumbnail}
                  alt={episode.doctorName}
                  fill
                  sizes="(min-width: 768px) 320px, 100vw"
                  className="object-cover"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-neuro-orange-ink text-white">
                    <Play className="ml-0.5 h-5 w-5" aria-hidden />
                  </span>
                </span>
              </span>
              <span className="block p-4">
                <span className="block text-base font-bold text-neuro-navy">{episode.doctorName}</span>
                <span className="mt-1 block text-sm text-gray-500">
                  {episode.city}, {episode.state}
                </span>
                <span className="mt-2 block text-sm italic leading-relaxed text-gray-700">&ldquo;{episode.quote}&rdquo;</span>
              </span>
            </Link>
          ))}
        </div>
        <Link href="/spotlight" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-neuro-orange-ink">
          {t.home.seeEpisodes} <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

export async function HomeFaq() {
  const { t } = await getRequestDictionary();
  return (
    <section className="bg-white px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-heading font-black text-neuro-navy">{t.home.faqTitle}</h2>
        <div className="mt-6 border-t border-gray-200">
          {t.home.faq.map((item) => (
            <details key={item.question} className="group border-b border-gray-200">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 text-base font-bold text-neuro-navy [&::-webkit-details-marker]:hidden">
                {item.question}
                <span className="text-neuro-orange-ink group-open:hidden" aria-hidden>+</span>
                <span className="hidden text-neuro-orange-ink group-open:inline" aria-hidden>−</span>
              </summary>
              <p className="pb-4 text-[15px] leading-relaxed text-gray-700">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export async function PatientListCard() {
  const { t } = await getRequestDictionary();
  return (
    <section className="bg-neuro-cream px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-md rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
        <h2 className="text-lg font-heading font-black text-neuro-navy">{t.home.listTitle}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-gray-700">{t.home.listBody}</p>
        <Link
          href="/list?source=homepage"
          className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-neuro-orange-ink px-6 text-base font-bold text-white"
        >
          {t.home.listButton}
        </Link>
      </div>
    </section>
  );
}

export async function DoctorStrip({ counts }: { counts: PublicDirectoryCounts }) {
  const { t } = await getRequestDictionary();
  return (
    <section data-section="for-chiropractors" className="bg-neuro-navy px-4 py-8 text-white sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-300">{t.home.forDoctors}</p>
        <h2 className="text-2xl font-heading font-black text-white">{t.home.forDoctorsTitle}</h2>
        <p className="text-[15px] leading-relaxed text-gray-300">{t.home.forDoctorsBody}</p>
        {counts.total > 0 && (
          <p className="text-sm text-gray-300">
            {fill(counts.countries === 1 ? t.home.verifiedOne : t.home.verifiedMany, {
              total: counts.total,
              countries: counts.countries,
            })}
          </p>
        )}
        <Link
          href="/get-started?source=homepage_join"
          className="inline-flex min-h-11 items-center text-sm font-bold text-white underline decoration-white/40 underline-offset-4 hover:text-neuro-orange-light"
        >
          {joinLabel(doctorJoinMenuLabel(), t.nav.applyToJoin, t.nav.joinNeuroChiro)}
        </Link>
        <Link
          href="/pro?source=homepage_cta"
          className="inline-flex h-[52px] items-center justify-center rounded-xl bg-neuro-orange-ink px-6 text-base font-bold text-white"
        >
          {t.home.seeMembership}
        </Link>
        <div className="flex flex-wrap gap-2">
          <Link href="/seminars" className="inline-flex min-h-11 items-center px-2 text-sm font-bold text-white">
            {t.nav.seminars}
          </Link>
          <Link href="/login" className="inline-flex min-h-11 items-center px-2 text-sm font-bold text-white">
            {t.nav.logIn}
          </Link>
        </div>
      </div>
    </section>
  );
}
