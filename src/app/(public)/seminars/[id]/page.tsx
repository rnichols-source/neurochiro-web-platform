"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  ArrowLeft, 
  Zap, 
  CheckCircle2, 
  Users, 
  ShieldCheck, 
  Globe,
  Loader2,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getSeminarById } from "../actions";

export default function SeminarDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [seminar, setSeminar] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getSeminarById(id);
      setSeminar(data);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1118] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-neuro-orange mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Syncing Event Intel...</p>
      </div>
    );
  }

  if (!seminar) {
    return (
      <div className="min-h-screen bg-[#0B1118] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">Event Not Found</h1>
        <p className="text-gray-500 mb-8 font-medium">The seminar you're looking for doesn't exist or has been moved.</p>
        <Link href="/seminars" className="px-10 py-4 bg-neuro-orange text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-neuro-orange/20">
          Return to Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1118] text-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-40 px-8 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 z-0">
            <img src={seminar.image_url} alt="" className="w-full h-full object-cover opacity-20 blur-sm scale-110" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0B1118] via-[#0B1118]/80 to-[#0B1118]"></div>
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <Link href="/seminars" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-12 text-xs font-black uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Back to All Seminars
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
            <div className="space-y-6 max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-4 py-1.5 bg-neuro-orange/10 border border-neuro-orange/20 text-neuro-orange text-[10px] font-black rounded-lg uppercase tracking-[0.2em]">
                  {seminar.event_type}
                </span>
                <span className="px-4 py-1.5 bg-white/5 border border-white/10 text-gray-300 text-[10px] font-black rounded-lg uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="text-sm">{seminar.country === 'Australia' ? '🇦🇺' : '🇺🇸'}</span> {seminar.city}, {seminar.country}
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-heading font-black tracking-tight leading-tight">
                {seminar.title}
              </h1>
              <div className="flex flex-wrap items-center gap-8 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-neuro-orange flex items-center justify-center text-white font-black text-sm border-2 border-white/10">
                    {seminar.instructor_name?.charAt(4) || 'RN'}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Instructor</p>
                    <p className="text-base font-bold text-white">{seminar.instructor_name}</p>
                  </div>
                </div>
                <div className="h-10 w-px bg-white/10 hidden md:block"></div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-neuro-orange">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Date</p>
                    <p className="text-base font-bold text-white">{seminar.dates}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:w-72 w-full">
               <a 
                href={seminar.registration_link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-6 bg-neuro-orange text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-neuro-orange-light transition-all shadow-2xl shadow-neuro-orange/30 flex items-center justify-center gap-3 hover:scale-[1.03] active:scale-95"
               >
                 Register for Seminar <ExternalLink className="w-4 h-4" />
               </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-24 px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
          
          {/* Left Column: Details */}
          <div className="lg:col-span-8 space-y-20">
            {/* Description */}
            <div className="space-y-8">
              <h2 className="text-3xl font-heading font-black flex items-center gap-4">
                <div className="p-3 bg-neuro-orange/10 rounded-xl text-neuro-orange">
                  <Zap className="w-6 h-6 fill-current" />
                </div>
                Overview
              </h2>
              <div className="text-lg text-gray-300 leading-relaxed space-y-6 font-medium whitespace-pre-wrap">
                {seminar.description}
              </div>
            </div>

            {/* What You Will Learn */}
            <div className="bg-white/5 border border-white/10 rounded-[3.5rem] p-12 space-y-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-neuro-orange/5 blur-[80px] -mr-32 -mt-32 transition-all duration-1000 group-hover:bg-neuro-orange/10"></div>
              <h2 className="text-3xl font-heading font-black">What You Will Learn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(seminar.tags || []).map((topic: string, i: number) => (
                  <div key={i} className="flex items-start gap-4 p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-neuro-orange/30 transition-all">
                    <CheckCircle2 className="w-6 h-6 text-neuro-orange mt-0.5" />
                    <span className="font-bold text-gray-200">{topic}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructor Bio */}
            <div className="space-y-8">
              <h2 className="text-3xl font-heading font-black flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                  <Users className="w-6 h-6" />
                </div>
                Your Instructor
              </h2>
              <div className="flex flex-col md:flex-row gap-10 items-start">
                <div className="w-32 h-32 rounded-[2.5rem] bg-neuro-orange flex-shrink-0 border-4 border-white/10 flex items-center justify-center text-white text-4xl font-black shadow-2xl">
                  {seminar.instructor_name?.charAt(4)}
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">{seminar.instructor_name}</h3>
                  <p className="text-gray-400 leading-relaxed italic text-lg font-medium">
                    {seminar.instructor_bio}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sidebar Stats */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 space-y-8 sticky top-32">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-2">Event Logistics</h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/5 rounded-xl text-neuro-orange">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Venue</p>
                    <p className="font-bold text-gray-200">{seminar.venue || 'Adelaide Training Facility'}</p>
                    <p className="text-xs text-gray-500">{seminar.city}, {seminar.country}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/5 rounded-xl text-neuro-orange">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Time</p>
                    <p className="font-bold text-gray-200">{seminar.start_time} — {seminar.end_time}</p>
                    <p className="text-xs text-gray-500">Local Time</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/5 rounded-xl text-neuro-orange">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Accreditation</p>
                    <p className="font-bold text-gray-200">Clinical Mastery Credits</p>
                    <p className="text-xs text-gray-500">Certificate Provided</p>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-white/10 space-y-6">
                <div className="flex items-end justify-between">
                  <p className="text-sm font-bold text-gray-400">Total Investment</p>
                  <p className="text-4xl font-black text-neuro-orange">${seminar.price}</p>
                </div>
                <a 
                  href={seminar.registration_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-5 bg-white text-neuro-navy hover:bg-neuro-orange hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 shadow-xl"
                >
                  Confirm Registration
                </a>
                <p className="text-center text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Limited Capacity: 12 spots remaining
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Secondary CTA */}
      <section className="py-32 px-8 bg-white/5 relative overflow-hidden">
         <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-heading font-black mb-8">Secure Your Spot in Adelaide.</h2>
            <p className="text-xl text-gray-400 mb-12 font-medium">Join Dr. Raymond Nichols for this immersive clinical experience.</p>
            <a 
              href={seminar.registration_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-4 px-12 py-6 bg-neuro-orange text-white rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-neuro-orange-light transition-all shadow-2xl shadow-neuro-orange/30 transform hover:-translate-y-1"
            >
              Register for Seminar <ChevronRight className="w-5 h-5" />
            </a>
         </div>
      </section>
    </div>
  );
}
