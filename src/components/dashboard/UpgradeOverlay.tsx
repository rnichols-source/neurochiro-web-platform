"use client";

import { Lock, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface UpgradeOverlayProps {
  title: string;
  description: string;
  tierRequired: 'growth' | 'pro';
}

export default function UpgradeOverlay({ title, description, tierRequired }: UpgradeOverlayProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-20 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center"
    >
      <div className="w-14 h-14 bg-neuro-navy text-neuro-orange rounded-full flex items-center justify-center mb-6 shadow-xl border-4 border-white">
        <Lock className="w-6 h-6" />
      </div>
      
      <h4 className="text-2xl font-black text-neuro-navy mb-3 tracking-tight">
        {title}
      </h4>
      
      <p className="text-sm text-gray-500 max-w-sm mb-8 font-medium leading-relaxed">
        {description}
      </p>
      
      <Link 
        href={`/pricing?upgrade_to=${tierRequired}`}
        className="group relative px-8 py-4 bg-neuro-orange text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all overflow-hidden"
      >
        <span className="relative z-10 flex items-center gap-2">
           Upgrade to {tierRequired === 'pro' ? 'Elite Pro' : 'Growth'} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      </Link>
      
      <div className="mt-6 flex items-center gap-2 opacity-50">
        <Sparkles className="w-3 h-3 text-neuro-orange" />
        <span className="text-[8px] font-black text-neuro-navy uppercase tracking-[0.2em]">Unlock Instant Clinical Authority</span>
      </div>
    </motion.div>
  );
}
