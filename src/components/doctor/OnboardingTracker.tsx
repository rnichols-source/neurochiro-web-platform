"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, ArrowRight, X, Sparkles, Camera, MapPin, FileText } from "lucide-react";
import Link from "next/link";

export default function OnboardingTracker() {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(60);

  const steps = [
    { id: 1, label: "Clinic Visibility", completed: true, icon: CheckCircle2 },
    { id: 2, label: "Clinic Verification", completed: true, icon: CheckCircle2 },
    { id: 3, label: "The Trust Multiplier", completed: false, icon: Camera, bonus: "+30% Visibility" },
    { id: 4, label: "The Patient Magnet Script", completed: false, icon: FileText, bonus: "+15% Conversion" },
  ];

  if (!isVisible) return null;

  return (
    <motion.section 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-neuro-navy to-neuro-navy-dark rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl border border-white/5"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-neuro-orange/10 blur-[100px] -mr-32 -mt-32"></div>
      
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-neuro-orange">
              <Sparkles className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Conversion Engine</span>
            </div>
            <h2 className="text-3xl font-heading font-black text-white">Your profile is <span className="text-neuro-orange">{progress}%</span> complete.</h2>
            <p className="text-gray-400 text-sm max-w-md">Complete these high-impact steps to reach the top of local search results.</p>
          </div>

          <div className="flex-shrink-0">
            <Link 
              href="/doctor/profile/edit" 
              className="px-8 py-4 bg-neuro-orange text-white font-black rounded-2xl hover:bg-neuro-orange-light transition-all transform hover:scale-105 flex items-center gap-3 shadow-xl shadow-neuro-orange/20 uppercase tracking-widest text-xs"
            >
              Finish Setup <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step) => (
            <div 
              key={step.id}
              className={`p-5 rounded-[2rem] border transition-all ${
                step.completed 
                  ? "bg-white/5 border-white/10 opacity-60" 
                  : "bg-white/10 border-neuro-orange/30 hover:border-neuro-orange hover:bg-white/15 cursor-pointer"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl ${step.completed ? "bg-green-500/20 text-green-500" : "bg-neuro-orange/20 text-neuro-orange"}`}>
                  <step.icon className="w-4 h-4" />
                </div>
                {step.bonus && (
                  <span className="text-[8px] font-black text-neuro-orange uppercase tracking-widest bg-neuro-orange/10 px-2 py-1 rounded-lg">
                    {step.bonus}
                  </span>
                )}
              </div>
              <p className={`text-sm font-bold ${step.completed ? "text-gray-400" : "text-white"}`}>{step.label}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mt-1">
                {step.completed ? "Completed" : "Action Required"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
