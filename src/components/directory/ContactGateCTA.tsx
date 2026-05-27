"use client";

import { Lock } from "lucide-react";
import Link from "next/link";

interface ContactGateCTAProps {
  variant: 'sidebar' | 'hero' | 'mobile';
}

export default function ContactGateCTA({ variant }: ContactGateCTAProps) {
  if (variant === 'mobile') {
    return (
      <Link href="/pricing" className="flex-1 py-3.5 bg-neuro-navy text-white rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2">
        <Lock className="w-4 h-4" /> Unlock Contact Info
      </Link>
    );
  }

  if (variant === 'hero') {
    return (
      <div className="px-6 py-3 bg-white/10 text-white/70 rounded-xl text-sm flex items-center gap-2 border border-white/20">
        <Lock className="w-4 h-4" />
        <span>Contact info available for <Link href="/pricing" className="text-neuro-orange font-bold hover:underline">Pro</Link> members</span>
      </div>
    );
  }

  // sidebar
  return (
    <div className="w-full py-4 px-4 bg-gray-50 rounded-xl text-center space-y-2 border border-gray-100">
      <div className="flex items-center justify-center gap-2 text-gray-400">
        <Lock className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">Contact Info Locked</span>
      </div>
      <p className="text-xs text-gray-500">Phone, website, and social links are available for Pro members.</p>
      <Link href="/pricing" className="inline-block mt-1 px-5 py-2.5 bg-neuro-orange text-white font-bold rounded-lg text-xs hover:bg-neuro-orange/90 transition-colors">
        View Plans
      </Link>
    </div>
  );
}
