"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Calendar, MapPin, ArrowLeft, Loader2, ExternalLink, Users, Globe } from "lucide-react";
import Link from "next/link";
import { getSeminarById, incrementSeminarStats } from "../actions";
import Footer from "@/components/landing/Footer";

export default function SeminarDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [seminar, setSeminar] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getSeminarById(id);
      setSeminar(data);
      setLoading(false);
      if (id) incrementSeminarStats(id, "page_views").catch(() => {});
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-neuro-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neuro-orange" />
      </div>
    );
  }

  if (!seminar) {
    return (
      <div className="min-h-dvh bg-neuro-cream flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-black text-neuro-navy mb-4">Event Not Found</h1>
        <p className="text-gray-500 mb-6">This seminar doesn&apos;t exist or has been removed.</p>
        <Link href="/seminars" className="px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl">
          Back to Seminars
        </Link>
      </div>
    );
  }

  const location = [seminar.location, seminar.city, seminar.country].filter(Boolean).join(", ");

  return (
    <div className="min-h-dvh bg-neuro-cream">
      {/* Hero */}
      <section className="bg-neuro-navy text-white pt-28 pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          <Link href="/seminars" className="text-xs text-gray-400 hover:text-white transition-colors mb-6 inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> All Seminars
          </Link>

          {/* Date + Location */}
          <div className="flex flex-wrap items-center gap-3 mb-4 mt-4">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
              <Calendar className="w-4 h-4 text-neuro-orange" />
              <span className="text-sm font-bold">{seminar.dates}</span>
            </div>
            {location && (
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
                <MapPin className="w-4 h-4 text-neuro-orange" />
                <span className="text-sm font-bold">{location}</span>
              </div>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-heading font-black text-white mb-4">
            {seminar.title}
          </h1>

          {seminar.instructor_name && (
            <p className="text-gray-400">Hosted by {seminar.host_doctor ? (
              <Link href={`/directory/${seminar.host_doctor.slug}`} className="text-white font-bold hover:text-neuro-orange transition-colors underline underline-offset-2">
                {seminar.instructor_name}
              </Link>
            ) : (
              <span className="text-white font-bold">{seminar.instructor_name}</span>
            )}</p>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="max-w-3xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {seminar.description && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <h2 className="text-lg font-black text-neuro-navy mb-4">About This Event</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{seminar.description}</p>
              </div>
            )}

            {/* Instructor Bio */}
            {seminar.instructor_bio && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <h2 className="text-lg font-black text-neuro-navy mb-4">About the Host</h2>
                <p className="text-gray-600 leading-relaxed italic">{seminar.instructor_bio}</p>
              </div>
            )}

            {/* Tags */}
            {seminar.tags && seminar.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {seminar.tags.map((tag: string, i: number) => (
                  <span key={i} className="px-3 py-1.5 bg-neuro-orange/5 text-neuro-orange text-xs font-bold rounded-lg border border-neuro-orange/10">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24 space-y-5">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Event Details</h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-neuro-orange mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-neuro-navy text-sm">{seminar.dates}</p>
                    {(seminar.start_time || seminar.end_time) && (
                      <p className="text-xs text-gray-400">{seminar.start_time} — {seminar.end_time}</p>
                    )}
                  </div>
                </div>

                {location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-neuro-orange mt-0.5 flex-shrink-0" />
                    <p className="font-bold text-neuro-navy text-sm">{location}</p>
                  </div>
                )}

                {seminar.price != null && (
                  <div className="pt-3 border-t border-gray-100">
                    {seminar.price > 0 ? (
                      <p className="text-2xl font-black text-neuro-navy">${seminar.price} <span className="text-sm font-normal text-gray-400">per person</span></p>
                    ) : (
                      <p className="text-2xl font-black text-green-600">Free</p>
                    )}
                  </div>
                )}
              </div>

              {seminar.registration_link && (
                <a
                  href={seminar.registration_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => incrementSeminarStats(id, "clicks").catch(() => {})}
                  className="w-full py-4 bg-neuro-orange text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-neuro-orange/90 transition-colors"
                >
                  Register Now <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
