"use client";

import { Check, X, Star } from "lucide-react";
import Link from "next/link";

export default function StudentPricing() {
  const tiers = [
    {
      name: "Free",
      price: "0",
      period: "forever",
      description: "Start exploring and building your career.",
      cta: "Get Started Free",
      ctaLink: "/get-started",
      highlight: false,
      features: [
        { text: "Student profile", included: true },
        { text: "Browse job listings", included: true },
        { text: "Browse seminars", included: true },
        { text: "Basic ChiroScore", included: true },
        { text: "Browse doctor directory", included: true },
        { text: "ChiroMatch participation", included: false },
        { text: "Academy courses", included: false },
        { text: "Contract Lab", included: false },
        { text: "Financial Planner", included: false },
        { text: "Messaging", included: false },
      ],
    },
    {
      name: "Premium",
      price: "12",
      period: "/mo",
      description: "Everything you need to launch your career.",
      cta: "Go Premium",
      ctaLink: "/get-started",
      highlight: true,
      badge: "Best Value",
      features: [
        { text: "Everything in Free", included: true },
        { text: "Full ChiroMatch — get matched with top practices", included: true },
        { text: "Academy courses (6 courses, 28 modules)", included: true },
        { text: "Contract Lab — AI contract review", included: true },
        { text: "Financial Planner — salary modeling", included: true },
        { text: "Interview Prep — 100+ real questions", included: true },
        { text: "Full ChiroScore (7 categories)", included: true },
        { text: "Techniques Library (18 techniques)", included: true },
        { text: "CE credit tracker + certificates", included: true },
        { text: "Direct messaging with doctors", included: true },
      ],
    },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-heading font-black text-neuro-navy uppercase tracking-tight">
          Student <span className="text-neuro-orange">Plans.</span>
        </h1>
        <p className="text-gray-500 mt-3 max-w-lg mx-auto">
          Start free. Upgrade to Premium when you&apos;re ready to launch your career.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`relative bg-white rounded-2xl border-2 p-8 flex flex-col ${
              tier.highlight ? "border-neuro-orange shadow-2xl shadow-neuro-orange/10" : "border-gray-100"
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
                  : "bg-neuro-navy text-white hover:bg-neuro-navy-light"
              }`}
            >
              {tier.cta}
            </Link>
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-400">
          No contracts. Cancel anytime. 30-day money-back guarantee.
        </p>
      </div>
    </div>
  );
}
