"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Rocket, 
  UserCircle, 
  LayoutDashboard, 
  Bell, 
  ShieldCheck,
  Zap,
  Target,
  Trophy,
  Loader2,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "doctor";
  const tier = searchParams.get("tier") || "growth";

  const [step, setStep] = useState(0);

  const onboardingSteps = [
    {
      title: "Welcome to the Network",
      subtitle: "You're now part of the global nervous-system-first community.",
      icon: Sparkles,
      color: "text-neuro-orange",
      bg: "bg-neuro-orange/10",
      content: (
        <div className="space-y-6">
          <p className="text-gray-500 font-medium">Your <span className="text-neuro-navy font-bold">{tier}</span> membership has been activated successfully. We've established your clinical command center.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-neuro-navy uppercase tracking-tight">Verified Status</span>
            </div>
            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-neuro-orange shadow-sm">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-neuro-navy uppercase tracking-tight">Full Feature Access</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Your First Objective",
      subtitle: "Maximize your visibility in the global directory.",
      icon: Target,
      color: "text-blue-500",
      bg: "bg-blue-50",
      content: (
        <div className="space-y-6 text-left">
          <p className="text-gray-500 font-medium">Doctors with complete profiles receive <span className="text-neuro-navy font-bold">4.2x more patient inquiries</span>. Here's what we recommend doing first:</p>
          <ul className="space-y-4">
            {[
              "Upload high-resolution clinic photos",
              "Add your clinical focus & specialties",
              "Link your online booking system",
              "Verify your clinic location"
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-4 text-sm font-bold text-neuro-navy/70">
                <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )
    },
    {
      title: "Ready for Launch",
      subtitle: "Your dashboard is ready and waiting.",
      icon: Rocket,
      color: "text-purple-500",
      bg: "bg-purple-50",
      content: (
        <div className="space-y-8">
          <p className="text-gray-500 font-medium">We've customized your experience. When you enter, we'll give you a quick 60-second tour of your new tools.</p>
          <div className="p-8 bg-neuro-navy rounded-[2.5rem] text-white relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neuro-orange/20 blur-3xl -mr-16 -mt-16"></div>
            <h4 className="font-bold mb-2">Pro Tip:</h4>
            <p className="text-sm text-gray-300">Check the 'Referral Insights' tab to see exactly how patients are finding you.</p>
          </div>
        </div>
      )
    }
  ];

  const currentStep = onboardingSteps[step];

  const nextStep = () => {
    if (step < onboardingSteps.length - 1) {
      setStep(step + 1);
    } else {
      router.push(`/${role}/dashboard?tutorial=true`);
    }
  };

  return (
    <div className="min-h-screen bg-neuro-cream flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-neuro-orange/5 blur-[160px] -mr-40 -mt-40 rounded-full"></div>
      
      <div className="w-full max-w-2xl">
        <div className="mb-12 flex justify-center gap-2">
          {onboardingSteps.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === step ? "w-12 bg-neuro-orange" : i < step ? "w-4 bg-neuro-navy" : "w-4 bg-gray-200"
              }`}
            />
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white rounded-[4rem] shadow-[0_48px_96px_-16px_rgba(0,0,0,0.1)] border border-white/40 p-10 md:p-16 text-center relative z-10"
        >
          <div className={`w-24 h-24 ${currentStep.bg} ${currentStep.color} rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner`}>
            <currentStep.icon className="w-12 h-12" />
          </div>

          <div className="space-y-4 mb-12">
            <span className="text-neuro-orange font-black uppercase tracking-[0.4em] text-[10px] block">Onboarding Stage {step + 1}</span>
            <h1 className="text-4xl md:text-5xl font-heading font-black text-neuro-navy leading-tight tracking-tight">
              {currentStep.title}
            </h1>
            <p className="text-gray-400 text-lg font-medium max-w-md mx-auto">
              {currentStep.subtitle}
            </p>
          </div>

          <div className="mb-12">
            {currentStep.content}
          </div>

          <button 
            onClick={nextStep}
            className="w-full py-6 bg-neuro-navy text-white font-black rounded-[2rem] hover:bg-neuro-navy-light transition-all shadow-2xl flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-sm group"
          >
            {step === onboardingSteps.length - 1 ? "Enter My Dashboard" : "Continue"}
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-neuro-orange" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neuro-cream" />}>
      <OnboardingContent />
    </Suspense>
  );
}
