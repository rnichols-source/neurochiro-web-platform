"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  LayoutDashboard, 
  UserCircle, 
  Bell,
  PlayCircle
} from "lucide-react";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const role = searchParams.get("role") || "doctor";
  const tier = searchParams.get("tier") || "growth";

  return (
    <div className="min-h-dvh bg-neuro-cream flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-neuro-orange/5 blur-[140px] rounded-full -mr-40 pointer-events-none"></div>
      
      <div className="max-w-2xl w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-gray-100 p-10 md:p-16 text-center relative z-10"
        >
          <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-emerald-500 mx-auto mb-10 shadow-inner">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-4 mb-12">
            <span className="text-neuro-orange font-black uppercase tracking-[0.4em] text-[10px] block">Membership Activated</span>
            <h1 className="text-4xl md:text-5xl font-heading font-black text-neuro-navy leading-tight">
              Welcome to the <br/>
              <span className="text-neuro-orange">NeuroChiro Network.</span>
            </h1>
            <p className="text-gray-500 text-lg font-medium max-w-md mx-auto">
              Your {tier} {role} account is now active. You have full access to the clinical ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 text-left space-y-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-neuro-navy shadow-sm">
                <UserCircle className="w-5 h-5" />
              </div>
              <h4 className="font-black text-sm text-neuro-navy uppercase tracking-tight">Complete Profile</h4>
              <p className="text-xs text-gray-400 leading-relaxed font-medium">Add your clinical focus and clinic photos to get verified.</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 text-left space-y-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-neuro-navy shadow-sm">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <h4 className="font-black text-sm text-neuro-navy uppercase tracking-tight">Explore Dashboard</h4>
              <p className="text-xs text-gray-400 leading-relaxed font-medium">Your central command for referrals, ROI, and tools.</p>
            </div>
          </div>

          <div className="space-y-4">
            <Link 
              href={`/onboarding?role=${role}&tier=${tier}`}
              className="w-full py-6 bg-neuro-navy text-white font-black rounded-[2rem] hover:bg-neuro-navy-light transition-all shadow-2xl flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-sm group"
            >
              Start Onboarding
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-neuro-orange" />
            </Link>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
              A confirmation email has been sent to your inbox.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-neuro-cream" />}>
      <SuccessContent />
    </Suspense>
  );
}
