"use client";

import { useState } from "react";
import { Check, ArrowRight, Quote, Users, Globe, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { useRegion } from "@/context/RegionContext";
import SocialProof from "@/components/landing/SocialProof";
import { STRIPE_PAYMENT_LINKS } from "@/lib/stripe-links";

export default function DoctorPricing() {
  const { region } = useRegion();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const price = billingCycle === "monthly" ? region.pricing.doctor.starter.monthly : region.pricing.doctor.starter.annual;

  const features = [
    "Directory listing with your own profile page",
    "AI-powered bio generator to write your story",
    "Search and recruit chiropractic students",
    "Post unlimited job listings",
    "Host and list your seminars",
    "Send and receive patient referrals",
    "See your profile views, leads, and clicks",
    "Verified badge to embed on your website",
    "Message doctors, students, and patients",
    "Upload your photo and edit your profile anytime",
    "Appear higher in patient search results",
    "Collect patient transformation stories",
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-heading font-black text-neuro-navy uppercase tracking-tight">
          One Plan. <span className="text-neuro-orange">Everything Included.</span>
        </h1>
        <p className="text-gray-500 mt-4 text-lg max-w-lg mx-auto">
          Full access to every feature on the platform. No tiers, no upgrades, no locked features.
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
          Annual <span className="text-green-500 text-xs">(Save {region.currency.symbol}{Math.round(Number(region.pricing.doctor.starter.monthly) * 12 - Number(region.pricing.doctor.starter.annual))})</span>
        </span>
      </div>

      {/* Plan card */}
      <div className="bg-white rounded-2xl border-2 border-neuro-orange p-10 shadow-xl">
        <div className="text-center mb-8">
          <p className="text-xs font-black text-neuro-orange uppercase tracking-widest mb-2">Doctor Membership</p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-lg text-gray-400">{region.currency.symbol}</span>
            <span className="text-6xl font-black text-neuro-navy">{price}</span>
            <span className="text-gray-400 font-bold">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}
        </div>

        <a
          href={STRIPE_PAYMENT_LINKS.doctor[billingCycle]}
          className="w-full py-5 bg-neuro-orange text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-neuro-orange/90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-neuro-orange/20"
        >
          <Zap className="w-5 h-5" /> Get Started
        </a>
        <p className="text-center text-xs text-gray-400 mt-3">Cancel anytime. No contracts. No hidden fees.</p>
      </div>

      {/* Social Proof */}
      <div className="mt-8">
        <SocialProof variant="inline" />
      </div>

      {/* Guarantee */}
      <div className="mt-8 bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <p className="text-green-700 font-bold text-sm">30-Day Money-Back Guarantee</p>
        <p className="text-green-600 text-xs mt-1">Try NeuroChiro risk-free. If you don&apos;t see value in the first 30 days, we&apos;ll refund your payment. No questions asked.</p>
      </div>

      {/* Why Not Google? */}
      <div className="mt-12 bg-gray-50 rounded-2xl p-8 border border-gray-100">
        <h3 className="font-bold text-neuro-navy text-center mb-4">&ldquo;Why not just use Google Business Profile?&rdquo;</h3>
        <div className="space-y-3 max-w-md mx-auto">
          {[
            "Google lists every chiropractor. NeuroChiro only lists nervous system specialists. Your patients find you, not your competitors.",
            "Google doesn't verify your approach. Our badge tells patients you've been reviewed and approved by a network that understands what you do.",
            "Google doesn't offer referrals, job postings, seminar hosting, student recruiting, or messaging. We do — all in one membership.",
          ].map((point, i) => (
            <div key={i} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-neuro-orange flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600">{point}</p>
            </div>
          ))}
        </div>
      </div>
      {/* FAQ */}
      <div className="mt-12">
        <h3 className="font-bold text-neuro-navy text-center mb-6">Common Questions</h3>
        <div className="space-y-4">
          {[
            { q: "Can I cancel anytime?", a: "Yes. Cancel from your dashboard anytime. No lock-in contracts, no cancellation fees." },
            { q: "Will patients actually find me?", a: "NeuroChiro is the only directory focused exclusively on nervous system chiropractors. Patients searching for this specific type of care find you here, not competing with generalists on Google." },
            { q: "What if there aren't many doctors in my area?", a: "That's actually an advantage. Being one of the first verified specialists in your area means you get all the patient traffic for your region." },
            { q: "How long does verification take?", a: "Most profiles are reviewed within 24-48 hours. Once approved, your listing goes live in the directory immediately." },
            { q: "What's included in the membership?", a: "Everything. Directory listing, analytics, job postings, seminar hosting, student recruiting, referral network, messaging, AI bio generator, and verified badge. One price, all features." },
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
