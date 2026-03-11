"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingSearch() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (location) params.set("location", location);
    router.push(`/directory?${params.toString()}`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.8 }}
      className="w-full max-w-4xl mx-auto mt-12 px-4 relative"
    >
      {/* Search Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-neuro-orange/20 to-blue-500/20 rounded-[3rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <form 
        onSubmit={handleSearch}
        className="relative bg-white/10 backdrop-blur-2xl border border-white/20 p-2.5 rounded-[3rem] flex flex-col md:flex-row gap-2 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] group focus-within:border-neuro-orange/50 focus-within:bg-white/15 transition-all duration-500"
      >
        <div className="flex-1 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-neuro-orange group-focus-within:scale-110 transition-all duration-300" />
          <input 
            type="text" 
            placeholder="Specialty or condition..." 
            className="w-full pl-14 pr-4 py-5 bg-transparent border-none focus:outline-none text-white font-bold text-lg placeholder:text-gray-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="hidden md:block w-px h-10 bg-white/10 self-center" />
        
        <div className="flex-1 relative">
          <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-neuro-orange group-focus-within:animate-pulse transition-colors" />
          <input 
            type="text" 
            placeholder="City, State, or Zip..." 
            className="w-full pl-14 pr-4 py-5 bg-transparent border-none focus:outline-none text-white font-bold text-lg placeholder:text-gray-500"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <motion.button 
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-neuro-orange hover:bg-neuro-orange-light text-white px-12 py-5 rounded-[2.5rem] font-black uppercase tracking-widest transition-all shadow-2xl shadow-neuro-orange/40 flex items-center justify-center gap-3 group/btn relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-shimmer" />
          <span className="relative z-10">Find Doctor</span>
          <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform relative z-10" />
        </motion.button>
      </form>
      
      <div className="mt-8 flex flex-wrap justify-center gap-8 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
        {[
          { label: "Verified Clinicians", color: "bg-neuro-orange" },
          { label: "Evidence Based", color: "bg-neuro-orange" },
          { label: "Global Network", color: "bg-blue-500" }
        ].map((badge, i) => (
          <motion.span 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 + (i * 0.1) }}
            className="flex items-center gap-3 group/badge cursor-default"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${badge.color} group-hover/badge:scale-150 transition-transform shadow-[0_0_8px_rgba(214,104,41,0.5)]`} /> 
            {badge.label}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}
