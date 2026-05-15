"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Users, BarChart3, Briefcase, Award, Shuffle, DollarSign,
  GraduationCap, Zap, Star, MapPin, Heart, Eye, Bell,
  TrendingUp, Calendar, Search, CheckCircle2, ArrowRight,
  FileText, MessageSquare, ShieldCheck, Target, Clock,
} from "lucide-react";

const SLIDES = [
  {
    title: "Doctor Dashboard",
    subtitle: "Your Practice Command Center",
    desc: "AI-powered insights, competitive ranking, revenue intelligence, and smart action items — all in one view.",
    color: "bg-blue-500",
    mockup: (
      <div className="space-y-3">
        <div className="bg-neuro-navy rounded-xl p-4 text-white">
          <p className="text-[10px] text-neuro-orange font-bold uppercase tracking-widest mb-1">Practice Command Center</p>
          <p className="text-lg font-bold">Good morning, Dr. Smith</p>
          <p className="text-xs text-white/40">AlignLife Chiropractic</p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Eye, label: "Views", value: "487", color: "text-blue-500" },
            { icon: Users, label: "Leads", value: "34", color: "text-emerald-500" },
            { icon: DollarSign, label: "Revenue", value: "$40K", color: "text-violet-500" },
            { icon: MapPin, label: "Rank", value: "#3", color: "text-neuro-orange" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-100 p-3 text-center">
              <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
              <p className="text-lg font-black text-neuro-navy">{s.value}</p>
              <p className="text-[8px] text-gray-400 uppercase">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="bg-neuro-orange/5 border border-neuro-orange/20 rounded-lg p-3">
          <p className="text-[10px] text-neuro-orange font-bold uppercase mb-1">AI Weekly Insight</p>
          <p className="text-xs text-gray-600">Your profile views increased 23% this week. Doctors who add video see 3x more leads.</p>
        </div>
      </div>
    ),
  },
  {
    title: "Patient Lead Pipeline",
    subtitle: "Never Lose a Lead",
    desc: "Track every patient from first contact to converted — with notes, stages, and conversion analytics.",
    color: "bg-emerald-500",
    mockup: (
      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-2">
          {["New", "Contacted", "Scheduled", "Converted"].map((s, i) => (
            <div key={i} className={`rounded-lg p-2 text-center text-white text-xs font-bold ${
              ["bg-blue-500", "bg-amber-500", "bg-violet-500", "bg-emerald-500"][i]
            }`}>{s} ({[3, 4, 2, 8][i]})</div>
          ))}
        </div>
        {["Sarah Mitchell — Directory — Converted", "Brandon Lee — Referral — Scheduled", "Megan Hernandez — Directory — New"].map((l, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-100 p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-neuro-orange/10 flex items-center justify-center text-neuro-orange font-bold text-xs">{l[0]}</div>
            <div className="flex-1">
              <p className="text-sm font-bold text-neuro-navy">{l.split(" — ")[0]}</p>
              <p className="text-[10px] text-gray-400">{l.split(" — ").slice(1).join(" · ")}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "ChiroMatch",
    subtitle: "The NFL Draft for Chiropractic",
    desc: "Students rank practices. Practices rank candidates. Our algorithm finds the perfect match on Match Day.",
    color: "bg-violet-500",
    mockup: (
      <div className="space-y-3">
        <div className="bg-neuro-navy rounded-xl p-4 text-center text-white">
          <Shuffle className="w-8 h-8 text-neuro-orange mx-auto mb-2" />
          <p className="font-bold text-lg">Fall 2026</p>
          <p className="text-xs text-white/40">Match Day: September 22</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white rounded-lg border border-gray-100 p-2">
            <p className="text-lg font-black text-neuro-navy">24</p>
            <p className="text-[8px] text-gray-400 uppercase">Positions</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-2">
            <p className="text-lg font-black text-neuro-navy">67</p>
            <p className="text-[8px] text-gray-400 uppercase">Students</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-2">
            <p className="text-lg font-black text-neuro-navy">89%</p>
            <p className="text-[8px] text-gray-400 uppercase">Match Rate</p>
          </div>
        </div>
        <p className="text-center text-xs text-gray-500">Rank your top 10 → Algorithm matches → Results on Match Day</p>
      </div>
    ),
  },
  {
    title: "Salary Transparency",
    subtitle: "Real Data. No Guessing.",
    desc: "Compensation data by state, role, and specialty — aggregated from real job postings on the platform.",
    color: "bg-emerald-500",
    mockup: (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-lg border border-gray-100 p-3 text-center">
            <p className="text-2xl font-black text-neuro-navy">$85K</p>
            <p className="text-[8px] text-gray-400 uppercase">Avg Associate</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-3 text-center">
            <p className="text-2xl font-black text-neuro-navy">$105K</p>
            <p className="text-[8px] text-gray-400 uppercase">75th Percentile</p>
          </div>
        </div>
        {["California — $105K", "Texas — $90K", "Florida — $82K", "Georgia — $80K"].map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs font-bold text-neuro-navy w-24">{s.split(" — ")[0]}</span>
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-neuro-orange rounded-full" style={{ width: `${[100, 86, 78, 76][i]}%` }} />
            </div>
            <span className="text-xs font-bold text-neuro-navy">{s.split(" — ")[1]}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "CE Credit Tracking",
    subtitle: "QR Check-In → Certificate",
    desc: "Attend a seminar, scan the QR code, and your CE certificate is generated instantly. All hours tracked in one dashboard.",
    color: "bg-amber-500",
    mockup: (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-lg border border-gray-100 p-3 text-center">
            <p className="text-2xl font-black text-neuro-navy">30</p>
            <p className="text-[8px] text-gray-400 uppercase">Total Hours</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-3 text-center">
            <p className="text-2xl font-black text-neuro-orange">12</p>
            <p className="text-[8px] text-gray-400 uppercase">This Year</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-3 text-center">
            <p className="text-2xl font-black text-neuro-navy">4</p>
            <p className="text-[8px] text-gray-400 uppercase">Certificates</p>
          </div>
        </div>
        {["Pediatric Neurology Workshop — 8 CE", "New Beginnings 2026 — 12 CE"].map((c, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-100 p-3 flex items-center gap-3">
            <Award className="w-6 h-6 text-blue-400" />
            <div className="flex-1">
              <p className="text-xs font-bold text-neuro-navy">{c.split(" — ")[0]}</p>
              <p className="text-[10px] text-gray-400">Certificate: NC-CE-{Math.random().toString(36).slice(2, 8).toUpperCase()}</p>
            </div>
            <span className="text-sm font-black text-blue-500">{c.split(" — ")[1]}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Seminar Platform",
    subtitle: "Better Than Eventbrite",
    desc: "Full event landing pages with schedule, speakers, venue, reviews, and spotlight interviews. CE tracking built in.",
    color: "bg-yellow-500",
    mockup: (
      <div className="space-y-3">
        <div className="bg-neuro-navy rounded-xl p-4 text-white">
          <div className="flex gap-2 mb-2">
            <span className="px-2 py-0.5 bg-white/10 rounded text-[10px]">📅 May 14-17</span>
            <span className="px-2 py-0.5 bg-white/10 rounded text-[10px]">📍 Asbury Park</span>
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-[10px]">12 CE</span>
          </div>
          <p className="font-bold">New Beginnings — 35th Anniversary</p>
          <p className="text-xs text-white/40">Berkeley Oceanfront Hotel</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-lg border border-gray-100 p-2 text-center text-xs"><Clock className="w-3 h-3 mx-auto mb-1 text-neuro-orange" /> Schedule</div>
          <div className="bg-white rounded-lg border border-gray-100 p-2 text-center text-xs"><Users className="w-3 h-3 mx-auto mb-1 text-neuro-orange" /> Speakers</div>
        </div>
        <div className="flex gap-1">
          {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
          <span className="text-xs text-gray-500 ml-1">4.8 (12 reviews)</span>
        </div>
      </div>
    ),
  },
  {
    title: "ChiroScore",
    subtitle: "Universal Candidate Rating",
    desc: "Every student gets a 0-100 score across 7 categories. Doctors see it on every applicant. Grades A through F.",
    color: "bg-blue-500",
    mockup: (
      <div className="space-y-3">
        <div className="flex items-center gap-4 justify-center">
          <div className="text-center">
            <p className="text-4xl font-black text-neuro-navy">78</p>
            <p className="text-xs text-gray-400">/100</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
            <span className="text-xl font-black text-blue-500">B</span>
          </div>
        </div>
        {[
          { label: "Profile", pct: 90 }, { label: "Education", pct: 75 },
          { label: "Academy", pct: 60 }, { label: "Career", pct: 85 },
        ].map((b, i) => (
          <div key={i}>
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="text-gray-500">{b.label}</span>
              <span className="text-gray-400">{b.pct}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full">
              <div className={`h-full rounded-full ${b.pct >= 75 ? 'bg-green-400' : 'bg-neuro-orange'}`} style={{ width: `${b.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Hiring System",
    subtitle: "Full ATS Built In",
    desc: "7-stage pipeline, interview prep, offer letters, email templates, reference checks — the most complete hiring system in chiropractic.",
    color: "bg-orange-500",
    mockup: (
      <div className="space-y-3">
        <div className="flex gap-1">
          {["New", "Review", "Phone", "Interview", "Offer", "Hired"].map((s, i) => (
            <div key={i} className={`flex-1 py-1 text-center text-[8px] font-bold rounded ${i < 4 ? 'bg-neuro-orange text-white' : 'bg-gray-100 text-gray-400'}`}>{s}</div>
          ))}
        </div>
        {["Dr. Sarah Chen — ChiroScore 82 B", "Dr. Mike Torres — ChiroScore 74 C", "Dr. Ashley Kim — ChiroScore 91 A"].map((a, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-100 p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-neuro-navy/5 flex items-center justify-center text-xs font-bold text-neuro-navy">{a[4]}{a.split(" ")[1][0]}</div>
            <div className="flex-1">
              <p className="text-xs font-bold text-neuro-navy">{a.split(" — ")[0]}</p>
              <p className="text-[10px] text-gray-400">{a.split(" — ")[1]}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Global Directory",
    subtitle: "Get Found by Patients",
    desc: "140+ verified nervous system chiropractors. Patients search, find your profile, and contact you directly.",
    color: "bg-red-500",
    mockup: (
      <div className="space-y-3">
        <div className="bg-neuro-navy rounded-xl p-4 text-white text-center">
          <Search className="w-6 h-6 mx-auto mb-2 text-neuro-orange" />
          <p className="text-sm font-bold">Find a Nervous System Chiropractor</p>
          <div className="mt-2 bg-white/10 rounded-lg px-3 py-2 text-xs text-white/40">City, state, or doctor name...</div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white rounded-lg border border-gray-100 p-2">
            <p className="text-lg font-black text-neuro-orange">140+</p>
            <p className="text-[8px] text-gray-400">Doctors</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-2">
            <p className="text-lg font-black text-neuro-orange">30+</p>
            <p className="text-[8px] text-gray-400">States</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-2">
            <p className="text-lg font-black text-neuro-orange">4</p>
            <p className="text-[8px] text-gray-400">Countries</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Marketplace",
    subtitle: "Products for Your Practice",
    desc: "Trusted vendors with exclusive member discounts. Product showcases, reviews, and direct contact — all in one place.",
    color: "bg-pink-500",
    mockup: (
      <div className="space-y-3">
        {["Aceva — Supplements — NEUROCHIRO10", "INSiGHT CLA — Scanning Tech — NEUROCHIRO", "MojoFeet — Custom Orthotics — NEURO15"].map((v, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-100 p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-lg font-bold text-neuro-orange">{v[0]}</div>
            <div className="flex-1">
              <p className="text-xs font-bold text-neuro-navy">{v.split(" — ")[0]}</p>
              <p className="text-[10px] text-gray-400">{v.split(" — ")[1]}</p>
            </div>
            <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[8px] font-bold rounded border border-green-200">{v.split(" — ")[2]}</span>
          </div>
        ))}
      </div>
    ),
  },
];

export default function BoothPage() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const slide = SLIDES[activeSlide];

  return (
    <div className="min-h-dvh bg-neuro-cream flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-10 pt-6 shrink-0">
        <div className="flex items-center gap-3">
          <Image src="/logo-dark.png" alt="NeuroChiro" width={40} height={40} className="hidden" />
          <div>
            <span className="text-2xl font-heading font-black tracking-tight text-neuro-navy">
              NEURO<span className="text-neuro-orange">CHIRO</span>
            </span>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.3em]">The Platform for Nervous System Chiropractors</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-neuro-navy rounded-full">
            <ShieldCheck className="w-4 h-4 text-neuro-orange" />
            <span className="text-sm font-bold text-white">140+ Verified Doctors</span>
          </div>
        </div>
      </div>

      {/* Main — Split Layout */}
      <div className="flex-1 flex items-center px-10 py-6">
        <div className="w-full grid grid-cols-2 gap-10 items-center">
          {/* Left — Feature Info */}
          <div>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 ${slide.color} text-white text-xs font-bold rounded-full mb-4`}>
              {slide.subtitle}
            </div>
            <h2 className="text-4xl md:text-5xl font-heading font-black text-neuro-navy tracking-tight mb-4 leading-tight">
              {slide.title}
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed mb-6">
              {slide.desc}
            </p>

            {/* Slide indicators */}
            <div className="flex items-center gap-2">
              {SLIDES.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`h-1.5 rounded-full transition-all ${i === activeSlide ? 'w-10 bg-neuro-orange' : 'w-1.5 bg-gray-200'}`}
                />
              ))}
            </div>
          </div>

          {/* Right — Mockup */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl shadow-gray-200/50 p-6 max-w-md mx-auto w-full">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-gray-50 rounded-lg px-4 py-1.5 text-[10px] text-gray-400 text-center font-medium">
                  neurochiro.co
                </div>
              </div>
            </div>
            {slide.mockup}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-10 pb-6 shrink-0">
        <div className="flex items-center justify-between bg-neuro-navy rounded-2xl px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <div>
              <p className="text-sm font-bold text-white">Scan to Join</p>
              <p className="text-xs text-white/40">neurochiro.co/conference</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-white/40">Doctors from</p>
              <p className="text-lg font-black text-neuro-orange">$49/mo</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-right">
              <p className="text-xs text-white/40">Students from</p>
              <p className="text-lg font-black text-neuro-orange">$12/mo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
