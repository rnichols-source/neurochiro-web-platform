"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Users, ShieldCheck, Globe, Sparkles, MapPin, Calendar, Check, Zap } from "lucide-react";
import { STRIPE_PAYMENT_LINKS } from "@/lib/stripe-links";

type Role = "doctor" | "student";
type Billing = "monthly" | "annual";

export default function ConferenceLandingPage() {
  const [role, setRole] = useState<Role>("doctor");
  const [billing, setBilling] = useState<Billing>("monthly");

  const prices = {
    doctor: { monthly: 49, annual: 490 },
    student: { monthly: 9, annual: 90 },
  };

  const price = prices[role][billing];
  const paymentLink = STRIPE_PAYMENT_LINKS[role][billing];

  const features = {
    doctor: [
      "Your own profile page in the directory",
      "Found by patients searching Google",
      "AI-powered bio generator",
      "Verified badge for your website",
      "Profile views and analytics dashboard",
      "Send and receive patient referrals",
      "Post job listings and seminars",
      "Message doctors, students, and patients",
    ],
    student: [
      "Learn from top nervous system chiropractors",
      "Build your professional network early",
      "Get listed in the directory at graduation",
      "Access to job listings and clinic matching",
      "Seminar and event access",
      "Message doctors and fellow students",
      "Academy courses and resources",
      "Profile visibility to hiring clinics",
    ],
  };

  return (
    <div className="min-h-dvh bg-neuro-cream">
      {/* Hero */}
      <section className="bg-neuro-navy text-white pt-32 pb-10 px-6">
        <div className="max-w-2xl mx-auto text-center">
          {/* Event badge */}
          <div className="inline-flex items-center gap-2 bg-neuro-orange/15 border border-neuro-orange/30 rounded-full px-4 py-2 mb-6">
            <Calendar className="w-4 h-4 text-neuro-orange" />
            <span className="text-xs font-bold text-neuro-orange uppercase tracking-wider">
              New Beginnings 2026 &middot; Asbury Park, NJ
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight leading-tight mb-4 text-white">
            Get Found by Patients Looking for{" "}
            <span className="text-neuro-orange">Nervous System</span> Chiropractors
          </h1>

          <p className="text-gray-300 text-base mb-6 max-w-lg mx-auto">
            The only directory built exclusively for doctors like you.
            120+ verified chiropractors across 30+ states and 4 countries.
          </p>

          {/* Event details */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-neuro-orange" />
              <span>Berkeley Oceanfront Hotel</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neuro-orange" />
              <span>May 14-17, 2026</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="bg-neuro-navy-dark border-t border-white/5">
        <div className="max-w-2xl mx-auto flex justify-center divide-x divide-white/10">
          {[
            { number: "120+", label: "Doctors" },
            { number: "30+", label: "States" },
            { number: "4", label: "Countries" },
          ].map((stat) => (
            <div key={stat.label} className="flex-1 text-center py-4">
              <div className="text-xl font-black text-neuro-orange">{stat.number}</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing + Signup */}
      <section className="px-6 py-12">
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-heading font-black text-neuro-navy text-center mb-2">
            Join NeuroChiro
          </h2>
          <p className="text-sm text-gray-400 text-center mb-6">
            One plan. Everything included. No hidden fees.
          </p>

          {/* Role selector */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-6">
            {(["doctor", "student"] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-3 text-sm font-bold transition-colors capitalize ${
                  role === r
                    ? "bg-neuro-navy text-white"
                    : "bg-white text-gray-400 hover:bg-gray-50"
                }`}
              >
                {r === "doctor" ? "Doctor" : "Student"}
              </button>
            ))}
          </div>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className={`text-sm font-bold ${billing === 'monthly' ? 'text-neuro-navy' : 'text-gray-400'}`}>Monthly</span>
            <button
              onClick={() => setBilling(billing === 'monthly' ? 'annual' : 'monthly')}
              className="relative w-14 h-7 bg-neuro-navy rounded-full transition-colors"
            >
              <div className={`absolute top-0.5 w-6 h-6 bg-neuro-orange rounded-full transition-all ${billing === 'annual' ? 'left-7' : 'left-0.5'}`} />
            </button>
            <span className={`text-sm font-bold ${billing === 'annual' ? 'text-neuro-navy' : 'text-gray-400'}`}>
              Annual <span className="text-green-500 text-xs">
                (Save ${role === 'doctor' ? 98 : 18})
              </span>
            </span>
          </div>

          {/* Price card */}
          <div className="bg-white rounded-2xl border-2 border-neuro-orange p-8 shadow-lg mb-6">
            <div className="text-center mb-6">
              <p className="text-xs font-black text-neuro-orange uppercase tracking-widest mb-2">
                {role === "doctor" ? "Doctor" : "Student"} Membership
              </p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-lg text-gray-400">$</span>
                <span className="text-5xl font-black text-neuro-navy">{price}</span>
                <span className="text-gray-400 font-bold">/{billing === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-8">
              {features[role].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{feature}</span>
                </div>
              ))}
            </div>

            {/* Pay button — goes straight to Stripe */}
            <a
              href={paymentLink}
              className="w-full py-4 bg-neuro-orange text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-neuro-orange/90 transition-colors text-base"
            >
              <Zap className="w-5 h-5" /> Join &amp; Pay Now
            </a>

            <p className="text-center text-xs text-gray-400 mt-3">
              Secure checkout via Stripe. Cancel anytime.
            </p>
          </div>

          {/* Guarantee */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center mb-6">
            <p className="text-green-700 font-bold text-sm">30-Day Money-Back Guarantee</p>
            <p className="text-green-600 text-xs mt-1">Not satisfied? Full refund within 30 days. No questions asked.</p>
          </div>

          {/* Already a member */}
          <p className="text-center text-xs text-gray-400">
            Already a member?{" "}
            <Link href="/login" className="text-neuro-orange font-bold hover:underline">Log in</Link>
          </p>

          {/* Vendor note */}
          <div className="mt-8 bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-neuro-orange" />
              <p className="text-sm font-bold text-neuro-navy">Vendors &amp; Partners</p>
            </div>
            <p className="text-xs text-gray-500">
              Want to reach 120+ nervous system chiropractors? Grab a card at our booth or email{" "}
              <a href="mailto:support@neurochirodirectory.com" className="text-neuro-orange font-bold hover:underline">
                support@neurochirodirectory.com
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="bg-neuro-navy text-center py-8 px-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Image src="/logo-white.png" alt="NeuroChiro" width={24} height={24} />
          <span className="text-sm font-heading font-bold text-white tracking-tight">
            NEURO<span className="text-neuro-orange">CHIRO</span>
          </span>
        </div>
        <p className="text-xs text-gray-500">
          neurochiro.co &middot; New Beginnings 2026 &middot; Asbury Park, NJ
        </p>
      </div>
    </div>
  );
}
