"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ShieldCheck, Users, Globe, BarChart3, Briefcase, Award, Shuffle, DollarSign, GraduationCap, Zap, Star, MapPin } from "lucide-react";

const FEATURES = [
  { icon: BarChart3, title: "AI Practice Intelligence", desc: "Practice Health Score, competitive ranking, AI-powered insights", color: "text-blue-400" },
  { icon: Users, title: "Patient Lead Pipeline", desc: "Track leads from first contact to converted patient", color: "text-emerald-400" },
  { icon: Shuffle, title: "ChiroMatch", desc: "Residency-style matching — students rank practices, algorithm matches", color: "text-violet-400" },
  { icon: DollarSign, title: "Salary Transparency", desc: "Real compensation data by state, role, and specialty", color: "text-emerald-400" },
  { icon: Award, title: "CE Credit Tracking", desc: "QR check-in, verified certificates, CE dashboard", color: "text-amber-400" },
  { icon: Star, title: "Seminar Reviews", desc: "Verified attendee reviews — the Yelp for chiropractic education", color: "text-yellow-400" },
  { icon: GraduationCap, title: "ChiroScore", desc: "Universal candidate rating (0-100) for every student", color: "text-blue-400" },
  { icon: Briefcase, title: "Full ATS Hiring System", desc: "7-stage pipeline with interview prep, offer letters, email templates", color: "text-orange-400" },
  { icon: MapPin, title: "Global Directory", desc: "140+ verified doctors across 30+ states and 4 countries", color: "text-red-400" },
  { icon: Zap, title: "Profile Boost", desc: "Rank higher in search results — get found by more patients", color: "text-violet-400" },
];

export default function BoothPage() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [stats, setStats] = useState<any>(null);

  // Auto-cycle features every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % FEATURES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch live stats
  useEffect(() => {
    fetch("/api/stats").then(r => r.json()).then(d => setStats(d)).catch(() => {});
  }, []);

  const feature = FEATURES[activeFeature];
  const Icon = feature.icon;

  return (
    <div className="min-h-dvh bg-[#0A0F15] text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-12 pt-8">
        <div className="flex items-center gap-4">
          <Image src="/logo-white.png" alt="NeuroChiro" width={48} height={48} />
          <div>
            <span className="text-3xl font-heading font-black tracking-tight text-white">
              NEURO<span className="text-[#D66829]">CHIRO</span>
            </span>
            <p className="text-xs text-white/30 font-bold uppercase tracking-[0.3em]">The Global Directory</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {stats && (
            <>
              <div className="text-center">
                <p className="text-2xl font-black text-white">{stats.doctors || 140}+</p>
                <p className="text-[9px] text-white/30 uppercase tracking-widest">Doctors</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-black text-white">{stats.countries || 4}</p>
                <p className="text-[9px] text-white/30 uppercase tracking-widest">Countries</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Feature Display */}
      <div className="flex-1 flex items-center justify-center px-12 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className={`w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 ${feature.color}`}>
              <Icon className="w-10 h-10" />
            </div>
            <h2 className="text-5xl md:text-6xl font-heading font-black tracking-tight mb-4 transition-all">
              {feature.title}
            </h2>
            <p className="text-xl text-white/40 max-w-lg mx-auto">
              {feature.desc}
            </p>
          </div>

          {/* Feature dots */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {FEATURES.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveFeature(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === activeFeature ? 'w-8 bg-[#D66829]' : 'bg-white/10'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-12 pb-8">
        <div className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-2xl px-8 py-5">
          <div>
            <p className="text-lg font-bold text-white">Scan to Join</p>
            <p className="text-sm text-white/30">neurochiro.co/conference</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-white/40">Doctors from</p>
              <p className="text-lg font-black text-[#D66829]">$49/mo</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-right">
              <p className="text-sm text-white/40">Students from</p>
              <p className="text-lg font-black text-[#D66829]">$12/mo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
