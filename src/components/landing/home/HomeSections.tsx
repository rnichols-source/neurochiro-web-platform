import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Brain, Heart, Users, Play } from "lucide-react";
import { homepageFaqs } from "@/lib/content/faq";
import { patientSpotlightEpisodes } from "@/app/(public)/spotlight/spotlight-data";
import type { PublicDirectoryCounts } from "@/lib/directory/public-counts";

export function WhatIsNSC() {
  const rows = [
    {
      icon: Brain,
      title: "Looks at how your brain and body communicate.",
      body: "Not just where it hurts, but how well your nervous system is adapting to stress.",
    },
    {
      icon: Heart,
      title: "Gentle, specific adjustments.",
      body: "A care plan built around you, with progress checked along the way.",
    },
    {
      icon: Users,
      title: "Care for the whole family.",
      body: "Many see newborns, kids, pregnant moms and grandparents.",
    },
  ];
  return (
    <section className="bg-white px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-heading font-black text-neuro-navy">What is a nervous system chiropractor?</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-gray-700">
          Patients often come in for kids, pregnancy, headaches, and stress. These doctors start with how the nervous system is working.
        </p>
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
            Learn the basics →
          </Link>
          <Link href="/learn/experience" className="inline-flex min-h-11 items-center text-sm font-bold text-neuro-orange-ink">
            What happens on a first visit →
          </Link>
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    { n: "1", title: "Search near you", body: "Enter your city or ZIP, or use your location." },
    { n: "2", title: "Compare", body: "See each doctor's focus, cost, availability and what the first visit is like." },
    {
      n: "3",
      title: "Request an appointment",
      body: "Send a request in under a minute. The office usually replies within 1 business day, and we follow up if they don't.",
    },
  ];
  return (
    <section className="bg-neuro-cream px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-heading font-black text-neuro-navy">How it works</h2>
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
          Find a doctor near me
        </a>
      </div>
    </section>
  );
}

export function QuizCard() {
  return (
    <section className="bg-white px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-gray-100 bg-neuro-cream p-6 sm:p-8">
        <h2 className="text-2xl font-heading font-black text-neuro-navy">Not sure who&apos;s right for you?</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-gray-700">
          Answer 4 quick questions and we&apos;ll match you with verified doctors near you.
        </p>
        <Link
          href="/quiz?source=homepage"
          className="mt-6 inline-flex h-[52px] items-center justify-center rounded-xl bg-neuro-orange-ink px-6 text-base font-bold text-white"
        >
          Take the quiz
        </Link>
      </div>
    </section>
  );
}

export function MeetTheDoctors() {
  const episodes = patientSpotlightEpisodes(3);
  return (
    <section className="bg-neuro-cream px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-neuro-orange-ink">Meet the doctors</p>
        <h2 className="mt-2 text-2xl font-heading font-black text-neuro-navy">Real doctors, real stories</h2>
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
          See all episodes <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

export function HomeFaq() {
  return (
    <section className="bg-white px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-heading font-black text-neuro-navy">Common questions</h2>
        <div className="mt-6 border-t border-gray-200">
          {homepageFaqs.map((item) => (
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

export function PatientListCard() {
  return (
    <section className="bg-neuro-cream px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-md rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
        <h2 className="text-lg font-heading font-black text-neuro-navy">No doctor near you yet?</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-gray-700">
          Join the patient list and we&apos;ll email you when a nervous system chiropractor joins your area.
        </p>
        <Link
          href="/list?source=homepage"
          className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-neuro-orange-ink px-6 text-base font-bold text-white"
        >
          Join the patient list
        </Link>
      </div>
    </section>
  );
}

export function DoctorStrip({ counts }: { counts: PublicDirectoryCounts }) {
  return (
    <section data-section="for-chiropractors" className="bg-neuro-navy px-4 py-8 text-white sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-300">For chiropractors</p>
        <h2 className="text-2xl font-heading font-black text-white">Are you a nervous system chiropractor?</h2>
        <p className="text-[15px] leading-relaxed text-gray-300">
          Get listed and receive appointment requests from patients near you.
        </p>
        {counts.total > 0 && (
          <p className="text-sm text-gray-300">
            {counts.total} verified doctors in {counts.countries} {counts.countries === 1 ? "country" : "countries"}.
          </p>
        )}
        <Link
          href="/pro?source=homepage_cta"
          className="inline-flex h-[52px] items-center justify-center rounded-xl bg-neuro-orange-ink px-6 text-base font-bold text-white"
        >
          See membership
        </Link>
        <div className="flex flex-wrap gap-2">
          <Link href="/seminars" className="inline-flex min-h-11 items-center px-2 text-sm font-bold text-white">
            Seminars
          </Link>
          <Link href="/login" className="inline-flex min-h-11 items-center px-2 text-sm font-bold text-white">
            Log in
          </Link>
        </div>
      </div>
    </section>
  );
}
