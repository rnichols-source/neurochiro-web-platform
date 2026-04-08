"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  ArrowLeft,
  Loader2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { getSeminarById, incrementSeminarStats } from "../actions";

export const dynamic = "force-dynamic";

export default function SeminarDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const [seminar, setSeminar] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getSeminarById(id);
      setSeminar(data);
      setLoading(false);
      if (id) incrementSeminarStats(id, "page_views");
    }
    load();
  }, [id]);

  const handleRegisterClick = () => {
    if (id) incrementSeminarStats(id, "clicks");
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#0B1118] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-neuro-orange mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
          Loading...
        </p>
      </div>
    );
  }

  if (!seminar) {
    return (
      <div className="min-h-dvh bg-[#0B1118] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-black text-white mb-4">Event Not Found</h1>
        <p className="text-gray-500 mb-8">
          The seminar you are looking for does not exist or has been removed.
        </p>
        <Link
          href="/seminars"
          className="px-10 py-4 bg-neuro-orange text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-neuro-orange-light transition-all shadow-xl"
        >
          Return to Seminars
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#0B1118] text-white">
      {/* Hero */}
      <section className="relative pt-32 pb-24 px-8 border-b border-white/5">
        {seminar.image_url && (
          <div className="absolute inset-0 z-0">
            <img
              loading="lazy"
              decoding="async"
              src={seminar.image_url}
              alt=""
              className="w-full h-full object-cover opacity-20 blur-sm scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0B1118] via-[#0B1118]/80 to-[#0B1118]" />
          </div>
        )}

        <div className="max-w-5xl mx-auto relative z-10 space-y-8">
          <Link
            href="/seminars"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-xs font-black uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" /> Back to All Seminars
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            {seminar.event_type && (
              <span className="px-4 py-1.5 bg-neuro-orange/10 border border-neuro-orange/20 text-neuro-orange text-[10px] font-black rounded-lg uppercase tracking-[0.2em]">
                {seminar.event_type}
              </span>
            )}
            {seminar.city && (
              <span className="px-4 py-1.5 bg-white/5 border border-white/10 text-gray-300 text-[10px] font-black rounded-lg uppercase tracking-[0.2em]">
                {seminar.city}, {seminar.country}
              </span>
            )}
          </div>

          <h1 className="text-5xl font-heading font-black tracking-tight leading-tight">
            {seminar.title}
          </h1>

          <div className="flex flex-wrap items-center gap-8 text-sm">
            {seminar.instructor_name && (
              <p className="text-gray-300">
                <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest block mb-1">
                  Instructor
                </span>
                {seminar.instructor_name}
              </p>
            )}
            {seminar.dates && (
              <p className="text-gray-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-neuro-orange" />
                {seminar.dates}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 px-8 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Description */}
        <div className="lg:col-span-2 space-y-8">
          {seminar.description && (
            <div className="space-y-4">
              <h2 className="text-2xl font-heading font-black">Overview</h2>
              <div className="text-lg text-gray-300 leading-relaxed whitespace-pre-wrap">
                {seminar.description}
              </div>
            </div>
          )}

          {seminar.instructor_bio && (
            <div className="space-y-4 pt-8 border-t border-white/10">
              <h2 className="text-2xl font-heading font-black">
                About the Instructor
              </h2>
              <p className="text-gray-400 leading-relaxed italic">
                {seminar.instructor_bio}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6 sticky top-32">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
              Event Details
            </h3>

            {(seminar.venue || seminar.city) && (
              <div className="flex items-start gap-4">
                <MapPin className="w-5 h-5 text-neuro-orange mt-0.5" />
                <div>
                  <p className="font-bold text-gray-200">
                    {seminar.venue || `${seminar.city}, ${seminar.country}`}
                  </p>
                  {seminar.venue && (
                    <p className="text-xs text-gray-500">
                      {seminar.city}, {seminar.country}
                    </p>
                  )}
                </div>
              </div>
            )}

            {(seminar.start_time || seminar.end_time) && (
              <div className="flex items-start gap-4">
                <Clock className="w-5 h-5 text-neuro-orange mt-0.5" />
                <p className="font-bold text-gray-200">
                  {seminar.start_time} — {seminar.end_time}
                </p>
              </div>
            )}

            {seminar.registration_link && (
              <a
                href={seminar.registration_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleRegisterClick}
                className="w-full py-5 bg-neuro-orange text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-neuro-orange-light transition-all shadow-xl flex items-center justify-center gap-3"
              >
                Register <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
