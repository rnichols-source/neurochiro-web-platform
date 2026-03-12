"use client";

import { 
  Search, 
  Filter, 
  MapPin, 
  GraduationCap, 
  Lock, 
  Sparkles, 
  MessageSquare, 
  ChevronRight,
  UserPlus,
  Star,
  Target,
  BarChart3,
  X,
  Check,
  Mail,
  ArrowRight,
  ShieldCheck,
  Award,
  Zap,
  Calendar,
  Clock,
  Gift,
  Flame,
  Eye,
  TrendingUp
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDoctorTier } from "@/context/DoctorTierContext";
import { motion, AnimatePresence } from "framer-motion";

export default function StudentDiscovery() {
  const router = useRouter();
  const { isMember } = useDoctorTier();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'top' | 'pipeline'>('all');
  const [selectedStudentForMessage, setSelectedStudentForMessage] = useState<any>(null);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<any>(null);
  const [messageSent, setMessageSent] = useState(false);
  const [isInterviewRequest, setIsInterviewRequest] = useState(false);
  const [isShadowingOffer, setIsShadowingOffer] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['std-1', 'std-3']));

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const students = [
    {
      id: "std-1",
      name: "Raymond Nichols",
      school: "Life University",
      gradYear: "2027",
      interests: ["Pediatrics", "Neuro-Scanning"],
      readinessScore: 98,
      recentViews: 12,
      activeTalks: 3,
      status: "Interviewing",
      isFavorite: true,
      isElite: true,
      clinicalStats: {
        adjusted: "480+",
        certification: "Level 3 scanning",
        volumeCapacity: "120+ visits/week"
      },
      projectedROI: "$220k/year",
      bio: "Focusing on the intersection of pediatric development and neurological integrity. Experience with Insight Scanning technology and chiropractic neurology principles.",
      achievements: ["Dean's List", "Neurology Club President"],
      location: "Marietta, GA"
    },
    {
      id: "std-2",
      name: "Sarah Miller",
      school: "Palmer College",
      gradYear: "2026",
      interests: ["Sports Performance", "TBI"],
      readinessScore: 94,
      recentViews: 8,
      activeTalks: 1,
      status: "Active Discovery",
      isFavorite: false,
      isElite: true,
      clinicalStats: {
        adjusted: "350+",
        certification: "TBI Protocol Cert",
        volumeCapacity: "100+ visits/week"
      },
      projectedROI: "$185k/year",
      bio: "Passionate about high-performance athletics and traumatic brain injury recovery. Looking for a clinical setting that prioritizes objective neuro-functional testing.",
      achievements: ["Sports Council Lead", "Research Assistant"],
      location: "Davenport, IA"
    },
    {
      id: "std-3",
      name: "Jason Lee",
      school: "Parker University",
      gradYear: "2028",
      interests: ["General Practice", "HRV Mastery"],
      readinessScore: 88,
      recentViews: 4,
      activeTalks: 0,
      status: "Mentorship",
      isFavorite: true,
      isElite: false,
      clinicalStats: {
        adjusted: "120+",
        certification: "HRV Mastery",
        volumeCapacity: "60+ visits/week"
      },
      projectedROI: "$140k/year",
      bio: "Incoming clinical intern with a strong foundation in heart rate variability and autonomic nervous system regulation. Seeking long-term mentorship in family-based neuro-wellness.",
      achievements: ["Student Ambassador", "HRV Certified"],
      location: "Dallas, TX"
    }
  ];

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          student.school.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.interests.some(i => i.toLowerCase().includes(searchTerm.toLowerCase()));

    if (activeFilter === 'top') return matchesSearch && student.readinessScore >= 90;
    if (activeFilter === 'pipeline') return matchesSearch && favorites.has(student.id);
    return matchesSearch;
  });

  const getInterviewTemplate = (student: any) => {
    const firstName = student.name.split(' ')[0];
    const topInterest = student.interests[0] || "Neuro-Chiropractic";
    return `Hey ${firstName}, saw your ${student.readinessScore}% readiness score and your focus on ${topInterest}. I'm looking for a lead associate for my clinic. You free Tuesday at 8 am for a 10-min 'Culture Fit' call?`;
  };

  const getShadowingTemplate = (student: any) => {
    const firstName = student.name.split(' ')[0];
    return `Hi ${firstName}, I'm impressed by your clinical stats. I'd like to invite you for a 'Shadowing Day' at my clinic. I'll cover your gas, buy you lunch, and give you a $100 stipend for your time. Plus, I'll walk you through our $1M clinical workflow so you can see how we handle volume. No strings attached—just want to support the next gen of docs. You interested?`;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    setMessageSent(true);
    setTimeout(() => {
      setSelectedStudentForMessage(null);
      setMessageSent(false);
      setIsInterviewRequest(false);
      setIsShadowingOffer(false);
    }, 2000);
  };

  const openInterviewRequest = (student: any) => {
    setIsInterviewRequest(true);
    setIsShadowingOffer(false);
    setSelectedStudentForMessage(student);
  };

  const openShadowingOffer = (student: any) => {
    setIsShadowingOffer(true);
    setIsInterviewRequest(false);
    setSelectedStudentForMessage(student);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-heading font-black text-neuro-navy">Talent Command</h1>
          <p className="text-neuro-gray mt-2 text-lg">Recruit and mentor the top 1% of chiropractic students.</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => setActiveFilter(activeFilter === 'pipeline' ? 'all' : 'pipeline')}
             className={`px-6 py-4 rounded-2xl shadow-sm border transition-all flex flex-col items-center justify-center min-w-[120px] ${activeFilter === 'pipeline' ? 'bg-neuro-navy text-white border-neuro-navy' : 'bg-white border-gray-100 hover:border-neuro-navy/20'}`}
           >
             <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${activeFilter === 'pipeline' ? 'text-white/60' : 'text-gray-400'}`}>Pipeline</p>
             <p className="text-2xl font-black">{favorites.size} Candidates</p>
           </button>
           <button 
             onClick={() => setActiveFilter(activeFilter === 'top' ? 'all' : 'top')}
             className={`px-6 py-4 rounded-2xl shadow-lg flex flex-col items-center justify-center min-w-[120px] transition-all ${activeFilter === 'top' ? 'bg-white text-neuro-orange border-2 border-neuro-orange' : 'bg-neuro-orange text-white border-none hover:bg-neuro-orange-light'}`}
           >
             <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${activeFilter === 'top' ? 'text-neuro-orange/60' : 'text-white/70'}`}>Top Matches</p>
             <p className="text-2xl font-black">12</p>
           </button>
        </div>
      </header>

      {/* Talent Analytics */}
      <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm relative overflow-hidden">
         {!isMember && (
           <div className="absolute inset-0 bg-white/60 backdrop-blur-[4px] z-20 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-neuro-orange/10 rounded-2xl flex items-center justify-center mb-4">
                 <Lock className="w-8 h-8 text-neuro-orange" />
              </div>
              <h3 className="text-xl font-heading font-black text-neuro-navy mb-2">Unlock Talent Intelligence</h3>
              <p className="text-gray-500 max-w-sm mb-6 text-sm">Members see detailed analytics, regional trends, and high-performance student metrics.</p>
              <Link href="/pricing" className="px-8 py-3 bg-neuro-navy text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-105">Join the Network</Link>
           </div>
         )}

         <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-heading font-black text-neuro-navy flex items-center gap-2">
               <Target className="w-5 h-5 text-neuro-orange" /> Talent Radar
            </h3>
            <button 
              onClick={() => router.push('/doctor/analytics')}
              className="text-xs font-bold text-neuro-orange hover:underline"
            >
              View Full Analytics
            </button>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                     <GraduationCap className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-blue-900">Graduating Soon</span>
               </div>
               <p className="text-3xl font-black text-blue-900">24</p>
               <p className="text-xs text-blue-700 mt-1">Students in your region (Class of '26)</p>
            </div>
            <div className="p-6 bg-purple-50 rounded-3xl border border-purple-100">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-xl text-purple-600">
                     <Star className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-purple-900">High Performers</span>
               </div>
               <p className="text-3xl font-black text-purple-900">18</p>
               <p className="text-xs text-purple-700 mt-1">With 90%+ readiness scores</p>
            </div>
            <div className="p-6 bg-green-50 rounded-3xl border border-green-100">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-xl text-green-600">
                     <MessageSquare className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-green-900">Active Conversations</span>
               </div>
               <p className="text-3xl font-black text-green-900">5</p>
               <p className="text-xs text-green-700 mt-1">Response rate: 80%</p>
            </div>
         </div>
      </section>

      {/* Filters & Search */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search students by name, school, or interest..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-none shadow-sm focus:ring-2 focus:ring-neuro-orange/10 transition-all"
            />
          </div>
          <div className="flex gap-2">
             <button 
               onClick={() => setShowFilters(!showFilters)}
               className={`px-6 py-4 rounded-2xl font-bold transition-all shadow-sm flex items-center gap-2 border ${showFilters ? 'bg-neuro-navy text-white border-neuro-navy' : 'bg-white text-neuro-navy border-gray-100 hover:bg-gray-50'}`}
             >
                <Filter className="w-4 h-4" /> {showFilters ? 'Hide Filters' : 'Advanced Filters'}
             </button>
             <button 
               onClick={() => setViewMode(viewMode === 'grid' ? 'map' : 'grid')}
               className={`px-6 py-4 rounded-2xl font-bold transition-all shadow-sm flex items-center gap-2 border ${viewMode === 'map' ? 'bg-neuro-orange text-white border-neuro-orange' : 'bg-white text-neuro-navy border-gray-100 hover:bg-gray-50'}`}
             >
                <MapPin className="w-4 h-4" /> {viewMode === 'map' ? 'Grid View' : 'Map View'}
             </button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 flex flex-wrap gap-4 overflow-hidden"
            >
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Min Readiness</label>
                 <div className="flex gap-2">
                    {[80, 90, 95].map(score => (
                      <button key={score} className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold hover:border-neuro-orange transition-colors">
                        {score}%+
                      </button>
                    ))}
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Class Year</label>
                 <div className="flex gap-2">
                    {['2026', '2027', '2028'].map(year => (
                      <button key={year} className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold hover:border-neuro-orange transition-colors">
                        {year}
                      </button>
                    ))}
                 </div>
              </div>
              <button 
                onClick={() => {setSearchTerm(""); setActiveFilter('all');}}
                className="mt-auto ml-auto text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-neuro-orange transition-colors"
              >
                 Clear All
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student, i) => (
              <div key={i} className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm hover:shadow-xl transition-all group flex flex-col relative overflow-hidden">
                 {student.isElite && (
                    <div className="absolute top-0 right-0 bg-gradient-to-br from-neuro-orange to-orange-600 text-white px-4 py-2 rounded-bl-2xl shadow-lg z-10 flex items-center gap-2">
                       <ShieldCheck className="w-4 h-4" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Elite Certified</span>
                    </div>
                 )}
                 {!student.isElite && favorites.has(student.id) && (
                    <div className="absolute top-0 right-0 bg-neuro-orange text-white p-2 rounded-bl-2xl shadow-md z-10">
                       <Star className="w-4 h-4 fill-current" />
                    </div>
                 )}
                 <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                       <div className="w-16 h-16 rounded-2xl bg-neuro-navy/5 flex items-center justify-center text-neuro-navy font-black text-xl">
                          {student.name.split(' ').map(n => n[0]).join('')}
                       </div>
                       {student.readinessScore >= 95 && (
                          <div className="absolute -top-2 -left-2 bg-red-500 text-white p-1.5 rounded-xl shadow-lg animate-bounce">
                             <Flame className="w-3 h-3 fill-current" />
                          </div>
                       )}
                    </div>
                    <div>
                       <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-neuro-navy group-hover:text-neuro-orange transition-colors">{student.name}</h3>
                          {favorites.has(student.id) && <Star className="w-3 h-3 text-neuro-orange fill-current" />}
                          {(student as any).recentViews > 5 && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-neuro-orange rounded-full border border-orange-100 animate-pulse">
                               <Eye className="w-2.5 h-2.5" />
                               <span className="text-[8px] font-black uppercase">{(student as any).recentViews} Views Today</span>
                            </div>
                          )}
                       </div>
                       <p className="text-xs text-gray-500 font-medium">{student.school}</p>
                       <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Class of {student.gradYear}</p>
                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                          <span className={`text-[9px] font-black uppercase tracking-widest ${
                            student.status === "Interviewing" ? "text-red-500" : "text-neuro-orange"
                          }`}>
                            {student.status}
                            {(student as any).activeTalks > 0 && ` • ${(student as any).activeTalks} Active Talks`}
                          </span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6 flex-1">
                    {/* Clinical Stats - Proof of ROI */}
                    <div className="grid grid-cols-2 gap-3">
                       <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Adjusted</p>
                          <p className="text-sm font-black text-neuro-navy">{(student as any).clinicalStats.adjusted}</p>
                       </div>
                       <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Capacity</p>
                          <p className="text-sm font-black text-neuro-navy">{(student as any).clinicalStats.volumeCapacity}</p>
                       </div>
                    </div>

                    <div className="p-4 bg-neuro-orange/5 rounded-2xl border border-neuro-orange/10">
                       <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] font-black text-neuro-orange uppercase tracking-widest">Projected Practice ROI</p>
                          <Sparkles className="w-3 h-3 text-neuro-orange" />
                       </div>
                       <p className="text-xl font-black text-neuro-navy">{(student as any).projectedROI}</p>
                       <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Based on readiness & clinical stats</p>
                    </div>

                    <div className="pt-6 border-t border-gray-50 space-y-4 mt-auto">
                       <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                             <Target className="w-3 h-3" /> Readiness
                          </span>
                          <span className="text-sm font-black text-neuro-navy">{student.readinessScore}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mb-4">
                          <div className="h-full bg-green-500" style={{ width: `${student.readinessScore}%` }}></div>
                       </div>

                       <div className="grid grid-cols-3 gap-2">
                          <button 
                            onClick={() => setSelectedStudentForProfile(student)}
                            className="py-3 bg-gray-50 text-neuro-navy font-black rounded-xl text-[9px] uppercase tracking-tighter hover:bg-gray-100 transition-colors active:scale-95"
                          >
                             Profile
                          </button>
                          {isMember ? (
                            <>
                              <button 
                                onClick={() => openShadowingOffer(student)}
                                className="py-3 bg-white border border-neuro-orange/30 text-neuro-orange font-black rounded-xl text-[9px] uppercase tracking-tighter hover:bg-neuro-orange/5 transition-all flex items-center justify-center gap-1 active:scale-95"
                              >
                                 <Gift className="w-3 h-3" /> Shadow
                              </button>
                              <button 
                                onClick={() => openInterviewRequest(student)}
                                className="py-3 bg-neuro-navy text-white font-black rounded-xl text-[9px] uppercase tracking-tighter hover:bg-neuro-navy-light transition-all flex items-center justify-center gap-1 shadow-lg shadow-neuro-navy/10 active:scale-95 group"
                              >
                                 <Zap className="w-3 h-3 text-neuro-orange fill-neuro-orange group-hover:animate-pulse" /> Interview
                              </button>
                            </>
                          ) : (
                            <button className="col-span-2 py-3 bg-neuro-navy/5 text-gray-400 font-black rounded-xl text-[9px] uppercase tracking-tighter flex items-center justify-center gap-2 cursor-not-allowed border border-dashed border-gray-200">
                               <Lock className="w-3 h-3" /> Unlock Recruitment
                            </button>
                          )}
                       </div>
                    </div>
                 </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center space-y-4">
               <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                  <Search className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-black text-neuro-navy">No students found.</h3>
               <p className="text-gray-500">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>
      ) : (
        /* Map View Placeholder */
        <div className="bg-neuro-navy rounded-[3rem] p-12 h-[600px] flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl">
           <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
           <div className="relative z-10 space-y-6">
              <div className="w-24 h-24 bg-neuro-orange/10 rounded-[2rem] flex items-center justify-center mx-auto border border-neuro-orange/20">
                 <MapPin className="w-12 h-12 text-neuro-orange" />
              </div>
              <h2 className="text-4xl font-heading font-black text-white italic underline decoration-neuro-orange decoration-4 underline-offset-8">Map Intelligence Active.</h2>
              <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
                 You are viewing student density across <span className="text-white font-bold">Denver Metro</span>. High-readiness candidates are clustered near Palmer College.
              </p>
              <div className="flex gap-4 justify-center pt-4">
                 <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Local Density</p>
                    <p className="text-lg font-black text-white">High (84%)</p>
                 </div>
                 <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Market Saturation</p>
                    <p className="text-lg font-black text-white italic underline decoration-neuro-orange decoration-2 underline-offset-4">Low</p>
                 </div>
              </div>
              <button 
                onClick={() => setViewMode('grid')}
                className="px-8 py-4 bg-white text-neuro-navy font-black rounded-2xl hover:bg-gray-100 transition-all text-xs uppercase tracking-widest flex items-center gap-2 mx-auto"
              >
                Return to Grid <ArrowRight className="w-4 h-4" />
              </button>
           </div>
        </div>
      )}

      {/* Student Profile Modal */}
      {selectedStudentForProfile && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-neuro-navy/40">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-white/20">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-neuro-navy text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-neuro-orange flex items-center justify-center text-white font-black text-2xl shadow-lg">
                   {selectedStudentForProfile.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-2xl font-black">{selectedStudentForProfile.name}</h3>
                  <p className="text-[10px] uppercase font-black text-white/50 tracking-widest flex items-center gap-2">
                    <GraduationCap className="w-3 h-3" /> {selectedStudentForProfile.school} • Class of {selectedStudentForProfile.gradYear}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedStudentForProfile(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-8 h-8" />
              </button>
            </div>
            
            <div className="p-8 max-h-[70vh] overflow-y-auto space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                     <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">About</h4>
                     <p className="text-gray-600 leading-relaxed">{selectedStudentForProfile.bio}</p>
                     
                     <div className="pt-4 space-y-4">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Core Interests</h4>
                        <div className="flex flex-wrap gap-2">
                           {selectedStudentForProfile.interests.map((interest: string, i: number) => (
                             <span key={i} className="px-3 py-1 bg-neuro-cream rounded-full text-[10px] font-black uppercase text-neuro-navy">
                                {interest}
                             </span>
                           ))}
                        </div>
                     </div>
                  </div>
                  
                  <div className="space-y-6">
                     <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                           <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Readiness Score</h4>
                           <span className="text-2xl font-black text-neuro-navy">{selectedStudentForProfile.readinessScore}%</span>
                        </div>
                        <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                           <div className="h-full bg-green-500 rounded-full" style={{ width: `${selectedStudentForProfile.readinessScore}%` }}></div>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-4 leading-relaxed">
                           This score is based on academic performance, clinical seminar attendance, and technical proficiency assessments.
                        </p>
                     </div>

                     <div className="space-y-4">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Key Achievements</h4>
                        <div className="space-y-2">
                           {selectedStudentForProfile.achievements.map((achievement: string, i: number) => (
                             <div key={i} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl">
                                <Award className="w-4 h-4 text-neuro-orange" />
                                <span className="text-xs font-bold text-neuro-navy">{achievement}</span>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>

               <div className="pt-8 border-t border-gray-100 flex gap-4">
                  <button 
                    onClick={() => {
                      setSelectedStudentForProfile(null);
                      openInterviewRequest(selectedStudentForProfile);
                    }}
                    className="flex-1 py-4 bg-neuro-navy text-white font-black rounded-2xl hover:bg-neuro-navy-light transition-all shadow-xl flex items-center justify-center gap-3 group"
                  >
                     <Zap className="w-5 h-5 text-neuro-orange fill-neuro-orange group-hover:animate-pulse" /> Send Interview Request
                  </button>
                  <button 
                    onClick={() => toggleFavorite(selectedStudentForProfile.id)}
                    className={`px-8 py-4 border rounded-2xl transition-all flex items-center justify-center gap-3 font-black ${
                      favorites.has(selectedStudentForProfile.id) 
                        ? 'bg-neuro-orange text-white border-neuro-orange shadow-lg' 
                        : 'bg-white border-gray-200 text-neuro-navy hover:bg-gray-50'
                    }`}
                  >
                     <Star className={`w-5 h-5 ${favorites.has(selectedStudentForProfile.id) ? 'fill-current' : 'text-neuro-orange'}`} /> 
                     {favorites.has(selectedStudentForProfile.id) ? 'Saved to Pipeline' : 'Save to Pipeline'}
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Messaging Modal */}
      {selectedStudentForMessage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-neuro-navy/40">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/20">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-neuro-navy text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-neuro-orange rounded-2xl flex items-center justify-center font-black">
                  {selectedStudentForMessage.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-bold">
                    {isShadowingOffer ? "Offer Shadowing Day" : isInterviewRequest ? "Send Interview Request" : `Message ${selectedStudentForMessage.name}`}
                  </h3>
                  <p className="text-[10px] uppercase font-black text-white/50 tracking-widest">
                    {isShadowingOffer ? "Shadowing Stipend & Clinical Audit" : isInterviewRequest ? "Culture Fit Call Invitation" : "Student Recruitment Inquiry"}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedStudentForMessage(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8">
              {messageSent ? (
                <div className="py-12 text-center space-y-4 animate-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-10 h-10" />
                  </div>
                  <h4 className="text-xl font-bold text-neuro-navy">{isShadowingOffer ? "Offer Sent!" : "Request Sent!"}</h4>
                  <p className="text-gray-500">Your invitation has been delivered to {selectedStudentForMessage.name.split(' ')[0]}.</p>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {isShadowingOffer ? "Shadowing Stipend Template" : "High-Converting Template"}
                      </label>
                      {(isInterviewRequest || isShadowingOffer) && (
                        <span className="flex items-center gap-1 text-[9px] font-black text-neuro-orange uppercase">
                          <Zap className="w-2.5 h-2.5 fill-current" /> {isShadowingOffer ? "Elite Perk" : "Optimized"}
                        </span>
                      )}
                    </div>
                    <textarea 
                      required
                      defaultValue={
                        isShadowingOffer 
                          ? getShadowingTemplate(selectedStudentForMessage) 
                          : isInterviewRequest 
                            ? getInterviewTemplate(selectedStudentForMessage) 
                            : ""
                      }
                      placeholder={`Hi ${selectedStudentForMessage.name.split(' ')[0]}, I saw your profile on the Talent Radar and would love to chat about...`}
                      className="w-full p-6 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 min-h-[150px] transition-all text-sm leading-relaxed"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <button className="w-full py-5 bg-neuro-orange text-white font-black rounded-2xl hover:bg-neuro-orange-light transition-all shadow-xl shadow-neuro-orange/20 uppercase tracking-widest text-xs flex items-center justify-center gap-3 group">
                      {isShadowingOffer ? (
                        <>
                          <Gift className="w-4 h-4 text-white group-hover:scale-110 transition-transform" /> Send Shadowing Stipend
                        </>
                      ) : isInterviewRequest ? (
                        <>
                          <Zap className="w-4 h-4 fill-current group-hover:animate-pulse" /> Send with Smart-Invite
                        </>
                      ) : (
                        "Send Message"
                      )}
                    </button>
                    {isShadowingOffer ? (
                      <p className="text-[9px] text-gray-400 text-center font-bold uppercase tracking-tighter">
                        Includes <span className="text-neuro-orange">Paid Audit</span>, Lunch, and $100 Student Stipend
                      </p>
                    ) : isInterviewRequest && (
                      <p className="text-[9px] text-gray-400 text-center font-bold uppercase tracking-tighter">
                        Includes your <span className="text-neuro-orange">Calendly</span> link for 1-click scheduling
                      </p>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
