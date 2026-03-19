"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, MapPin, Briefcase, Sparkles, Star, ArrowRight, Check, TrendingUp, Zap, Loader2 } from "lucide-react";
import { getJobsForRadar } from "@/app/(student)/student/dashboard/actions";
import { applyForJob } from "@/app/(public)/jobs/actions";

export default function JobRadar() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [action, setAction] = useState<"save" | "apply" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      const data = await getJobsForRadar();
      setJobs(data);
      setLoading(false);
    }
    loadJobs();
  }, []);

  const handleAction = async (type: "save" | "apply") => {
    if (jobs.length === 0) return;
    
    const currentJob = jobs[currentIndex];
    setAction(type);

    if (type === "apply") {
      try {
        await applyForJob(currentJob.id);
      } catch (e) {
        console.error("Failed to apply:", e);
      }
    }

    setTimeout(() => {
      setAction(null);
      if (currentIndex < jobs.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(0);
      }
    }, 600);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm h-[500px] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-neuro-orange animate-spin mb-4" />
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Scanning Opportunities...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm h-[500px] flex flex-col items-center justify-center p-10 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200 mb-6">
          <Briefcase className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-neuro-navy mb-2">No Jobs in Your Area</h3>
        <p className="text-sm text-gray-500 max-w-[240px] leading-relaxed">We couldn't find any open positions matching your radar right now. Check back soon!</p>
      </div>
    );
  }

  const currentJob = jobs[currentIndex];

  return (
    <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[500px]">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-neuro-navy text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-neuro-orange" />
          <h2 className="text-sm font-black uppercase tracking-widest">Opportunity Radar</h2>
        </div>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg">Live Listings</span>
      </div>

      <div className="flex-1 relative p-6 bg-gray-50/50">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentJob.id}
            initial={{ opacity: 0, scale: 0.95, x: action === "apply" ? 100 : action === "save" ? -100 : 0 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: action === "apply" ? 200 : action === "save" ? -200 : 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="w-full h-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col"
          >
            {/* Job Image */}
            <div className="h-32 bg-gray-200 relative">
              <img 
                loading="lazy" 
                decoding="async" 
                src={currentJob.doctors?.photo_url || "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=400"} 
                className="w-full h-full object-cover opacity-80" 
                alt={currentJob.doctors?.clinic_name || "Clinic"} 
              />
              <div className="absolute top-4 left-4 bg-neuro-orange text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg">
                Verified Opportunity
              </div>
            </div>

            {/* Job Details */}
            <div className="p-6 flex-1 flex flex-col">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-neuro-navy leading-tight">{currentJob.title}</h3>
                  <p className="text-sm font-bold text-gray-400">{currentJob.doctors?.clinic_name || "Private Practice"}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-2 py-1 rounded-lg">{currentJob.type}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                  <MapPin className="w-3.5 h-3.5" /> {currentJob.location}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                  <Briefcase className="w-3.5 h-3.5" /> {currentJob.salary_range || "Competitive"}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-neuro-orange font-black uppercase tracking-tighter">
                  <TrendingUp className="w-3 h-3" /> ROI Focus
                </div>
                <div className="flex items-center gap-2 text-[10px] text-blue-600 font-black uppercase tracking-tighter">
                  <Zap className="w-3 h-3 fill-current" /> Expert Mentorship
                </div>
              </div>

              {/* Interaction Buttons */}
              <div className="mt-auto grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleAction("save")}
                  className="flex items-center justify-center gap-2 py-3 border-2 border-gray-100 rounded-2xl text-gray-400 hover:bg-gray-50 hover:text-neuro-navy transition-all group"
                >
                  <Star className="w-4 h-4 group-hover:fill-current" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Save</span>
                </button>
                <button 
                  onClick={() => handleAction("apply")}
                  className="flex items-center justify-center gap-2 py-3 bg-neuro-navy text-white rounded-2xl hover:bg-neuro-navy-light transition-all shadow-lg shadow-neuro-navy/10"
                >
                  <Check className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Apply</span>
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Visual Action Indicators */}
        <AnimatePresence>
          {action === "apply" && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
            >
              <div className="bg-green-500 text-white p-8 rounded-full shadow-2xl">
                <Check className="w-12 h-12" />
              </div>
            </motion.div>
          )}
          {action === "save" && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
            >
              <div className="bg-neuro-orange text-white p-8 rounded-full shadow-2xl">
                <Star className="w-12 h-12 fill-current" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
        <Link href="/student/jobs" className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-neuro-orange transition-colors">
          View All Opportunities
        </Link>
      </div>
    </section>
  );
}
