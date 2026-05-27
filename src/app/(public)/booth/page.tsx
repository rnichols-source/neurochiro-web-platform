"use client";

import { useEffect, useState } from "react";
import {
  Users, BarChart3, Briefcase, Award, Shuffle, DollarSign,
  GraduationCap, Zap, Star, MapPin, Eye, Search,
  CheckCircle2, ArrowRight, MessageSquare, ShieldCheck, Clock,
  Heart, TrendingUp, Target, FileText, Activity, Mic2,
  Calendar, Globe, Lock, Stethoscope,
} from "lucide-react";
import LiveSignupFeed from "@/components/booth/LiveSignupFeed";

/* ─── Full-Screen Slide Components ─── */

function SlideHero() {
  return (
    <div className="h-full bg-neuro-navy flex flex-col items-center justify-center text-center px-16 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-40 w-96 h-96 bg-neuro-orange rounded-full blur-[150px]" />
        <div className="absolute bottom-20 right-40 w-72 h-72 bg-blue-500 rounded-full blur-[120px]" />
      </div>
      <div className="relative z-10">
        <p className="text-neuro-orange text-sm font-black uppercase tracking-[0.4em] mb-6">The Platform for</p>
        <h1 className="text-7xl font-heading font-black text-white tracking-tight mb-4 leading-none">
          Nervous System<br />Chiropractors
        </h1>
        <p className="text-2xl text-gray-400 mt-6 mb-12">The only directory, hiring system, and practice growth platform built for doctors like you.</p>
        <div className="flex items-center justify-center gap-12">
          {[
            { value: "140+", label: "Verified Doctors" },
            { value: "30+", label: "States" },
            { value: "4", label: "Countries" },
            { value: "Free", label: "To Join" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-4xl font-black text-neuro-orange">{s.value}</p>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideDoctorDashboard() {
  return (
    <div className="h-full bg-[#0F1A24] flex items-center px-16 gap-12">
      {/* Left info */}
      <div className="w-[380px] shrink-0">
        <p className="text-neuro-orange text-xs font-black uppercase tracking-[0.3em] mb-3">Doctor Portal</p>
        <h2 className="text-5xl font-heading font-black text-white leading-tight mb-4">Your Practice<br />Command Center</h2>
        <p className="text-gray-400 text-lg leading-relaxed">AI-powered insights, competitive ranking, lead pipeline, and smart action items — everything you need to grow your practice in one dashboard.</p>
      </div>
      {/* Right mockup — dark portal style */}
      <div className="flex-1 bg-gradient-to-br from-[#1a2e40] to-[#162231] rounded-2xl border border-white/10 p-6 shadow-2xl">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-white/40">Live Dashboard</span>
        </div>
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { icon: Eye, label: "Profile Views", value: "487", sub: "+23% this week", color: "text-blue-400" },
            { icon: Users, label: "Active Leads", value: "34", sub: "8 new this week", color: "text-emerald-400" },
            { icon: TrendingUp, label: "Practice Health", value: "87", sub: "Top 15% in state", color: "text-violet-400" },
            { icon: MapPin, label: "City Rank", value: "#3", sub: "of 12 in Charleston", color: "text-neuro-orange" },
          ].map((s, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-[10px] text-white/30 font-bold uppercase mt-1">{s.label}</p>
              <p className="text-[10px] text-green-400 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>
        {/* AI Insight */}
        <div className="bg-neuro-orange/10 border border-neuro-orange/20 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-neuro-orange" />
            <span className="text-xs font-bold text-neuro-orange uppercase tracking-wider">AI Weekly Insight</span>
          </div>
          <p className="text-sm text-white/80">Your profile views increased 23% this week. Doctors in your area who add a video bio get 3x more patient inquiries. Consider recording a 60-second intro.</p>
        </div>
        {/* Lead pipeline preview */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { stage: "New", count: 3, color: "bg-blue-500" },
            { stage: "Contacted", count: 4, color: "bg-amber-500" },
            { stage: "Scheduled", count: 2, color: "bg-violet-500" },
            { stage: "Converted", count: 8, color: "bg-emerald-500" },
          ].map((s, i) => (
            <div key={i} className={`${s.color} rounded-lg py-2 text-center`}>
              <p className="text-lg font-black text-white">{s.count}</p>
              <p className="text-[9px] text-white/70 font-bold uppercase">{s.stage}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideDirectory() {
  return (
    <div className="h-full bg-neuro-cream flex items-center px-16 gap-12">
      <div className="w-[380px] shrink-0">
        <p className="text-neuro-orange text-xs font-black uppercase tracking-[0.3em] mb-3">Global Directory</p>
        <h2 className="text-5xl font-heading font-black text-neuro-navy leading-tight mb-4">Get Found by<br />Patients</h2>
        <p className="text-gray-500 text-lg leading-relaxed">Patients search for nervous system chiropractors by city, state, or specialty. Your profile is your storefront — photos, bio, specialties, reviews, and contact info.</p>
        <div className="flex items-center gap-6 mt-8">
          <div className="text-center">
            <p className="text-3xl font-black text-neuro-orange">140+</p>
            <p className="text-xs text-gray-400 font-bold">Doctors</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-neuro-orange">30+</p>
            <p className="text-xs text-gray-400 font-bold">States</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-neuro-orange">4</p>
            <p className="text-xs text-gray-400 font-bold">Countries</p>
          </div>
        </div>
      </div>
      <div className="flex-1">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6">
          <div className="bg-gray-50 rounded-xl px-5 py-3 flex items-center gap-3 mb-5">
            <Search className="w-5 h-5 text-gray-300" />
            <span className="text-gray-400 text-sm">Search by city, state, or doctor name...</span>
          </div>
          <div className="space-y-3">
            {[
              { name: "Dr. Sarah Mitchell", loc: "Austin, TX", spec: "Torque Release, Pediatrics", views: "1,243", badge: true },
              { name: "Dr. James Park", loc: "Boulder, CO", spec: "NetworkSpinal, Family Care", views: "892", badge: true },
              { name: "Dr. Aisha Rahman", loc: "Atlanta, GA", spec: "NUCCA, Upper Cervical", views: "756", badge: false },
              { name: "Dr. Carlos Rivera", loc: "Miami, FL", spec: "Gonstead, Sports Chiro", views: "634", badge: true },
            ].map((d, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-14 h-14 rounded-xl bg-neuro-navy/10 flex items-center justify-center text-neuro-navy font-bold text-sm">
                  {d.name.split(' ').slice(1).map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-neuro-navy">{d.name}</p>
                    {d.badge && <ShieldCheck className="w-4 h-4 text-blue-500" />}
                  </div>
                  <p className="text-xs text-gray-400">{d.loc} · {d.spec}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-neuro-navy">{d.views}</p>
                  <p className="text-[9px] text-gray-400">views</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideChiroMatch() {
  return (
    <div className="h-full bg-neuro-navy flex items-center px-16 gap-12">
      <div className="w-[380px] shrink-0">
        <p className="text-neuro-orange text-xs font-black uppercase tracking-[0.3em] mb-3">ChiroMatch</p>
        <h2 className="text-5xl font-heading font-black text-white leading-tight mb-4">The NFL Draft<br />for Chiropractic</h2>
        <p className="text-gray-400 text-lg leading-relaxed">The first residency-style matching system for chiropractic. Students rank practices. Practices rank candidates. Our Gale-Shapley algorithm finds the optimal match.</p>
      </div>
      <div className="flex-1 flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
            <Shuffle className="w-8 h-8 text-neuro-orange mx-auto mb-3" />
            <p className="text-3xl font-black text-white">24</p>
            <p className="text-xs text-gray-500 font-bold uppercase mt-1">Open Positions</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
            <GraduationCap className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <p className="text-3xl font-black text-white">67</p>
            <p className="text-xs text-gray-500 font-bold uppercase mt-1">Students Ranked</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <p className="text-3xl font-black text-white">89%</p>
            <p className="text-xs text-gray-500 font-bold uppercase mt-1">Match Rate</p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <p className="text-xs text-neuro-orange font-bold uppercase tracking-wider mb-4">How It Works</p>
          <div className="flex items-center justify-between">
            {["Students Submit Rankings", "Practices Submit Rankings", "Algorithm Runs", "Match Day Results"].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neuro-orange/10 flex items-center justify-center text-neuro-orange font-black text-sm">{i + 1}</div>
                <p className="text-sm text-white/70 font-bold">{s}</p>
                {i < 3 && <ArrowRight className="w-4 h-4 text-white/20 ml-3" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideSalary() {
  return (
    <div className="h-full bg-neuro-cream flex items-center px-16 gap-12">
      <div className="w-[380px] shrink-0">
        <p className="text-neuro-orange text-xs font-black uppercase tracking-[0.3em] mb-3">Salary Engine</p>
        <h2 className="text-5xl font-heading font-black text-neuro-navy leading-tight mb-4">Real Data.<br />No Guessing.</h2>
        <p className="text-gray-500 text-lg leading-relaxed">Compensation data aggregated from real job postings. Know what the market pays by state, role, and experience level before you make an offer or accept one.</p>
      </div>
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-xl p-8">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-neuro-navy rounded-xl p-5 text-center">
            <p className="text-3xl font-black text-white">$85K</p>
            <p className="text-xs text-gray-400 font-bold uppercase mt-1">Avg Associate</p>
          </div>
          <div className="bg-neuro-orange rounded-xl p-5 text-center">
            <p className="text-3xl font-black text-white">$105K</p>
            <p className="text-xs text-white/70 font-bold uppercase mt-1">75th Percentile</p>
          </div>
          <div className="bg-neuro-navy rounded-xl p-5 text-center">
            <p className="text-3xl font-black text-white">$142K</p>
            <p className="text-xs text-gray-400 font-bold uppercase mt-1">Top 10%</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-4">By State</p>
        <div className="space-y-3">
          {[
            { state: "California", salary: "$105K", pct: 100 },
            { state: "New York", salary: "$98K", pct: 93 },
            { state: "Texas", salary: "$90K", pct: 86 },
            { state: "Florida", salary: "$82K", pct: 78 },
            { state: "Colorado", salary: "$88K", pct: 84 },
            { state: "Georgia", salary: "$80K", pct: 76 },
          ].map((s) => (
            <div key={s.state} className="flex items-center gap-4">
              <span className="text-sm font-bold text-neuro-navy w-28">{s.state}</span>
              <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-neuro-orange to-orange-400 rounded-full" style={{ width: `${s.pct}%` }} />
              </div>
              <span className="text-sm font-black text-neuro-navy w-16 text-right">{s.salary}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideStudentTools() {
  return (
    <div className="h-full bg-[#0F1A24] flex items-center px-16 gap-12">
      <div className="w-[380px] shrink-0">
        <p className="text-neuro-orange text-xs font-black uppercase tracking-[0.3em] mb-3">Student Portal</p>
        <h2 className="text-5xl font-heading font-black text-white leading-tight mb-4">Your Career<br />Starts Here</h2>
        <p className="text-gray-400 text-lg leading-relaxed">ChiroScore, interview prep, contract analysis, financial planning, technique explorer, CE tracking — tools your school doesn't teach you.</p>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-4">
        {[
          { icon: Target, title: "ChiroScore", desc: "Your 0-100 candidate rating across 7 categories. Employers see this on every application.", color: "text-blue-400" },
          { icon: FileText, title: "Contract Lab", desc: "Paste any associate agreement. AI breaks down the terms, spots red flags, and compares to market standards.", color: "text-violet-400" },
          { icon: DollarSign, title: "Financial Planner", desc: "Model your salary, student loans, cost of living, and runway. Know your numbers before you negotiate.", color: "text-emerald-400" },
          { icon: Mic2, title: "Interview Prep", desc: "20 real interview questions with frameworks, example answers, and scoring rubrics. Practice before game day.", color: "text-amber-400" },
          { icon: Award, title: "CE Tracker", desc: "QR check-in at seminars. Certificates generated instantly. All hours tracked in one dashboard.", color: "text-pink-400" },
          { icon: Shuffle, title: "ChiroMatch", desc: "Rank your top practice choices. Get matched through our algorithm on Match Day. Like the NFL Draft.", color: "text-neuro-orange" },
        ].map((t, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5">
            <t.icon className={`w-6 h-6 ${t.color} mb-3`} />
            <p className="font-bold text-white text-sm mb-1">{t.title}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{t.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideSeminars() {
  return (
    <div className="h-full bg-neuro-cream flex items-center px-16 gap-12">
      <div className="w-[380px] shrink-0">
        <p className="text-neuro-orange text-xs font-black uppercase tracking-[0.3em] mb-3">Seminars</p>
        <h2 className="text-5xl font-heading font-black text-neuro-navy leading-tight mb-4">Better Than<br />Eventbrite</h2>
        <p className="text-gray-500 text-lg leading-relaxed">Full event pages with schedule, 22 speaker landing pages, venue photos, Google Maps, countdown timer, FAQ, reviews, and CE tracking built in.</p>
      </div>
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
        {/* Event header */}
        <div className="bg-neuro-navy p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 bg-white/10 rounded-lg text-xs text-white font-bold flex items-center gap-1.5"><Calendar className="w-3 h-3 text-neuro-orange" /> Nov 5-8, 2026</span>
            <span className="px-3 py-1 bg-white/10 rounded-lg text-xs text-white font-bold flex items-center gap-1.5"><MapPin className="w-3 h-3 text-neuro-orange" /> Fort Lauderdale, FL</span>
          </div>
          <p className="text-2xl font-black text-white">The Brave Practice Event</p>
          <p className="text-sm text-gray-400 mt-1">Hosted by Dr. Kim Thor-Adams, Dr. Aura Tovar & Dr. Jenna Davis</p>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
          {[
            { value: "22", label: "Speakers" },
            { value: "2", label: "Days" },
            { value: "$379", label: "Ticket" },
            { value: "4.9", label: "Rating" },
          ].map((s) => (
            <div key={s.label} className="text-center py-4">
              <p className="text-xl font-black text-neuro-orange">{s.value}</p>
              <p className="text-[9px] text-gray-400 font-bold uppercase">{s.label}</p>
            </div>
          ))}
        </div>
        {/* Speaker preview */}
        <div className="p-5">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">Featured Speakers</p>
          <div className="flex gap-3">
            {["Dr. Billy DeMoss", "Roberto Monaco", "Dr. Travis Corcoran", "Dr. Lauryn Brunclik", "Dr. Peter Kevorkian"].map((s) => (
              <div key={s} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-neuro-navy/10 flex items-center justify-center text-neuro-navy font-bold text-xs mx-auto mb-1">
                  {s.replace('Dr. ', '').split(' ').map(n => n[0]).join('')}
                </div>
                <p className="text-[9px] text-gray-500 font-bold">{s.split(' ').slice(-1)[0]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideDoctorFeatures() {
  return (
    <div className="h-full bg-neuro-navy flex items-center px-16 gap-12">
      <div className="w-[380px] shrink-0">
        <p className="text-neuro-orange text-xs font-black uppercase tracking-[0.3em] mb-3">For Doctors</p>
        <h2 className="text-5xl font-heading font-black text-white leading-tight mb-4">Everything<br />You Need</h2>
        <p className="text-gray-400 text-lg leading-relaxed">Free to join. Upgrade to Pro ($49/mo) to unlock the full suite of practice tools.</p>
      </div>
      <div className="flex-1">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Eye, title: "Directory Listing", desc: "Get found by patients", tier: "Free" },
            { icon: ShieldCheck, title: "Verified Badge", desc: "Build trust instantly", tier: "Free" },
            { icon: BarChart3, title: "Profile Analytics", desc: "See who's viewing you", tier: "Free" },
            { icon: MessageSquare, title: "Patient Messaging", desc: "Direct communication", tier: "Pro" },
            { icon: Users, title: "Lead Pipeline", desc: "Track every patient", tier: "Pro" },
            { icon: Activity, title: "KPI Tracker", desc: "Practice metrics", tier: "Pro" },
            { icon: Shuffle, title: "ChiroMatch", desc: "Find associates", tier: "Pro" },
            { icon: Award, title: "CE Tracking", desc: "QR check-in + certs", tier: "Pro" },
            { icon: Stethoscope, title: "Care Plans", desc: "AI-powered plans", tier: "Pro" },
            { icon: FileText, title: "Scan Reports", desc: "Patient reports", tier: "Pro" },
            { icon: DollarSign, title: "P&L Analyzer", desc: "Financial clarity", tier: "Pro" },
            { icon: Target, title: "Command Center", desc: "Full practice OS", tier: "Pro" },
          ].map((f, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3">
              <f.icon className="w-5 h-5 text-neuro-orange shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white text-sm">{f.title}</p>
                </div>
                <p className="text-[10px] text-gray-500">{f.desc}</p>
              </div>
              <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                f.tier === "Free" ? "bg-green-500/20 text-green-400" :
                f.tier === "Pro" ? "bg-neuro-orange/20 text-neuro-orange" :
                "bg-violet-500/20 text-violet-400"
              }`}>{f.tier}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideJoinFree() {
  return (
    <div className="h-full bg-gradient-to-br from-neuro-navy to-[#0F1A24] flex items-center justify-center px-16">
      <div className="text-center max-w-4xl">
        <p className="text-neuro-orange text-sm font-black uppercase tracking-[0.4em] mb-6">Join NeuroChiro Today</p>
        <h2 className="text-7xl font-heading font-black text-white mb-12">Free. For Everyone.</h2>
        <div className="grid grid-cols-3 gap-8 mb-12">
          {[
            { icon: Stethoscope, role: "Doctors", desc: "Get your practice listed in the global directory. Verified badge. Profile analytics. Upgrade to Pro or Pro anytime.", url: "neurochiro.co/get-started" },
            { icon: GraduationCap, role: "Students", desc: "Find jobs, attend seminars, build your ChiroScore, explore techniques, and prep for interviews. Upgrade to Premium anytime.", url: "neurochiro.co/get-started" },
            { icon: Heart, role: "Patients", desc: "Find nervous system chiropractors near you. Track your health. Read reviews. Message doctors directly. Always free.", url: "neurochiro.co/get-started" },
          ].map((r) => (
            <div key={r.role} className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
              <r.icon className="w-10 h-10 text-neuro-orange mx-auto mb-4" />
              <p className="text-2xl font-black text-white mb-3">{r.role}</p>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">{r.desc}</p>
              <div className="bg-neuro-orange rounded-xl py-3 px-6 inline-block">
                <p className="text-white font-bold text-lg">Free to Join</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-3xl font-heading font-black text-neuro-orange">neurochiro.co/get-started</p>
        <p className="text-gray-500 mt-2">Scan the QR code or visit the link</p>
      </div>
    </div>
  );
}

/* ─── Slide Registry ─── */
const SLIDES = [
  { id: "hero", component: SlideHero },
  { id: "dashboard", component: SlideDoctorDashboard },
  { id: "directory", component: SlideDirectory },
  { id: "chiromatch", component: SlideChiroMatch },
  { id: "salary", component: SlideSalary },
  { id: "students", component: SlideStudentTools },
  { id: "seminars", component: SlideSeminars },
  { id: "features", component: SlideDoctorFeatures },
  { id: "join", component: SlideJoinFree },
];

export default function BoothPage() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const SlideComponent = SLIDES[activeSlide].component;

  return (
    <div className="h-dvh w-full overflow-hidden relative">
      <LiveSignupFeed />

      {/* Full-screen slide */}
      <SlideComponent />

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between px-8 py-3 bg-black/60 backdrop-blur">
          {/* Logo */}
          <div>
            <span className="text-lg font-heading font-black text-white tracking-tight">
              NEURO<span className="text-neuro-orange">CHIRO</span>
            </span>
          </div>

          {/* Slide indicators */}
          <div className="flex items-center gap-2">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActiveSlide(i)}
                className={`h-1.5 rounded-full transition-all ${i === activeSlide ? 'w-8 bg-neuro-orange' : 'w-2 bg-white/20'}`}
              />
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-white/60 font-bold">neurochiro.co/get-started</span>
            </div>
            <div className="px-4 py-2 bg-neuro-orange rounded-lg">
              <p className="text-sm font-black text-white">Free to Join</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
