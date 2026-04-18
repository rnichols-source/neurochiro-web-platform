import Link from "next/link";
import Image from "next/image";
import { Search, ArrowRight, MapPin, ShieldCheck, Globe, Users, Play } from "lucide-react";
import { createAdminClient } from "@/lib/supabase-admin";
import Footer from "@/components/landing/Footer";
import WhoIsItFor from "@/components/landing/WhoIsItFor";
import Testimonials from "@/components/landing/Testimonials";
import SocialProof from "@/components/landing/SocialProof";
import DoctorValueProp from "@/components/landing/DoctorValueProp";
import EmailCaptureBanner from "@/components/landing/EmailCaptureBanner";
import { spotlightEpisodes } from "./spotlight/spotlight-data";

export const metadata = {
  title: "NeuroChiro | Find a Nervous System Chiropractor",
  description: "The global directory for nervous system chiropractors. Find verified specialists, track your health, and connect with the chiropractic community.",
};

export const revalidate = 300; // Cache for 5 minutes

async function getFeaturedDoctors() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('doctors')
      .select('first_name, last_name, clinic_name, city, state, slug, photo_url')
      .eq('verification_status', 'verified')
      .order('profile_views', { ascending: false })
      .limit(3);
    return data || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featured = await getFeaturedDoctors();

  return (
    <div className="min-h-dvh bg-neuro-cream">
      {/* Hero */}
      <section className="bg-neuro-navy text-white pt-40 md:pt-48 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight leading-tight mb-4 text-white">
            Find a Nervous System<br />
            <span className="text-neuro-orange">Chiropractor</span>
          </h1>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            The global directory for doctors who put your nervous system first.
          </p>

          {/* Search Bar */}
          <form action="/directory" method="GET" className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                name="location"
                type="text"
                placeholder="City, state, or doctor name..."
                className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-neuro-orange"
              />
            </div>
            <button type="submit" className="px-8 py-4 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors">
              Search
            </button>
          </form>
        </div>

        {/* Trust Stats — Dynamic */}
        <SocialProof doctorCount={featured.length > 0 ? undefined : 0} />
      </section>

      {/* Featured Doctors */}
      {featured.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-heading font-black text-neuro-navy text-center mb-10">Featured Specialists</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featured.map((doc) => (
              <Link
                key={doc.slug}
                href={`/directory/${doc.slug}`}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-gray-200 transition-all group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-neuro-navy/5 flex items-center justify-center text-neuro-navy font-black text-lg overflow-hidden relative">
                    {doc.photo_url ? (
                      <Image src={doc.photo_url} alt={`Dr. ${doc.first_name} ${doc.last_name}`} fill className="object-cover" />
                    ) : (
                      <>{doc.first_name?.[0]}{doc.last_name?.[0]}</>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-neuro-navy">Dr. {doc.first_name} {doc.last_name}</p>
                    <p className="text-gray-500 text-sm">{doc.clinic_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-gray-400 text-sm">
                  <MapPin className="w-3 h-3" />
                  <span>{doc.city}{doc.state ? `, ${doc.state}` : ''}</span>
                </div>
                <p className="text-neuro-orange text-sm font-bold mt-3 group-hover:gap-2 flex items-center gap-1 transition-all">
                  View Profile <ArrowRight className="w-4 h-4" />
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* NeuroChiro Spotlight */}
      <section className="bg-white py-16 px-6 border-b border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-neuro-orange text-xs font-black uppercase tracking-[0.2em] mb-2">Live Interviews</p>
            <h2 className="text-2xl font-heading font-black text-neuro-navy mb-2">The NeuroChiro Spotlight</h2>
            <p className="text-gray-500 text-sm">Watch real doctors share their stories</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {spotlightEpisodes.slice(0, 3).map((episode) => (
              <Link
                key={episode.id}
                href="/spotlight"
                className="bg-neuro-cream rounded-2xl overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group"
              >
                <div className="relative aspect-video bg-gray-200 overflow-hidden">
                  <Image
                    src={episode.thumbnail}
                    alt={episode.doctorName}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-neuro-orange flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 text-white ml-0.5" />
                    </div>
                  </div>
                  <span className="absolute top-2 left-2 bg-neuro-navy/90 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                    EP {String(episode.episodeNumber).padStart(2, "0")}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-neuro-navy text-sm mb-1">{episode.doctorName}</h3>
                  <p className="text-gray-500 text-xs italic line-clamp-2 mb-2">&ldquo;{episode.quote}&rdquo;</p>
                  <span className="text-neuro-orange text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                    Watch <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/spotlight" className="inline-flex items-center gap-2 text-neuro-orange font-bold text-sm hover:underline">
              See All Episodes <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-heading font-black text-neuro-navy mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Search", desc: "Find a verified nervous system chiropractor by location or specialty." },
              { step: "2", title: "Choose", desc: "Review profiles, read patient stories, and check credentials." },
              { step: "3", title: "Book", desc: "Contact the doctor directly or book through their office." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-neuro-orange/10 text-neuro-orange font-black text-lg flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-neuro-navy mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* For Everyone — client component for region-aware pricing */}
      <WhoIsItFor />

      {/* Doctor Value Prop */}
      <DoctorValueProp />

      {/* Email Capture for Non-Account Patients */}
      <EmailCaptureBanner />

      {/* Doctor CTA */}
      <section className="bg-neuro-navy py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-heading font-black text-white mb-4">Are you a chiropractor?</h2>
          <p className="text-gray-400 mb-8">Join the global network of nervous system specialists. Get your verified listing, connect with students, and grow your practice.</p>
          <Link href="/pricing/doctors" className="inline-flex items-center gap-2 px-8 py-4 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors">
            Join the Network <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
