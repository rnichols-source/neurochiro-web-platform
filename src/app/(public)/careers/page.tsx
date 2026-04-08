"use client";

import { useState } from "react";
import { 
  Briefcase, 
  MapPin, 
  Search, 
  ChevronRight, 
  Heart, 
  Users, 
  Calendar, 
  DollarSign, 
  Filter, 
  Clock, 
  CheckCircle2, 
  Zap, 
  X,
  UploadCloud
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useStudentTier } from "@/context/StudentTierContext";
import { useUserPreferences } from "@/context/UserPreferencesContext";

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

export default function CareersPage() {
  const { lastLocation } = useUserPreferences();
  const { toggleSave, isSaved } = useUserPreferences();
  const [activeFilter, setActiveFilter] = useState("All Roles");
  const [searchQuery, setSearchQuery] = useState(lastLocation || "");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [applicationStep, setApplicationStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOneClickApplying, setIsOneClickApplying] = useState(false);
  const { isProfessional, tier } = useStudentTier();

  const handleOneClickApply = async () => {
    setIsOneClickApplying(true);
    // Simulate API call to fetch profile and submit
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsOneClickApplying(false);
    alert(`Success! Your NeuroChiro ${tier} Profile has been securely submitted to ${selectedJob?.clinic}. You'll receive an update in your dashboard once they review your application.`);
    setSelectedJob(null);
    setTimeout(() => setApplicationStep(1), 300);
  };

  const filters = ["All Roles", "Front Desk CA", "Tech CA", "Patient Coordinator", "Office Manager"];

  const jobs = [
    {
      id: 1,
      title: "Front Desk Patient Concierge",
      clinic: "Vitality NeuroChiro",
      location: "Denver, CO",
      type: "Full-Time",
      role_type: "Front Desk CA",
      salary: "$20 - $25 / hr + Bonus",
      posted: "2 days ago",
      tags: ["High Energy", "Family Focused", "Training Provided"],
      description: "We are looking for a high-energy director of first impressions. You will be the first face our practice members see when they walk through the door. If you love people, health, and a fast-paced environment, this is for you."
    },
    {
      id: 2,
      title: "Clinical Tech Assistant",
      clinic: "Apex Neurological",
      location: "Austin, TX",
      type: "Full-Time",
      role_type: "Tech CA",
      salary: "$45,000 - $55,000 / yr",
      posted: "1 week ago",
      tags: ["Tech Savvy", "Clinical Focus", "Mission Driven"],
      description: "Join our clinical team helping with thermal scanning, patient vitals, and education. No prior chiropractic experience required; we provide full certification in neuro-scans."
    },
    {
      id: 3,
      title: "Wellness Coordinator",
      clinic: "Thrive Family Practice",
      location: "Charlotte, NC",
      type: "Part-Time",
      role_type: "Patient Coordinator",
      salary: "$18 - $22 / hr",
      posted: "3 days ago",
      tags: ["Pediatric", "Community Events", "Flexible"],
      description: "Help us coordinate community health talks, patient appreciation days, and internal marketing. Perfect for someone who loves event planning and holistic health."
    }
  ];

  const filteredJobs = jobs.filter(job => {
    const matchesFilter = activeFilter === "All Roles" || job.role_type === activeFilter;
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         job.clinic.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setApplicationStep(3); // Success state
    }, 2000);
  };

  const closeApplication = () => {
    setSelectedJob(null);
    setTimeout(() => setApplicationStep(1), 300); // Reset step after closing animation
  };

  return (
    <div className="min-h-dvh bg-neuro-cream pt-24 pb-20 overflow-x-hidden">
      
      {/* Application Modal */}
      <AnimatePresence>
        {selectedJob && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeApplication}
              className="absolute inset-0 bg-neuro-navy/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] sm:rounded-[3rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 sm:p-8 border-b border-gray-100 flex items-start justify-between bg-neuro-navy text-white shrink-0">
                <div>
                  <p className="text-[10px] font-black text-neuro-orange uppercase tracking-widest mb-1">Applying For</p>
                  <h3 className="text-xl sm:text-2xl font-heading font-black">{selectedJob.title}</h3>
                  <p className="text-sm text-gray-300 mt-1">{selectedJob.clinic} • {selectedJob.location}</p>
                </div>
                <button onClick={closeApplication} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 sm:p-8 overflow-y-auto flex-1">
                {applicationStep === 1 && (
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                     <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-neuro-navy rounded-[2rem] text-white border border-white/10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-neuro-orange/10 blur-3xl group-hover:bg-neuro-orange/20 transition-all"></div>
                        <div className="w-14 h-14 bg-neuro-orange rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
                           <Users className="w-7 h-7" />
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                           <h4 className="font-bold text-lg mb-1">Applying as a Guest?</h4>
                           <p className="text-sm text-gray-300">You can apply below, but creating a profile lets you track application status, save resumes, and get matched with elite clinics automatically.</p>
                        </div>
                        <div className="flex flex-col gap-3">
                           {isProfessional ? (
                              <button 
                                 onClick={handleOneClickApply}
                                 disabled={isOneClickApplying}
                                 className="px-6 py-3 bg-neuro-orange text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-neuro-orange-light transition-all whitespace-nowrap shadow-xl flex items-center gap-2"
                              >
                                 {isOneClickApplying ? 'Applying...' : '1-Click Apply with Profile'} <Zap className={cn("w-3.5 h-3.5", isOneClickApplying ? "animate-pulse" : "fill-current")} />
                              </button>
                           ) : (
                              <Link href="/register?role=student" className="px-6 py-3 bg-white text-neuro-navy font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-neuro-orange hover:text-white transition-all whitespace-nowrap shadow-xl">
                                 Create Profile First
                              </Link>
                           )}
                        </div>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">First Name</label>
                           <input type="text" autoComplete="given-name" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-neuro-orange transition-colors" placeholder="Jane" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Last Name</label>
                           <input type="text" autoComplete="family-name" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-neuro-orange transition-colors" placeholder="Doe" />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                           <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
                           <input type="email" autoComplete="email" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-neuro-orange transition-colors" placeholder="jane@example.com" />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                           <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Phone Number</label>
                           <input type="tel" autoComplete="tel" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-neuro-orange transition-colors" placeholder="(555) 123-4567" />
                        </div>
                     </div>

                     <button 
                       onClick={() => setApplicationStep(2)}
                       className="w-full py-4 bg-neuro-navy text-white font-black uppercase tracking-widest rounded-2xl hover:bg-neuro-navy-light transition-all flex items-center justify-center gap-2"
                     >
                       Continue to Questions <ChevronRight className="w-4 h-4" />
                     </button>
                  </motion.div>
                )}

                {applicationStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Upload Resume (PDF)</label>
                        <div className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-neuro-orange transition-colors cursor-pointer bg-gray-50">
                           <UploadCloud className="w-8 h-8 text-gray-400 mb-3" />
                           <p className="text-sm font-bold text-neuro-navy">Click to browse or drag file here</p>
                           <p className="text-xs text-gray-500 mt-1">Maximum file size: 5MB</p>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Why are you interested in holistic health?</label>
                        <textarea rows={4} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-neuro-orange transition-colors resize-none" placeholder="Share a bit about your philosophy..."></textarea>
                     </div>

                     <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <button 
                          onClick={() => setApplicationStep(1)}
                          className="px-6 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all text-sm"
                        >
                          Back
                        </button>
                        <button 
                          onClick={handleApply}
                          disabled={isSubmitting}
                          className="flex-1 py-4 bg-neuro-orange text-white font-black uppercase tracking-widest rounded-2xl hover:bg-neuro-orange-dark transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-70"
                        >
                          {isSubmitting ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Submitting...
                            </div>
                          ) : "Submit Application"}
                        </button>
                     </div>
                  </motion.div>
                )}

                {applicationStep === 3 && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-12 text-center space-y-4">
                     <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                     </div>
                     <h3 className="text-3xl font-heading font-black text-neuro-navy">Application Sent!</h3>
                     <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
                       Your profile and resume have been securely delivered to <strong>{selectedJob.clinic}</strong>. Keep an eye on your inbox for the next steps.
                     </p>
                     <button 
                       onClick={closeApplication}
                       className="mt-8 px-8 py-4 bg-neuro-navy text-white font-black uppercase tracking-widest rounded-2xl hover:bg-neuro-navy-light transition-all inline-block"
                     >
                       Return to Jobs
                     </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 1. Hero Section */}
      <section className="relative pt-12 pb-24 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neuro-orange/10 blur-[120px] rounded-full -mr-40 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 relative z-10">
            <span className="text-neuro-orange font-black uppercase tracking-[0.4em] text-[10px] block border border-neuro-orange/20 px-4 py-1.5 rounded-full w-max">NeuroChiro Careers</span>
            <h1 className="text-5xl md:text-7xl font-heading font-black text-neuro-navy leading-[1.05]">
              More Than a Job. <br/>
              <span className="text-neuro-orange">A Mission.</span>
            </h1>
            <p className="text-gray-600 text-lg md:text-xl leading-relaxed max-w-lg">
              Join the frontlines of holistic healthcare. Discover fulfilling opportunities as a Chiropractic Assistant (CA) in nervous-system-focused clinics near you.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={() => document.getElementById('job-board')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-neuro-navy hover:bg-neuro-navy-light text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-xl transition-all flex items-center gap-3"
              >
                View Open Roles <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="relative hidden lg:block">
             <div className="absolute inset-0 bg-gradient-to-tr from-neuro-navy/5 to-neuro-orange/5 rounded-[3rem] blur-2xl transform rotate-3"></div>
             <div className="bg-white p-2 rounded-[3rem] shadow-2xl relative z-10 transform -rotate-2 border border-gray-100">
                <img loading="lazy" decoding="async" 
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
                  alt="Chiropractic Assistant interacting with patient" 
                  className="rounded-[2.5rem] w-full h-[400px] object-cover"
                />
             </div>
             {/* Floating badge */}
             <div className="absolute -bottom-6 -left-6 bg-white p-5 rounded-2xl shadow-2xl border border-gray-50 flex items-center gap-4 z-20 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                   <Heart className="w-6 h-6 text-green-500 fill-current" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Impact Score</p>
                   <p className="font-bold text-neuro-navy">100+ Lives Touched Daily</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* 2. Educational Section: What is a CA? */}
      <section className="py-24 px-6 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-black text-neuro-navy mb-4">What does a Chiropractic Assistant do?</h2>
            <p className="text-gray-500 text-lg">You aren't just answering phones. You are the director of first impressions and the operational heartbeat of the clinic.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {[
               { icon: Users, title: "Front Desk Concierge", desc: "Manage patient flow, scheduling, and ensure every practice member feels seen, heard, and welcomed the moment they arrive." },
               { icon: Zap, title: "Clinical Tech", desc: "Assist the doctor with clinical duties, perform neuro-scans (training provided!), and educate patients on their healing journey." },
               { icon: Heart, title: "Wellness Coordinator", desc: "Drive community impact through internal marketing, event planning, and orchestrating patient appreciation days." }
             ].map((role, i) => (
               <div key={i} className="p-8 bg-neuro-cream rounded-[2.5rem] border border-gray-100 hover:border-neuro-orange transition-all group">
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                     <role.icon className="w-7 h-7 text-neuro-orange" />
                  </div>
                  <h3 className="text-xl font-bold text-neuro-navy mb-3">{role.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm">{role.desc}</p>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* 3. Job Board / Discovery Feed */}
      <section id="job-board" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                 <h2 className="text-4xl font-heading font-black text-neuro-navy mb-2">Open Opportunities</h2>
                 <p className="text-gray-500">Find clinics looking for mission-driven team members.</p>
              </div>
              <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                 <Search className="w-5 h-5 text-gray-400 ml-3" />
                 <input 
                   type="text" 
                   placeholder="Search by city or zip..." 
                   className="w-full md:w-64 p-2 bg-transparent outline-none text-sm font-bold text-neuro-navy"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
                 <button className="p-3 bg-neuro-navy text-white rounded-xl hover:bg-neuro-navy-light transition-colors">
                    <MapPin className="w-4 h-4" />
                 </button>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Filters Sidebar */}
              <div className="lg:col-span-1 space-y-8">
                 <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm sticky top-32">
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                       <Filter className="w-4 h-4 text-neuro-orange" />
                       <h3 className="font-bold text-neuro-navy uppercase tracking-widest text-xs">Role Type</h3>
                    </div>
                    <div className="space-y-2">
                       {filters.map(filter => (
                         <button 
                           key={filter}
                           onClick={() => setActiveFilter(filter)}
                           className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeFilter === filter ? 'bg-neuro-orange/10 text-neuro-orange' : 'text-gray-500 hover:bg-gray-50'}`}
                         >
                           {filter}
                         </button>
                       ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                       <h3 className="font-bold text-neuro-navy uppercase tracking-widest text-xs mb-4">Employment</h3>
                       <div className="space-y-3">
                          {["Full-Time", "Part-Time"].map(type => (
                             <label key={type} className="flex items-center gap-3 cursor-pointer group">
                                <div className="w-5 h-5 rounded border border-gray-300 group-hover:border-neuro-orange flex items-center justify-center transition-colors">
                                   <div className={`w-3 h-3 rounded-sm bg-neuro-orange scale-0 transition-transform ${type === 'Full-Time' ? 'scale-100' : ''}`}></div>
                                </div>
                                <span className="text-sm font-bold text-gray-600 group-hover:text-neuro-navy transition-colors">{type}</span>
                             </label>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>

              {/* Job Listings */}
              <div className="lg:col-span-3 space-y-6">
                 {filteredJobs.map(job => (
                    <div key={job.id} className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col sm:flex-row gap-6 sm:items-center">
                       <div className="absolute left-0 top-0 bottom-0 w-2 bg-neuro-orange scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom"></div>
                       
                       <div className="flex-1 space-y-4">
                          <div className="flex flex-wrap items-center gap-3">
                             <span className="px-3 py-1 bg-neuro-navy/5 text-neuro-navy rounded-lg text-[10px] font-black uppercase tracking-widest">{job.type}</span>
                             <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest"><Clock className="w-3 h-3" /> {job.posted}</span>
                          </div>
                          
                          <div>
                             <h3 className="text-2xl font-bold text-neuro-navy group-hover:text-neuro-orange transition-colors">{job.title}</h3>
                             <p className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-2">
                                <Briefcase className="w-4 h-4" /> {job.clinic} <span className="text-gray-300">•</span> <MapPin className="w-4 h-4" /> {job.location}
                             </p>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2">
                             {job.tags.map(tag => (
                               <span key={tag} className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                 {tag}
                               </span>
                             ))}
                          </div>
                       </div>

                       <div className="flex flex-col sm:items-end gap-4 shrink-0 sm:pl-6 sm:border-l border-gray-100">
                          <div className="flex items-center gap-2">
                             <div className="flex items-center gap-1 text-neuro-navy font-black bg-green-50 px-4 py-2 rounded-xl flex-1 justify-center">
                                <DollarSign className="w-4 h-4 text-green-600" /> {job.salary}
                             </div>
                             <button 
                               onClick={() => toggleSave("jobs", job.id.toString())}
                               className={cn(
                                 "p-3 rounded-xl transition-all border",
                                 isSaved("jobs", job.id.toString()) 
                                   ? "bg-neuro-orange/10 border-neuro-orange text-neuro-orange" 
                                   : "bg-gray-50 border-gray-100 text-gray-300 hover:text-neuro-orange"
                               )}
                             >
                                <Heart className={cn("w-5 h-5", isSaved("jobs", job.id.toString()) && "fill-current")} />
                             </button>
                          </div>
                          <button 
                            onClick={() => setSelectedJob(job)}
                            className="w-full px-8 py-3 bg-neuro-navy text-white font-black rounded-xl hover:bg-neuro-orange transition-colors uppercase tracking-widest text-xs"
                          >
                             Apply Now
                          </button>
                       </div>
                    </div>
                 ))}

                 {filteredJobs.length === 0 && (
                   <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
                      <Briefcase className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-neuro-navy">No roles found matching your search</h3>
                      <p className="text-gray-400 mt-2">Try adjusting your filters or search query.</p>
                      <button 
                        onClick={() => { setActiveFilter("All Roles"); setSearchQuery(""); }}
                        className="mt-6 text-neuro-orange font-black uppercase tracking-widest text-xs hover:underline"
                      >
                        Clear All Filters
                      </button>
                   </div>
                 )}
                 
                 <div className="pt-8 text-center">
                    <button className="px-6 py-3 border-2 border-neuro-navy/10 text-neuro-navy font-black uppercase tracking-widest text-xs rounded-xl hover:border-neuro-navy hover:bg-neuro-navy hover:text-white transition-all">
                       Load More Roles
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </section>

    </div>
  );
}
