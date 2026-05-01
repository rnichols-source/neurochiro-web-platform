"use client";

import { useState } from "react";
import { Check, X, ArrowRight, Zap, Crown, Star, ShieldCheck } from "lucide-react";
import Link from "next/link";
import SocialProof from "@/components/landing/SocialProof";

export default function DoctorPricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const growthPrice = billingCycle === "monthly" ? "69" : "59";
  const proPrice = billingCycle === "monthly" ? "129" : "109";
  const growthAnnualTotal = "$708/yr";
  const proAnnualTotal = "$1,308/yr";

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-heading font-black text-neuro-navy uppercase tracking-tight">
          Start Free. <span className="text-neuro-orange">Upgrade When Ready.</span>
        </h1>
        <p className="text-gray-500 mt-4 text-lg max-w-xl mx-auto">
          Get listed in the global directory for free. Upgrade to unlock premium tools that grow your practice.
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-4 mb-10">
        <span className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-neuro-navy' : 'text-gray-400'}`}>Monthly</span>
        <button
          onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
          className="relative w-14 h-7 bg-neuro-navy rounded-full transition-colors"
        >
          <div className={`absolute top-0.5 w-6 h-6 bg-neuro-orange rounded-full transition-all ${billingCycle === 'annual' ? 'left-7' : 'left-0.5'}`} />
        </button>
        <span className={`text-sm font-bold ${billingCycle === 'annual' ? 'text-neuro-navy' : 'text-gray-400'}`}>
          Annual <span className="text-green-500 text-xs font-black">(Save 15%)</span>
        </span>
      </div>

      {/* 3 Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* FREE */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-black text-neuro-navy">Free</h3>
          </div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-5xl font-black text-neuro-navy">$0</span>
            <span className="text-gray-400 font-bold">/forever</span>
          </div>
          <p className="text-sm text-gray-500 mb-8">Get listed in the directory</p>

          <div className="space-y-3 mb-8">
            {[
              { name: "Directory listing", included: true },
              { name: "Profile page with photo & bio", included: true },
              { name: "Profile views count", included: true },
              { name: "Show up in patient searches", included: true },
              { name: "Patient messaging", included: false },
              { name: "Analytics dashboard", included: false },
              { name: "KPI Tracker", included: false },
              { name: "Verified badge", included: false },
              { name: "Priority search placement", included: false },
            ].map((f, i) => (
              <div key={i} className={`flex items-center gap-2 text-sm ${f.included ? 'text-gray-700' : 'text-gray-300'}`}>
                {f.included ? <Check className="w-4 h-4 text-green-500 flex-shrink-0" /> : <X className="w-4 h-4 text-gray-200 flex-shrink-0" />}
                {f.name}
              </div>
            ))}
          </div>

          <Link
            href="/register?role=doctor"
            className="w-full py-4 bg-gray-100 text-neuro-navy font-bold rounded-xl text-sm text-center flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
          >
            Get Listed Free
          </Link>
        </div>

        {/* GROWTH — POPULAR */}
        <div className="bg-white rounded-2xl border-2 border-neuro-orange p-8 relative shadow-xl shadow-neuro-orange/10">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-neuro-orange rounded-full text-[10px] font-black text-white uppercase tracking-widest">
            Most Popular
          </div>
          <div className="flex items-center gap-2 mb-4 mt-1">
            <Zap className="w-5 h-5 text-neuro-orange" />
            <h3 className="text-lg font-black text-neuro-navy">Growth</h3>
          </div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-lg text-gray-400">$</span>
            <span className="text-5xl font-black text-neuro-navy">{growthPrice}</span>
            <span className="text-gray-400 font-bold">/mo</span>
          </div>
          {billingCycle === "annual" && <p className="text-xs text-green-500 font-bold mb-2">Billed at {growthAnnualTotal}</p>}
          <p className="text-sm text-gray-500 mb-8">Everything to grow your practice</p>

          <div className="space-y-3 mb-8">
            {[
              { name: "Everything in Free", included: true },
              { name: "Patient messaging", included: true },
              { name: "Analytics dashboard", included: true },
              { name: "KPI Tracker", included: true },
              { name: "AI Bio Generator", included: true },
              { name: "Job posting", included: true },
              { name: "Referral program", included: true },
              { name: "Verified badge", included: true },
              { name: "Care Plan Builder", included: false },
              { name: "P&L Analyzer", included: false },
              { name: "Priority search placement", included: false },
            ].map((f, i) => (
              <div key={i} className={`flex items-center gap-2 text-sm ${f.included ? 'text-gray-700' : 'text-gray-300'}`}>
                {f.included ? <Check className="w-4 h-4 text-green-500 flex-shrink-0" /> : <X className="w-4 h-4 text-gray-200 flex-shrink-0" />}
                {f.name}
              </div>
            ))}
          </div>

          <Link
            href="/register?role=doctor&billing=growth"
            className="w-full py-4 bg-neuro-orange text-white font-black uppercase tracking-wider text-sm rounded-xl text-center flex items-center justify-center gap-2 hover:bg-neuro-orange-light transition-all shadow-lg shadow-neuro-orange/20"
          >
            <Zap className="w-4 h-4" /> Start with Growth
          </Link>
        </div>

        {/* PRO */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-black text-neuro-navy">Pro</h3>
          </div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-lg text-gray-400">$</span>
            <span className="text-5xl font-black text-neuro-navy">{proPrice}</span>
            <span className="text-gray-400 font-bold">/mo</span>
          </div>
          {billingCycle === "annual" && <p className="text-xs text-green-500 font-bold mb-2">Billed at {proAnnualTotal}</p>}
          <p className="text-sm text-gray-500 mb-8">Full suite — every tool unlocked</p>

          <div className="space-y-3 mb-8">
            {[
              { name: "Everything in Growth", included: true },
              { name: "Care Plan Builder", included: true },
              { name: "Scan Reports", included: true },
              { name: "P&L Analyzer", included: true },
              { name: "Contracts", included: true },
              { name: "Screenings system", included: true },
              { name: "Workshops", included: true },
              { name: "Content Library", included: true },
              { name: "Priority search placement", included: true },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                {f.name}
              </div>
            ))}
          </div>

          <Link
            href="/register?role=doctor&billing=pro"
            className="w-full py-4 bg-neuro-navy text-white font-bold rounded-xl text-sm text-center flex items-center justify-center gap-2 hover:bg-neuro-navy-light transition-all"
          >
            <Crown className="w-4 h-4" /> Start with Pro
          </Link>
        </div>
      </div>

      {/* Social Proof */}
      <div className="mt-12">
        <SocialProof variant="inline" />
      </div>

      {/* FAQ */}
      <div className="mt-12">
        <h3 className="font-bold text-neuro-navy text-center mb-6">Common Questions</h3>
        <div className="space-y-4">
          {[
            { q: "Is the free plan really free?", a: "Yes. Your directory listing is free forever. No credit card required. No time limit. You can upgrade to Growth or Pro whenever you're ready." },
            { q: "Can I start free and upgrade later?", a: "Absolutely. Most doctors start with a free listing, get some profile views, and then upgrade when they see the value. You can upgrade from your dashboard anytime." },
            { q: "Can I cancel anytime?", a: "Yes. Cancel from your dashboard anytime. No lock-in contracts, no cancellation fees. Your free listing stays even if you cancel a paid plan." },
            { q: "Will patients actually find me?", a: "NeuroChiro is the only directory focused exclusively on nervous system chiropractors. Patients searching for this specific type of care find you here, not competing with generalists on Google." },
            { q: "What's the difference between Growth and Pro?", a: "Growth unlocks patient messaging, analytics, KPI tracking, and the verified badge. Pro adds the Care Plan Builder, Scan Reports, P&L Analyzer, Screenings system, and priority search placement." },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="font-bold text-neuro-navy text-sm">{item.q}</p>
              <p className="text-gray-500 text-sm mt-2">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
