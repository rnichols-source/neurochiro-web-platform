"use client";

import { useState } from "react";
import { Check, Zap, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useRegion } from "@/context/RegionContext";
import { STRIPE_PAYMENT_LINKS } from "@/lib/stripe-links";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DoctorPricing() {
  const { region } = useRegion();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const doctorTiers = [
    {
      id: "starter",
      name: "Starter",
      price: region.pricing.doctor.starter[billingCycle],
      description: "Establish your presence in the nervous-system-first community.",
      features: ["Standard Directory Listing", "Basic Practice Profile", "Access to Referral Network", "Basic Profile Analytics", "Community Access"],
      cta: "Get Started",
      featured: false,
    },
    {
      id: "growth",
      name: "Growth",
      price: region.pricing.doctor.growth[billingCycle],
      description: "The complete toolkit for expanding your clinical influence.",
      features: ["Verified Badge", "Student Recruiting Tools", "Seminar Hosting (Public)", "Mentorship Directory Listing", "Traffic Source Analytics", "Enhanced Profile Display"],
      cta: "Join Growth",
      featured: true,
      tag: "Most Popular"
    },
    {
      id: "pro",
      name: "Pro",
      price: region.pricing.doctor.pro[billingCycle],
      description: "Dominant visibility and advanced clinical leadership tools.",
      features: ["Featured Directory Placement", "Priority Seminar Visibility", "Unlimited Job Postings", "Candidate Search Access", "Referral Insights Dashboard", "Advanced Analytics Suite"],
      cta: "Go Pro",
      featured: false,
    }
  ];

  return (
    <div className="space-y-12">
      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-4 mb-16">
        <span className={cn("text-xs font-black uppercase tracking-widest transition-colors", billingCycle === 'monthly' ? 'text-neuro-navy' : 'text-gray-400')}>Monthly</span>
        <button 
          onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
          className="w-14 h-7 bg-neuro-navy rounded-full relative p-1 transition-colors hover:bg-neuro-navy-light shadow-inner"
        >
          <motion.div
            animate={{ x: billingCycle === 'monthly' ? 0 : 28 }}
            className="w-5 h-5 bg-white rounded-full shadow-lg"
          />
        </button>
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-black uppercase tracking-widest transition-colors", billingCycle === 'annual' ? 'text-neuro-navy' : 'text-gray-400')}>Annual</span>
          <span className="bg-green-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm">2 Months Free</span>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mx-auto max-w-6xl">
        {doctorTiers.map((tier) => (
          <div 
            key={tier.id}
            className={cn(
              "bg-white rounded-[3rem] p-10 flex flex-col border transition-all duration-500 hover:shadow-2xl relative",
              tier.featured ? "border-neuro-orange shadow-xl scale-105 z-10" : "border-gray-100 shadow-sm"
            )}
          >
            {tier.tag && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-neuro-orange text-white text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full shadow-lg">
                {tier.tag}
              </div>
            )}
            
            <div className="mb-10 text-center">
              <h3 className="text-2xl font-black text-neuro-navy mb-3">{tier.name}</h3>
              <div className="flex flex-col items-center">
                <div className="flex items-end justify-center gap-1">
                  <span className="text-4xl font-black text-neuro-navy">{region.currency.symbol}{tier.price}</span>
                  <span className="text-gray-400 font-bold mb-1">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
                {billingCycle === 'annual' && tier.id !== 'free' && (
                  <span className="text-[9px] font-bold text-green-500 uppercase tracking-tighter mt-1">
                    Save {region.currency.symbol}{(Number(tier.price) / 10) * 2} per year
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm font-medium leading-relaxed mt-4">{tier.description}</p>
            </div>

            <div className="space-y-4 mb-10 flex-1">
              {tier.features.map((f) => (
                <div key={f} className="flex items-start gap-3">
                  <div className={cn(
                    "mt-1 w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                    tier.featured ? "bg-neuro-orange/10 text-neuro-orange" : "bg-gray-100 text-gray-400"
                  )}>
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">{f}</span>
                </div>
              ))}
            </div>

            <Link 
              href={`/register?role=doctor&tier=${tier.id}&billing=${billingCycle}`}
              className={cn(
                "w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                tier.featured 
                  ? "bg-neuro-orange text-white hover:bg-neuro-orange-dark shadow-xl shadow-neuro-orange/20" 
                  : "bg-neuro-navy text-white hover:bg-neuro-navy-light shadow-lg"
              )}
            >
              {tier.cta} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
