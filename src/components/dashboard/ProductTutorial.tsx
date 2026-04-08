"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Sparkles, LayoutDashboard, Search, UserCircle, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

interface TutorialStep {
  title: string;
  description: string;
  icon: any;
  target?: string; // CSS selector if we were doing real highlights
}

export default function ProductTutorial() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tutorial") === "true") {
      setIsVisible(true);
    }
  }, []);

  const steps: TutorialStep[] = [
    {
      title: "Your Command Center",
      description: "This is your main dashboard. Here you'll find real-time analytics, patient leads, and your clinical performance pulse.",
      icon: LayoutDashboard,
    },
    {
      title: "Clinical Profile",
      description: "Manage how patients see you in the global directory. Keep your specialties and clinic photos updated for maximum reach.",
      icon: UserCircle,
    },
    {
      title: "The Talent Marketplace",
      description: "Looking for an associate or a student preceptor? The 'Recruit' tab connects you with the top neuro-focused talent.",
      icon: Search,
    },
    {
      title: "Referral Network",
      description: "Easily send and receive referrals from other verified nervous-system-first doctors across the globe.",
      icon: Sparkles,
    },
    {
      title: "System Settings",
      description: "Manage your billing, notification preferences, and account security all in one place.",
      icon: Settings,
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      closeTutorial();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const closeTutorial = () => {
    setIsVisible(false);
    // Remove tutorial param from URL without refreshing
    const url = new URL(window.location.href);
    url.searchParams.delete("tutorial");
    window.history.replaceState({}, '', url.toString());
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-neuro-navy/60 backdrop-blur-md"
          onClick={closeTutorial}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden border border-white/20"
        >
          <div className="absolute top-0 right-0 p-8">
            <button 
              onClick={closeTutorial}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-neuro-orange/10 rounded-3xl flex items-center justify-center text-neuro-orange mx-auto mb-8">
              <Sparkles className="w-10 h-10 fill-current" />
            </div>

            <div className="space-y-4 mb-10">
              <span className="text-neuro-orange font-black uppercase tracking-[0.4em] text-[10px] block">Guided Tour: {currentStep + 1}/{steps.length}</span>
              <h2 className="text-3xl font-heading font-black text-neuro-navy leading-tight">
                {steps[currentStep].title}
              </h2>
              <p className="text-gray-500 font-medium leading-relaxed">
                {steps[currentStep].description}
              </p>
            </div>

            <div className="flex items-center justify-between gap-4">
              <button 
                onClick={handleBack}
                disabled={currentStep === 0}
                className={`flex items-center gap-2 text-sm font-black uppercase tracking-widest transition-all ${
                  currentStep === 0 ? "opacity-0 pointer-events-none" : "text-gray-400 hover:text-neuro-navy"
                }`}
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentStep ? "w-6 bg-neuro-orange" : "w-1.5 bg-gray-200"
                    }`}
                  />
                ))}
              </div>

              <button 
                onClick={handleNext}
                className="px-8 py-4 bg-neuro-navy text-white font-black rounded-2xl hover:bg-neuro-navy-light transition-all shadow-xl flex items-center gap-2 uppercase tracking-widest text-xs group"
              >
                {currentStep === steps.length - 1 ? "Finish" : "Next"}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-neuro-orange" />
              </button>
            </div>
          </div>

          <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
              You can replay this tutorial anytime from your settings.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
