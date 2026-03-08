"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Building2, 
  Clock, 
  ArrowRight, 
  Target, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight, 
  LineChart,
  Eye,
  CheckCircle2,
  X,
  Lock
} from "lucide-react";
import Link from "next/link";
import { Automations } from "@/lib/automations";
import { useStudentTier } from "@/context/StudentTierContext";

export default function JobsPage() {
  const router = useRouter();
  const { tier, isProfessional, isFoundation, isAccelerator } = useStudentTier();
  const [toast, setToast] = useState<{isOpen: boolean, message: string}>({ isOpen: false, message: "" });

  const handleApply = async (jobTitle: string, clinicName: string) => {
    if (!isProfessional) return; // Safeguard
    // Arguments: applicantId, email, jobId, jobTitle
    await Automations.onJobApplication("Student_User", "student@example.com", "MOCK_JOB_ID", jobTitle);
    setToast({ isOpen: true, message: `Application sent to ${clinicName} for the ${jobTitle} position!` });
    setTimeout(() => setToast({ isOpen: false, message: "" }), 3000);
  };

  const jobs = [
    {
      title: "Associate Chiropractor",
      clinic: "Vitality Neuro Life",
      location: "Denver, CO",
      type: "Full-time",
      posted: "2 days ago",
      matchScore: 98,
      status: "Active"
    },
    {
      title: "Pediatric Focused Associate",
      clinic: "The Neural Connection",
      location: "Austin, TX",
      type: "Full-time",
      posted: "1 week ago",
      matchScore: 94,
      status: "Applied"
    },
    {
      title: "Internship / Pre-ceptorship",
      clinic: "Roots Chiropractic",
      location: "Chicago, IL",
      type: "Part-time",
      posted: "3 days ago",
      matchScore: 92,
      status: "Active"
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
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-heading font-black text-neuro-navy">Opportunities</h1>
          <p className="text-neuro-gray mt-2 text-lg">Your personalized career matches and application tracker.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
             <Eye className="w-5 h-5 text-neuro-orange" />
             <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Profile Views</p>
               <p className="text-sm font-bold text-neuro-navy">12 this week</p>
             </div>
          </div>
          <div className="relative group">
            <div className={`bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 ${!isProfessional ? 'blur-[2px] opacity-50 grayscale' : ''}`}>
               <Target className="w-5 h-5 text-green-600" />
               <div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Readiness</p>
                 <p className="text-sm font-bold text-neuro-navy">85% Score</p>
               </div>
            </div>
            {!isProfessional && (
               <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px] rounded-2xl z-10">
                  <Lock className="w-4 h-4 text-neuro-navy" />
               </div>
            )}
          </div>
        </div>
      </header>

      {/* Application Tracker - Gated for Professional */}
      <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm overflow-hidden relative min-h-[200px]">
         {!isProfessional && (
            <div className="absolute inset-0 z-30 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
               <div className="w-12 h-12 bg-neuro-navy text-neuro-orange rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <Lock className="w-6 h-6" />
               </div>
               <h4 className="text-xl font-black text-neuro-navy mb-2">Application Tracking Locked</h4>
               <p className="text-sm text-gray-500 max-w-sm mb-6">Upgrade to Professional to apply for jobs and track your application status in real-time.</p>
               <Link href="/pricing" className="px-8 py-3 bg-neuro-orange text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Upgrade Now</Link>
            </div>
         )}
         <div className="absolute top-0 right-0 w-32 h-32 bg-neuro-orange/5 blur-3xl"></div>
         <h2 className="text-xl font-heading font-bold text-neuro-navy mb-6">Active Applications</h2>
         <div className={`flex gap-6 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2 ${!isProfessional ? 'blur-md grayscale' : ''}`}>
            {[
              { clinic: "The Neural Connection", status: "Interview Scheduled", date: "Oct 12", color: "bg-blue-600" },
              { clinic: "Vitality Neuro Life", status: "Reviewing Resume", date: "Oct 08", color: "bg-neuro-orange" },
              { clinic: "Pacific Health", status: "Applied", date: "Oct 01", color: "bg-gray-400" }
            ].map((app, i) => (
              <div key={i} className="flex-shrink-0 w-72 p-6 rounded-3xl bg-gray-50 border border-gray-100 group cursor-pointer hover:border-neuro-orange transition-all">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{app.date}</p>
                 <h4 className="font-bold text-neuro-navy mb-4 group-hover:text-neuro-orange transition-colors">{app.clinic}</h4>
                 <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${app.color}`}></div>
                    <span className="text-xs font-bold text-gray-600">{app.status}</span>
                 </div>
              </div>
            ))}
         </div>
      </section>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Advanced Filters */}
        <aside className="w-full md:w-64 space-y-8">
          <div className="bg-neuro-navy rounded-3xl p-6 text-white relative overflow-hidden group">
             {!isProfessional && <div className="absolute inset-0 bg-neuro-navy/40 backdrop-blur-[1px] z-10"></div>}
             <div className="relative z-20">
                <Sparkles className="w-6 h-6 text-neuro-orange mb-4" />
                <h4 className="font-bold text-sm mb-2">Smart Match</h4>
                <p className="text-[10px] text-gray-400 leading-relaxed mb-4">
                   {isProfessional 
                     ? "We've highlighted clinics that match your clinical interests and preferred location." 
                     : "Personalized matching is a Professional feature."}
                </p>
                <Link href={isProfessional ? "#" : "/pricing"} className="block w-full py-2 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-colors text-center">
                   {isProfessional ? "Adjust Preferences" : "Upgrade Plan"}
                </Link>
             </div>
          </div>
          
          <div>
            <h4 className="font-bold text-neuro-navy mb-4 text-sm uppercase tracking-widest">Job Type</h4>
            <div className="space-y-3">
              {["Associate", "Internship", "Coverage", "Partnership"].map((type) => (
                <label key={type} className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm text-gray-500 group-hover:text-neuro-navy transition-colors">{type}</span>
                  <div className="w-4 h-4 border-2 border-gray-200 rounded-md group-hover:border-neuro-orange transition-colors"></div>
                </label>
              ))}
            </div>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm relative">
             {!isProfessional && (
                <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-3xl">
                   <Lock className="w-5 h-5 text-neuro-navy opacity-20" />
                </div>
             )}
             <h4 className="font-bold text-neuro-navy mb-2 text-sm">Career Prep</h4>
             <p className="text-[10px] text-gray-500 mb-4">Improve your score to attract top clinics.</p>
             <ul className="space-y-2">
                <li className="flex items-center gap-2 text-[10px] font-bold text-green-600">
                   <CheckCircle2 className="w-3 h-3" /> Resume Uploaded
                </li>
                <li className="flex items-center gap-2 text-[10px] font-bold text-neuro-orange">
                   <Target className="w-3 h-3" /> Intro Video Missing
                </li>
             </ul>
          </div>
        </aside>

        {/* Job Listings with Match Scores */}
        <div className="flex-1 space-y-4">
          <div className="relative mb-8">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by clinic, technique, or city..." 
              className="w-full pl-16 pr-6 py-5 bg-white border border-gray-100 rounded-[2rem] focus:outline-none shadow-sm text-lg"
            />
          </div>

          {jobs.map((job, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
              {job.matchScore > 95 && isProfessional && (
                 <div className="absolute top-0 right-0 bg-neuro-orange text-white text-[9px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-[0.2em]">
                    Top Match
                 </div>
              )}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-neuro-orange transition-colors border border-gray-100 shadow-inner">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-xl text-neuro-navy group-hover:text-neuro-orange transition-colors">{job.title}</h3>
                      {job.status === "Applied" && isProfessional && (
                         <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded uppercase tracking-widest border border-blue-100">Applied</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-4">{job.clinic}</p>
                    <div className="flex flex-wrap gap-6">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" /> {job.location}
                      </span>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {job.posted}
                      </span>
                      <span className={`text-[10px] font-black text-neuro-orange uppercase tracking-widest flex items-center gap-1.5 ${!isProfessional ? 'blur-[2px] opacity-40 select-none' : ''}`}>
                        <LineChart className="w-3.5 h-3.5" /> {isProfessional ? `${job.matchScore}% Match` : "XX% Match"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row md:flex-col items-center md:items-end gap-3">
                  <button className="px-6 py-3 bg-gray-50 text-neuro-navy font-black rounded-xl text-xs hover:bg-gray-100 transition-colors border border-gray-100">
                    View Details
                  </button>
                  <button 
                    onClick={() => isProfessional ? handleApply(job.title, job.clinic) : router.push('/pricing')}
                    className={`px-6 py-3 ${job.status === 'Applied' && isProfessional ? 'bg-gray-100 text-gray-400' : 'bg-neuro-navy text-white hover:bg-neuro-navy-light shadow-lg shadow-neuro-navy/20'} font-black rounded-xl text-xs transition-all relative overflow-hidden`}
                  >
                    {!isProfessional && <Lock className="w-3 h-3 absolute top-1 right-1 opacity-20" />}
                    {job.status === 'Applied' && isProfessional ? 'Manage App' : isProfessional ? 'Apply Now' : 'Upgrade to Apply'}
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button className="w-full py-8 text-sm font-bold text-gray-400 hover:text-neuro-navy transition-colors">
            View 24 More Opportunities
          </button>
        </div>
      </div>
    </div>
  );
}
