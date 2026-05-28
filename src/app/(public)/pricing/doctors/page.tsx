"use client";

import { Check, X, Zap, Star } from "lucide-react";
import Link from "next/link";

export default function DoctorPricing() {
  const tiers = [
    {
      name: "Free",
      price: "0",
      period: "forever",
      description: "Get listed. Start getting found.",
      cta: "Get Started Free",
      ctaLink: "/get-started",
      highlight: false,
      features: [
        { text: "Listed in global directory", included: true },
        { text: "Public profile page", included: true },
        { text: "Map pin with your location", included: true },
        { text: "Up to 2 specialties shown", included: true },
        { text: "Browse seminars & marketplace", included: true },
        { text: "Phone & contact info visible", included: false },
        { text: "Website & booking link", included: false },
        { text: "Social media links", included: false },
        { text: "Photo on directory cards", included: false },
        { text: "Verified badge", included: false },
        { text: "Analytics dashboard", included: false },
        { text: "Patient leads & messaging", included: false },
        { text: "Priority search ranking", included: false },
        { text: "Practice tools (AI, KPI, Care Plans)", included: false },
      ],
    },
    {
      name: "Pro",
      price: "49",
      period: "/mo",
      description: "Everything unlocked. Patients can reach you.",
      cta: "Upgrade to Pro",
      ctaLink: "/get-started",
      highlight: true,
      badge: "Everything Included",
      features: [
        { text: "Full directory listing", included: true },
        { text: "Contact info visible to patients", included: true },
        { text: "Phone, website, booking link", included: true },
        { text: "Instagram & social links", included: true },
        { text: "Photo on directory cards", included: true },
        { text: "Verified badge", included: true },
        { text: "Priority search ranking", included: true },
        { text: "Analytics dashboard", included: true },
        { text: "Patient leads & messaging", included: true },
        { text: "KPI Tracker", included: true },
        { text: "AI Bio Generator", included: true },
        { text: "Care Plan Builder", included: true },
        { text: "Scan Report Generator", included: true },
        { text: "ChiroMatch hiring", included: true },
        { text: "CE Tracker + certificates", included: true },
        { text: "Content Library", included: true },
        { text: "P&L Analyzer", included: true },
        { text: "Referral Network", included: true },
      ],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-heading font-black text-neuro-navy uppercase tracking-tight">
          Simple <span className="text-neuro-orange">Pricing.</span>
        </h1>
        <p className="text-gray-500 mt-3 max-w-lg mx-auto">
          Free to get listed. $49/mo to unlock everything. No contracts, cancel anytime.
        </p>
        <p className="text-neuro-orange text-sm font-bold mt-2">
          One new patient pays for a full year of NeuroChiro.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 max-w-3xl mx-auto">
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
              <span className="text-5xl font-black text-neuro-navy">${tier.price}</span>
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
              {tier.highlight && <Zap className="w-4 h-4 inline mr-2" />}
              {tier.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* Why NeuroChiro vs Google */}
      <div className="max-w-3xl mx-auto mb-12">
        <h2 className="text-2xl font-heading font-black text-neuro-navy text-center mb-6">
          Why NeuroChiro <span className="text-neuro-orange">vs. Google?</span>
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-5 font-bold text-gray-400 text-xs uppercase tracking-wider"></th>
                <th className="py-3 px-4 font-bold text-gray-400 text-xs uppercase tracking-wider text-center">Google</th>
                <th className="py-3 px-4 font-bold text-neuro-orange text-xs uppercase tracking-wider text-center">NeuroChiro Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                ["General search listing", true, true],
                ["Nervous-system-specific directory", false, true],
                ["Patients pre-filtered for your specialty", false, true],
                ["Verified nervous system practitioner badge", false, true],
                ["Practice analytics & KPI tracking", false, true],
                ["Care Plan Builder", false, true],
                ["AI Bio Generator", false, true],
                ["ChiroMatch hiring system", false, true],
                ["CE credit tracker", false, true],
                ["Doctor referral network", false, true],
              ].map(([feature, google, nc], i) => (
                <tr key={i}>
                  <td className="py-2.5 px-5 text-gray-700 font-medium">{feature as string}</td>
                  <td className="py-2.5 px-4 text-center">{google ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-gray-300 mx-auto" />}</td>
                  <td className="py-2.5 px-4 text-center">{nc ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-gray-300 mx-auto" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">
          Google shows everyone. NeuroChiro shows patients who are already looking for nervous system chiropractors — zero wasted traffic.
        </p>
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
