"use client";

import { 
  CheckCircle2, 
  ArrowLeft, 
  Zap, 
  Star, 
  Building2, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  Award,
  Users,
  MousePointerClick
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { STRIPE_PAYMENT_LINKS } from "@/lib/stripe-links";

export default function MarketplacePricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const plans = [
    {
      id: "basic",
      name: "Basic Listing",
      price: billingCycle === "monthly" ? "99" : "990",
      description: "Establish your presence in the nervous-system-first community.",
      icon: Building2,
      features: [
        "Vendor Profile Page",
        "Listing in One Category",
        "Website Link",
        "Logo Display",
        "Basic Engagement Stats"
      ],
      cta: "Start Basic",
      popular: false
    },
    {
      id: "professional",
      name: "Professional",
      price: billingCycle === "monthly" ? "299" : "2,990",
      description: "Dominant visibility and advanced clinical leadership tools.",
      icon: Zap,
      features: [
        "Listing in Multiple Categories",
        "Enhanced Vendor Profile",
        "Product Photo Gallery",
        "Direct Demo Booking Link",
        "Verified Professional Badge",
        "Priority Search Ranking"
      ],
      cta: "Join Professional",
      popular: true
    },
    {
      id: "partner",
      name: "Featured Partner",
      price: billingCycle === "monthly" ? "799" : "7,990",
      description: "The ultimate clinical integration for market leaders.",
      icon: Star,
      features: [
        "Homepage Hero Placement",
        "Featured Category Listing",
        "Official 'NeuroChiro Partner' Badge",
        "Sponsored Content Opportunities",
        "Spotlight Vendor Feature",
        "Full Analytics Dashboard"
      ],
      cta: "Apply for Partnership",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-neuro-cream pt-24 pb-20 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <Link href="/marketplace" className="inline-flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-neuro-orange transition-colors mb-12 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Marketplace
        </Link>

        <div className="text-center mb-20 space-y-6">
           <h1 className="text-5xl md:text-7xl font-heading font-black text-neuro-navy leading-tight">
              Simple Pricing. <br/>
              <span className="text-neuro-orange">Unlimited Scale.</span>
           </h1>
           <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Join the NeuroChiro Marketplace and connect your brand with the world's most innovative chiropractic clinics.
           </p>

           {/* Billing Cycle Toggle */}
           <div className="flex items-center justify-center gap-4">
             <span className={`text-xs font-black uppercase tracking-widest transition-colors ${billingCycle === 'monthly' ? 'text-neuro-navy' : 'text-gray-400'}`}>Monthly</span>
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
               <span className={`text-xs font-black uppercase tracking-widest transition-colors ${billingCycle === 'annual' ? 'text-neuro-navy' : 'text-gray-400'}`}>Annual</span>
               <span className="bg-green-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm">2 Months Free</span>
             </div>
           </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
           {plans.map((plan) => (
             <motion.div 
               key={plan.id}
               whileHover={{ y: -10 }}
               className={`relative bg-white rounded-[3rem] p-10 border shadow-sm flex flex-col h-full ${plan.popular ? 'border-neuro-orange ring-4 ring-neuro-orange/10' : 'border-gray-100'}`}
             >
                {plan.popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-neuro-orange text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                    Most Popular
                  </div>
                )}

                <div className="mb-10">
                   <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${plan.popular ? 'bg-neuro-orange text-white' : 'bg-neuro-navy text-white'}`}>
                      <plan.icon className="w-8 h-8" />
                   </div>
                   <h3 className="text-3xl font-black text-neuro-navy mb-2">{plan.name}</h3>
                   <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-neuro-navy">${plan.price}</span>
                      <span className="text-gray-400 text-sm font-bold">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                   </div>
                   {billingCycle === 'annual' && (
                      <p className="text-[10px] font-bold text-green-600 uppercase tracking-tighter mt-1">Includes 2 Months Free</p>
                   )}
                   <p className="text-gray-500 text-sm mt-4 leading-relaxed">{plan.description}</p>
                </div>

                <div className="space-y-4 mb-12 flex-1">
                   {plan.features.map((feature, i) => (
                     <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 className={`w-5 h-5 shrink-0 ${plan.popular ? 'text-neuro-orange' : 'text-green-500'}`} />
                        <span className="text-sm font-bold text-neuro-navy/80">{feature}</span>
                     </div>
                   ))}
                </div>

                <Link 
                  href={
                    plan.id === 'partner' 
                      ? STRIPE_PAYMENT_LINKS.vendor.partner.one_time 
                      : STRIPE_PAYMENT_LINKS.vendor.basic[billingCycle]
                  } 
                  className={`w-full py-5 rounded-2xl text-center font-black uppercase tracking-widest text-xs transition-all shadow-xl ${plan.popular ? 'bg-neuro-orange text-white hover:bg-neuro-orange-dark shadow-neuro-orange/20' : 'bg-neuro-navy text-white hover:bg-neuro-navy-light shadow-neuro-navy/20'}`}
                >
                   {plan.cta}
                </Link>
             </motion.div>
           ))}
        </div>

        {/* Value Prop Banner */}
        <section className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-gray-200 pt-24">
           {[
             { title: "Targeted Audience", desc: "Reach doctors who prioritize clinical excellence and tonal chiropractic.", icon: Users },
             { title: "Direct Attribution", desc: "Track every profile view, website click, and demo request in real-time.", icon: MousePointerClick },
             { title: "Brand Authority", desc: "Align your company with the trusted NeuroChiro brand and ecosystem.", icon: Award }
           ].map((prop, i) => (
             <div key={i} className="text-center space-y-4">
                <div className="w-14 h-14 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center mx-auto mb-6">
                   <prop.icon className="w-7 h-7 text-neuro-orange" />
                </div>
                <h4 className="text-xl font-black text-neuro-navy">{prop.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{prop.desc}</p>
             </div>
           ))}
        </section>
      </div>
    </div>
  );
}
