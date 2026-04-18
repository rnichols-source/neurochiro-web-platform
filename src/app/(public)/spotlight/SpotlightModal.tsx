"use client";

import { useState } from "react";
import { X, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { SpotlightEpisode } from "./spotlight-data";

interface SpotlightModalProps {
  episode: SpotlightEpisode;
  children: React.ReactNode;
}

export default function SpotlightModal({ episode, children }: SpotlightModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{children}</div>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="fixed inset-4 md:inset-8 lg:inset-16 z-[501] flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-full overflow-y-auto">
              {/* Close */}
              <div className="flex justify-end p-4 pb-0">
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Video */}
              <div className="px-4 md:px-6">
                <div className="rounded-xl overflow-hidden bg-black">
                  <div className="aspect-video">
                    <iframe
                      src={episode.videoUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={`NeuroChiro Spotlight EP ${String(episode.episodeNumber).padStart(2, "0")} — ${episode.doctorName}`}
                    />
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 md:p-6">
                <span className="inline-block bg-neuro-orange/10 text-neuro-orange text-xs font-black px-3 py-1 rounded-full mb-3">
                  EP {String(episode.episodeNumber).padStart(2, "0")}
                </span>
                <h3 className="text-2xl font-black text-neuro-navy mb-1">
                  {episode.doctorName}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {episode.clinicName} &middot; {episode.city},{" "}
                  {episode.state}
                </p>
                <blockquote className="text-gray-600 italic text-lg border-l-4 border-neuro-orange pl-4 mb-4">
                  &ldquo;{episode.quote}&rdquo;
                </blockquote>
                <p className="text-gray-500 leading-relaxed mb-6">
                  {episode.description}
                </p>

                <Link
                  href={`/directory/${episode.doctorSlug}`}
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-neuro-navy text-white font-bold rounded-xl hover:bg-neuro-navy/90 transition-colors"
                >
                  Find {episode.doctorName} on NeuroChiro{" "}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
