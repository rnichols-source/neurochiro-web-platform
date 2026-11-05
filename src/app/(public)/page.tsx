import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { createAdminClient } from "@/lib/supabase-admin";
import { excludeDemo } from "@/lib/directory/exclude-demo";
import { getPublicDirectoryCounts } from "@/lib/directory/public-counts";
import { doctorJoinMenuLabel } from "@/lib/applications/flag";
import Footer from "@/components/landing/Footer";
import { LocaleLink as Link } from "@/i18n/LocaleLink";
import { languageAlternates, openGraphLocale } from "@/i18n/alternates";
import { getRequestDictionary } from "@/i18n/get-locale";
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

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getRequestDictionary();
  const title = t.meta.homeTitle;
  const description = t.meta.homeDescription;
  const alternates = languageAlternates("/", locale);
  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: String(alternates.canonical),
      siteName: "NeuroChiro",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: t.meta.homeImageAlt,
        },
      ],
      locale: openGraphLocale(locale),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
  };
}

/**
 * Hero options. B is active because the build brief says Raymond chose B.
 * The handoff checklist says the default is A. The live line is B, in the locale dictionaries.
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

async function HeroHeading() {
  const { t } = await getRequestDictionary();
  const accentAt = t.home.accent ? t.home.h1.indexOf(t.home.accent) : -1;
  return (
    <>
      <h1 className="text-[28px] font-heading font-black leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-5xl">
        {accentAt >= 0 ? (
          <>
            {t.home.h1.slice(0, accentAt)}
            <span className="text-neuro-orange-light">{t.home.accent}</span>
            {t.home.h1.slice(accentAt + t.home.accent.length)}
          </>
        ) : (
          t.home.h1
        )}
      </h1>
      <p className="mt-3 text-[15px] leading-snug text-gray-300 sm:text-base">{t.home.sub}</p>
    </>
  );
}

export default async function HomePage() {
  const [{ t }, counts, faces] = await Promise.all([getRequestDictionary(), getPublicDirectoryCounts(), getTrustFaces()]);
  const menuLabel = doctorJoinMenuLabel();
  const joinText = menuLabel === "Apply to join" ? t.nav.applyToJoin : menuLabel === "Join NeuroChiro" ? t.nav.joinNeuroChiro : menuLabel;
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.home.faq.map((item) => ({
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
          <div className="mx-auto grid w-full min-w-0 max-w-6xl grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,420px)]">
            <HeroSearch counts={counts} faces={faces}>
              <HeroHeading />
            </HeroSearch>
            <aside id="home-nearby-preview" className="hidden lg:block" aria-label={t.home.nearbyLabel}>
              <div id="home-nearby-fallback" className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white">
                <p className="text-lg font-heading font-black text-white">{t.home.nearbyTitle}</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-300">
                  {t.home.nearbyBody}
                </p>
                <div className="mt-6 space-y-3" aria-hidden>
                  <div className="h-16 rounded-xl bg-white/10" />
                  <div className="h-16 rounded-xl bg-white/10" />
                </div>
              </div>
            </aside>
          </div>
          <p className="mx-auto mt-4 max-w-6xl text-center lg:mt-6 lg:text-left">
            <Link
              href="/get-started?source=homepage_join"
              className="inline-flex min-h-11 max-w-full flex-wrap items-center justify-center gap-x-1 text-center text-sm leading-snug text-gray-300 hover:text-white lg:justify-start lg:text-left"
            >
              {t.home.doctorPrompt}{" "}
              <span className="ml-1 font-bold text-white underline decoration-white/50 underline-offset-4">
                {joinText}
              </span>
            </Link>
          </p>
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
