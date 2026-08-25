"use client";

import { useEffect, useState } from "react";
import {
  Users, CheckCircle2, MapPin, Star, Video, BarChart3, Phone,
  Stethoscope, GraduationCap, Zap, Heart, Image as ImageIcon,
} from "lucide-react";
import { DOCTOR_PRO_FEATURES_FULL, PRICING } from "@/lib/membership-value";

/* ─── Slide 1: Hero + Directory Stats ─── */
function SlideDirectory() {
  return (
    <div className="h-full bg-neuro-navy flex flex-col items-center justify-center text-center px-16 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-40 w-96 h-96 bg-neuro-orange rounded-full blur-[150px]" />
        <div className="absolute bottom-20 right-40 w-72 h-72 bg-blue-500 rounded-full blur-[120px]" />
      </div>
      <div className="relative z-10">
        <p className="text-neuro-orange text-sm font-black uppercase tracking-[0.4em] mb-6">The Only Directory for</p>
        <h1 className="text-8xl font-heading font-black text-white tracking-tight mb-4 leading-none">
          Nervous System<br />Chiropractors
        </h1>
        <p className="text-2xl text-gray-400 mt-6 mb-16 max-w-2xl mx-auto">
          Get found by patients. Get promoted every week. Get the tools to grow your practice.
        </p>
        <div className="flex items-center justify-center gap-16">
          {[
            { value: "162+", label: "Verified Doctors" },
            { value: "30+", label: "States" },
            { value: "4", label: "Countries" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-5xl font-black text-neuro-orange">{s.value}</p>
              <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mt-2">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="text-gray-600 text-lg mt-16">Are you listed?</p>
      </div>
    </div>
  );
}

/* ─── Slide 2: What You Get (Value Prop) ─── */
function SlideValueProp() {
  return (
    <div className="h-full bg-[#0F1A24] flex items-center px-16 gap-16">
      <div className="w-[420px] shrink-0">
        <p className="text-neuro-orange text-xs font-black uppercase tracking-[0.3em] mb-4">Pro Membership</p>
        <h2 className="text-6xl font-heading font-black text-white leading-tight mb-4">
          <span className="text-neuro-orange">${PRICING.doctor.monthly}</span>/mo
        </h2>
        <p className="text-xl text-gray-400 leading-relaxed mb-8">
          Personal onboarding. Weekly promotion. Patient leads. Everything to grow your practice.
        </p>
        <div className="bg-neuro-orange/10 border border-neuro-orange/20 rounded-2xl p-6">
          <p className="text-neuro-orange font-black text-sm mb-2">The math:</p>
          <p className="text-white/60 text-sm leading-relaxed">
            One new patient from the directory pays for an entire year of Pro. The average new patient is worth $2,000-5,000.
          </p>
        </div>
      </div>
      <div className="flex-1">
        <div className="grid grid-cols-2 gap-3">
          {DOCTOR_PRO_FEATURES_FULL.map((feature, i) => (
            <div key={i} className="flex items-start gap-3 bg-white/[0.04] rounded-xl p-4">
              <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-white/70 leading-snug">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Slide 3: Social Proof / Spotlight ─── */
function SlideSpotlight() {
  return (
    <div className="h-full bg-neuro-navy flex flex-col items-center justify-center text-center px-16 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-40 right-60 w-[500px] h-[500px] bg-neuro-orange rounded-full blur-[200px]" />
      </div>
      <div className="relative z-10 max-w-4xl">
        <p className="text-neuro-orange text-sm font-black uppercase tracking-[0.4em] mb-6">The Weekly Adjustment</p>
        <h2 className="text-7xl font-heading font-black text-white mb-12">Promoted. Every Week.</h2>
        <div className="grid grid-cols-3 gap-6 mb-16">
          {[
            { icon: Video, title: "The Weekly Adjustment", desc: "Live every Thursday 8 PM. Dr. Ray + a featured doctor answer real patient questions." },
            { icon: Star, title: "Spotlight Interview", desc: "30-min interview on YouTube. Chopped into reels for your social. Posted in rotation." },
            { icon: ImageIcon, title: "Content Rotation", desc: "Your clips, graphics, and story features posted to 185K followers at least once a month." },
          ].map((item, i) => (
            <div key={i} className="bg-white/[0.06] border border-white/[0.08] rounded-2xl p-8 text-center">
              <item.icon className="w-10 h-10 text-neuro-orange mx-auto mb-4" />
              <p className="text-xl font-black text-white mb-2">{item.title}</p>
              <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-8">
          {[
            { icon: Phone, text: "Patient leads forwarded to you" },
            { icon: MapPin, text: "City spotlight weeks" },
            { icon: BarChart3, text: "Monthly growth report" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <item.icon className="w-4 h-4 text-neuro-orange" />
              <span className="text-sm text-gray-400 font-bold">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Slide 4: QR Code + CTA ─── */
function SlideSignup() {
  return (
    <div className="h-full bg-gradient-to-br from-neuro-navy to-[#0F1A24] flex items-center justify-center px-16">
      <div className="text-center max-w-4xl">
        <p className="text-neuro-orange text-sm font-black uppercase tracking-[0.4em] mb-6">Join the Network</p>
        <h2 className="text-8xl font-heading font-black text-white mb-8">Scan. Sign Up.<br />Get Promoted.</h2>

        <div className="flex items-center justify-center gap-16 mb-12">
          {/* QR Code */}
          <div className="bg-white rounded-3xl p-6 shadow-2xl">
            <img src="/qr-join.png" alt="Scan to join" className="w-48 h-48" />
          </div>

          {/* Or sign up info */}
          <div className="text-left">
            <div className="space-y-4">
              {[
                { icon: Stethoscope, role: "Doctors", price: `$${PRICING.doctor.monthly}/mo`, desc: "Directory, promotion, patient leads, full toolkit" },
                { icon: GraduationCap, role: "Students", price: `$${PRICING.student.monthly}/mo`, desc: "Jobs, Academy, ChiroMatch, monthly group call" },
                { icon: Heart, role: "Patients", price: "Free", desc: "Find a nervous system chiropractor near you" },
              ].map((r) => (
                <div key={r.role} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-neuro-orange/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <r.icon className="w-6 h-6 text-neuro-orange" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="text-xl font-black text-white">{r.role}</p>
                      <span className="text-neuro-orange font-black text-sm">{r.price}</span>
                    </div>
                    <p className="text-sm text-gray-400">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-4xl font-heading font-black text-neuro-orange">neurochiro.co/mh4</p>
        <p className="text-gray-500 mt-2 text-lg">Scan the QR code or visit the link</p>
      </div>
    </div>
  );
}

/* ─── Slide Registry ─── */
const SLIDES = [
  { id: "directory", component: SlideDirectory },
  { id: "spotlight", component: SlideSpotlight },
  { id: "value", component: SlideValueProp },
  { id: "signup", component: SlideSignup },
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
      {/* Full-screen slide */}
      <SlideComponent />

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between px-8 py-3 bg-black/60 backdrop-blur">
          <span className="text-lg font-heading font-black text-white tracking-tight">
            NEURO<span className="text-neuro-orange">CHIRO</span>
          </span>

          <div className="flex items-center gap-2">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActiveSlide(i)}
                className={`h-1.5 rounded-full transition-all ${i === activeSlide ? 'w-8 bg-neuro-orange' : 'w-2 bg-white/20'}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-white/60 font-bold">neurochiro.co/mh4</span>
            </div>
            <div className="px-4 py-2 bg-neuro-orange rounded-lg">
              <p className="text-sm font-black text-white">Join Now</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
