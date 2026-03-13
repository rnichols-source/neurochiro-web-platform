"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, MapPin, Briefcase, Sparkles, Star, ArrowRight, Check, TrendingUp, Zap } from "lucide-react";

const MOCK_JOBS = [
  {
    id: "job_1",
    clinic: "Vitality Neuro-Life",
    location: "Austin, TX",
    role: "Associate Chiropractor",
    match: "98% Match",
    tags: ["Pediatrics", "Neurology"],
    salary: "$85k - $120k",
    roi: "400+ visits/week",
    mentorship: "$25k/yr CE Included",
    careerValue: "$150k Career Accelerator",
    image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "job_2",
    clinic: "Apex Spinal Center",
    location: "Denver, CO",
    role: "Preceptorship",
    match: "94% Match",
    tags: ["Sports", "Performance"],
    salary: "Stipend + Housing",
    roi: "High-Volume Training",
    mentorship: "Owner-Direct Mentorship",
    careerValue: "Elite Track Internship",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "job_3",
    clinic: "The Well Family",
    location: "Charlotte, NC",
    role: "Growth Associate",
    match: "91% Match",
    tags: ["Family", "Tonal"],
    salary: "$75k + Bonus",
    roi: "Subluxation-Based",
    mentorship: "Accelerator Certification",
    careerValue: "Partner-Path Asset",
    image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=400"
  }
];

export default function JobRadar() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [action, setAction] = useState<"save" | "apply" | null>(null);

  const currentJob = MOCK_JOBS[currentIndex];

  const handleAction = (type: "save" | "apply") => {
    setAction(type);
    setTimeout(() => {
      setAction(null);
      if (currentIndex < MOCK_JOBS.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(0); // Reset for demo purposes
      }
    }, 600);
  };

  return (
    <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[500px]">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-neuro-navy text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-neuro-orange" />
          <h2 className="text-sm font-black uppercase tracking-widest">Opportunity Radar</h2>
        </div>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg">Based on Interests</span>
      </div>

      <div className="flex-1 relative p-6 bg-gray-50/50">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95, x: action === "apply" ? 100 : action === "save" ? -100 : 0 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: action === "apply" ? 200 : action === "save" ? -200 : 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="w-full h-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col"
          >
            {/* Job Image */}
            <div className="h-32 bg-gray-200 relative">
              <img loading="lazy" decoding="async" src={currentJob.image} className="w-full h-full object-cover opacity-80" alt={currentJob.clinic} />
              <div className="absolute top-4 left-4 bg-neuro-orange text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg">
                {currentJob.match}
              </div>
            </div>

            {/* Job Details */}
            <div className="p-6 flex-1 flex flex-col">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-neuro-navy leading-tight">{currentJob.role}</h3>
                  <p className="text-sm font-bold text-gray-400">{currentJob.clinic}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-2 py-1 rounded-lg">{(currentJob as any).careerValue}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                  <MapPin className="w-3.5 h-3.5" /> {currentJob.location}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                  <Briefcase className="w-3.5 h-3.5" /> {currentJob.salary}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-neuro-orange font-black uppercase tracking-tighter">
                  <TrendingUp className="w-3 h-3" /> ROI: {(currentJob as any).roi}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-blue-600 font-black uppercase tracking-tighter">
                  <Zap className="w-3 h-3 fill-current" /> {(currentJob as any).mentorship}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {currentJob.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[9px] font-black text-gray-400 uppercase tracking-widest">{tag}</span>
                ))}
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
        <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-neuro-orange transition-colors">
          View All {MOCK_JOBS.length}+ Opportunities
        </button>
      </div>
    </section>
  );
}
