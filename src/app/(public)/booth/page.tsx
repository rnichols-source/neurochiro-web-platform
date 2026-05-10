"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ShieldCheck, Users, Globe, BarChart3, Briefcase, Award, Shuffle, DollarSign, GraduationCap, Zap, Star, MapPin, Heart, TrendingUp } from "lucide-react";

const SLIDES = [
  {
    icon: BarChart3,
    title: "AI Practice Intelligence",
    desc: "Your practice command center — health score, competitive ranking, AI-powered weekly insights, and revenue intelligence.",
    color: "text-blue-400",
    screenshot: "/booth/dashboard.png",
    label: "Doctor Dashboard",
  },
  {
    icon: Users,
    title: "Patient Lead Pipeline",
    desc: "Track every patient lead from first contact to converted. Notes, stage management, and conversion tracking built in.",
    color: "text-emerald-400",
    screenshot: "/booth/leads.png",
    label: "Lead Pipeline",
  },
  {
    icon: Shuffle,
    title: "ChiroMatch",
    desc: "The first residency-style matching system for chiropractic. Students rank practices. Practices rank candidates. Algorithm matches.",
    color: "text-violet-400",
    screenshot: "/booth/chiromatch.png",
    label: "ChiroMatch",
  },
  {
    icon: DollarSign,
    title: "Salary Transparency",
    desc: "Real compensation data by state, role, and specialty. Know what the market pays before you make an offer.",
    color: "text-emerald-400",
    screenshot: "/booth/salary.png",
    label: "Salary Explorer",
  },
  {
    icon: Award,
    title: "CE Credit Tracking",
    desc: "QR check-in at events. Verified certificates generated automatically. Track all your CE hours in one dashboard.",
    color: "text-amber-400",
    screenshot: "/booth/ce-tracker.png",
    label: "CE Tracker",
  },
  {
    icon: Star,
    title: "Seminar Platform",
    desc: "Full event landing pages with schedule, speakers, venue, reviews, and spotlight interviews. Better than Eventbrite for chiropractic.",
    color: "text-yellow-400",
    screenshot: "/booth/seminars.png",
    label: "Seminar Pages",
  },
  {
    icon: GraduationCap,
    title: "ChiroScore",
    desc: "Universal candidate rating from 0-100. Seven categories. Grades A through F. Doctors see it on every applicant.",
    color: "text-blue-400",
    screenshot: "/booth/chiroscore.png",
    label: "ChiroScore",
  },
  {
    icon: Briefcase,
    title: "Hiring System + ATS",
    desc: "7-stage pipeline. Interview prep. Offer letters. Email templates. Reference checks. The most complete hiring system in chiropractic.",
    color: "text-orange-400",
    screenshot: "/booth/hiring.png",
    label: "Hiring ATS",
  },
  {
    icon: MapPin,
    title: "Global Directory",
    desc: "140+ verified nervous system chiropractors. Patients find you. Badges, reviews, and referral tracking on every profile.",
    color: "text-red-400",
    screenshot: "/booth/directory.png",
    label: "Doctor Directory",
  },
  {
    icon: Heart,
    title: "Marketplace",
    desc: "Trusted products for your practice. Exclusive member discounts. Vendor reviews and product showcases.",
    color: "text-pink-400",
    screenshot: "/booth/marketplace.png",
    label: "Marketplace",
  },
];

export default function BoothPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch("/api/stats").then(r => r.json()).then(d => setStats(d)).catch(() => {});
  }, []);

  const slide = SLIDES[activeSlide];
  const Icon = slide.icon;

  return (
    <div className="min-h-dvh bg-[#0A0F15] text-white overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-12 pt-6 shrink-0">
        <div className="flex items-center gap-4">
          <Image src="/logo-white.png" alt="NeuroChiro" width={44} height={44} />
          <div>
            <span className="text-2xl font-heading font-black tracking-tight text-white">
              NEURO<span className="text-[#D66829]">CHIRO</span>
            </span>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em]">The Platform for Nervous System Chiropractors</p>
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

      {/* Main Content — Feature + Screenshot */}
      <div className="flex-1 flex items-center px-12 py-8">
        <div className="w-full grid grid-cols-2 gap-12 items-center">
          {/* Left — Feature Info */}
          <div>
            <div className={`w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 ${slide.color}`}>
              <Icon className="w-7 h-7" />
            </div>
            <h2 className="text-4xl md:text-5xl font-heading font-black tracking-tight mb-4 leading-tight">
              {slide.title}
            </h2>
            <p className="text-lg text-white/40 leading-relaxed mb-8">
              {slide.desc}
            </p>

            {/* Progress dots */}
            <div className="flex items-center gap-2">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`h-1.5 rounded-full transition-all ${i === activeSlide ? 'w-10 bg-[#D66829]' : 'w-1.5 bg-white/10'}`}
                />
              ))}
            </div>
          </div>

          {/* Right — Screenshot Mockup */}
          <div className="relative">
            <div className="bg-gradient-to-b from-[#1a2e40] to-[#0F1A24] rounded-2xl border border-white/[0.08] p-1 shadow-2xl shadow-black/50">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white/[0.06] rounded-lg px-4 py-1 text-[10px] text-white/20 text-center">
                    neurochiro.co
                  </div>
                </div>
              </div>
              {/* Screenshot area */}
              <div className="aspect-[16/10] bg-[#0F1A24] rounded-b-xl flex items-center justify-center overflow-hidden">
                <div className="text-center p-8">
                  <div className={`w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 ${slide.color}`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <p className="text-xl font-heading font-black text-white mb-2">{slide.label}</p>
                  <p className="text-sm text-white/20">Live on neurochiro.co</p>
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <div className="bg-white/[0.04] rounded-lg p-3">
                      <div className="w-full h-2 bg-white/[0.06] rounded mb-2" />
                      <div className="w-2/3 h-2 bg-white/[0.04] rounded" />
                    </div>
                    <div className="bg-white/[0.04] rounded-lg p-3">
                      <div className="w-full h-2 bg-[#D66829]/20 rounded mb-2" />
                      <div className="w-1/2 h-2 bg-white/[0.04] rounded" />
                    </div>
                    <div className="bg-white/[0.04] rounded-lg p-3">
                      <div className="w-full h-2 bg-emerald-500/20 rounded mb-2" />
                      <div className="w-3/4 h-2 bg-white/[0.04] rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-[#D66829]/5 rounded-3xl blur-2xl -z-10" />
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-12 pb-6 shrink-0">
        <div className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-2xl px-8 py-4">
          <div>
            <p className="text-lg font-bold text-white">Scan to Join</p>
            <p className="text-sm text-white/30">neurochiro.co/conference</p>
          </div>
          <div className="flex items-center gap-4">
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
