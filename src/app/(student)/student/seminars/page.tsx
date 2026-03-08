"use client";

import { 
  Search, 
  MapPin, 
  Calendar, 
  Filter, 
  Star, 
  Heart, 
  ArrowRight, 
  Award, 
  Users, 
  Bell, 
  CheckCircle2,
  Bookmark,
  X,
  Info,
  ChevronRight,
  Globe,
  Navigation
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Automations } from "@/lib/automations";

export default function SeminarsPage() {
  const [savedSeminars, setSavedSeminars] = useState<string[]>([]);
  const [toast, setToast] = useState<{isOpen: boolean, message: string}>({ isOpen: false, message: "" });
  const [isTravelModeOpen, setIsTravelModeOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedSeminar, setSelectedSeminar] = useState<any>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const handleRegister = async (title: string) => {
    // Arguments: userId, email, phone, seminarName
    await Automations.onSeminarRegistration("Student_User", "student@example.com", "000-000-0000", title);
    setToast({ isOpen: true, message: `Successfully registered for ${title}!` });
    setSelectedSeminar(null);
    setTimeout(() => setToast({ isOpen: false, message: "" }), 3000);
  };

  const toggleSave = (title: string) => {
    setSavedSeminars(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const seminars = [
    {
      title: "The Neuro-Scanning Masterclass",
      host: "Dr. Sarah Johnson",
      date: "Oct 15-16, 2026",
      location: "Austin, TX",
      category: "Clinical Skills",
      price: "$299",
      isRecommended: true,
      hasRecruiters: true,
      image: "bg-blue-100",
      description: "A deep dive into advanced neuro-scanning techniques and interpretation. Learn how to identify subtle neurological patterns that others miss.",
      speakers: ["Dr. Sarah Johnson", "Dr. Robert Lee"],
      attendees: 145
    },
    {
      title: "Pediatric Nervous System Development",
      host: "Dr. Marcus Chen",
      date: "Nov 03, 2026",
      location: "Seattle, WA",
      category: "Pediatrics",
      price: "$199",
      isRecommended: true,
      hasRecruiters: false,
      image: "bg-orange-100",
      description: "Understanding the unique developmental milestones of the pediatric nervous system and clinical approaches for optimizing growth.",
      speakers: ["Dr. Marcus Chen"],
      attendees: 89
    },
    {
      title: "Business of Nervous System Care",
      host: "Dr. Elizabeth Thorne",
      date: "Dec 12, 2026",
      location: "Miami, FL",
      category: "Business",
      price: "$349",
      isRecommended: false,
      hasRecruiters: true,
      image: "bg-green-100",
      description: "Master the operational and marketing strategies needed to build a high-impact, nervous-system-centered chiropractic practice.",
      speakers: ["Dr. Elizabeth Thorne", "Mark Stevens (CEO)"],
      attendees: 210
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 relative">
      <AnimatePresence>
        {toast.isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] bg-green-50 rounded-2xl shadow-xl border border-green-100 p-4 flex items-center gap-3 min-w-[320px]"
          >
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="font-bold text-green-900 text-sm">{toast.message}</span>
            <button onClick={() => setToast({ isOpen: false, message: "" })} className="text-green-700 hover:text-green-900 ml-auto">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-heading font-black text-neuro-navy">Seminar Hub</h1>
          <p className="text-neuro-gray mt-2 text-lg">Personalized recommendations based on your clinical interests.</p>
        </div>
        <div className="flex gap-3 relative">
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-neuro-orange transition-colors shadow-sm active:scale-95"
          >
             <Bell className="w-5 h-5" />
             <span className="absolute top-2 right-2 w-2 h-2 bg-neuro-orange rounded-full border-2 border-white"></span>
          </button>
          
          <AnimatePresence>
            {isNotificationsOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] overflow-hidden"
              >
                <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <span className="font-bold text-neuro-navy text-sm">Notifications</span>
                  <button onClick={() => setIsNotificationsOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-2 space-y-1">
                  {[
                    { title: "New Seminar Added", desc: "Advanced HRV Protocols just opened in Chicago.", time: "2h ago" },
                    { title: "Registration Confirmed", desc: "You're all set for the Neuro-Scanning Masterclass.", time: "1d ago" }
                  ].map((n, i) => (
                    <div key={i} className="p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group">
                      <p className="text-xs font-bold text-neuro-navy group-hover:text-neuro-orange">{n.title}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{n.desc}</p>
                      <p className="text-[8px] text-gray-400 mt-1 uppercase font-bold">{n.time}</p>
                    </div>
                  ))}
                </div>
                <button className="w-full py-3 text-[10px] font-black uppercase text-gray-400 hover:text-neuro-orange border-t border-gray-50 transition-colors">Clear All</button>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={() => setIsTravelModeOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-neuro-navy text-white font-bold rounded-xl hover:bg-neuro-navy-light transition-colors shadow-lg active:scale-95"
          >
            <MapPin className="w-5 h-5" /> Travel Mode
          </button>
        </div>
      </header>

      {/* Personalized Stats / Tracking */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         {[
           { label: "Attended", value: "4", icon: CheckCircle2, color: "text-green-600" },
           { label: "Registered", value: "2", icon: Calendar, color: "text-blue-600" },
           { label: "Badges", value: "3", icon: Award, color: "text-neuro-orange" },
           { label: "Network", value: "124", icon: Users, color: "text-purple-600" }
         ].map((stat, i) => (
           <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:border-neuro-orange/30 transition-all cursor-default">
              <div className={`p-2 rounded-xl bg-gray-50 ${stat.color} group-hover:scale-110 transition-transform`}>
                 <stat.icon className="w-5 h-5" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                 <p className="text-lg font-black text-neuro-navy">{stat.value}</p>
              </div>
           </div>
         ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by topic, host, or city..." 
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 shadow-sm transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsFiltersOpen(true)}
            className="flex items-center gap-2 px-6 py-4 bg-white border border-gray-100 rounded-2xl font-bold text-sm text-neuro-navy hover:bg-gray-50 transition-colors shadow-sm active:scale-95"
          >
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>
      </div>

      {/* Featured / Recommended */}
      <section>
        <div className="flex items-center justify-between mb-6">
           <h2 className="text-2xl font-heading font-bold text-neuro-navy">Featured for You</h2>
           <button 
            onClick={() => alert("Loading all available seminars...")}
            className="text-sm font-bold text-neuro-orange hover:underline"
           >
             View All
           </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {seminars.map((sem, i) => (
            <div key={i} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm group hover:shadow-xl transition-all flex flex-col">
              <div className={`aspect-[16/10] ${sem.image} relative overflow-hidden`}>
                <div className="absolute top-4 right-4 flex gap-2">
                  <button 
                    onClick={() => toggleSave(sem.title)}
                    className={`p-2 rounded-full transition-all active:scale-90 ${savedSeminars.includes(sem.title) ? 'bg-neuro-orange text-white shadow-lg' : 'bg-white/90 text-gray-400 hover:text-neuro-orange'}`}
                  >
                    <Bookmark className={`w-5 h-5 ${savedSeminars.includes(sem.title) ? 'fill-current' : ''}`} />
                  </button>
                </div>
                {sem.isRecommended && (
                  <div className="absolute top-4 left-4 bg-neuro-orange text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <Star className="w-3 h-3 fill-current" /> Recommended
                  </div>
                )}
                {sem.hasRecruiters && (
                  <div className="absolute bottom-4 left-4 bg-neuro-navy/80 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1">
                    <Users className="w-3 h-3" /> Recruiting Clinics Present
                  </div>
                )}
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <div className="flex items-center gap-1 text-[10px] font-black text-neuro-orange mb-3 uppercase tracking-widest">
                  <Calendar className="w-3 h-3" /> {sem.date}
                </div>
                <h3 className="font-heading font-bold text-xl text-neuro-navy mb-3 group-hover:text-neuro-orange transition-colors">
                  {sem.title}
                </h3>
                <p className="text-sm text-gray-500 mb-6 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-400" /> {sem.location}
                </p>
                
                <div className="flex items-center justify-between pt-6 border-t border-gray-50 mt-auto">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white shadow-sm"></div>
                    <div className="flex flex-col">
                       <span className="text-xs font-bold text-neuro-navy">{sem.host}</span>
                       <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Host</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-neuro-navy">{sem.price}</p>
                    <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Special Student Rate</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setSelectedSeminar(sem)}
                  className="w-full mt-8 py-4 bg-gray-50 group-hover:bg-neuro-navy group-hover:text-white text-neuro-navy font-black rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  View Full Details <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Seminar Library & Network */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
            <h3 className="text-xl font-heading font-bold text-neuro-navy mb-6">Seminar Attendance Network</h3>
            <div className="space-y-6">
               <p className="text-sm text-gray-500">See which of your peers and mentors are attending upcoming events.</p>
               <div 
                onClick={() => alert("Opening Network Directory...")}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group cursor-pointer hover:border-neuro-orange transition-all"
               >
                  <div className="flex items-center gap-3">
                     <div className="flex -space-x-3">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="w-10 h-10 rounded-full bg-gray-300 border-2 border-white"></div>
                        ))}
                     </div>
                     <span className="text-sm font-bold text-neuro-navy">+12 others you follow</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-neuro-orange transition-colors" />
               </div>
            </div>
         </section>
         <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
            <h3 className="text-xl font-heading font-bold text-neuro-navy mb-6">My Seminar Badges</h3>
            <div className="flex flex-wrap gap-4">
               {[
                 { name: "Scanning L1", color: "bg-blue-100 text-blue-600" },
                 { name: "Neuro-Phil", color: "bg-orange-100 text-neuro-orange" },
                 { name: "Practice V1", color: "bg-green-100 text-green-600" }
               ].map((badge, i) => (
                 <div key={i} className={`px-4 py-4 rounded-2xl ${badge.color} flex flex-col items-center justify-center text-center min-w-[100px] border border-white/50 hover:scale-105 transition-transform cursor-pointer`}>
                    <Award className="w-6 h-6 mb-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{badge.name}</span>
                 </div>
               ))}
               <div className="px-4 py-4 rounded-2xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center min-w-[100px] text-gray-300 group hover:border-neuro-orange transition-colors cursor-pointer">
                  <Star className="w-6 h-6 mb-2 group-hover:text-neuro-orange" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Next: L2</span>
               </div>
            </div>
         </section>
      </div>

      {/* TRAVEL MODE MODAL */}
      {isTravelModeOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-neuro-navy/40">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-neuro-navy text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Navigation className="w-6 h-6 text-neuro-orange" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Travel Mode</h3>
                  <p className="text-[10px] uppercase font-black text-white/50 tracking-widest">Find seminars by region</p>
                </div>
              </div>
              <button onClick={() => setIsTravelModeOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 space-y-6">
               <p className="text-sm text-gray-500 leading-relaxed">
                 Planning a clinical rotation or relocation? Change your region to see seminars and recruitment opportunities in other areas.
               </p>
               <div className="grid grid-cols-1 gap-3">
                  {["Current: Southeast", "Pacific Northwest", "Northeast", "International (AU/UK)"].map((region, i) => (
                    <button key={i} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-neuro-orange hover:bg-gray-50 transition-all group">
                       <span className="text-sm font-bold text-neuro-navy">{region}</span>
                       <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-neuro-orange" />
                    </button>
                  ))}
               </div>
               <button onClick={() => setIsTravelModeOpen(false)} className="w-full py-4 bg-neuro-orange text-white font-black rounded-2xl hover:bg-neuro-orange-light shadow-xl">Apply Region Change</button>
            </div>
          </div>
        </div>
      )}

      {/* FILTERS MODAL */}
      {isFiltersOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-neuro-navy/40">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-neuro-orange" />
                <h3 className="font-bold text-xl text-neuro-navy">Refine Seminars</h3>
              </div>
              <button onClick={() => setIsFiltersOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 space-y-8">
               <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Category</h4>
                  <div className="flex flex-wrap gap-2">
                     {["Clinical", "Business", "Pediatrics", "Neurology", "Tonal"].map(c => (
                       <button key={c} className="px-4 py-2 rounded-xl bg-gray-50 text-xs font-bold text-neuro-navy hover:bg-neuro-orange hover:text-white transition-all">{c}</button>
                     ))}
                  </div>
               </div>
               <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Attendance Type</h4>
                  <div className="grid grid-cols-2 gap-3">
                     <button className="p-4 rounded-2xl border-2 border-neuro-orange bg-neuro-orange/5 text-xs font-black text-neuro-orange">In-Person</button>
                     <button className="p-4 rounded-2xl border-2 border-gray-100 text-xs font-black text-gray-400">Virtual / Hybrid</button>
                  </div>
               </div>
               <button onClick={() => setIsFiltersOpen(false)} className="w-full py-4 bg-neuro-navy text-white font-black rounded-2xl hover:bg-neuro-navy-light transition-all">Show 12 Results</button>
            </div>
          </div>
        </div>
      )}

      {/* SEMINAR DETAILS MODAL */}
      {selectedSeminar && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-neuro-navy/40">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className={`h-48 ${selectedSeminar.image} relative shrink-0`}>
               <button 
                onClick={() => setSelectedSeminar(null)}
                className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md transition-all"
               >
                 <X className="w-6 h-6" />
               </button>
               <div className="absolute bottom-6 left-8">
                  <div className="flex items-center gap-2 mb-2">
                    {selectedSeminar.isRecommended && <span className="bg-neuro-orange text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Top Pick</span>}
                    <span className="bg-neuro-navy/80 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">{selectedSeminar.category}</span>
                  </div>
                  <h2 className="text-3xl font-black text-neuro-navy">{selectedSeminar.title}</h2>
               </div>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                     <div>
                        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">About this seminar</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{selectedSeminar.description}</p>
                     </div>
                     <div className="p-4 bg-neuro-cream rounded-2xl border border-neuro-orange/10">
                        <div className="flex items-center gap-2 text-neuro-orange mb-2">
                           <Users className="w-4 h-4" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Recruitment Spotlight</span>
                        </div>
                        <p className="text-[11px] text-neuro-navy/70 leading-relaxed font-medium">
                           3 high-volume clinics in {selectedSeminar.location.split(',')[1]} will be recruiting during the networking breaks.
                        </p>
                     </div>
                  </div>
                  
                  <div className="space-y-6">
                     <div className="space-y-4">
                        <div className="flex items-start gap-3">
                           <Calendar className="w-5 h-5 text-neuro-orange shrink-0 mt-0.5" />
                           <div>
                              <p className="text-xs font-bold text-neuro-navy">{selectedSeminar.date}</p>
                              <p className="text-[10px] text-gray-400">Standard Intensive Schedule</p>
                           </div>
                        </div>
                        <div className="flex items-start gap-3">
                           <MapPin className="w-5 h-5 text-neuro-orange shrink-0 mt-0.5" />
                           <div>
                              <p className="text-xs font-bold text-neuro-navy">{selectedSeminar.location}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase hover:text-neuro-orange cursor-pointer">Open in Maps</p>
                           </div>
                        </div>
                     </div>
                     
                     <div className="pt-6 border-t border-gray-100">
                        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Speakers</h4>
                        <div className="space-y-3">
                           {selectedSeminar.speakers.map((s: string, i: number) => (
                             <div key={i} className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-neuro-navy">{s[0]}</div>
                                <span className="text-xs font-bold text-neuro-navy">{s}</span>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
               
               <div className="pt-8 border-t border-gray-100 flex items-center justify-between gap-6 shrink-0 mt-auto">
                  <div>
                     <p className="text-2xl font-black text-neuro-navy">{selectedSeminar.price}</p>
                     <p className="text-[10px] font-black text-neuro-orange uppercase">Locked student rate</p>
                  </div>
                  <button 
                    onClick={() => handleRegister(selectedSeminar.title)}
                    className="flex-1 py-5 bg-neuro-orange text-white font-black rounded-2xl hover:bg-neuro-orange-light transition-all shadow-xl shadow-neuro-orange/20 uppercase tracking-widest text-sm active:scale-95"
                  >
                    Register Now
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
