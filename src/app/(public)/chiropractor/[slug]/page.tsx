import Link from "next/link";
import { MapPin, Phone, ArrowRight, ShieldCheck, Calendar, Navigation, Clock, CheckCircle, AlertCircle } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { slugToCity, EMPTY_METROS, STATE_NAMES } from "@/lib/city-data";
import { getDoctorsNearCity, getNearestDoctors, getNearbyCityPages, type CityDoctor } from "../actions";
import { formatDistance } from "@/lib/geo";
import Footer from "@/components/landing/Footer";
import FindSomeoneForm from "./FindSomeoneForm";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const parsed = slugToCity(slug);
  if (!parsed) return {};
  const { city, state } = parsed;
  const stateName = STATE_NAMES[state] || state;
  const location = `${city}, ${stateName}`;

  return {
    title: `Nervous System Chiropractor in ${location} | NeuroChiro`,
    description: `Find a nervous system chiropractor near ${location}. Browse verified doctors who focus on your nervous system, not just pain. Book online or call today.`,
    openGraph: {
      title: `Nervous System Chiropractor in ${location}`,
      description: `Find a nervous system chiropractor near ${location}. Verified doctors, real profiles, book directly.`,
      url: `https://neurochiro.co/chiropractor/${slug}`,
    },
    alternates: {
      canonical: `https://neurochiro.co/chiropractor/${slug}`,
    },
  };
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const parsed = slugToCity(slug);
  if (!parsed) notFound();
  const { city, state } = parsed;
  const stateName = STATE_NAMES[state] || state;
  const location = `${city}, ${stateName}`;

  // Find city coordinates from empty metros or geocode
  const emptyMetro = EMPTY_METROS.find(m => m.slug === slug);
  let lat = emptyMetro?.lat || 0;
  let lng = emptyMetro?.lng || 0;

  // If not in empty metros, get coords from the first doctor in this city
  if (!lat || !lng) {
    const { createAdminClient } = await import('@/lib/supabase-admin');
    const supabase = createAdminClient();
    const { data: cityDoc } = await (supabase as any)
      .from('doctors')
      .select('latitude, longitude')
      .eq('verification_status', 'verified')
      .eq('country', 'US')
      .ilike('city', city)
      .eq('state', state)
      .gt('latitude', 0)
      .limit(1)
      .maybeSingle();
    if (cityDoc) {
      lat = cityDoc.latitude;
      lng = cityDoc.longitude;
    }
  }

  // If still no coordinates, try geocoding
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
    name: `Nervous System Chiropractor in ${location}`,
    url: `https://neurochiro.co/chiropractor/${slug}`,
    description: `Find a nervous system chiropractor near ${location}.`,
    about: { '@type': 'MedicalSpecialty', name: 'Chiropractic' },
  };

  const doctorJsonLd = nearbyDoctors.map(doc => {
    const ld: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': ['LocalBusiness', 'Physician'],
      name: doc.clinic_name || `Dr. ${doc.first_name} ${doc.last_name}`,
      url: `https://neurochiro.co/directory/${doc.slug}`,
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
            {hasLocalDoctors
              ? <>Find a Nervous System Chiropractor in <span className="text-neuro-orange">{city}</span></>
              : <>No Nervous System Chiropractor in <span className="text-neuro-orange">{city}</span> Yet</>
            }
          </h1>
          <p className="text-white/50 max-w-xl mx-auto">
            {hasLocalDoctors
              ? `${nearbyDoctors.length} verified ${nearbyDoctors.length === 1 ? 'doctor' : 'doctors'} within 30 miles of ${city}. Every doctor on NeuroChiro focuses on your nervous system, not just pain.`
              : `We're growing the network in ${stateName}. Here's what you can do right now.`
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
                <DoctorCityCard key={doc.id} doc={doc} searchCity={city} />
              ))}
            </div>
          </>
        ) : (
          <>
            {/* No doctors — the strongest page on the site */}

            {/* 1. Nearest doctors with real distances */}
            {nearestDoctors.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xl font-heading font-black text-neuro-navy mb-2">Nearest Doctors to {city}</h2>
                <p className="text-gray-500 text-sm mb-4">These are the closest nervous system chiropractors we have right now.</p>
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
                          <span className="text-neuro-orange font-bold text-sm">{formatDistance(doc.distance_miles)}</span>
                          <p className="text-[10px] text-gray-400">from {city}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Patient waitlist signup */}
            <div className="bg-neuro-navy rounded-2xl p-8 mb-10">
              <h2 className="text-lg font-heading font-black text-white mb-2">Get notified when a doctor joins {city}</h2>
              <p className="text-white/50 text-sm mb-4">
                Join the patient list. We'll email you the moment a nervous system chiropractor joins near your area.
              </p>
              <Link
                href={`/list?source=city_page&zip=`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors text-sm min-h-[44px]"
              >
                Join the Waitlist <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 3. Help me find someone */}
            <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-10">
              <h2 className="text-lg font-heading font-black text-neuro-navy mb-2">Let me help you find someone</h2>
              <p className="text-gray-500 text-sm mb-4">
                I know chiropractors who aren't on the directory yet. Tell me where you are and I'll personally look into whether I can make an introduction.
              </p>
              <FindSomeoneForm city={city} state={state} />
            </div>
          </>
        )}

        {/* What is nervous system chiropractic */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-8">
          <h2 className="text-xl font-heading font-black text-neuro-navy mb-4">
            What Is Nervous System Chiropractic?
          </h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>Your brain and spinal cord control every function in your body. A nervous system chiropractor focuses on how well that system is communicating, not just whether something hurts.</p>
            <p>Doctors in the NeuroChiro directory use specific adjustments to reduce interference in your nervous system. The goal is better function across everything your body does: sleep, digestion, immune response, stress recovery, and yes, pain.</p>
            <p>This is different from a chiropractor who only addresses the spot that hurts. It's a whole-body approach, and the results patients report go well beyond pain relief.</p>
          </div>
        </div>

        {/* What to expect */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-8">
          <h2 className="text-xl font-heading font-black text-neuro-navy mb-4">
            What to Expect at Your First Visit
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { n: '1', title: 'Consultation', desc: 'Your doctor listens to your health history, your concerns, and what you want to achieve. No rushing.' },
              { n: '2', title: 'Examination', desc: 'A thorough check of your spine and nervous system. Many doctors use scanning technology to show you exactly where your body is stressed.' },
              { n: '3', title: 'Your plan', desc: 'Based on the findings, your doctor explains what they found and recommends a care plan specific to you.' },
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
            Questions People Ask
          </h2>
          <div className="space-y-4">
            {[
              { q: `How do I find a nervous system chiropractor near ${city}?`, a: `Browse the doctors listed on this page, or search the full NeuroChiro directory. Every doctor listed has been reviewed and focuses on nervous system care.` },
              { q: 'Do I need a referral?', a: 'No. You can contact any doctor on this page directly. Most accept new patients without a referral.' },
              { q: 'Does insurance cover this?', a: 'Many insurance plans cover chiropractic. Coverage varies by plan and provider. Contact the office directly to verify your benefits before your first visit.' },
              { q: 'Is this different from regular chiropractic?', a: 'Yes. Nervous system chiropractors focus on how your brain communicates with your body through the spine. The goal is better overall function, not just pain relief.' },
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
          <h2 className="text-xl font-heading font-black text-white mb-3">Are You a Chiropractor in {city}?</h2>
          <p className="text-white/50 text-sm mb-6">Join NeuroChiro and get found by patients searching for nervous system care in your area.</p>
          <Link href={`/pro?source=city_page_${slug}`} className="inline-flex items-center gap-2 px-8 py-4 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors">
            Learn More <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Also serving — internal links to nearby city pages */}
      {nearbyCities.length > 0 && (
        <section className="bg-neuro-cream border-t border-gray-200 py-10 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Also Serving Nearby</h2>
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

function DoctorCityCard({ doc, searchCity }: { doc: CityDoctor; searchCity: string }) {
  const name = `Dr. ${doc.first_name} ${doc.last_name}`;
  const isInCity = doc.city.toLowerCase() === searchCity.toLowerCase();
  const distLabel = isInCity
    ? formatDistance(doc.distance_miles)
    : `${formatDistance(doc.distance_miles)} from ${searchCity}`;

  const dirParts = [doc.city, doc.state].filter(Boolean);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dirParts.join(', '))}`;

  // Normalize specialties
  const specialties = (doc.specialties || [])
    .flatMap((s: string) => s.split(/\n/).map(t => t.trim()))
    .filter((s: string) => s.length > 0 && s.length <= 45)
    .slice(0, 3);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-all">
      <div className="flex gap-5 items-start">
        {/* Photo */}
        <div className="w-16 h-16 rounded-2xl bg-neuro-navy flex-shrink-0 overflow-hidden flex items-center justify-center">
          {doc.photo_url ? (
            <img src={doc.photo_url} alt={name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <span className="text-white font-black text-xl">{doc.first_name?.[0]}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="font-heading font-black text-neuro-navy text-lg">{name}</h2>
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-bold rounded-md border border-blue-200">
              <ShieldCheck className="w-3 h-3" /> Verified
            </span>
          </div>
          {doc.clinic_name && <p className="text-sm text-gray-500 font-medium">{doc.clinic_name}</p>}
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="w-3 h-3" /> {doc.city}, {doc.state}
            </span>
            <span className="text-xs text-neuro-orange font-bold">{distLabel}</span>
            {doc.accepting_new_patients && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                <CheckCircle className="w-3 h-3" /> Accepting patients
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bio excerpt */}
      {doc.bio && (
        <p className="text-sm text-gray-500 mt-3 line-clamp-2 leading-relaxed">{doc.bio}</p>
      )}

      {/* Specialties */}
      {specialties.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {specialties.map((s: string, i: number) => (
            <span key={i} className="px-2.5 py-1 bg-neuro-orange/5 text-neuro-orange text-[10px] font-bold rounded-lg border border-neuro-orange/10">
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Quick info */}
      <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-400">
        {doc.offers_telehealth && <span>Telehealth available</span>}
        {doc.accepts_walkins && <span>Walk-ins welcome</span>}
        {doc.accepted_payment?.includes('HSA/FSA') && <span>HSA/FSA accepted</span>}
      </div>

      {/* Actions — Book primary */}
      <div className="flex gap-2 mt-4">
        {doc.booking_url ? (
          <a
            href={doc.booking_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 bg-neuro-orange text-white rounded-xl hover:bg-neuro-orange/90 transition-colors flex items-center justify-center gap-2 text-xs font-bold min-h-[44px]"
            aria-label={`Book online with ${name}`}
          >
            <Calendar className="w-3.5 h-3.5" /> Book Online
          </a>
        ) : (
          <Link href={`/directory/${doc.slug}`} className="flex-1">
            <div className="w-full py-3 bg-neuro-navy text-white rounded-xl hover:bg-neuro-navy/90 transition-colors flex items-center justify-center gap-2 text-xs font-bold min-h-[44px]">
              View Profile <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        )}
        {doc.phone && (
          <a
            href={`tel:${doc.phone}`}
            className="py-3 px-4 bg-neuro-navy/10 text-neuro-navy rounded-xl hover:bg-neuro-navy/20 transition-colors flex items-center justify-center gap-1.5 text-xs font-bold min-h-[44px]"
            aria-label={`Call ${name}`}
          >
            <Phone className="w-3.5 h-3.5" /> Call
          </a>
        )}
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="py-3 px-4 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5 text-xs font-bold min-h-[44px]"
          aria-label={`Get directions to ${name}`}
        >
          <Navigation className="w-3.5 h-3.5" /> Map
        </a>
        {doc.booking_url && (
          <Link href={`/directory/${doc.slug}`}>
            <div className="py-3 px-3 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center text-xs font-bold min-h-[44px]">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
