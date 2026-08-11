import Link from "next/link";
import { MapPin, Phone, Globe, Check, ArrowRight, Search, Users, Star, ShieldCheck } from "lucide-react";
import { getDoctorsByLocation, getDoctorsByState } from "../actions";
import type { Metadata } from "next";

// State abbreviation mapping
const STATE_NAMES: Record<string, string> = {
  al: "Alabama", ak: "Alaska", az: "Arizona", ar: "Arkansas", ca: "California",
  co: "Colorado", ct: "Connecticut", de: "Delaware", fl: "Florida", ga: "Georgia",
  hi: "Hawaii", id: "Idaho", il: "Illinois", in: "Indiana", ia: "Iowa",
  ks: "Kansas", ky: "Kentucky", la: "Louisiana", me: "Maine", md: "Maryland",
  ma: "Massachusetts", mi: "Michigan", mn: "Minnesota", ms: "Mississippi", mo: "Missouri",
  mt: "Montana", ne: "Nebraska", nv: "Nevada", nh: "New Hampshire", nj: "New Jersey",
  nm: "New Mexico", ny: "New York", nc: "North Carolina", nd: "North Dakota", oh: "Ohio",
  ok: "Oklahoma", or: "Oregon", pa: "Pennsylvania", ri: "Rhode Island", sc: "South Carolina",
  sd: "South Dakota", tn: "Tennessee", tx: "Texas", ut: "Utah", vt: "Vermont",
  va: "Virginia", wa: "Washington", wv: "West Virginia", wi: "Wisconsin", wy: "Wyoming",
  // Full names map to themselves
  texas: "Texas", georgia: "Georgia", florida: "Florida", california: "California",
  arizona: "Arizona", colorado: "Colorado", mississippi: "Mississippi", oklahoma: "Oklahoma",
  "north carolina": "North Carolina", "south carolina": "South Carolina",
  "new jersey": "New Jersey", "new york": "New York", washington: "Washington",
  pennsylvania: "Pennsylvania", illinois: "Illinois", alabama: "Alabama",
  arkansas: "Arkansas", oregon: "Oregon", indiana: "Indiana",
};

function titleCase(str: string): string {
  return str.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function parseSlug(slug: string[]): { city: string | null; state: string } {
  const combined = slug.join("-").toLowerCase();

  // First: check if the entire slug is a known state name (e.g., "texas", "new-york")
  if (STATE_NAMES[combined]) {
    return { city: null, state: STATE_NAMES[combined] };
  }

  // Second: try to find a state name at the END of the slug
  // Sort by length descending so "north-carolina" matches before "carolina"
  const stateEntries = Object.entries(STATE_NAMES).sort((a, b) => b[0].length - a[0].length);
  for (const [key, name] of stateEntries) {
    const stateSlug = key.replace(/ /g, "-");
    if (combined.endsWith(`-${stateSlug}`)) {
      const cityPart = combined.slice(0, -(stateSlug.length + 1));
      if (cityPart) {
        return { city: titleCase(cityPart), state: name };
      }
    }
  }

  // Third: if single segment with no state match, treat as state
  if (slug.length === 1) {
    return { city: null, state: titleCase(slug[0]) };
  }

  // Fallback: last segment is state, rest is city
  const state = titleCase(slug[slug.length - 1]);
  const city = slug.slice(0, -1).map(s => titleCase(s)).join(" ");
  return { city: city || null, state };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const { city, state } = parseSlug(slug);
  const location = city ? `${city}, ${state}` : state;

  return {
    title: `Nervous System Chiropractors in ${location} | NeuroChiro`,
    description: `Find verified nervous system chiropractors in ${location}. Browse profiles, read bios, and book appointments with specialists who focus on your nervous system health.`,
    openGraph: {
      title: `Nervous System Chiropractors in ${location}`,
      description: `Find verified nervous system chiropractors in ${location}. The only directory built for nervous system specialists.`,
    },
  };
}

export default async function CityPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const { city, state } = parseSlug(slug);
  const location = city ? `${city}, ${state}` : state;

  const doctors = city
    ? await getDoctorsByLocation(city, state)
    : await getDoctorsByState(state);

  return (
    <div className="min-h-dvh bg-neuro-cream">
      {/* Hero */}
      <div className="bg-neuro-navy py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-neuro-orange" />
            <span className="text-neuro-orange text-sm font-bold uppercase tracking-widest">{location}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-black text-white leading-tight">
            Nervous System Chiropractors in <span className="text-neuro-orange">{location}</span>
          </h1>
          <p className="text-white/50 mt-4 max-w-xl mx-auto">
            {doctors.length > 0
              ? `${doctors.length} verified nervous system ${doctors.length === 1 ? "chiropractor" : "chiropractors"} in ${location}. Browse profiles and find the right doctor for you.`
              : `We're growing our network in ${location}. Check back soon or search the full directory.`}
          </p>
          {doctors.length > 0 && (
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="text-center">
                <div className="text-2xl font-black text-white">{doctors.length}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest">Doctors</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-2xl font-black text-neuro-orange">{doctors.reduce((sum: number, d: any) => sum + (d.profile_views || 0), 0).toLocaleString()}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest">Patient Searches</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Doctor Cards */}
        {doctors.length > 0 ? (
          <div className="space-y-4 mb-12">
            {doctors.map((doc: any) => (
              <Link key={doc.id} href={`/directory/${doc.slug}`}>
                <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-neuro-orange/20 transition-all cursor-pointer flex gap-5 items-start">
                  {/* Photo */}
                  <div className="w-20 h-20 rounded-2xl bg-gray-100 flex-shrink-0 overflow-hidden">
                    {doc.photo_url ? (
                      <img src={doc.photo_url} alt={`Dr. ${doc.first_name} ${doc.last_name}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl font-black">
                        {(doc.first_name?.[0] || "")}{(doc.last_name?.[0] || "")}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-heading font-black text-neuro-navy text-lg">Dr. {doc.first_name} {doc.last_name}</h2>
                      <ShieldCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    </div>
                    {doc.clinic_name && (
                      <p className="text-sm text-gray-500 font-medium">{doc.clinic_name}</p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                      <MapPin className="w-3 h-3" />
                      <span>{doc.city}, {doc.state}</span>
                    </div>
                    {doc.bio && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">{doc.bio}</p>
                    )}
                    {doc.specialties && doc.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {doc.specialties.slice(0, 4).map((s: string) => (
                          <span key={s} className="px-2 py-0.5 bg-neuro-orange/10 text-neuro-orange text-[10px] font-bold rounded-full uppercase">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 self-center">
                    <div className="px-4 py-2 bg-neuro-orange/10 text-neuro-orange text-xs font-bold rounded-lg">
                      View Profile <ArrowRight className="w-3 h-3 inline ml-1" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-heading font-black text-neuro-navy mb-2">No Doctors Listed in {location} Yet</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">We're growing our network every week. Search the full directory to find a nervous system chiropractor near you.</p>
            <Link href="/directory" className="inline-flex items-center gap-2 px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors">
              <Search className="w-4 h-4" /> Search Full Directory
            </Link>
          </div>
        )}

        {/* What Is Nervous System Chiropractic */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-8">
          <h2 className="text-xl font-heading font-black text-neuro-navy mb-4">
            What Is Nervous System Chiropractic?
          </h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>Nervous system chiropractic is a specialized approach that focuses on the relationship between your spine and your nervous system. Unlike traditional chiropractic that primarily addresses pain and joint mobility, nervous system chiropractors use advanced scanning technology to measure how well your brain communicates with your body.</p>
            <p>Doctors in {location} who practice nervous system chiropractic typically use tools like INSiGHT scanning, HRV (Heart Rate Variability) monitoring, and surface EMG to assess your nervous system function. This data-driven approach helps create personalized care plans based on your unique neurology.</p>
            <p>Patients often report improvements in sleep quality, stress resilience, energy levels, digestion, and immune function, in addition to pain relief. The focus is on optimizing how your body functions, not just eliminating symptoms.</p>
          </div>
        </div>

        {/* What to Expect */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-8">
          <h2 className="text-xl font-heading font-black text-neuro-navy mb-4">
            What to Expect at Your First Visit
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-neuro-cream rounded-xl p-5">
              <div className="text-2xl font-black text-neuro-orange mb-2">1</div>
              <h3 className="font-bold text-neuro-navy text-sm mb-1">Consultation</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Your doctor will listen to your health history, concerns, and goals. They want to understand what brought you in and what you want to achieve.</p>
            </div>
            <div className="bg-neuro-cream rounded-xl p-5">
              <div className="text-2xl font-black text-neuro-orange mb-2">2</div>
              <h3 className="font-bold text-neuro-navy text-sm mb-1">Nervous System Scan</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Using advanced scanning technology, your doctor measures your nervous system function. This is painless and takes about 10 minutes. The results show exactly where your body is stressed.</p>
            </div>
            <div className="bg-neuro-cream rounded-xl p-5">
              <div className="text-2xl font-black text-neuro-orange mb-2">3</div>
              <h3 className="font-bold text-neuro-navy text-sm mb-1">Your Care Plan</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Based on your scan results and consultation, your doctor creates a personalized plan designed to restore proper nervous system function and help you reach your health goals.</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-8">
          <h2 className="text-xl font-heading font-black text-neuro-navy mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              { q: `How do I find a nervous system chiropractor in ${city || location}?`, a: `Browse the doctors listed above, or use the NeuroChiro directory search to filter by city, specialty, and availability. Every doctor on NeuroChiro is verified as a nervous system chiropractor.` },
              { q: "Is nervous system chiropractic different from regular chiropractic?", a: "Yes. While traditional chiropractic focuses on pain and joint mobility, nervous system chiropractic uses advanced scanning to measure and optimize how your brain communicates with your body. The goal is improved function, not just pain relief." },
              { q: "Does insurance cover nervous system chiropractic?", a: "Many insurance plans cover chiropractic care, including nervous system approaches. Coverage varies by plan. Contact the doctor's office directly to verify your benefits before your first visit." },
              { q: "How many visits will I need?", a: "Every patient is different. Your doctor will recommend a care plan based on your scan results and health goals. Some patients notice improvement within a few visits, while others benefit from longer-term corrective care." },
            ].map((faq, i) => (
              <div key={i}>
                <h3 className="font-bold text-neuro-navy text-sm">{faq.q}</h3>
                <p className="text-gray-500 text-sm mt-1 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-neuro-navy rounded-2xl p-8 text-center">
          <h2 className="text-xl font-heading font-black text-white mb-3">Are You a Nervous System Chiropractor in {location}?</h2>
          <p className="text-white/50 text-sm mb-6">Join the directory and get found by patients searching for your specialty.</p>
          <Link href="/get-started" className="inline-flex items-center gap-2 px-8 py-4 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors">
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-white/30 text-xs mt-3">$99/mo. Cancel anytime.</p>
        </div>
      </div>
    </div>
  );
}
