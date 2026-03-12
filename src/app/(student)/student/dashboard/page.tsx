"use client";

import { 
  Calendar, 
  Briefcase, 
  TrendingUp, 
  CheckCircle2, 
  Star,
  ArrowRight,
  Sparkles,
  Target,
  Users,
  Zap,
  ChevronRight,
  Search,
  MapPin,
  Lock,
  Trophy,
  Loader2,
  DollarSign,
  Clock
} from "lucide-react";
import Link from "next/link";
import { useStudentTier } from "@/context/StudentTierContext";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { getStudentDashboardData, transitionToDoctorAction } from "./actions";
import JobRadar from "@/components/student/JobRadar";
import { useRouter } from "next/navigation";

export default function StudentDashboard() {
  const { tier, isFoundation, isProfessional, isAccelerator } = useStudentTier();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const result = await getStudentDashboardData();
      if (result) setData(result);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleTransition = async () => {
    setTransitioning(true);
    const result = await transitionToDoctorAction();
    if (result.success) {
        // Force full reload to update context and UI correctly
        window.location.href = '/doctor/dashboard';
    } else {
        alert("Failed to transition account. Please try again.");
        setTransitioning(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neuro-cream">
        <Loader2 className="w-10 h-10 text-neuro-orange animate-spin" />
      </div>
    );
  }

  const studentName = data?.profile?.name || "Student";
  const schoolInfo = `${data?.profile?.school || "Life University"} '${data?.profile?.gradYear?.toString().slice(-2) || "27"}`;
  
  const currentYear = new Date().getFullYear();
  const gradYear = data?.profile?.gradYear ? parseInt(data.profile.gradYear, 10) : null;
  const isGraduating = gradYear && gradYear <= currentYear;

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10">
      {isGraduating && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neuro-navy border border-neuro-orange/30 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-neuro-orange/10 blur-[80px] pointer-events-none"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-neuro-orange rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Trophy className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Congratulations, Doctor!</h3>
              <p className="text-sm font-medium text-gray-300 mt-1">
                It looks like you've graduated. Transition your account to a full Doctor profile to activate your directory listing.
              </p>
            </div>
          </div>
          <button 
            onClick={handleTransition}
            disabled={transitioning}
            className="px-8 py-4 bg-neuro-orange text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-neuro-orange-light transition-all whitespace-nowrap shadow-xl shadow-neuro-orange/20 relative z-10 disabled:opacity-50 flex items-center gap-2"
          >
            {transitioning ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Transition Account
          </button>
        </motion.div>
      )}

      {/* Personalized Engagement Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neuro-orange/10 border border-neuro-orange/20 p-4 rounded-[2rem] flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-neuro-orange rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <p className="text-sm font-bold text-neuro-navy">
            New clinic matching your criteria just joined in <span className="underline decoration-neuro-orange">Denver, CO</span>.
          </p>
        </div>
        <button 
          onClick={() => alert("Redirecting to specific clinic match details...")}
          className="px-6 py-2 bg-neuro-navy text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-neuro-navy-light transition-all"
        >
          View Match
        </button>
      </motion.div>

      {/* Welcome & Global Stats */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-heading font-black text-neuro-navy leading-tight">
            Elevating your career, <span className="text-neuro-orange">{studentName}</span>.
          </h1>
          <div className="flex items-center gap-3 mt-2">
             <span className="px-3 py-1 bg-neuro-navy text-white text-[10px] font-black rounded-full uppercase tracking-widest flex items-center gap-2">
                {tier === "Accelerator" && <Sparkles className="w-3 h-3 text-neuro-orange" />}
                {tier === "Professional" && <Zap className="w-3 h-3 text-neuro-orange" />}
                {tier === "Foundation" && <Trophy className="w-3 h-3 text-neuro-orange" />}
                {tier} Member
             </span>
             <span className="text-neuro-gray text-lg">• {schoolInfo}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-w-[140px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-1 bg-neuro-orange/10 text-neuro-orange group-hover:bg-neuro-orange group-hover:text-white transition-colors">
               <DollarSign className="w-2.5 h-2.5" />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Market Value Index</span>
            <div className="flex items-baseline gap-1">
               <span className="text-2xl font-black text-neuro-navy">{data?.stats?.readiness || 85}%</span>
               <span className="text-[10px] font-bold text-green-500">+$60k Gap</span>
            </div>
          </div>
          <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-w-[120px]">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Elite Opps</span>
            <span className="text-2xl font-black text-neuro-navy">{data?.stats?.applications || 4}</span>
          </div>
          <div className="bg-neuro-orange px-6 py-4 rounded-2xl shadow-lg flex flex-col items-center justify-center min-w-[120px] text-white">
            <span className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">Hire-ability</span>
            <span className="text-2xl font-black">{(data?.stats?.matchScore || 9.2).toFixed(1)}</span>
          </div>
        </div>
      </header>

      {/* REST OF THE UI - MAINTAINED FROM ORIGINAL */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mentorship - Accelerator */}
          <div className="relative group">
            <Link href={isAccelerator ? "/student/clinics" : "/pricing"} className={`bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group block h-full ${!isAccelerator ? 'opacity-60 grayscale-[0.5]' : ''}`}>
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                <Users className="w-6 h-6 text-blue-600 group-hover:text-white" />
              </div>
              <h3 className="font-bold text-neuro-navy mb-1">Mentorship</h3>
              <p className="text-[10px] text-gray-500 leading-tight">
                {isAccelerator 
                  ? "2 active mentor connections" 
                  : "14 High-Volume Doctors in your region looked for an associate this week. Your profile was hidden."
                }
              </p>
              <div className="mt-4 flex items-center gap-1 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                {isAccelerator ? "View Network" : "Unlock Connections"} <ChevronRight className="w-3 h-3" />
              </div>
            </Link>
            {!isAccelerator && (
               <div className="absolute top-4 right-4">
                  <Lock className="w-4 h-4 text-neuro-orange" />
               </div>
            )}
          </div>

          {/* Applications - Professional */}
          <div className="relative group">
            <Link href={isProfessional ? "/student/jobs" : "/pricing"} className={`bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group block h-full ${!isProfessional ? 'opacity-60 grayscale-[0.5]' : ''}`}>
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-neuro-orange transition-colors">
                <Briefcase className="w-6 h-6 text-neuro-orange group-hover:text-white" />
              </div>
              <h3 className="font-bold text-neuro-navy mb-1">Applications</h3>
              <p className="text-[10px] text-gray-500 leading-tight">
                {isProfessional 
                  ? `${data?.stats?.applications || 0} active job applications` 
                  : "3 'Elite' Tier jobs were posted in Denver today. Paid members already have interviews scheduled."
                }
              </p>
              <div className="mt-4 flex items-center gap-1 text-[10px] font-black text-neuro-orange uppercase tracking-widest">
                {isProfessional ? "Track Status" : "Reveal Views"} <ChevronRight className="w-3 h-3" />
              </div>
            </Link>
            {!isProfessional && (
               <div className="absolute top-4 right-4">
                  <Lock className="w-4 h-4 text-neuro-orange" />
               </div>
            )}
          </div>

          {/* Academy - Foundation */}
          <div className="relative group">
            <Link href={isFoundation ? "/student/learn" : "/pricing"} className={`bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group block h-full ${!isFoundation ? 'opacity-60 grayscale-[0.5]' : ''}`}>
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-purple-600 transition-colors">
                <Trophy className="w-6 h-6 text-purple-600 group-hover:text-white" />
              </div>
              <h3 className="font-bold text-neuro-navy mb-1">Neuro Academy</h3>
              <p className="text-[10px] text-gray-500 leading-tight">
                {isFoundation 
                  ? "12 modules in progress" 
                  : "Current Market Value: $85k (Unoptimized). Elite Associate Potential: $145k+."
                }
              </p>
              <div className="mt-4 flex items-center gap-1 text-[10px] font-black text-purple-600 uppercase tracking-widest">
                {isFoundation ? "Continue Learning" : "Optimize Salary"} <ChevronRight className="w-3 h-3" />
              </div>
            </Link>
            {!isFoundation && (
               <div className="absolute top-4 right-4">
                  <Lock className="w-4 h-4 text-neuro-orange" />
               </div>
            )}
          </div>
        </div>

        {/* Sidebar Mini Action - Urgency / Countdown */}
        <div className="bg-neuro-navy rounded-[2.5rem] p-8 text-white relative overflow-hidden flex flex-col justify-between shadow-2xl border border-white/5">
           <div className="absolute top-0 right-0 w-48 h-48 bg-neuro-orange/20 blur-[60px] -mr-24 -mt-24"></div>
           <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-black text-neuro-orange uppercase tracking-widest flex items-center gap-2">
                   <Clock className="w-3 h-3" /> Success Window
                </span>
                <div className="px-2 py-1 bg-green-500/20 text-green-500 text-[8px] font-black uppercase tracking-widest rounded-lg border border-green-500/30">
                   +$50k Career Premium
                </div>
              </div>

              <h4 className="text-2xl font-black mb-2 leading-tight">Class of '27 <br />Elite Track</h4>
              
              <div className="space-y-4 mb-8 mt-6">
                 <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tighter">
                       <span className="text-gray-400">Roadmap Status</span>
                       <span className="text-neuro-orange">Action Required</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                       <div className="h-full bg-neuro-orange w-1/3 shadow-[0_0_10px_rgba(214,104,41,0.5)]" />
                    </div>
                 </div>

                 <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <p className="text-[11px] text-gray-300 leading-relaxed font-medium">
                       "You need <span className="text-white font-black">12 clinical modules</span> completed by Oct '26 to lock in your <span className="text-neuro-orange font-black">Tier 1 Associate Contract</span>."
                    </p>
                 </div>
              </div>
           </div>
           
           <div className="space-y-3 relative z-10">
              <Link href="/student/learn" className="block w-full py-4 bg-neuro-orange text-white font-black text-[11px] uppercase tracking-widest rounded-2xl text-center hover:bg-neuro-orange-light transition-all shadow-xl shadow-neuro-orange/20 active:scale-[0.98]">
                 Accelerate My Path
              </Link>
              <p className="text-[9px] text-gray-500 text-center font-bold uppercase tracking-tighter">
                 Unlocks the 2026 Associate Placement Roadmap
              </p>
           </div>
        </div>
      </div>

      {/* Main Insights & Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            {/* New Opportunity Radar */}
            <JobRadar />

            {/* Career Readiness Meter */}
            <section className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
               <div className="flex items-center justify-between mb-8">
                  <div>
                     <h3 className="text-xl font-bold text-neuro-navy">Career Readiness</h3>
                     <p className="text-sm text-gray-500">Based on your clinical engagement & profile data.</p>
                  </div>
                  <div className="text-right">
                     <span className="text-3xl font-black text-neuro-navy">85%</span>
                     <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Excellent</p>
                  </div>
               </div>
               
               <div className="space-y-6">
                  {[
                    { label: "Clinical Certifications", score: 90, color: "bg-green-500" },
                    { label: "Community Engagement", score: 75, color: "bg-blue-500" },
                    { label: "Profile Optimization", score: 95, color: "bg-neuro-orange" },
                    { label: "Soft Skills Assessment", score: 80, color: "bg-purple-500" }
                  ].map((item, i) => (
                    <div key={i}>
                       <div className="flex justify-between mb-2">
                          <span className="text-xs font-bold text-gray-600">{item.label}</span>
                          <span className="text-xs font-black text-neuro-navy">{item.score}%</span>
                       </div>
                       <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${item.score}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className={`h-full ${item.color}`}
                          />
                       </div>
                    </div>
                  ))}
               </div>
            </section>

            {/* Smart Matching Feed */}
            <section className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Target className="w-32 h-32 text-neuro-navy" />
               </div>
               <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-xl font-bold text-neuro-navy flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-neuro-orange" /> Career Accelerator Feed
                     </h3>
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Market Updated Daily</span>
                  </div>

                  <div className="space-y-4">
                     {[
                       { clinic: "Vitality NeuroChiro", location: "Austin, TX", match: "98%", type: "Elite Associate", roi: "$150k Career Value" },
                       { clinic: "The Well Family", location: "Denver, CO", match: "94%", type: "Associate Role", roi: "Mentorship-First" },
                       { clinic: "Apex Clinical", location: "Charlotte, NC", match: "91%", type: "Mentorship", roi: "High Volume" }
                     ].map((match, i) => (
                       <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer group/item">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-neuro-navy font-bold shadow-sm group-hover/item:bg-neuro-navy group-hover/item:text-white transition-all text-sm">
                                {match.clinic[0]}
                             </div>
                             <div>
                                <h4 className="text-sm font-bold text-neuro-navy">{match.clinic}</h4>
                                <p className="text-[10px] text-gray-500">{match.location} • <span className="text-neuro-orange font-bold">{match.type}</span></p>
                             </div>
                          </div>
                          <div className="text-right">
                             <span className="text-xs font-black text-green-600 block">{match.roi}</span>
                             <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Projected Value</p>
                          </div>
                       </div>
                     ))}
                  </div>

                  {/* Hormozi Lead Magnet */}
                  <div className="mt-8 p-6 bg-neuro-navy rounded-3xl relative overflow-hidden border border-white/10 group/magnet">
                     <div className="absolute top-0 right-0 p-4 opacity-20 group-hover/magnet:scale-110 transition-transform">
                        <Zap className="w-12 h-12 text-neuro-orange fill-current" />
                     </div>
                     <div className="relative z-10">
                        <p className="text-[10px] font-black text-neuro-orange uppercase tracking-widest mb-2">Member Gift: Unlocked</p>
                        <h4 className="text-lg font-black text-white mb-2">The Associate Contract Blacklist</h4>
                        <p className="text-xs text-gray-400 leading-relaxed mb-6 max-w-sm">
                           Protect your career. Download the exact "Contract Red-Flags" our legal team identified in 90% of chiropractic associate agreements.
                        </p>
                        {!isFoundation ? (
                           <Link href="/pricing" className="px-6 py-3 bg-white text-neuro-navy font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-neuro-orange hover:text-white transition-all inline-block">
                              Upgrade to Unlock Gift
                           </Link>
                        ) : (
                           <button className="px-6 py-3 bg-green-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-green-600 transition-all">
                              Download My Copy
                           </button>
                        )}
                     </div>
                  </div>
                  
                  <button 
                    onClick={() => alert("Loading full list of clinical matches...")}
                    className="w-full mt-6 py-4 border-2 border-dashed border-gray-200 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:border-neuro-orange hover:text-neuro-orange transition-all"
                  >
                     View All Potential Matches
                  </button>
               </div>
            </section>
         </div>

         <div className="space-y-8">
            {/* Seminar Calendar */}
            <section className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
               <h3 className="text-lg font-bold text-neuro-navy mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-neuro-orange" /> Upcoming Seminars
               </h3>
               <div className="space-y-6">
                  {[
                    { title: "Neuro-Pediatric Level 1", date: "Mar 15", host: "Dr. Nichols" },
                    { title: "The Clinical Protocol", date: "Apr 02", host: "Dr. Segura" },
                    { title: "Practice Launchpad", date: "Apr 18", host: "Global Team" }
                  ].map((event, i) => (
                    <div key={i} className="flex items-start gap-4 group/event cursor-pointer">
                       <div className="flex flex-col items-center justify-center w-12 h-12 bg-gray-50 rounded-xl group-hover/event:bg-neuro-orange group-hover/event:text-white transition-all">
                          <span className="text-[10px] font-black uppercase tracking-tighter">{event.date.split(' ')[0]}</span>
                          <span className="text-sm font-black">{event.date.split(' ')[1]}</span>
                       </div>
                       <div>
                          <h4 className="text-sm font-bold text-neuro-navy group-hover/event:text-neuro-orange transition-colors">{event.title}</h4>
                          <p className="text-[10px] text-gray-500 font-medium">Hosted by {event.host}</p>
                       </div>
                    </div>
                  ))}
               </div>
               <Link href="/seminars" className="block w-full mt-8 py-3 bg-neuro-navy text-white font-black text-[10px] uppercase tracking-widest rounded-xl text-center hover:bg-neuro-navy-light transition-all shadow-lg shadow-neuro-navy/10">
                  Full Seminar Feed
               </Link>
            </section>

            {/* Resume Status */}
            <section className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm text-center">
               <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
               </div>
               <h3 className="font-bold text-neuro-navy mb-1">Resume Verified</h3>
               <p className="text-xs text-gray-500 mb-6">Your clinical profile is 100% complete and ready for elite clinics.</p>
               <button 
                onClick={() => alert("Opening clinical CV and intro video editor...")}
                className="text-[10px] font-black text-neuro-orange uppercase tracking-widest hover:underline"
               >
                  Update CV / Intro Video
               </button>
            </section>
         </div>
      </div>
    </div>
  );
}
