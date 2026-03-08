"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, ArrowRight, Search, Zap, Clock, Star, Filter, Heart } from "lucide-react";
import Link from "next/link";
import { useRegion } from "@/context/RegionContext";
import { useUserPreferences } from "@/context/UserPreferencesContext";

export default function SeminarHub() {
  const { region } = useRegion();
  const { lastLocation, setLastLocation, toggleSave, isSaved } = useUserPreferences();
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState(lastLocation || "");

  const seminars = useMemo(() => [
    {
      id: 1,
      title: "Clinical Mastery: Pediatric Neurology",
      date: "Oct 24-25, 2026",
      location: "Denver, CO",
      instructor: "Dr. Sarah Johnson",
      attendees: "124/150",
      category: "clinical",
      price: 497,
      image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800",
      featured: true,
      region_code: "US"
    },
    {
      id: 2,
      title: "Nervous System Centered Marketing",
      date: "Nov 12, 2026",
      location: "Austin, TX",
      instructor: "Dr. Raymond Nichols",
      attendees: "42/60",
      category: "business",
      price: 297,
      image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=800",
      featured: false,
      region_code: "US"
    },
    {
      id: 3,
      title: "Australian Clinical Intensive",
      date: "Dec 05, 2026",
      location: "Melbourne, VIC",
      instructor: "Dr. Michael Chen",
      attendees: "12/50",
      category: "clinical",
      price: 397,
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800",
      featured: true,
      region_code: "AU"
    },
    {
      id: 4,
      title: "Patient Experience & Regulation",
      date: "Jan 15, 2027",
      location: "Sydney, NSW",
      instructor: "Dr. Natalie West",
      attendees: "18/50",
      category: "experience",
      price: 197,
      image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800",
      featured: false,
      region_code: "AU"
    }
  ], []);

  const filteredSeminars = useMemo(() => {
    return seminars.filter(s => {
      const regionMatch = s.region_code === region.code;
      const categoryMatch = filter === "all" || s.category === filter;
      return regionMatch && categoryMatch;
    });
  }, [filter, region.code, seminars]);

  return (
    <div className="min-h-screen bg-neuro-cream pb-32">
      {/* Immersive Header */}
      <header className="bg-neuro-navy text-white pt-32 pb-48 px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-8">
           <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-xs font-black uppercase tracking-[0.3em] text-neuro-orange-light shadow-2xl">
              <Zap className="w-4 h-4 fill-current" /> Clinical Evolution ({region.code})
           </div>
           <h1 className="text-6xl md:text-8xl font-heading font-black leading-[0.9] text-white">
              Regional <br />
              <span className="text-neuro-orange">Seminars.</span>
           </h1>
           <p className="text-gray-300 text-xl md:text-2xl max-w-2xl mx-auto font-medium leading-relaxed">
             Master the clinical protocols and business implementations in {region.label}.
           </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 -mt-24 relative z-20">
        
        {/* Controls Bar */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col md:flex-row items-center gap-6 mb-16">
           <div className="flex-1 relative w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by city, topic, or instructor..."
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-neuro-orange/30 rounded-2xl focus:outline-none transition-all font-medium text-neuro-navy"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setLastLocation(e.target.value);
                }}
              />
           </div>
           <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
              {["all", "clinical", "business", "experience"].map((cat) => (
                <button 
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    filter === cat 
                      ? "bg-neuro-navy text-white shadow-xl" 
                      : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
           </div>
        </div>

        {/* Seminar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {filteredSeminars.length > 0 ? (
             filteredSeminars.map((seminar) => (
               <motion.div 
                 layout
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 key={seminar.id}
                 className="bg-white rounded-[3rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all group flex flex-col"
               >
                  <div className="relative aspect-[4/3] overflow-hidden">
                     <img 
                       src={seminar.image} 
                       alt={seminar.title}
                       className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-neuro-navy/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     <div className="absolute top-6 left-6 flex flex-col gap-2">
                        <span className="px-4 py-2 bg-white/90 backdrop-blur-md text-neuro-navy text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg">
                          {seminar.category}
                        </span>
                        {seminar.featured && (
                          <span className="px-4 py-2 bg-neuro-orange text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" /> Featured
                          </span>
                        )}
                     </div>
                     <div className="absolute top-6 right-6">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            toggleSave("seminars", seminar.id.toString());
                          }}
                          className={`p-3 rounded-xl backdrop-blur-md transition-all shadow-lg ${isSaved("seminars", seminar.id.toString()) ? 'bg-neuro-orange text-white' : 'bg-white/90 text-gray-400 hover:text-neuro-orange'}`}
                        >
                           <Heart className={`w-5 h-5 ${isSaved("seminars", seminar.id.toString()) ? 'fill-current' : ''}`} />
                        </button>
                     </div>
                  </div>

                  <div className="p-8 flex-1 flex flex-col">
                     <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                        <div className="flex items-center gap-1 text-neuro-orange">
                           <Calendar className="w-3.5 h-3.5" /> {seminar.date}
                        </div>
                        <div className="flex items-center gap-1">
                           <MapPin className="w-3.5 h-3.5" /> {seminar.location}
                        </div>
                     </div>

                     <h3 className="text-2xl font-bold text-neuro-navy mb-4 group-hover:text-neuro-orange transition-colors">
                       {seminar.title}
                     </h3>

                     <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-full bg-neuro-cream flex items-center justify-center text-neuro-navy font-bold text-xs border border-gray-100">
                           {seminar.instructor[4]}
                        </div>
                        <div>
                           <p className="text-xs font-bold text-neuro-navy">{seminar.instructor}</p>
                           <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Instructor</p>
                        </div>
                     </div>

                     <div className="mt-auto pt-8 border-t border-gray-50 flex items-center justify-between">
                        <div>
                           <p className="text-2xl font-black text-neuro-navy">{region.currency.symbol}{seminar.price}</p>
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                              <Users className="w-3 h-3" /> {seminar.attendees} Registered
                           </p>
                        </div>
                        <Link 
                          href={`/seminars/${seminar.id}`}
                          className="p-4 bg-neuro-navy text-white rounded-2xl group-hover:bg-neuro-orange transition-all shadow-xl shadow-neuro-navy/10 group-hover:shadow-neuro-orange/20"
                        >
                           <ArrowRight className="w-6 h-6" />
                        </Link>
                     </div>
                  </div>
               </motion.div>
             ))
           ) : (
             <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
                <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-2xl font-black text-neuro-navy">No Seminars Scheduled</h3>
                <p className="text-gray-400">There are currently no events in {region.label}.</p>
             </div>
           )}
        </div>

        {/* Support Section */}
        <section className="mt-32 bg-neuro-navy rounded-[4rem] p-12 md:p-20 text-white relative overflow-hidden text-center shadow-2xl">
           <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-neuro-orange/10 blur-[100px] -mr-48 -mt-48 rounded-full"></div>
           <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <h2 className="text-4xl md:text-5xl font-heading font-black">Want to host a seminar?</h2>
              <p className="text-gray-400 text-lg md:text-xl font-medium">
                Verified Doctors in {region.label} can host and manage public seminars directly through the NeuroChiro ecosystem.
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                 <Link href="/register?role=doctor" className="px-10 py-5 bg-neuro-orange hover:bg-neuro-orange-light text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-2xl shadow-neuro-orange/20 transition-all transform hover:scale-105">
                    Become a Host
                 </Link>
                 <Link href="/contact" className="px-10 py-5 bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-widest text-sm rounded-2xl backdrop-blur-sm transition-all">
                    Inquire for Details
                 </Link>
              </div>
           </div>
        </section>
      </main>
    </div>
  );
}
