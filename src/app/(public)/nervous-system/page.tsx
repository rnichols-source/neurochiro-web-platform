"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  Activity, 
  Wind, 
  Brain as BrainIcon, 
  ArrowRight, 
  ShieldCheck, 
  Search,
  ChevronRight,
  Info
} from "lucide-react";
import Link from "next/link";

// --- Types & Data ---
type SystemKey = "brain" | "spinal-cord" | "vagus" | "autonomic";

const SYSTEMS: Record<SystemKey, any> = {
  "brain": {
    title: "The Brain",
    subtitle: "The CEO",
    controls: ["Decision Making", "Emotional Balance", "Sensory Processing"],
    dysregulation: "Brain fog, chronic anxiety, and difficulty focusing.",
    chiro: "Chiropractic care supports the brain by improving the quality of sensory input it receives from the body.",
    color: "bg-blue-500",
    glow: "shadow-blue-500/50"
  },
  "spinal-cord": {
    title: "Spinal Cord",
    subtitle: "The Highway",
    controls: ["Brain-Body Communication", "Reflexes", "Motor Signals"],
    dysregulation: "Physical tension, persistent discomfort, and 'disconnected' feelings.",
    chiro: "Focusing on spinal alignment helps ensure the neural 'highway' remains clear of mechanical interference.",
    color: "bg-neuro-orange",
    glow: "shadow-neuro-orange/50"
  },
  "vagus": {
    title: "Vagus Nerve",
    subtitle: "The Brake Pedal",
    controls: ["Heart Rate", "Digestion", "Inflammation Control"],
    dysregulation: "Digestive issues, inability to relax, and poor sleep quality.",
    chiro: "Gentle adjustments can support Vagus nerve tone, helping your body shift into 'Rest and Digest' mode.",
    color: "bg-purple-500",
    glow: "shadow-purple-500/50"
  },
  "autonomic": {
    title: "Autonomic System",
    subtitle: "The Balance Scale",
    controls: ["Sympathetic (Action)", "Parasympathetic (Rest)", "Survival Response"],
    dysregulation: "Feeling 'tired but wired,' burnout, and hormonal imbalances.",
    chiro: "We aim to balance the 'gas' and 'brake' pedals, allowing your body to adapt to stress more effectively.",
    color: "bg-green-500",
    glow: "shadow-green-500/50"
  }
};

export default function NervousSystemExperience() {
  const [activeSystem, setActiveSystem] = useState<SystemKey>("brain");

  return (
    <div className="min-h-screen bg-[#0B1118] text-white selection:bg-neuro-orange/30">
      
      <main className="relative pt-32 px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* 2. THE VISUAL CANVAS (Left) */}
        <div className="lg:col-span-7 relative aspect-square lg:h-[70vh] flex items-center justify-center">
          
          {/* Silhouette Placeholder (In production, this is the 3D R3F Canvas) */}
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-transparent to-neuro-orange/10 rounded-full blur-[120px]"></div>
            
            {/* SVG Interactive Anatomy */}
            <svg viewBox="0 0 200 400" className="w-full h-full drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              {/* Brain */}
              <motion.circle 
                cx="100" cy="40" r="25" 
                className={`cursor-pointer transition-all duration-500 ${activeSystem === 'brain' ? 'fill-blue-500' : 'fill-white/10'}`}
                whileHover={{ scale: 1.1 }}
                onClick={() => setActiveSystem('brain')}
              />
              {/* Spinal Cord */}
              <motion.rect 
                x="97" y="65" width="6" height="280" rx="3"
                className={`cursor-pointer transition-all duration-500 ${activeSystem === 'spinal-cord' ? 'fill-neuro-orange' : 'fill-white/10'}`}
                onClick={() => setActiveSystem('spinal-cord')}
              />
              {/* Vagus Nerve Branches */}
              <motion.path 
                d="M100 70 Q 130 150 110 250" fill="none" strokeWidth="3"
                className={`cursor-pointer transition-all duration-500 ${activeSystem === 'vagus' ? 'stroke-purple-500' : 'stroke-white/5'}`}
                onClick={() => setActiveSystem('vagus')}
              />
              <motion.path 
                d="M100 70 Q 70 150 90 250" fill="none" strokeWidth="3"
                className={`cursor-pointer transition-all duration-500 ${activeSystem === 'vagus' ? 'stroke-purple-500' : 'stroke-white/5'}`}
                onClick={() => setActiveSystem('vagus')}
              />
            </svg>

            {/* Floating Hotspot Labels */}
            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 text-center pointer-events-none">
               <div className={`w-3 h-3 rounded-full mx-auto mb-2 animate-pulse ${SYSTEMS[activeSystem].color}`}></div>
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Scanning System...</span>
            </div>
          </div>
        </div>

        {/* 3. DYNAMIC INSIGHT PANEL (Right) */}
        <div className="lg:col-span-5 space-y-8">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeSystem}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden"
            >
              {/* Animated Glow in Card */}
              <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20 ${SYSTEMS[activeSystem].color}`}></div>

              <header className="mb-10">
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block text-white ${SYSTEMS[activeSystem].color}`}>
                  {SYSTEMS[activeSystem].subtitle}
                </span>
                <h1 className="text-5xl font-heading font-black leading-tight">
                  {SYSTEMS[activeSystem].title}
                </h1>
              </header>

              <div className="space-y-10">
                {/* Section 1: Controls */}
                <section>
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-neuro-orange" /> What it Controls
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {SYSTEMS[activeSystem].controls.map((c: string) => (
                      <span key={c} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold">
                        {c}
                      </span>
                    ))}
                  </div>
                </section>

                {/* Section 2: Dysregulation */}
                <section>
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-red-400" /> Signs of Dysregulation
                  </h3>
                  <p className="text-gray-400 leading-relaxed font-medium">
                    {SYSTEMS[activeSystem].dysregulation}
                  </p>
                </section>

                {/* Section 3: Chiro Connection */}
                <section className="pt-8 border-t border-white/5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-neuro-orange/10 flex items-center justify-center text-neuro-orange shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white mb-2">The NeuroChiro Connection</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {SYSTEMS[activeSystem].chiro}
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Interaction Menu */}
          <div className="grid grid-cols-2 gap-4">
            {(Object.keys(SYSTEMS) as SystemKey[]).map((key) => (
              <button 
                key={key}
                onClick={() => setActiveSystem(key)}
                className={`p-4 rounded-2xl border transition-all text-left group ${
                  activeSystem === key 
                  ? 'bg-white/10 border-white/20' 
                  : 'bg-transparent border-white/5 hover:border-white/10'
                }`}
              >
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${activeSystem === key ? 'text-neuro-orange' : 'text-gray-600'}`}>
                  Explore
                </p>
                <p className="text-sm font-bold flex items-center justify-between">
                  {SYSTEMS[key].title}
                  <ChevronRight className={`w-4 h-4 transition-transform ${activeSystem === key ? 'translate-x-1 text-white' : 'text-gray-700'}`} />
                </p>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* 4. CALL TO ACTION: DIRECTORY CONNECTION */}
      <section className="py-32 px-8 text-center mt-32 border-t border-white/5 bg-gradient-to-b from-transparent to-neuro-navy/30">
        <div className="max-w-3xl mx-auto">
          <div className="w-20 h-20 bg-neuro-navy rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl border border-white/5">
            <Search className="w-8 h-8 text-neuro-orange" />
          </div>
          <h2 className="text-4xl md:text-5xl font-heading font-black mb-6">Experience the difference of a regulated system.</h2>
          <p className="text-gray-400 text-lg mb-12 leading-relaxed">
            NeuroChiro doctors are specifically trained to assess and support the health of your nervous system. Find a clinical expert in your region.
          </p>
          <Link 
            href="/directory" 
            className="inline-flex items-center gap-3 px-12 py-5 bg-neuro-orange hover:bg-neuro-orange-light text-white font-black uppercase tracking-widest rounded-2xl shadow-2xl transition-all transform hover:scale-105"
          >
            Find a NeuroChiro Doctor <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="p-12 text-center text-[10px] font-black uppercase tracking-[0.5em] text-gray-700">
        Educational Exhibit &bull; NeuroChiro Platform v1.0
      </footer>
    </div>
  );
}
