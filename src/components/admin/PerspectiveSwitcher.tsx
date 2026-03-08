"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  User, 
  X, 
  ChevronRight, 
  ShieldCheck, 
  Sparkles,
  Smartphone,
  Check
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useDoctorTier } from "@/context/DoctorTierContext";
import { useStudentTier, StudentTier } from "@/context/StudentTierContext";
import { MembershipTier } from "@/types/directory";

export default function PerspectiveSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDev, setIsDev] = useState(false);
  const pathname = usePathname();
  
  const { tier: doctorTier, setTier: setDoctorTier } = useDoctorTier();
  const { tier: studentTier, setTier: setStudentTier } = useStudentTier();

  useEffect(() => {
    // Check if user is in dev mode
    const checkDev = () => {
      const isDevMode = localStorage.getItem("nc_dev_mode") === "true";
      setIsDev(isDevMode);
    };

    checkDev();
    
    // Check for Alt+P shortcut
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    // Listen for storage events (if they switch in another tab)
    window.addEventListener('storage', checkDev);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('storage', checkDev);
    };
  }, []);

  if (!isDev) return null;

  const isDoctorPath = pathname.includes("/doctor");
  const isStudentPath = pathname.includes("/student");

  const doctorTiers: { id: MembershipTier; label: string; desc: string }[] = [
    { id: "starter", label: "Starter", desc: "Limited visibility & tools" },
    { id: "growth", label: "Growth", desc: "Full recruiting & directory" },
    { id: "pro", label: "Elite Pro", desc: "Advanced analytics & priority" }
  ];

  const studentTiers: { id: StudentTier; label: string; desc: string }[] = [
    { id: "Free", label: "Free", desc: "Basic directory access" },
    { id: "Foundation", label: "Foundation", desc: "Mentorship & jobs" },
    { id: "Professional", label: "Professional", desc: "Advanced matching" },
    { id: "Accelerator", label: "Accelerator", desc: "Priority placement" }
  ];

  return (
    <>
      {/* Floating Toggle Trigger - Mobile Friendly */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-[9998] w-12 h-12 bg-neuro-orange text-white rounded-full flex items-center justify-center shadow-2xl border-2 border-white md:hidden animate-pulse-slow"
      >
        <ShieldCheck className="w-6 h-6" />
      </button>

      {/* Desktop Toggle Trigger */}
      <div className="fixed bottom-6 left-6 z-[9998] hidden md:block">
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-neuro-navy text-white rounded-full shadow-2xl border border-white/10 hover:bg-neuro-navy-light transition-all group"
        >
          <ShieldCheck className="w-4 h-4 text-neuro-orange" />
          <span className="text-[10px] font-black uppercase tracking-widest">Perspective Switcher</span>
          <div className="px-1.5 py-0.5 bg-white/10 rounded text-[8px] font-black text-gray-400 group-hover:text-white transition-colors">⌥ P</div>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-6">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-neuro-navy/60 backdrop-blur-md"
            />

            {/* Modal/Drawer */}
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-neuro-navy p-6 md:p-8 text-white relative">
                <div className="absolute top-0 right-0 w-48 h-48 bg-neuro-orange/10 blur-[60px] rounded-full -mr-24 -mt-24"></div>
                
                <div className="flex justify-between items-center relative z-10">
                  <div className="space-y-1">
                    <h2 className="text-neuro-orange font-black text-sm uppercase tracking-[0.2em]">Perspective Controller</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest opacity-80">Toggle Live Tier Experiences</p>
                  </div>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Tiers List */}
              <div className="p-6 md:p-8 max-h-[70vh] overflow-y-auto">
                {/* Doctor Tiers */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Doctor Experience</span>
                    {isDoctorPath && <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[8px] font-black uppercase">Viewing Now</div>}
                  </div>
                  <div className="grid gap-2">
                    {doctorTiers.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setDoctorTier(t.id);
                        }}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${
                          doctorTier === t.id 
                          ? "bg-neuro-orange/5 border-neuro-orange/30 shadow-lg shadow-neuro-orange/5" 
                          : "bg-gray-50 border-gray-100 hover:border-neuro-orange/20"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-active:scale-95 ${
                          doctorTier === t.id ? "bg-neuro-orange text-white" : "bg-white text-gray-400"
                        }`}>
                          <Zap className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-black text-sm uppercase tracking-tight ${doctorTier === t.id ? "text-neuro-navy" : "text-gray-500"}`}>{t.label}</h4>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t.desc}</p>
                        </div>
                        {doctorTier === t.id && <Check className="w-5 h-5 text-neuro-orange" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Student Tiers */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4 text-gray-400">
                    <span className="text-[10px] font-black uppercase tracking-widest">Student Experience</span>
                    {isStudentPath && <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[8px] font-black uppercase">Viewing Now</div>}
                  </div>
                  <div className="grid gap-2">
                    {studentTiers.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setStudentTier(t.id);
                        }}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${
                          studentTier === t.id 
                          ? "bg-neuro-navy/5 border-neuro-navy/30 shadow-lg shadow-neuro-navy/5" 
                          : "bg-gray-50 border-gray-100 hover:border-neuro-navy/20"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-active:scale-95 ${
                          studentTier === t.id ? "bg-neuro-navy text-white" : "bg-white text-gray-400"
                        }`}>
                          <User className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-black text-sm uppercase tracking-tight ${studentTier === t.id ? "text-neuro-navy" : "text-gray-500"}`}>{t.label}</h4>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t.desc}</p>
                        </div>
                        {studentTier === t.id && <Check className="w-5 h-5 text-neuro-navy" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 md:p-8 bg-gray-50 border-t border-gray-100 text-center space-y-4">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] px-4">
                  Changes apply immediately. You can now experience the portal as any user level.
                </p>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-full py-4 bg-neuro-navy text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs"
                >
                  Confirm Perspective
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
