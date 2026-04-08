"use client";

import { Tag, Sparkles, ShoppingBag, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function MarketplaceComingSoon() {
  return (
    <div className="min-h-dvh bg-[#020617] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center space-y-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex p-4 rounded-3xl bg-neuro-orange/10 border border-neuro-orange/20 text-neuro-orange mb-4"
        >
          <ShoppingBag className="w-12 h-12" />
        </motion.div>
        
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-heading font-black text-white uppercase tracking-tighter">
            Vendor Marketplace <span className="text-neuro-orange">Coming Soon</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl font-medium max-w-xl mx-auto">
            We are currently vetting elite partners to provide exclusive discounts on clinical equipment, EHR software, and practice growth services.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-8">
          {[
            { icon: Tag, label: "Exclusive Deals" },
            { icon: Sparkles, label: "Vetted Partners" },
            { icon: Clock, label: "Q2 2026 Launch" }
          ].map((item, i) => (
            <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center gap-3">
              <item.icon className="w-6 h-6 text-neuro-orange" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">{item.label}</span>
            </div>
          ))}
        </div>

        <Link 
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all font-black uppercase tracking-widest text-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Command Center
        </Link>
      </div>
    </div>
  );
}
