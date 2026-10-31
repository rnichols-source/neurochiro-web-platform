import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { createAdminClient } from "@/lib/supabase-admin";
import { excludeDemo } from "@/lib/directory/exclude-demo";
import { getPublicDirectoryCounts } from "@/lib/directory/public-counts";
import { homepageFaqs } from "@/lib/content/faq";
import Footer from "@/components/landing/Footer";
import HeroSearch from "@/components/landing/HeroSearch";
import {
  WhatIsNSC,
  HowItWorks,
  QuizCard,
  MeetTheDoctors,
  HomeFaq,
  PatientListCard,
  DoctorStrip,
} from "@/components/landing/home/HomeSections";

const NearbyDoctors = dynamic(() => import("@/components/landing/home/NearbyDoctors"));

export const revalidate = 300;

const TITLE = "NeuroChiro | Find a Nervous System Chiropractor Near You";
const DESCRIPTION =
  "Free directory of verified nervous system chiropractors. Search by city or ZIP, compare doctors, and request an appointment online.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://www.neurochiro.co" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://www.neurochiro.co",
    siteName: "NeuroChiro",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Find a nervous system chiropractor near you",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

/**
 * Hero options. B is active because the build brief says Raymond chose B.
 * The handoff checklist says the default is A. Switch ACTIVE_HERO to change it.
 */
export const HERO_COPY = {
  A: {
    h1: "Find a chiropractor who looks at your whole nervous system",
    accent: "",
    sub: "NeuroChiro is a directory of verified chiropractors who focus on how your brain and body communicate. Search near you and request an appointment in minutes.",
  },
  B: {
    h1: "Find a nervous system chiropractor near you",
    accent: "nervous system chiropractor",
    sub: "A free directory of verified chiropractors who look beyond the pain to how your nervous system is working, for kids, pregnancy, headaches, stress and more.",
  },
  C: {
    h1: "Care that starts with your nervous system",
    accent: "",
    sub: "Verified chiropractors for families, pregnancy, headaches and stress. Find one near you and request a visit, free.",
  },
} as const;

const ACTIVE_HERO = "B" as const;

async function getTrustFaces() {
  try {
    const supabase = createAdminClient();
    const { data } = await excludeDemo(
      supabase
        .from("doctors")
        .select("first_name, last_name, photo_url")
        .eq("verification_status", "verified")
        .not("photo_url", "is", null)
        .order("accepting_new_patients", { ascending: false })
        .limit(12),
    );
    return (data || [])
      .filter((row) => row.photo_url)
      .slice(0, 3)
      .map((row) => ({
        name: `Dr. ${row.first_name || ""} ${row.last_name || ""}`.trim(),
        photo: row.photo_url as string,
      }));
  } catch {
    return [];
  }
}

function HeroHeading() {
  const copy = HERO_COPY[ACTIVE_HERO];
  const accentAt = copy.accent ? copy.h1.indexOf(copy.accent) : -1;
  return (
    <>
      <h1 className="text-[28px] font-heading font-black leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-5xl">
        {accentAt >= 0 ? (
          <>
            {copy.h1.slice(0, accentAt)}
            <span className="text-neuro-orange-light">{copy.accent}</span>
            {copy.h1.slice(accentAt + copy.accent.length)}
          </>
        ) : (
          copy.h1
        )}
      </h1>
      <p className="mt-3 text-[15px] leading-snug text-gray-300 sm:text-base">{copy.sub}</p>
    </>
  );
}

export default async function HomePage() {
  const [counts, faces] = await Promise.all([getPublicDirectoryCounts(), getTrustFaces()]);
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: homepageFaqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <div className="min-h-dvh bg-neuro-cream">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <main>
        <section className="bg-neuro-navy px-4 pb-8 pt-20 sm:px-6 lg:pt-24 lg:pb-14">
          <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,420px)]">
            <HeroSearch counts={counts} faces={faces}>
              <HeroHeading />
            </HeroSearch>
            <aside id="home-nearby-preview" className="hidden lg:block" aria-label="Doctors near you">
              <div id="home-nearby-fallback" className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white">
                <p className="text-lg font-heading font-black text-white">Doctors near you</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-300">
                  Search by city or ZIP and verified doctors near that place show up here.
                </p>
                <div className="mt-6 space-y-3" aria-hidden>
                  <div className="h-16 rounded-xl bg-white/10" />
                  <div className="h-16 rounded-xl bg-white/10" />
                </div>
              </div>
            </aside>
          </div>
        </section>

        <NearbyDoctors />
        <WhatIsNSC />
        <HowItWorks />
        <QuizCard />
        <MeetTheDoctors />
        <HomeFaq />
        <PatientListCard />
        <DoctorStrip counts={counts} />
      </main>
      <Footer />
    </div>
  );
}
