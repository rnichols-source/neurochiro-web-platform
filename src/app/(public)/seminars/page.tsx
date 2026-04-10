"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, MapPin, Users, ArrowRight, ExternalLink, Zap } from "lucide-react";
import { getSeminars } from "./actions";
import Footer from "@/components/landing/Footer";

export default function SeminarsPage() {
  const [seminars, setSeminars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSeminars({}).then((data) => {
      setSeminars(data || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-dvh bg-neuro-cream">
      {/* Hero */}
      <section className="bg-neuro-navy text-white pt-32 pb-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-10 w-60 h-60 bg-neuro-orange rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neuro-orange mb-3">Events &amp; Workshops</p>
          <h1 className="text-4xl md:text-5xl font-heading font-black mb-4 text-white">
            Upcoming <span className="text-neuro-orange">Seminars</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
            Learn from the best in nervous system chiropractic. Attend live events, workshops, and summits around the world.
          </p>
          <Link
            href="/host-a-seminar"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-colors text-sm"
          >
            Host Your Own Seminar <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Seminars List */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-neuro-orange border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : seminars.length > 0 ? (
          <div className="space-y-6">
            {seminars.map((seminar, i) => (
              <div
                key={seminar.id}
                className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-lg transition-all ${i === 0 ? 'border-neuro-orange' : 'border-gray-100'}`}
              >
                {/* Featured badge for first seminar */}
                {i === 0 && (
                  <div className="bg-neuro-orange px-4 py-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-white" />
                    <span className="text-white text-xs font-black uppercase tracking-widest">Featured Event</span>
                  </div>
                )}

                <div className="p-6 md:p-8">
                  {/* Date + Location Row */}
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center gap-2 bg-neuro-navy/5 px-3 py-1.5 rounded-lg">
                      <Calendar className="w-4 h-4 text-neuro-orange" />
                      <span className="text-sm font-bold text-neuro-navy">{seminar.dates}</span>
                    </div>
                    {(seminar.city || seminar.location) && (
                      <div className="flex items-center gap-2 bg-neuro-navy/5 px-3 py-1.5 rounded-lg">
                        <MapPin className="w-4 h-4 text-neuro-orange" />
                        <span className="text-sm font-bold text-neuro-navy">
                          {seminar.location ? `${seminar.location}, ` : ''}{seminar.city}{seminar.country ? `, ${seminar.country}` : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl md:text-3xl font-heading font-black text-neuro-navy mb-3">
                    {seminar.title}
                  </h2>

                  {/* Description */}
                  {seminar.description && (
                    <p className="text-gray-500 leading-relaxed mb-6 line-clamp-3">
                      {seminar.description}
                    </p>
                  )}

                  {/* Price + CTA */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      {seminar.price > 0 ? (
                        <p className="text-lg font-black text-neuro-navy">${seminar.price} <span className="text-sm font-normal text-gray-400">per person</span></p>
                      ) : (
                        <p className="text-lg font-black text-green-600">Free Event</p>
                      )}
                    </div>
                    <div className="flex gap-3">
                      {seminar.registration_link && (
                        <a
                          href={seminar.registration_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl text-sm hover:bg-neuro-orange/90 transition-colors flex items-center gap-2"
                        >
                          Register Now <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <Link
                        href={`/seminars/${seminar.id}`}
                        className="px-6 py-3 bg-gray-100 text-neuro-navy font-bold rounded-xl text-sm hover:bg-gray-200 transition-colors"
                      >
                        Learn More
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-neuro-navy mb-2">No upcoming seminars yet</h3>
            <p className="text-gray-400 text-sm mb-6">Be the first to host an event for the NeuroChiro community.</p>
            <Link href="/host-a-seminar" className="px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl text-sm inline-flex items-center gap-2">
              Host a Seminar <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>

      {/* Host CTA */}
      <section className="bg-neuro-navy py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-heading font-black text-white mb-4">Want to Host a Seminar?</h2>
          <p className="text-gray-400 mb-8">Share your expertise with the global nervous system chiropractic community. Members list seminars for free.</p>
          <Link href="/host-a-seminar" className="inline-flex items-center gap-2 px-8 py-4 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors">
            Get Started <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
