"use client";

import { Check, ArrowRight, Heart, ShieldCheck, Activity, Globe } from "lucide-react";
import Link from "next/link";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function PatientPricing() {
  const patientTiers = [
    {
      id: "free",
      name: "Patient Access",
      price: "0",
      description: "Access to the NeuroChiro clinical ecosystem is free for all patients.",
      features: ["Digital Health ID Card", "Personal Scan History", "Global Doctor Directory", "Clinic Booking Tools", "Health Progress Reports", "Educational Resources"],
      cta: "Create Free Account",
      featured: true,
      tag: "Always Free"
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-8 items-stretch mx-auto max-w-lg">
      {patientTiers.map((tier) => (
        <div 
          key={tier.id}
          className={cn(
            "bg-white rounded-[3rem] p-12 flex flex-col border transition-all duration-500 hover:shadow-2xl relative border-neuro-orange shadow-xl scale-105 z-10"
          )}
        >
          {tier.tag && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-neuro-orange text-white text-[10px] font-black uppercase tracking-widest px-8 py-2.5 rounded-full shadow-lg">
              {tier.tag}
            </div>
          )}
          
          <div className="mb-10 text-center">
            <h3 className="text-3xl font-black text-neuro-navy mb-3">{tier.name}</h3>
            <div className="flex items-end justify-center gap-1 mb-6">
              <span className="text-5xl font-black text-neuro-navy">$0</span>
              <span className="text-gray-400 font-bold mb-1 uppercase tracking-widest text-xs">For Life</span>
            </div>
            <p className="text-gray-500 text-lg font-medium leading-relaxed">{tier.description}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-12">
            {tier.features.map((f) => (
              <div key={f} className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="mt-0.5 w-6 h-6 rounded-full bg-neuro-orange/10 text-neuro-orange flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-neuro-navy">{f}</span>
              </div>
            ))}
          </div>

          <Link 
            href="/register?role=patient"
            className="w-full py-6 bg-neuro-orange text-white hover:bg-neuro-orange-dark rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-neuro-orange/30 transition-all flex items-center justify-center gap-3 transform hover:-translate-y-1"
          >
            {tier.cta} <ArrowRight className="w-5 h-5" />
          </Link>

          <div className="mt-12 pt-10 border-t border-gray-100 grid grid-cols-3 gap-4 text-center">
             <div className="space-y-2">
                <Globe className="w-6 h-6 text-gray-300 mx-auto" />
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Global Network</p>
             </div>
             <div className="space-y-2">
                <ShieldCheck className="w-6 h-6 text-gray-300 mx-auto" />
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Privacy First</p>
             </div>
             <div className="space-y-2">
                <Activity className="w-6 h-6 text-gray-300 mx-auto" />
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Health Insights</p>
             </div>
          </div>
        </div>
      ))}
    </div>
  );
}
