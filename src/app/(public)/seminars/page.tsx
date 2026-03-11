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
    <div className="min-h-screen bg-[#0B1118] text-white pt-32 pb-32">
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
            className="text-gray-400 text-xl max-w-2xl font-medium"
          >
            Master the clinical certainty and communication architecture required for a nervous-system-first practice.
          </motion.p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8">
        
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
                  className="group bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden hover:border-neuro-orange/50 transition-all hover:shadow-[0_32px_64px_-16px_rgba(214,104,41,0.15)] flex flex-col relative"
                >
                  {/* Card Image Section */}
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img 
                      src={seminar.image_url} 
                      alt={seminar.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B1118] via-[#0B1118]/20 to-transparent" />
                    
                    {/* Country Badge */}
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
                      className={`absolute top-6 right-6 p-3 rounded-2xl backdrop-blur-md border border-white/10 transition-all ${isSaved("seminars", seminar.id) ? 'bg-neuro-orange text-white' : 'bg-white/10 text-white/60 hover:text-white'}`}
                    >
                      <Heart className={`w-5 h-5 ${isSaved("seminars", seminar.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Card Content */}
                  <div className="p-10 flex-1 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="px-3 py-1 bg-neuro-orange/10 border border-neuro-orange/20 text-neuro-orange text-[9px] font-black rounded-lg uppercase tracking-widest">
                        {seminar.event_type}
                      </span>
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {seminar.start_time}
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold mb-4 leading-tight group-hover:text-neuro-orange transition-colors">
                      {seminar.title}
                    </h3>

                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-8">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-neuro-orange" />
                        <span className="font-bold text-gray-300">{seminar.dates}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mb-10 pt-6 border-t border-white/5">
                      <div className="w-10 h-10 rounded-full bg-neuro-orange flex items-center justify-center text-white font-black text-xs">
                        {seminar.instructor_name?.charAt(4) || 'RN'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{seminar.instructor_name}</p>
                        <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black">Lead Instructor</p>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <Link 
                        href={`/seminars/${seminar.id}`}
                        className="w-full py-5 bg-white/5 border border-white/10 hover:bg-neuro-orange hover:border-neuro-orange text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-3 group/btn"
                      >
                        View Details
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
