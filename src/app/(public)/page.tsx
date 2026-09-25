import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin, Play, Mail } from "lucide-react";
import { createAdminClient } from "@/lib/supabase-admin";
import Footer from "@/components/landing/Footer";
// LeadCaptureInline removed — homepage links to /list instead of duplicating capture
import { spotlightEpisodes } from "./spotlight/spotlight-data";
import HeroSearch from "@/components/landing/HeroSearch";

export const metadata = {
  title: "NeuroChiro | Find a Nervous System Chiropractor",
  description: "Find a nervous system chiropractor near you. Verified doctors who focus on how well your nervous system is communicating, not just whether something hurts.",
};

export const revalidate = 300;

async function getPlatformStats() {
  try {
    const supabase = createAdminClient();
    const { getDoctorCounts } = await import('@/lib/platform-stats');
    const [doctorCounts, seminars] = await Promise.all([
      getDoctorCounts(),
      supabase.from('seminars').select('id', { count: 'exact', head: true }).eq('is_approved', true).eq('is_past', false),
    ]);
    return {
      doctors: doctorCounts.active,
      seminars: seminars.count || 0,
      states: doctorCounts.statesCovered,
    };
  } catch {
    return { doctors: 0, seminars: 0, states: 0 };
  }
}

async function getRecentDoctors() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('doctors')
      .select('first_name, last_name, clinic_name, city, state, slug, photo_url, specialties, created_at')
      .eq('verification_status', 'verified')
      .not('latitude', 'eq', 0)
      .not('latitude', 'is', null)
      .order('created_at', { ascending: false })
      .limit(6);
    return data || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [recentDoctors, stats] = await Promise.all([getRecentDoctors(), getPlatformStats()]);

  return (
    <div className="min-h-dvh bg-neuro-cream">

      {/* 1. Hero with location search */}
      <section className="bg-neuro-navy text-white pt-36 md:pt-44 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight leading-tight mb-4 text-white">
            Find a Nervous System<br />
            <span className="text-neuro-orange">Chiropractor</span>
          </h1>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            Verified doctors who focus on your nervous system, not just pain.
          </p>

          <HeroSearch />

          {stats.doctors > 0 && (
            <div className="max-w-2xl mx-auto mt-12 flex items-center justify-center gap-8 md:gap-12">
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-black text-white">{stats.doctors}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Verified Doctors</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-black text-white">{stats.states}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">States</p>
              </div>
              {stats.seminars > 0 && (
                <>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center">
                    <p className="text-2xl md:text-3xl font-black text-white">{stats.seminars}</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Upcoming Events</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 2. What nervous system chiropractic is */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-heading font-black text-neuro-navy text-center mb-6">What Makes These Doctors Different</h2>
        <div className="space-y-4 text-gray-600 leading-relaxed">
          <p>Your brain and spinal cord control every function in your body. A nervous system chiropractor focuses on how well that system is communicating, not just whether something hurts.</p>
          <p>Doctors in the NeuroChiro directory use specific adjustments to reduce interference in your nervous system. The goal is better function across everything your body does: sleep, digestion, immune response, stress recovery, and pain.</p>
          <p>Every doctor listed here has been reviewed and verified. Their profiles show credentials, specialties, cost, availability, and what to expect on your first visit.</p>
        </div>
      </section>

      {/* 3. Recently joined doctors */}
      {recentDoctors.length > 0 && (
        <section className="bg-white py-16 px-6 border-y border-gray-100">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-heading font-black text-neuro-navy text-center mb-3">Recently Joined</h2>
            <p className="text-gray-500 text-sm text-center mb-10">The newest doctors in the NeuroChiro directory</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentDoctors.map((doc) => (
                <Link
                  key={doc.slug}
                  href={`/directory/${doc.slug}`}
                  className="bg-neuro-cream/50 rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-neuro-navy/5 flex items-center justify-center text-neuro-navy font-black text-sm overflow-hidden relative shrink-0">
                      {doc.photo_url ? (
                        <Image src={doc.photo_url} alt={`Dr. ${doc.first_name} ${doc.last_name}`} fill className="object-cover" />
                      ) : (
                        <span>{doc.first_name?.[0]}{doc.last_name?.[0]}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-neuro-navy text-sm truncate">Dr. {doc.first_name} {doc.last_name}</p>
                      <div className="flex items-center gap-1 text-gray-400 text-xs">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{doc.city}{doc.state ? `, ${doc.state}` : ''}</span>
                      </div>
                    </div>
                  </div>
                  {(doc.specialties || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(doc.specialties as string[]).slice(0, 2).map((s, i) => (
                        <span key={i} className="px-2 py-0.5 text-[10px] font-bold text-neuro-orange bg-neuro-orange/5 rounded-md border border-neuro-orange/10">{s}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-neuro-orange text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                    View Profile <ArrowRight className="w-3 h-3" />
                  </p>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/directory" className="inline-flex items-center gap-2 text-neuro-orange font-bold text-sm hover:underline">
                Browse All Doctors <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 4. How It Works */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-heading font-black text-neuro-navy mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Search", desc: "Enter your ZIP code or city to find verified nervous system chiropractors near you." },
              { step: "2", title: "Choose", desc: "Review credentials, specialties, cost, availability, and watch their Spotlight interview." },
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

      {/* 5. NeuroChiro Spotlight */}
      <section className="bg-white py-16 px-6 border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-neuro-orange text-xs font-black uppercase tracking-[0.2em] mb-2">Live Interviews</p>
            <h2 className="text-2xl font-heading font-black text-neuro-navy mb-2">The NeuroChiro Spotlight</h2>
            <p className="text-gray-500 text-sm">Watch real doctors share their stories</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...spotlightEpisodes].reverse().slice(0, 3).map((episode) => (
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

      {/* 6. Patient waitlist */}
      <section className="bg-neuro-cream py-12 px-6">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center">
          <h3 className="text-lg font-black text-neuro-navy mb-1">Can't find a doctor near you?</h3>
          <p className="text-sm text-gray-500 mb-6">Join the patient list. We'll email you the moment a nervous system chiropractor joins your area.</p>
          <Link
            href="/list?source=homepage"
            className="inline-flex items-center gap-2 px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors min-h-[48px]"
          >
            <Mail className="w-4 h-4" /> Join the Patient List
          </Link>
        </div>
      </section>

      {/* 7. One doctor CTA — links to /pro */}
      <section className="bg-neuro-navy py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-neuro-orange text-xs font-black uppercase tracking-[0.2em] mb-3">For Practitioners</p>
          <h2 className="text-2xl font-heading font-black text-white mb-4">Are you a nervous system chiropractor?</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Join {stats.doctors} verified doctors across {stats.states} states. Get a profile that shows patients exactly what you do and how to book.
          </p>
          <Link href="/pro?source=homepage_cta" className="inline-flex items-center gap-2 px-8 py-4 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors min-h-[48px]">
            See the Membership <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* 8. Footer */}
      <Footer />
    </div>
  );
}
