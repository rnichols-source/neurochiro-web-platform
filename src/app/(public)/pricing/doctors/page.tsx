"use client";

import { useState } from "react";
import { Check, X, ArrowRight, Zap, Crown, ShieldCheck, Camera, BarChart3, Users, MessageSquare, Briefcase, Award, Star } from "lucide-react";
import Link from "next/link";

export default function DoctorPricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const growthPrice = billingCycle === "monthly" ? "69" : "59";
  const proPrice = billingCycle === "monthly" ? "129" : "109";

  const tiers = [
    {
      name: "Free",
      price: "0",
      period: "forever",
      description: "Get listed and start getting found by patients.",
      cta: "Get Started Free",
      ctaLink: "/get-started",
      highlight: false,
      features: [
        { text: "Listed in global directory", included: true },
        { text: "Public profile page", included: true },
        { text: "Profile view count", included: true },
        { text: "Verified badge", included: true },
        { text: "Post 1 job listing", included: true },
        { text: "Browse seminars & marketplace", included: true },
        { text: "Instagram highlights", included: true },
        { text: "Patient lead pipeline", included: false },
        { text: "AI practice insights", included: false },
        { text: "Competitive ranking", included: false },
        { text: "Practice management tools", included: false },
      ],
    },
    {
      name: "Growth",
      price: growthPrice,
      period: billingCycle === "monthly" ? "/mo" : "/mo (billed annually)",
      description: "Everything to grow your practice and fill your schedule.",
      cta: "Start Growth",
      ctaLink: "/get-started",
      highlight: true,
      badge: "Most Popular",
      features: [
        { text: "Everything in Free", included: true },
        { text: "See WHO viewed your profile", included: true },
        { text: "Patient lead pipeline (CRM)", included: true },
        { text: "AI practice insights & weekly report", included: true },
        { text: "Competitive ranking in your city", included: true },
        { text: "Revenue intelligence & ROI tracking", included: true },
        { text: "Full analytics dashboard", included: true },
        { text: "Unlimited job postings", included: true },
        { text: "ChiroMatch participation", included: true },
        { text: "CE credit tracker + certificates", included: true },
        { text: "Doctor-to-doctor messaging", included: true },
        { text: "Monthly Instagram feature (post + story)", included: true },
        { text: "Practice management tools", included: false },
      ],
    },
    {
      name: "Pro",
      price: proPrice,
      period: billingCycle === "monthly" ? "/mo" : "/mo (billed annually)",
      description: "Every tool unlocked. The complete practice operating system.",
      cta: "Go Pro",
      ctaLink: "/get-started",
      highlight: false,
      features: [
        { text: "Everything in Growth", included: true },
        { text: "NeuroChiro Spotlight interview", included: true },
        { text: "Profile Boost (rank higher in search)", included: true },
        { text: "Care Plan Builder", included: true },
        { text: "Scan Report Generator", included: true },
        { text: "KPI Tracker", included: true },
        { text: "P&L Analyzer", included: true },
        { text: "Content Library", included: true },
        { text: "Contract Templates", included: true },
        { text: "Workshops System", included: true },
        { text: "Screenings System", included: true },
        { text: "Weekly Instagram promotion (4x/month)", included: true },
      ],
    },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-heading font-black text-neuro-navy uppercase tracking-tight">
          Choose Your <span className="text-neuro-orange">Plan.</span>
        </h1>
        <p className="text-gray-500 mt-3 max-w-lg mx-auto">
          Start free. Upgrade when you&apos;re ready. No contracts, cancel anytime.
        </p>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <span className={`text-sm font-bold ${billingCycle === "monthly" ? "text-neuro-navy" : "text-gray-400"}`}>Monthly</span>
          <button
            onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")}
            className="relative w-14 h-7 bg-neuro-navy rounded-full"
          >
            <div className={`absolute top-0.5 w-6 h-6 bg-neuro-orange rounded-full transition-all ${billingCycle === "annual" ? "left-7" : "left-0.5"}`} />
          </button>
          <span className={`text-sm font-bold ${billingCycle === "annual" ? "text-neuro-navy" : "text-gray-400"}`}>
            Annual <span className="text-green-500 text-xs">(Save 15%)</span>
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`relative bg-white rounded-2xl border-2 p-8 flex flex-col ${
              tier.highlight ? "border-neuro-orange shadow-2xl shadow-neuro-orange/10 scale-[1.02]" : "border-gray-100"
            }`}
          >
            {tier.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-neuro-orange text-white text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
                <Star className="w-3 h-3 fill-white" /> {tier.badge}
              </span>
            )}

            <div className="mb-6">
              <h2 className="text-xl font-heading font-black text-neuro-navy">{tier.name}</h2>
              <p className="text-gray-400 text-sm mt-1">{tier.description}</p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-black text-neuro-navy">${tier.price}</span>
              <span className="text-gray-400 text-sm font-bold">{tier.period}</span>
            </div>

            <div className="space-y-3 flex-1 mb-8">
              {tier.features.map((f, i) => (
                <div key={i} className="flex items-start gap-2">
                  {f.included ? (
                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                  )}
                  <span className={`text-sm ${f.included ? "text-gray-700" : "text-gray-400"}`}>{f.text}</span>
                </div>
              ))}
            </div>

            <Link
              href={tier.ctaLink}
              className={`w-full py-4 font-bold rounded-xl text-center text-sm transition-all block ${
                tier.highlight
                  ? "bg-neuro-orange text-white hover:bg-neuro-orange/90 shadow-lg shadow-neuro-orange/20"
                  : tier.name === "Free"
                  ? "bg-neuro-navy text-white hover:bg-neuro-navy-light"
                  : "bg-neuro-navy text-white hover:bg-neuro-navy-light"
              }`}
            >
              {tier.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* Founding member note */}
      <div className="text-center mb-12">
        <p className="text-xs text-gray-400">
          Founding members are locked at their original price with full Pro access forever.
        </p>
      </div>
    </div>
  );
}
