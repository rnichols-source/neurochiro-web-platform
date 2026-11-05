import { MapPin, ArrowRight, CheckCircle } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { slugToCity, STATE_NAMES, getCityCoords } from "@/lib/city-data";
import { getDoctorsNearCity, getNearestDoctors, getNearbyCityPages, type CityDoctor } from "../actions";
import { formatDistance } from "@/lib/geo";
import Footer from "@/components/landing/Footer";
import { LocaleLink as Link } from "@/i18n/LocaleLink";
import { fill } from "@/i18n/config";
import { languageAlternates, publicUrl } from "@/i18n/alternates";
import { getRequestDictionary } from "@/i18n/get-locale";
import FindSomeoneForm from "./FindSomeoneForm";
import CityDoctorCard from "./CityDoctorCard";

// Force dynamic rendering — database queries change as doctors join
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const parsed = slugToCity(slug);
  if (!parsed) return {};
  const { city, state } = parsed;
  const stateName = STATE_NAMES[state] || state;
  const location = `${city}, ${stateName}`;
  const { locale, t } = await getRequestDictionary();
  const title = fill(t.city.title, { location });
  const description = fill(t.city.description, { location });
  const alternates = languageAlternates(`/chiropractor/${slug}`, locale);

  return {
    title,
    description,
    openGraph: {
      title: fill(t.city.ogTitle, { location }),
      description: fill(t.city.ogDescription, { location }),
      url: String(alternates.canonical),
    },
    alternates,
  };
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const parsed = slugToCity(slug);
  if (!parsed) notFound();
  const { city, state } = parsed;
  const stateName = STATE_NAMES[state] || state;
  const location = `${city}, ${stateName}`;
  const { locale, t } = await getRequestDictionary();
  const distanceUnit = locale === "fr" ? "km" as const : "mi" as const;

  // Get city center from static lookup (geocoded city centers, not doctor addresses)
  const coords = getCityCoords(slug);
  let lat = coords?.lat || 0;
  let lng = coords?.lng || 0;

  // Fallback: geocode via Nominatim for cities not in the static lookup
  if (!lat || !lng) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${city}, ${state}, USA`)}&limit=1`, {
        headers: { 'User-Agent': 'NeuroChiro/1.0 (neurochiro.co)' },
      });
      const data = await res.json();
      if (data[0]) {
        lat = parseFloat(data[0].lat);
        lng = parseFloat(data[0].lon);
      }
    } catch {}
  }

  if (!lat || !lng) notFound();

  // Get doctors within 30 miles
  const nearbyDoctors = await getDoctorsNearCity(lat, lng, 30);
  const hasLocalDoctors = nearbyDoctors.length > 0;

  // If no nearby doctors, get nearest nationwide
  let nearestDoctors: CityDoctor[] = [];
  if (!hasLocalDoctors) {
    nearestDoctors = await getNearestDoctors(lat, lng, 5);
  }

  // Nearby city pages for internal linking
  const nearbyCities = await getNearbyCityPages(lat, lng, slug, 6);

  // Structured data — only emit fields we actually have
  const pageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: fill(t.city.jsonName, { location }),
    url: locale === "fr" ? publicUrl(`/chiropractor/${slug}`, "fr") : `https://neurochiro.co/chiropractor/${slug}`,
    description: fill(t.city.jsonDescription, { location }),
    about: { '@type': 'MedicalSpecialty', name: 'Chiropractic' },
  };

  const doctorJsonLd = nearbyDoctors.map(doc => {
    const ld: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': ['LocalBusiness', 'Physician'],
      name: doc.clinic_name || `Dr. ${doc.first_name} ${doc.last_name}`,
      url: locale === "fr" ? publicUrl(`/directory/${doc.slug}`, "fr") : `https://neurochiro.co/directory/${doc.slug}`,
      ...(doc.phone && { telephone: doc.phone }),
      ...(doc.website_url && { url: doc.website_url }),
      address: {
        '@type': 'PostalAddress',
        addressLocality: doc.city,
        addressRegion: doc.state,
        addressCountry: 'US',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: doc.latitude,
        longitude: doc.longitude,
      },
      ...(doc.accepting_new_patients && { isAcceptingNewPatients: true }),
      ...(doc.photo_url && { image: doc.photo_url }),
      medicalSpecialty: 'Chiropractic',
    };
    // Parse hours if available
    if (doc.hours) {
      const dayMap: Record<string, string> = { monday: 'Mo', tuesday: 'Tu', wednesday: 'We', thursday: 'Th', friday: 'Fr', saturday: 'Sa', sunday: 'Su' };
      const specs: string[] = [];
      for (const line of doc.hours.split('\n')) {
        const match = line.match(/^(\w+):\s*(.+)/i);
        if (match) {
          const day = dayMap[match[1].toLowerCase()];
          if (day) specs.push(`${day} ${match[2].replace(/\s/g, '')}`);
        }
      }
      if (specs.length > 0) ld.openingHours = specs;
    }
    return ld;
  });

  return (
    <div className="min-h-dvh bg-neuro-cream">
      {/* Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }} />
      {doctorJsonLd.map((ld, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      ))}

      {/* Hero */}
      <section className="bg-neuro-navy py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-neuro-orange" />
            <span className="text-neuro-orange text-sm font-bold uppercase tracking-widest">{location}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-black text-white leading-tight mb-4">
            <CityHeading template={hasLocalDoctors ? t.city.h1 : t.city.h1Empty} city={city} />
          </h1>
          <p className="text-white/50 max-w-xl mx-auto">
            {hasLocalDoctors
              ? fill(t.city.withDoctors, {
                  count: nearbyDoctors.length,
                  doctors: nearbyDoctors.length === 1 ? t.city.doctor : t.city.doctors,
                  city,
                })
              : fill(t.city.growing, { state: stateName })
            }
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {hasLocalDoctors ? (
          <>
            {/* Doctor cards */}
            <div className="space-y-4 mb-12">
              {nearbyDoctors.map((doc) => (
                <CityDoctorCard key={doc.id} doc={doc as any} searchCity={city} />
              ))}
            </div>
          </>
        ) : (
          <>
            {/* No doctors — the strongest page on the site */}

            {/* 1. Nearest doctors with real distances */}
            {nearestDoctors.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xl font-heading font-black text-neuro-navy mb-2">{fill(t.city.nearestTitle, { city })}</h2>
                <p className="text-gray-500 text-sm mb-4">{t.city.nearestBody}</p>
                <div className="space-y-3">
                  {nearestDoctors.map((doc) => (
                    <Link key={doc.id} href={`/directory/${doc.slug}`} className="block">
                      <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-neuro-orange/20 transition-all flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-neuro-navy flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {doc.photo_url ? (
                            <img src={doc.photo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white font-black text-lg">{doc.first_name?.[0]}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-neuro-navy text-sm">Dr. {doc.first_name} {doc.last_name}</p>
                          <p className="text-xs text-gray-500">{doc.clinic_name} &middot; {doc.city}, {doc.state}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-neuro-orange font-bold text-sm">{formatDistance(doc.distance_miles, distanceUnit)}</span>
                          <p className="text-[10px] text-gray-400">{fill(t.city.fromCity, { city })}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Patient waitlist signup */}
            <div className="bg-neuro-navy rounded-2xl p-8 mb-10">
              <h2 className="text-lg font-heading font-black text-white mb-2">{fill(t.city.notifyTitle, { city })}</h2>
              <p className="text-white/50 text-sm mb-4">
                {t.city.notifyBody}
              </p>
              <Link
                href={`/list?source=city_page&zip=`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors text-sm min-h-[44px]"
              >
                {t.city.waitlist} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 3. Help me find someone */}
            <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-10">
              <h2 className="text-lg font-heading font-black text-neuro-navy mb-2">{t.city.helpTitle}</h2>
              <p className="text-gray-500 text-sm mb-4">
                {t.city.helpBody}
              </p>
              <FindSomeoneForm city={city} state={state} />
            </div>
          </>
        )}

        {/* What is nervous system chiropractic */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-8">
          <h2 className="text-xl font-heading font-black text-neuro-navy mb-4">
            {t.city.whatTitle}
          </h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>{t.city.what1}</p>
            <p>{t.city.what2}</p>
            <p>{t.city.what3}</p>
          </div>
        </div>

        {/* What to expect */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-8">
          <h2 className="text-xl font-heading font-black text-neuro-navy mb-4">
            {t.city.expectTitle}
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { n: '1', title: t.city.expect1Title, desc: t.city.expect1 },
              { n: '2', title: t.city.expect2Title, desc: t.city.expect2 },
              { n: '3', title: t.city.expect3Title, desc: t.city.expect3 },
            ].map((step) => (
              <div key={step.n} className="bg-neuro-cream rounded-xl p-5">
                <div className="text-2xl font-black text-neuro-orange mb-2">{step.n}</div>
                <h3 className="font-bold text-neuro-navy text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-8">
          <h2 className="text-xl font-heading font-black text-neuro-navy mb-4">
            {t.city.questions}
          </h2>
          <div className="space-y-4">
            {[
              { q: fill(t.city.q1, { city }), a: t.city.a1 },
              { q: t.city.q2, a: t.city.a2 },
              { q: t.city.q3, a: t.city.a3 },
              { q: t.city.q4, a: t.city.a4 },
            ].map((faq, i) => (
              <div key={i}>
                <h3 className="font-bold text-neuro-navy text-sm">{faq.q}</h3>
                <p className="text-gray-500 text-sm mt-1 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor CTA */}
        <div className="bg-neuro-navy rounded-2xl p-8 text-center">
          <h2 className="text-xl font-heading font-black text-white mb-3">{fill(t.city.doctorCta, { city })}</h2>
          <p className="text-white/50 text-sm mb-6">{t.city.doctorCtaBody}</p>
          <Link href={`/pro?source=city_page_${slug}`} className="inline-flex items-center gap-2 px-8 py-4 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors">
            {t.city.learnMore} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Also serving — internal links to nearby city pages */}
      {nearbyCities.length > 0 && (
        <section className="bg-neuro-cream border-t border-gray-200 py-10 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">{t.city.alsoServing}</h2>
            <div className="flex flex-wrap gap-2">
              {nearbyCities.map((c) => (
                <Link
                  key={c.slug}
                  href={`/chiropractor/${c.slug}`}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-neuro-navy font-medium hover:border-neuro-orange/30 hover:shadow-sm transition-all"
                >
                  {c.city}, {c.state}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}

function CityHeading({ template, city }: { template: string; city: string }) {
  const [before, after] = template.split("{city}");
  return (
    <>
      {before}
      <span className="text-neuro-orange">{city}</span>
      {after}
    </>
  );
}

// DoctorCityCard moved to CityDoctorCard.tsx (client component) to support onClick handlers
