"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Users, ShieldCheck, Globe, Sparkles, MapPin, Calendar, Check, Zap, Star } from "lucide-react";
import { STRIPE_PAYMENT_LINKS } from "@/lib/stripe-links";

type Role = "doctor" | "student";
type Billing = "monthly" | "annual";

export default function ConferenceLandingPage() {
  const [role, setRole] = useState<Role>("doctor");
  const [billing, setBilling] = useState<Billing>("monthly");

  const prices = {
    doctor: { monthly: 49, annual: 490 },
    student: { monthly: 12, annual: 120 },
  };

  const regularPrices = {
    doctor: { monthly: 69, annual: 708 },
    student: { monthly: 29, annual: 300 },
  };

  const price = prices[role][billing];
  const regularPrice = regularPrices[role][billing];
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
      "KPI tracker, care plan builder, and more",
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
          <div className="inline-flex items-center gap-2 bg-neuro-orange/15 border border-neuro-orange/30 rounded-full px-4 py-2 mb-6">
            <Star className="w-4 h-4 text-neuro-orange fill-neuro-orange" />
            <span className="text-xs font-bold text-neuro-orange uppercase tracking-wider">
              Conference Exclusive &mdash; Founding Rate
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight leading-tight mb-4 text-white">
            Get Found by Patients Looking for{" "}
            <span className="text-neuro-orange">Nervous System</span> Chiropractors
          </h1>

          <p className="text-gray-300 text-base mb-6 max-w-lg mx-auto">
            The only directory built exclusively for doctors like you.
            Start free or lock in the founding member rate &mdash; only available with this brochure.
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <div className="bg-neuro-navy-dark border-t border-white/5">
        <div className="max-w-2xl mx-auto flex justify-center divide-x divide-white/10">
          {[
            { number: "140+", label: "Doctors" },
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

      {/* Two Options */}
      <section className="px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-heading font-black text-neuro-navy text-center mb-2">
            Two Ways to Join
          </h2>
          <p className="text-sm text-gray-400 text-center mb-8">
            Start free or upgrade today and lock in the founding rate forever.
          </p>

          {/* Role selector */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-8 max-w-sm mx-auto">
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

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Option */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <div className="text-center mb-6">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  Free Listing
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-lg text-gray-400">$</span>
                  <span className="text-5xl font-black text-neuro-navy">0</span>
                  <span className="text-gray-400 font-bold">/forever</span>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {[
                  "Directory listing with your profile",
                  "Show up in patient searches",
                  "Photo, bio, and specialties",
                  "Profile view count",
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{f}</span>
                  </div>
                ))}
              </div>

              <Link
                href={`/register?role=${role}`}
                className="w-full py-4 bg-neuro-navy text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-neuro-navy/90 transition-colors text-base"
              >
                Get Listed
              </Link>
            </div>

            {/* Founding Rate Option */}
            <div className="bg-white rounded-2xl border-2 border-neuro-orange p-8 shadow-lg relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-neuro-orange text-white text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1 whitespace-nowrap">
                <Star className="w-3 h-3 fill-white" /> Founding Rate &mdash; Locked Forever
              </div>

              <div className="text-center mb-4">
                <p className="text-xs font-black text-neuro-orange uppercase tracking-widest mb-2">
                  Full Membership
                </p>

                {/* Billing toggle */}
                <div className="flex items-center justify-center gap-3 mb-3">
                  <span className={`text-xs font-bold ${billing === 'monthly' ? 'text-neuro-navy' : 'text-gray-400'}`}>Monthly</span>
                  <button
                    onClick={() => setBilling(billing === 'monthly' ? 'annual' : 'monthly')}
                    className="relative w-12 h-6 bg-neuro-navy rounded-full transition-colors"
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-neuro-orange rounded-full transition-all ${billing === 'annual' ? 'left-6' : 'left-0.5'}`} />
                  </button>
                  <span className={`text-xs font-bold ${billing === 'annual' ? 'text-neuro-navy' : 'text-gray-400'}`}>Annual</span>
                </div>

                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-lg text-gray-400">$</span>
                  <span className="text-5xl font-black text-neuro-navy">{price}</span>
                  <span className="text-gray-400 font-bold">/{billing === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  <span className="line-through">${regularPrice}/{billing === 'monthly' ? 'mo' : 'yr'}</span>
                  <span className="text-green-600 font-bold ml-2">Save ${regularPrice - price}/{billing === 'monthly' ? 'mo' : 'yr'}</span>
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {features[role].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-neuro-orange flex-shrink-0" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>

              <a
                href={paymentLink}
                className="w-full py-4 bg-neuro-orange text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-neuro-orange/90 transition-colors text-base"
              >
                <Zap className="w-5 h-5" /> Lock In Founding Rate
              </a>

              <p className="text-center text-xs text-gray-400 mt-3">
                This price is locked forever. Cancel anytime.
              </p>
            </div>
          </div>

          {/* Guarantee */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center mt-6">
            <p className="text-green-700 font-bold text-sm">30-Day Money-Back Guarantee</p>
            <p className="text-green-600 text-xs mt-1">Not satisfied? Full refund within 30 days. No questions asked.</p>
          </div>

          {/* Already a member */}
          <p className="text-center text-xs text-gray-400 mt-4">
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
              Want to reach 140+ nervous system chiropractors?{" "}
              <a href="mailto:support@neurochirodirectory.com" className="text-neuro-orange font-bold hover:underline">
                Email us
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
          neurochiro.co
        </p>
      </div>
    </div>
  );
}
