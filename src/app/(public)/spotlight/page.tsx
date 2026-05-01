import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Play, MapPin } from "lucide-react";
import Footer from "@/components/landing/Footer";
import { spotlightEpisodes, getLatestEpisode } from "./spotlight-data";
import SpotlightModal from "./SpotlightModal";

export const metadata = {
  title: "The NeuroChiro Spotlight | Doctor Interviews",
  description:
    "Watch real nervous system chiropractors share their stories, patient transformations, and what makes their practice different.",
};

export default function SpotlightPage() {
  const featured = getLatestEpisode();
  const otherEpisodes = spotlightEpisodes.filter((ep) => ep.id !== featured.id);

  return (
    <div className="min-h-dvh bg-neuro-cream">
      {/* Hero — Dark Cinematic */}
      <section className="bg-neuro-navy pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto text-center mb-10">
          <p className="text-neuro-orange text-sm font-black uppercase tracking-[0.2em] mb-3">
            Live Interviews
          </p>
          <h1 className="text-4xl md:text-5xl font-heading font-black text-white leading-tight mb-4">
            The NeuroChiro{" "}
            <span className="text-neuro-orange">Spotlight</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Real doctors. Real stories. Real results. Meet the nervous system
            chiropractors changing healthcare.
          </p>
        </div>

        {/* Featured Episode — Large Embed */}
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
            <div className="aspect-video bg-black">
              <iframe
                src={featured.videoUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={`NeuroChiro Spotlight EP ${String(featured.episodeNumber).padStart(2, "0")} — ${featured.doctorName}`}
              />
            </div>
          </div>

          <div className="mt-6 text-center">
            <span className="inline-block bg-neuro-orange/20 text-neuro-orange text-xs font-black px-3 py-1 rounded-full mb-3">
              EP {String(featured.episodeNumber).padStart(2, "0")} — Latest
            </span>
            <h2 className="text-2xl font-black text-white mb-1">
              {featured.doctorName}
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              {featured.clinicName} &middot; {featured.city}, {featured.state}
            </p>
            <blockquote className="text-gray-300 italic text-lg max-w-2xl mx-auto leading-relaxed">
              &ldquo;{featured.quote}&rdquo;
            </blockquote>
            {featured.doctorSlug && (
            <div className="mt-5">
              <Link
                href={`/directory/${featured.doctorSlug}`}
                className="inline-flex items-center gap-2 text-neuro-orange font-bold text-sm hover:underline"
              >
                Find {featured.doctorName} on NeuroChiro{" "}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            )}
          </div>
        </div>
      </section>

      {/* Episode Grid */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-heading font-black text-neuro-navy text-center mb-10">
          All Episodes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spotlightEpisodes.map((episode) => (
            <SpotlightModal key={episode.id} episode={episode}>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-100 overflow-hidden">
                  <Image
                    src={episode.thumbnail}
                    alt={episode.doctorName}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 rounded-full bg-neuro-orange flex items-center justify-center shadow-lg">
                      <Play className="w-6 h-6 text-white ml-1" />
                    </div>
                  </div>
                  <span className="absolute top-3 left-3 bg-neuro-navy/90 text-white text-xs font-black px-2.5 py-1 rounded-lg">
                    EP {String(episode.episodeNumber).padStart(2, "0")}
                  </span>
                </div>

                {/* Card Content */}
                <div className="p-5">
                  <h3 className="font-black text-neuro-navy text-lg mb-1">
                    {episode.doctorName}
                  </h3>
                  <p className="text-gray-400 text-sm mb-3 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {episode.clinicName} &middot; {episode.city},{" "}
                    {episode.state}
                  </p>
                  <p className="text-gray-500 text-sm italic line-clamp-2 mb-4">
                    &ldquo;{episode.quote}&rdquo;
                  </p>
                  <span className="text-neuro-orange text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                    Watch Episode <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </SpotlightModal>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-neuro-navy py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-heading font-black text-white mb-3">
            Ready to Take the Next Step?
          </h2>
          <p className="text-gray-400 mb-8">
            Whether you are a patient looking for care or a doctor ready to
            share your story — we have got you covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/directory"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors"
            >
              Find a Doctor Near You <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/pricing/doctors"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-colors"
            >
              Are You a Doctor? Get Featured <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
