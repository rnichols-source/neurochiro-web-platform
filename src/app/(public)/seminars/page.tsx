"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  MapPin, 
  Users, 
  ArrowRight, 
  Search, 
  Zap, 
  Clock, 
  Star, 
  Filter, 
  Heart, 
  Loader2,
  Globe,
  Navigation,
  ChevronDown,
  X
} from "lucide-react";
import Link from "next/link";
import { useRegion } from "@/context/RegionContext";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { getSeminars, SeminarFilterOptions } from "./actions";
import nextDynamic from "next/dynamic";

const GlobalNetworkMap = nextDynamic(() => import("@/components/map/GlobalNetworkMap"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-white/5 animate-pulse flex items-center justify-center rounded-[2.5rem] border border-white/10">
      <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Initializing Seminar Map...</p>
    </div>
  )
});

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const dynamic = 'force-dynamic';

export default function SeminarHub() {
  const { region } = useRegion();
  const { toggleSave, isSaved } = useUserPreferences();
  
  const [loading, setLoading] = useState(true);
  const [seminars, setSeminars] = useState<any[]>([]);
  const [filters, setFilters] = useState<SeminarFilterOptions>({
    country: 'All',
    city: 'All',
    instructor: 'All',
    eventType: 'All',
    showPast: false
  });

  const loadSeminars = async () => {
    setLoading(true);
    const data = await getSeminars(filters);
    setSeminars(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadSeminars();
  }, [filters]);

  const handleFilterChange = (key: keyof SeminarFilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-dvh bg-[#0B1118] text-white pt-32 pb-32">
      {/* Premium Header */}
      <header className="max-w-7xl mx-auto px-8 mb-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neuro-orange/10 blur-[120px] -mr-40 -mt-40 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
          >
            <span className="w-2 h-2 rounded-full bg-neuro-orange animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neuro-orange">Global Education</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-7xl font-heading font-black tracking-tight leading-tight mb-8"
          >
            Regional <span className="text-transparent bg-clip-text bg-gradient-to-r from-neuro-orange to-orange-400">Seminars.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-xl max-w-2xl font-medium mb-12"
          >
            Master the clinical certainty and communication architecture required for a nervous-system-first practice.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link 
              href="/host-a-seminar"
              className="px-8 py-4 bg-neuro-orange text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-neuro-orange-light transition-all shadow-xl shadow-neuro-orange/20 flex items-center gap-2 group"
            >
              Host Your Seminar <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8">
        
        {/* Global Seminar Map */}
        <div className="w-full h-[500px] mb-16 relative">
          <div className="absolute inset-0 bg-neuro-orange/5 blur-[100px] rounded-full pointer-events-none"></div>
          <GlobalNetworkMap defaultLayer="seminar" />
        </div>

        {/* Discovery Bar */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-[2.5rem] flex flex-wrap items-center gap-4 mb-16 shadow-2xl">
          <div className="flex-1 min-w-[200px] relative group">
            <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-neuro-orange transition-colors" />
            <select 
              value={filters.country}
              onChange={(e) => handleFilterChange('country', e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-transparent border-none focus:outline-none text-sm font-bold appearance-none cursor-pointer"
            >
              <option value="All" className="bg-[#0B1118]">All Countries</option>
              <option value="Australia" className="bg-[#0B1118]">Australia</option>
              <option value="United States" className="bg-[#0B1118]">United States</option>
            </select>
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          <div className="flex-1 min-w-[200px] relative group">
            <Users className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-neuro-orange transition-colors" />
            <select 
              value={filters.instructor}
              onChange={(e) => handleFilterChange('instructor', e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-transparent border-none focus:outline-none text-sm font-bold appearance-none cursor-pointer"
            >
              <option value="All" className="bg-[#0B1118]">All Instructors</option>
              <option value="Dr. Raymond Nichols" className="bg-[#0B1118]">Dr. Raymond Nichols</option>
            </select>
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          <div className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/5">
            <button 
              onClick={() => handleFilterChange('showPast', false)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!filters.showPast ? 'bg-neuro-orange text-white' : 'text-gray-500 hover:text-white'}`}
            >
              Upcoming
            </button>
            <button 
              onClick={() => handleFilterChange('showPast', true)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filters.showPast ? 'bg-neuro-orange text-white' : 'text-gray-500 hover:text-white'}`}
            >
              Past
            </button>
          </div>
        </div>

        {/* Seminar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="wait">
            {loading ? (
              <div className="col-span-full py-40 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-neuro-orange mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Retrieving Education Nodes...</p>
              </div>
            ) : seminars.length > 0 ? (
              seminars.map((seminar, i) => (
                <motion.div
                  key={seminar.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "group bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden transition-all flex flex-col relative",
                    seminar.listing_tier === 'premium' ? "border-neuro-orange/40 shadow-[0_32px_64px_-16px_rgba(214,104,41,0.2)] hover:border-neuro-orange" : "hover:border-neuro-orange/50 hover:shadow-[0_32px_64px_-16px_rgba(214,104,41,0.15)]"
                  )}
                >
                  {/* Tier Badge */}
                  {seminar.listing_tier !== 'basic' && (
                    <div className={cn(
                      "absolute top-6 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] backdrop-blur-md border",
                      seminar.listing_tier === 'premium' ? "bg-neuro-orange text-white border-white/20" : "bg-white/10 text-white border-white/10"
                    )}>
                      {seminar.listing_tier === 'premium' ? 'Premium Event' : 'Featured Seminar'}
                    </div>
                  )}

                  {/* Card Image Section */}
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img loading="lazy" decoding="async" 
                      src={seminar.image_url || '/placeholder-seminar.jpg'} 
                      alt={seminar.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B1118] via-[#0B1118]/20 to-transparent" />
                    
                    {/* Location Badge */}
                    <div className="absolute top-6 left-6">
                      <div className="px-4 py-2 bg-[#0B1118]/80 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2">
                        <span className="text-sm">{seminar.country === 'Australia' ? '🇦🇺' : '🇺🇸'}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">{seminar.city}</span>
                      </div>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        toggleSave("seminars", seminar.id);
                      }}
                      className={`absolute top-6 right-6 p-3 rounded-2xl backdrop-blur-md border border-white/10 transition-all z-20 ${isSaved("seminars", seminar.id) ? 'bg-neuro-orange text-white' : 'bg-white/10 text-white/60 hover:text-white'}`}
                    >
                      <Heart className={`w-5 h-5 ${isSaved("seminars", seminar.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Card Content */}
                  <div className="p-10 flex-1 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="px-3 py-1 bg-neuro-orange/10 border border-neuro-orange/20 text-neuro-orange text-[9px] font-black rounded-lg uppercase tracking-widest">
                        {seminar.event_type || 'Clinical Workshop'}
                      </span>
                      <div className="flex gap-1.5">
                        {seminar.target_audience?.map((target: string) => (
                          <span key={target} className="text-[8px] font-black text-gray-500 uppercase tracking-widest border border-white/5 px-2 py-0.5 rounded">
                            {target}
                          </span>
                        ))}
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold mb-4 leading-tight group-hover:text-neuro-orange transition-colors">
                      {seminar.title}
                    </h3>

                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-neuro-orange" />
                        <span className="font-bold text-gray-300 text-sm">{seminar.dates}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Investment From</p>
                        <p className="text-xl font-black text-neuro-orange">${seminar.price || '395'}</p>
                      </div>
                    </div>

                    <Link href={`/hosts/${seminar.host_id}`} className="flex items-center gap-3 mb-10 pt-6 border-t border-white/5 group/host">
                      <div className="w-10 h-10 rounded-full bg-neuro-orange flex items-center justify-center text-white font-black text-xs overflow-hidden">
                        {seminar.logo_url ? <img loading="lazy" decoding="async" src={seminar.logo_url} className="w-full h-full object-cover" /> : (seminar.instructor_name?.charAt(0) || 'RN')}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white group-hover/host:text-neuro-orange transition-colors">{seminar.instructor_name || 'NeuroChiro Faculty'}</p>
                        <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black">View Educator Profile</p>
                      </div>
                    </Link>

                    <div className="mt-auto pt-4">
                      <Link 
                        href={`/seminars/${seminar.id}`}
                        className="w-full py-5 bg-neuro-orange text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-3 shadow-xl shadow-neuro-orange/20 hover:bg-neuro-orange-light hover:scale-[1.02] active:scale-95 group/btn"
                      >
                        Register Now
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-40 text-center">
                <X className="w-12 h-12 text-gray-800 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-500 uppercase tracking-widest">No matching seminars found</h3>
                <button 
                  onClick={() => setFilters({ country: 'All', instructor: 'All', showPast: false, eventType: 'All' })}
                  className="mt-6 text-neuro-orange font-bold text-xs uppercase tracking-widest hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
