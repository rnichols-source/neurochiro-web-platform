"use client";

import { useState } from "react";
import { Check, ArrowRight, Shield, Users, BarChart3, MessageSquare, Briefcase, Calendar, Star, Zap } from "lucide-react";
import Link from "next/link";

export default function DoctorPricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const price = billingCycle === "monthly" ? "49" : "41";
  const period = billingCycle === "monthly" ? "/mo" : "/mo (billed annually)";
  const annualTotal = "$490/yr";

  const features = [
    { text: "Listed in the global nervous system chiropractic directory", icon: Users },
    { text: "Full profile with photo, bio, specialties, and booking link", icon: Star },
    { text: "Verified nervous system chiropractor badge", icon: Shield },
    { text: "Patient analytics (profile views, phone taps, website clicks, sources)", icon: BarChart3 },
    { text: "Patient messaging (respond to leads directly)", icon: MessageSquare },
    { text: "Job postings + ChiroMatch hiring system", icon: Briefcase },
    { text: "Seminar hosting + CE seminar calendar", icon: Calendar },
    { text: "Referral network (doctor-to-doctor referrals)", icon: Users },
    { text: "Spotlight interview eligibility (185K+ Instagram followers)", icon: Star },
    { text: "Weekly Practice Growth Report", icon: BarChart3 },
    { text: "Instagram features + city spotlights", icon: Zap },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-heading font-black text-neuro-navy uppercase tracking-tight">
          Get Found by <span className="text-neuro-orange">Patients.</span>
        </h1>
        <p className="text-gray-500 mt-3 max-w-lg mx-auto">
          The only directory for nervous system chiropractors. One plan. Everything included.
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <span className={`text-sm font-bold ${billingCycle === "monthly" ? "text-neuro-navy" : "text-gray-400"}`}>Monthly</span>
        <button
          onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")}
          className="relative w-14 h-7 bg-neuro-navy rounded-full transition-all"
        >
          <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${billingCycle === "annual" ? "left-8" : "left-1"}`} />
        </button>
        <span className={`text-sm font-bold ${billingCycle === "annual" ? "text-neuro-navy" : "text-gray-400"}`}>
          Annual <span className="text-neuro-orange text-xs">(save $98)</span>
        </span>
      </div>

      {/* Single pricing card */}
      <div className="bg-white rounded-3xl border-2 border-neuro-orange shadow-2xl shadow-neuro-orange/10 p-10 relative overflow-hidden">
        <span className="absolute -top-0 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-neuro-orange text-white text-[10px] font-black uppercase tracking-widest rounded-b-xl">
          NeuroChiro Pro
        </span>

        {/* Price */}
        <div className="text-center mt-4 mb-8">
          <div className="text-6xl font-black text-neuro-navy">${price}<span className="text-lg font-bold text-gray-400">{period}</span></div>
          {billingCycle === "annual" && (
            <p className="text-sm text-neuro-orange font-bold mt-1">{annualTotal} billed annually. Save $98.</p>
          )}
        </div>

        {/* Features */}
        <div className="space-y-4 mb-8">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-green-600" />
              </div>
              <span className="text-sm text-gray-700 leading-relaxed">{f.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/get-started"
          className="w-full py-4 bg-neuro-orange text-white font-black rounded-xl text-center text-sm uppercase tracking-wider hover:bg-neuro-orange/90 shadow-lg shadow-neuro-orange/20 transition-all flex items-center justify-center gap-2 block"
        >
          Start Your 7-Day Free Trial <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-center text-xs text-gray-400 mt-3">No credit card required. Cancel anytime.</p>
      </div>

      {/* Social proof */}
      <div className="text-center mt-8 space-y-2">
        <p className="text-sm text-gray-500 font-bold">Join 115+ nervous system chiropractors across 30+ states</p>
        <p className="text-xs text-gray-400">Founding members are locked at their original price with full access forever.</p>
      </div>

      {/* One-liner value prop */}
      <div className="mt-12 bg-neuro-navy rounded-2xl p-8 text-center">
        <p className="text-white text-lg font-bold leading-relaxed">
          "One new patient from the directory pays for <span className="text-neuro-orange">an entire year</span> of NeuroChiro Pro."
        </p>
        <p className="text-white/50 text-sm mt-2">The average new patient is worth $2,000-5,000. NeuroChiro Pro is $49/mo.</p>
      </div>

      {/* FAQ */}
      <div className="mt-12 mb-8">
        <h2 className="text-2xl font-heading font-black text-neuro-navy text-center mb-6">Common Questions</h2>
        <div className="space-y-4">
          {[
            { q: "What happens after the 7-day trial?", a: "You'll be prompted to subscribe at $49/mo (or $490/yr). If you don't subscribe, your profile goes to an unclaimed state with masked contact info. No charge during the trial." },
            { q: "Can I cancel anytime?", a: "Yes. No contracts, no cancellation fees. Cancel from your dashboard or email support. Your profile will be set to unclaimed." },
            { q: "What's the difference between NeuroChiro and NeurOS?", a: "NeuroChiro is the directory. It gets you found by patients. NeurOS is a separate practice operating system (care plans, P&L, KPIs) at neuros.co. They're different products." },
            { q: "I'm already listed. Do I need to pay?", a: "If you have a claimed profile, you're already on a plan. Check your dashboard for your current status. Founding members keep their locked price forever." },
            { q: "How do patients find me?", a: "Through the NeuroChiro directory (search by city), our Instagram (185K followers), SEO city pages, Google Ads, and the Spotlight interview series. We actively drive patient traffic to doctor profiles." },
          ].map((faq, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-bold text-neuro-navy text-sm">{faq.q}</h3>
              <p className="text-gray-500 text-sm mt-2 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
