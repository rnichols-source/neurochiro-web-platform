"use client";

import { useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRegion } from "@/context/RegionContext";

export default function StudentPricing() {
  const { region } = useRegion();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const price = billingCycle === "monthly" ? region.pricing.student.foundation.monthly : region.pricing.student.foundation.annual;

  const features = [
    "Job search and applications",
    "Clinic matching",
    "Seminar discovery and registration",
    "Academy courses (all 3 included)",
    "AI contract analysis lab",
    "Direct messaging with doctors",
    "Interview prep resources",
    "Profile visible to hiring doctors",
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-heading font-black text-neuro-navy uppercase tracking-tight">
          Launch Your <span className="text-neuro-orange">Career.</span>
        </h1>
        <p className="text-gray-500 mt-4 text-lg max-w-lg mx-auto">
          Full access to the entire NeuroChiro student platform. Find jobs, learn, and connect with practices.
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
          Annual <span className="text-green-500 text-xs">(Save {region.currency.symbol}{Math.round(Number(region.pricing.student.foundation.monthly) * 12 - Number(region.pricing.student.foundation.annual))})</span>
        </span>
      </div>

      {/* Plan card */}
      <div className="bg-white rounded-2xl border-2 border-neuro-orange p-10 shadow-xl">
        <div className="text-center mb-8">
          <p className="text-xs font-black text-neuro-orange uppercase tracking-widest mb-2">Student Membership</p>
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

        <Link
          href={`/register?role=student&billing=${billingCycle}`}
          className="w-full py-5 bg-neuro-orange text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-neuro-orange/90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-neuro-orange/20"
        >
          Get Started <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
