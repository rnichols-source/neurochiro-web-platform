"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  MapPin, 
  Search, 
  Filter, 
  ArrowRight, 
  Star, 
  ShieldCheck, 
  Users, 
  Navigation,
  Globe,
  Zap,
  Target,
  ChevronRight,
  Sparkles,
  Lock
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function CareerMapPage() {
  const router = useRouter();

  const clinics = [
    {
      name: "Summit Chiropractic & Wellness",
      location: "Boulder, CO",
      matchScore: 98,
      tags: ["Hiring", "Mentorship", "Preceptorship"],
      logo: "S"
    },
    {
      name: "The Neural Hive",
      location: "Austin, TX",
      matchScore: 95,
      tags: ["Mentorship", "Preceptorship"],
      logo: "T"
    },
    {
      name: "Pacific Neuro Health",
      location: "San Diego, CA",
      matchScore: 88,
      tags: ["Hiring"],
      logo: "P"
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 relative">
      {/* Interactive Map Header */}
      <section className="bg-neuro-navy h-[400px] rounded-2xl relative overflow-hidden shadow-2xl border border-white/10 group">
         {/* Background Map Visual */}
         <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/-98,38,3,0/1200x400?access_token=MOCK')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-1000"></div>
         
         {/* Floating Nodes */}
         <div className="absolute inset-0 z-10">
            {[
              { t: '30%', l: '40%' },
              { t: '50%', l: '60%' },
              { t: '45%', l: '25%' },
              { t: '65%', l: '45%' },
              { t: '25%', l: '85%' },
            ].map((pos, i) => (
              <div key={i} className="absolute w-6 h-6 bg-neuro-orange/40 rounded-full animate-pulse flex items-center justify-center" style={{ top: pos.t, left: pos.l }}>
                 <div className="w-2 h-2 bg-neuro-orange rounded-full border border-white shadow-[0_0_15px_rgba(255,107,0,0.8)]"></div>
              </div>
            ))}
         </div>

         {/* Map Overlay Controls */}
         <div className="absolute top-6 left-6 z-20 flex gap-2">
            <div className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
               <span className="text-[10px] font-black text-white uppercase tracking-widest">United States Node Active: Local Feed</span>
            </div>
         </div>

         <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3">
            {[MapPin, GraduationCap, Calendar].map((Icon, i) => (
               <button key={i} className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-center text-white hover:bg-neuro-orange transition-all shadow-xl">
                  <Icon className="w-5 h-5" />
               </button>
            ))}
         </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Feed: High-Match Clinics */}
        <div className="lg:col-span-2 space-y-6">
           <div className="flex items-center justify-between">
              <h2 className="text-2xl font-heading font-black text-neuro-navy">High-Match Clinics</h2>
              <button className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm text-gray-400 hover:text-neuro-navy transition-colors">
                 <Filter className="w-5 h-5" />
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {clinics.map((clinic, i) => (
                <div key={i} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden flex flex-col">
                   <div className="p-8 border-b border-gray-50 flex-1">
                      <div className="flex justify-between items-start mb-6">
                         <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-xl font-bold text-neuro-navy shadow-inner border border-gray-100">
                            {clinic.logo}
                         </div>
                         <div className="text-right">
                            <div className={`text-xl font-black text-neuro-navy`}>
                               {`${clinic.matchScore}%`}
                            </div>
                            <div className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Match Score</div>
                         </div>
                      </div>
                      <h3 className="text-lg font-bold text-neuro-navy group-hover:text-neuro-orange transition-colors mb-1">{clinic.name}</h3>
                      <p className="text-xs text-gray-400 font-medium mb-6">{clinic.location}</p>
                      <div className="flex flex-wrap gap-2">
                         {clinic.tags.map(tag => (
                            <span key={tag} className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-black rounded uppercase tracking-widest border border-blue-100">{tag}</span>
                         ))}
                      </div>
                   </div>
                   <div className="p-4 bg-gray-50/50 flex gap-3">
                      <button className="flex-1 py-3 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-neuro-navy hover:bg-gray-100 transition-all">View Profile</button>
                      <button
                        className={`flex-1 py-3 bg-neuro-orange text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all`}
                      >
                         <Users className="w-3.5 h-3.5" /> Mentorship
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Sidebar: Career Radar & Alerts */}
        <div className="space-y-6">
           <section className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm relative overflow-hidden">
              <h3 className="text-xl font-heading font-black text-neuro-navy mb-10">Career Radar</h3>
              <div className={`relative aspect-square mb-10`}>
                 {/* Radar Visual */}
                 <div className="absolute inset-0 border border-gray-100 rounded-full"></div>
                 <div className="absolute inset-8 border border-gray-100 rounded-full"></div>
                 <div className="absolute inset-16 border border-gray-100 rounded-full"></div>
                 
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-neuro-orange/20 rounded-full animate-ping"></div>
                    <div className="absolute w-4 h-4 bg-neuro-orange rounded-full shadow-lg"></div>
                 </div>

                 {/* Sweeping Line */}
                 <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/2 left-1/2 w-1/2 h-0.5 bg-gradient-to-r from-neuro-orange/40 to-transparent origin-left -translate-y-1/2"
                 />

                 <span className="absolute top-0 left-1/2 -translate-x-1/2 text-xs font-black text-gray-300 uppercase tracking-widest">Denver</span>
                 <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs font-black text-gray-300 uppercase tracking-widest">Austin</span>
              </div>
              <p className="text-[10px] text-gray-400 font-bold text-center leading-relaxed italic">Scanning for new clinic matches in your top 3 cities...</p>
              
              <div className="mt-8 bg-neuro-navy p-5 rounded-2xl text-white relative overflow-hidden group">
                 <div className="relative z-10 flex items-start gap-3">
                    <div className="p-1.5 bg-neuro-orange rounded-lg">
                       <Zap className="w-3.5 h-3.5 text-white fill-current" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase text-neuro-orange tracking-widest mb-1">New Alert</p>
                       <p className="text-[11px] font-bold leading-relaxed">A high-match clinic in Austin just updated their hiring status.</p>
                    </div>
                 </div>
              </div>
           </section>

           <section className="bg-gradient-to-br from-neuro-navy to-neuro-navy-dark rounded-[2rem] p-8 text-white text-center relative overflow-hidden shadow-2xl">
              <Sparkles className="w-10 h-10 text-neuro-orange mx-auto mb-6" />
              <h4 className="font-heading font-black text-xl mb-3 leading-tight">Priority Matching</h4>
              <p className="text-gray-400 text-xs mb-8 leading-relaxed">Accelerator members appear at the top of candidate searches for elite clinics.</p>
              <Link href="/pricing" className="block w-full py-4 bg-white text-neuro-navy font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-neuro-orange hover:text-white transition-all shadow-xl shadow-black/20">
                 Join Accelerator
              </Link>
           </section>
        </div>

      </div>
    </div>
  );
}

// Mock icon for navigation
function GraduationCap(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function Calendar(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}
