"use client";

import { 
  Briefcase, 
  Plus, 
  Search, 
  MapPin, 
  Eye, 
  Users, 
  ArrowRight, 
  Sparkles, 
  Lock, 
  MessageSquare,
  CheckCircle2,
  Calendar,
  FileText,
  X,
  UserCheck,
  ClipboardList,
  Target,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Clock,
  Globe,
  Calculator,
  Percent,
  Zap,
  Loader2,
  Award,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { 
  getJobPostings, 
  createJobPosting, 
  getApplications, 
  updateApplicationStage, 
  getMarketBenchmarks, 
  getTalentRecommendations,
  generateDreamPitch
} from "./actions";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function JobsPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showPitchPreview, setShowPitchPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'Associate' | 'Staff'>('Associate');
  
  const [jobPostings, setJobPostings] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [benchmarks, setBenchmarks] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dreamPitchText, setDreamPitchText] = useState("");

  // Load Data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [jobs, apps, bench] = await Promise.all([
        getJobPostings(),
        getApplications(),
        getMarketBenchmarks(activeTab)
      ]);
      setJobPostings(jobs);
      setApplications(apps);
      setBenchmarks(bench);
      
      if (jobs.length > 0) {
        const recs = await getTalentRecommendations(jobs[0].id);
        setRecommendations(recs);
      }
      
      setLoading(false);
    }
    loadData();
  }, [activeTab]);

  // Elite Scorecard State
  const [scores, setScores] = useState<Record<string, number>>({
    "Nervous System Proficiency": 0,
    "Communication Skills": 0,
    "Adjusting Artistry": 0,
    "Practice Growth Mindset": 0
  });
  const [savingScorecard, setSavingScorecard] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const averageScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length;
  const hiringVerdict = averageScore >= 4.5 ? "STRONG HIRE" : averageScore >= 3.5 ? "POTENTIAL" : averageScore > 0 ? "PASS" : "AWAITING DATA";

  // Calculator State
  const [calcBase, setCalcBase] = useState(65000);
  const [calcBonus, setCalcBonus] = useState(15);
  const [calcVolume, setCalcVolume] = useState(120);

  const [isZapping, setIsZapping] = useState(false);
  const [zapSuccess, setZapSuccess] = useState(false);

  const openPitchDeck = async (applicant: any) => {
    if (!jobPostings[0]) return;
    setSelectedApplicant(applicant);
    setActiveModal('Generate-Pitch-Deck');
    setShowPitchPreview(false);
  };

  const handleGeneratePitch = async () => {
    if (!selectedApplicant || !jobPostings[0]) return;
    setIsGeneratingPitch(true);
    const pitch = await generateDreamPitch(selectedApplicant.id, jobPostings[0].id);
    setDreamPitchText(pitch);
    setIsGeneratingPitch(false);
    setShowPitchPreview(true);
  };

  const handleZap = async (e: React.MouseEvent, applicationId: string) => {
    e.stopPropagation();
    
    // Optimistic UI Update
    const originalApplications = [...applications];
    setApplications(prev => prev.map(app => 
      app.id === applicationId ? { ...app, stage: 'Interview' } : app
    ));
    
    setIsZapping(true);
    try {
      const res = await updateApplicationStage(applicationId, 'Interview');
      if (res.success) {
        setIsZapping(false);
        setZapSuccess(true);
        setTimeout(() => setZapSuccess(false), 3000);
      } else {
        // Rollback on failure
        setApplications(originalApplications);
        setIsZapping(false);
      }
    } catch (err) {
      setApplications(originalApplications);
      setIsZapping(false);
    }
  };

  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  const handleReviewApplicants = (job: any, stage?: string) => {
    setSelectedJob(job);
    setSelectedStage(stage || null);
    setActiveModal('Review-Applicants');
  };

  const handleCreateJob = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const jobData = {
      title: formData.get('title'),
      type: activeTab,
      salary_min: parseInt(formData.get('salary_min') as string) || 0,
      salary_max: parseInt(formData.get('salary_max') as string) || 0,
      description: "" // Placeholder
    };
    
    setIsGenerating(true);
    const res = await createJobPosting(jobData);
    if (res.success) {
      const jobs = await getJobPostings();
      setJobPostings(jobs);
      setActiveModal(null);
    }
    setIsGenerating(false);
  };

  const yearlyBonus = calcBonus * calcVolume * 50;
  const totalComp = calcBase + yearlyBonus;
  
  // Market pulse logic using real benchmarks
  const benchmarkAvg = benchmarks ? (benchmarks.avg_salary_min + benchmarks.avg_salary_max) / 2 : 100000;
  const talentScore = Math.min(100, Math.round((totalComp / benchmarkAvg) * 85));
  const riskScore = Math.round((calcBase / benchmarkAvg) * 100);

  const activeJobsFiltered = jobPostings.filter(j => j.type === activeTab);

  const closeModal = () => {
    setActiveModal(null);
    setSelectedApplicant(null);
    setSelectedJob(null);
    setIsGenerating(false);
    setShowPreview(false);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowPreview(true);
    }, 2500);
  };

  const initiateDownload = () => {
    // PDF generation logic (same as before)
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-neuro-cream">
        <Loader2 className="w-10 h-10 text-neuro-orange animate-spin" />
      </div>
    );
  }

  const renderModal = () => {
    return (
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-neuro-navy/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[3rem] shadow-2xl border border-white/20 w-full max-w-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-neuro-cream/30">
                <h3 className="text-2xl font-heading font-black text-neuro-navy uppercase tracking-tight">
                  {activeModal.replace('-', ' ')}
                </h3>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-neuro-navy" />
                </button>
              </div>

              <div className="p-10 max-h-[70vh] overflow-y-auto">
                {activeModal === 'Post-New-Job' && (
                  <form onSubmit={handleCreateJob} className="space-y-6">
                    <div className="space-y-4">
                       <div className="p-6 bg-neuro-orange/5 border border-neuro-orange/10 rounded-2xl">
                          <p className="text-sm font-bold text-neuro-navy mb-2">Role Title</p>
                          <input name="title" required type="text" placeholder="e.g. Lead Associate Chiropractor" className="w-full p-4 rounded-xl border border-gray-200 focus:outline-neuro-orange" />
                       </div>
                       <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl">
                          <p className="text-sm font-bold text-neuro-navy mb-2">Job Description</p>
                          <textarea name="description" required rows={4} placeholder="Describe the clinical focus, culture, and expectations..." className="w-full p-4 rounded-xl border border-gray-200 focus:outline-neuro-orange resize-none" />
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl">
                          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Min Base Salary</p>
                          <input name="salary_min" type="number" placeholder="75000" className="w-full bg-transparent font-bold text-neuro-navy outline-none" />
                       </div>
                       <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl">
                          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Max Base Salary</p>
                          <input name="salary_max" type="number" placeholder="120000" className="w-full bg-transparent font-bold text-neuro-navy outline-none" />
                       </div>
                    </div>
                    <button type="submit" disabled={isGenerating} className="w-full py-5 bg-neuro-orange text-white font-black rounded-2xl shadow-xl hover:bg-neuro-orange-dark transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                       {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Publish to Global Network"}
                    </button>
                  </form>
                )}

                {activeModal === 'Review-Applicants' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                        {selectedStage ? `Filtering by ${selectedStage}` : 'All Applicants'}
                      </p>
                      {selectedStage && (
                        <button 
                          onClick={() => setSelectedStage(null)}
                          className="text-[10px] font-black uppercase text-neuro-orange hover:underline"
                        >
                          Clear Filter
                        </button>
                      )}
                    </div>
                    {applications.filter(a => (!selectedJob || a.jobId === selectedJob.id) && (!selectedStage || a.stage === selectedStage)).length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-500 font-bold">No applicants yet for this pipeline stage.</p>
                      </div>
                    ) : applications.filter(a => (!selectedJob || a.jobId === selectedJob.id) && (!selectedStage || a.stage === selectedStage)).map((app, i) => (
                      <div key={i} className="flex items-center justify-between p-6 bg-white border border-gray-100 rounded-3xl hover:border-neuro-orange transition-all group cursor-pointer shadow-sm">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-neuro-navy flex items-center justify-center text-white font-bold text-lg">
                               {app.name[0]}
                            </div>
                            <div>
                               <h4 className="font-bold text-neuro-navy">{app.name}</h4>
                               <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">{app.school}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-6">
                            <div className="text-right">
                               <div className="flex items-center gap-1 justify-end">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                                    app.stage === 'New' ? "bg-blue-50 text-blue-600" :
                                    app.stage === 'Interview' ? "bg-orange-50 text-neuro-orange" :
                                    "bg-purple-50 text-purple-600"
                                  )}>
                                    {app.stage}
                                  </span>
                               </div>
                               <p className="text-[8px] text-gray-400 mt-1 uppercase font-bold">Applied {new Date(app.appliedAt).toLocaleDateString()}</p>
                            </div>
                            <button onClick={() => window.open(app.resumeUrl, '_blank')} className="p-2 hover:bg-gray-50 rounded-lg">
                               <ExternalLink className="w-4 h-4 text-gray-400" />
                            </button>
                         </div>
                      </div>
                    ))}
                  </div>
                )}

                 {activeModal === 'Interview-Scorecards' && (
                  <div className="space-y-8">
                       <>
                        <div className="p-8 bg-neuro-navy text-white rounded-[2.5rem] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-neuro-orange/20 blur-3xl"></div>
                            <div className="relative z-10 flex justify-between items-center">
                              <div>
                                  <h4 className="text-xl font-heading font-black mb-1 text-white">Elite Standardized Scorecard</h4>
                                  <p className="text-[10px] text-gray-200 uppercase tracking-widest">Objectively evaluate clinical and cultural alignment.</p>
                              </div>
                              <div className="text-right">
                                  <p className="text-[10px] font-black text-neuro-orange uppercase mb-1 tracking-widest">Hiring Verdict</p>
                                  <p className={cn(
                                    "text-lg font-black italic",
                                    hiringVerdict === "STRONG HIRE" ? "text-green-400" : 
                                    hiringVerdict === "POTENTIAL" ? "text-blue-400" : 
                                    hiringVerdict === "PASS" ? "text-red-400" : "text-gray-100"
                                  )}>{hiringVerdict}</p>
                              </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {Object.entries(scores).map(([category, value], i) => (
                              <div key={category} className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm hover:border-neuro-orange transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="font-black text-neuro-navy uppercase text-xs tracking-widest">{category}</span>
                                    <span className="text-sm font-black text-neuro-orange">{value > 0 ? value : "--"} / 5</span>
                                </div>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(n => (
                                      <button 
                                        key={n} 
                                        onClick={() => setScores(prev => ({ ...prev, [category]: n }))}
                                        className={cn(
                                          "flex-1 py-3 rounded-xl border text-[10px] font-black transition-all",
                                          value === n 
                                              ? "bg-neuro-orange text-white border-neuro-orange shadow-lg scale-105" 
                                              : "bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100"
                                        )}
                                      >
                                        {n === 1 ? "POOR" : n === 3 ? "AVG" : n === 5 ? "ELITE" : n}
                                      </button>
                                    ))}
                                </div>
                              </div>
                            ))}
                        </div>

                        <div className="flex gap-4">
                            <button 
                              onClick={() => {}}
                              className="flex-1 py-5 bg-white border-2 border-neuro-navy text-neuro-navy font-black rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                            >
                              <FileText className="w-4 h-4" />
                              Export Scorecard
                            </button>
                            <button 
                              onClick={() => {
                                  setSavingScorecard(true);
                                  setTimeout(() => {
                                    setSavingScorecard(false);
                                    setSaveSuccess(true);
                                    setTimeout(() => {
                                        setSaveSuccess(false);
                                        closeModal();
                                    }, 1000);
                                  }, 1500);
                              }}
                              disabled={savingScorecard || saveSuccess}
                              className={cn(
                                  "flex-[2] py-5 font-black rounded-2xl shadow-xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2",
                                  saveSuccess ? "bg-green-500 text-white" : "bg-neuro-navy text-white hover:bg-neuro-navy-light"
                              )}
                            >
                              {savingScorecard ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <CheckCircle2 className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                              {savingScorecard ? "Saving Assessment..." : saveSuccess ? "Saved Successfully" : "Save to Candidate Profile"}
                            </button>
                        </div>
                       </>
                  </div>
                )}

                {activeModal === '90-Day-Success-Plan' && (
                  <div className="space-y-8">
                    {!showPreview ? (
                      <div className="py-12 flex flex-col items-center justify-center text-center">
                        <motion.div 
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-20 h-20 bg-neuro-navy/5 rounded-[2rem] flex items-center justify-center mb-6 border border-neuro-navy/10 shadow-inner"
                        >
                          <Calendar className="w-10 h-10 text-neuro-navy" />
                        </motion.div>
                        <h4 className="text-2xl font-heading font-black text-neuro-navy mb-2">Build the 90-Day Blueprint.</h4>
                        <p className="text-xs text-gray-500 max-w-sm mb-8">Generate a clinical mastery roadmap, weekly KPI scorecards, and a 12-week marketing schedule for your new hire.</p>
                        
                        {isGenerating ? (
                          <div className="space-y-4 w-full max-w-xs">
                             <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: "100%" }}
                                  transition={{ duration: 2.5 }}
                                  className="h-full bg-neuro-orange"
                                />
                             </div>
                             <p className="text-[9px] font-black text-neuro-orange uppercase animate-pulse">Architecting Onboarding Systems...</p>
                          </div>
                        ) : (
                          <button 
                            onClick={handleGenerate}
                            className="px-8 py-4 bg-neuro-navy text-white font-black rounded-2xl shadow-xl hover:bg-neuro-orange transition-all uppercase tracking-widest text-xs flex items-center gap-2"
                          >
                            <Sparkles className="w-4 h-4" /> Generate Full Plan
                          </button>
                        )}
                      </div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-6"
                      >
                         <div className="bg-gradient-to-br from-neuro-navy to-neuro-navy-dark p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-neuro-orange/10 blur-3xl -mr-32 -mt-32"></div>
                            <div className="relative z-10">
                               <div className="flex items-center gap-2 mb-6">
                                  <CheckCircle2 className="w-5 h-5 text-neuro-orange" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-neuro-orange">Plan Generated Successfully</span>
                               </div>
                               <h4 className="text-3xl font-heading font-black mb-2 text-white">12-Week Success Roadmap</h4>
                               <p className="text-xs text-gray-200 max-w-md">14 pages of clinical systems, scripts, and KPI tracking ready for your new Associate.</p>
                            </div>
                         </div>

                         <button 
                           onClick={() => {}}
                           className="w-full py-6 bg-neuro-orange text-white font-black rounded-3xl shadow-xl hover:bg-neuro-orange-dark transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-3 group"
                         >
                            <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
                            Download PDF Success Plan
                         </button>
                      </motion.div>
                    )}
                  </div>
                )}

                {activeModal === 'Generate-Pitch-Deck' && selectedApplicant && (
                  <div className="space-y-6">
                    {!showPitchPreview ? (
                      <div className="py-12 flex flex-col items-center justify-center text-center">
                        <motion.div 
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="w-20 h-20 bg-neuro-orange/10 rounded-3xl flex items-center justify-center mb-6 border border-neuro-orange/20"
                        >
                          <Sparkles className="w-10 h-10 text-neuro-orange" />
                        </motion.div>
                        <h4 className="text-2xl font-heading font-black text-neuro-navy mb-2">Architecting the Dream.</h4>
                        <p className="text-xs text-gray-500 max-w-sm mb-8">We're using AI to generate a hyper-personalized recruitment pitch for {selectedApplicant.name}.</p>
                        
                        {isGeneratingPitch ? (
                          <div className="space-y-4 w-full max-w-xs">
                             <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: "100%" }}
                                  transition={{ duration: 2.5 }}
                                  className="h-full bg-neuro-orange"
                                />
                             </div>
                             <p className="text-[9px] font-black text-neuro-orange uppercase animate-pulse">Personalizing Value Proposition...</p>
                          </div>
                        ) : (
                          <button 
                            onClick={handleGeneratePitch}
                            className="px-8 py-4 bg-neuro-navy text-white font-black rounded-2xl shadow-xl hover:bg-neuro-orange transition-all uppercase tracking-widest text-xs"
                          >
                            Generate Pitch
                          </button>
                        )}
                      </div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-8"
                      >
                         <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
                            <div className="flex items-center gap-2 mb-4">
                               <Sparkles className="w-4 h-4 text-neuro-orange" />
                               <span className="text-[10px] font-black uppercase text-neuro-orange tracking-widest">AI Generated Dream Pitch</span>
                            </div>
                            <p className="text-sm text-neuro-navy leading-relaxed font-medium italic">
                               "{dreamPitchText}"
                            </p>
                         </div>

                         <div className="flex gap-4">
                            <button className="flex-1 py-5 bg-neuro-orange text-white font-black rounded-2xl shadow-xl hover:bg-neuro-orange-dark transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3">
                               Copy & Send <MessageSquare className="w-4 h-4" />
                            </button>
                            <button onClick={() => setShowPitchPreview(false)} className="px-6 py-5 bg-white border border-gray-200 text-neuro-navy font-black rounded-2xl hover:bg-gray-50 transition-all">
                               <Plus className="w-5 h-5 rotate-45" />
                            </button>
                         </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {renderModal()}
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-heading font-black text-neuro-navy">Recruiting Hub</h1>
          <p className="text-neuro-gray mt-2 text-lg">Your ATS-powered hiring command center.</p>
        </div>
        <button 
          onClick={() => setActiveModal('Post-New-Job')}
          className="bg-neuro-navy text-white px-8 py-4 rounded-2xl shadow-xl hover:bg-neuro-navy-light transition-all transform hover:scale-105 flex items-center gap-3 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          <span className="font-black uppercase tracking-widest text-sm">Post New Job</span>
        </button>
      </header>

      {/* Role Type Tabs */}
      <div className="flex items-center gap-2 p-1 bg-white rounded-2xl border border-gray-100 shadow-sm w-max mt-2">
         <button 
           onClick={() => setActiveTab('Associate')}
           className={`px-6 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'Associate' ? 'bg-neuro-navy text-white shadow-md' : 'text-gray-500 hover:text-neuro-navy'}`}
         >
            Associate Doctors
         </button>
         <button 
           onClick={() => setActiveTab('Staff')}
           className={`px-6 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'Staff' ? 'bg-neuro-orange text-white shadow-md' : 'text-gray-500 hover:text-neuro-orange'}`}
         >
            Support Staff (CAs)
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Job Pipeline Management */}
        <div className="lg:col-span-2 space-y-8">
           <div className="flex items-center justify-between">
              <h2 className="text-2xl font-heading font-black text-neuro-navy">
                 Active {activeTab} Pipelines
              </h2>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-100 shadow-sm">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                 <span className="text-[10px] font-black text-neuro-navy uppercase tracking-widest">Live Monitoring</span>
              </div>
           </div>
           
           {loading ? (
              <div className="space-y-6">
                 {[1, 2].map(i => (
                   <div key={i} className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm h-64 animate-pulse">
                      <div className="flex justify-between items-start mb-8">
                         <div className="space-y-3">
                            <div className="h-6 w-48 bg-gray-100 rounded"></div>
                            <div className="h-3 w-32 bg-gray-50 rounded"></div>
                         </div>
                         <div className="h-8 w-24 bg-gray-50 rounded-xl"></div>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                         {[1, 2, 3, 4].map(j => (
                           <div key={j} className="h-32 bg-gray-50 rounded-3xl"></div>
                         ))}
                      </div>
                   </div>
                 ))}
              </div>
           ) : activeJobsFiltered.length === 0 ? (
             <div className="bg-white rounded-[3rem] border-2 border-dashed border-gray-100 p-20 text-center space-y-6">
                <div className="w-20 h-20 bg-neuro-cream rounded-full flex items-center justify-center mx-auto">
                   <Briefcase className="w-10 h-10 text-gray-300" />
                </div>
                <div className="max-w-xs mx-auto">
                   <h3 className="text-xl font-black text-neuro-navy">No {activeTab} Roles Posted</h3>
                   <p className="text-gray-500 text-sm mt-2">Start your hiring engine by posting your first job opening to the global network.</p>
                </div>
                <button 
                  onClick={() => setActiveModal('Post-New-Job')}
                  className="inline-flex px-10 py-4 bg-neuro-orange text-white font-black rounded-2xl shadow-xl hover:bg-neuro-orange-light transition-all uppercase tracking-widest text-xs"
                >
                  Post First Opening
                </button>
             </div>
           ) : activeJobsFiltered.map((job, i) => {
             const jobApps = applications.filter(a => a.jobId === job.id);
             const pipeline = {
               new: jobApps.filter(a => a.stage === 'New').length,
               screening: jobApps.filter(a => a.stage === 'Screening').length,
               interview: jobApps.filter(a => a.stage === 'Interview').length,
               offer: jobApps.filter(a => a.stage === 'Offer').length
             };

             return (
               <div key={job.id} className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
                  <div className="flex items-center justify-between mb-8">
                     <div>
                        <h3 className="text-2xl font-bold text-neuro-navy group-hover:text-neuro-orange transition-colors">{job.title}</h3>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                          <Clock className="w-3 h-3" /> Posted {new Date(job.created_at).toLocaleDateString()} • <span className="text-green-600 font-bold px-2 py-0.5 bg-green-50 rounded-full">{job.status}</span>
                        </p>
                     </div>
                     <button className="px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold text-neuro-navy hover:bg-gray-100 transition-colors">
                        Edit Listing
                     </button>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-8">
                     {[
                       { label: 'New', count: pipeline.new, color: 'blue' },
                       { label: 'Screening', count: pipeline.screening, color: 'purple' },
                       { label: 'Interview', count: pipeline.interview, color: 'orange' },
                       { label: 'Offer', count: pipeline.offer, color: 'green' }
                     ].map((stage, idx) => (
                       <div 
                         key={idx}
                         onClick={() => handleReviewApplicants(job, stage.label)}
                         className={cn(
                          "p-6 rounded-3xl border text-center cursor-pointer transition-all hover:-translate-y-1 shadow-sm relative overflow-hidden flex flex-col items-center justify-center min-h-[160px]",
                          stage.color === 'blue' ? "bg-blue-50 border-blue-100 hover:bg-blue-100" :
                          stage.color === 'purple' ? "bg-purple-50 border-purple-100 hover:bg-purple-100" :
                          stage.color === 'orange' ? "bg-orange-50 border-orange-100 hover:bg-orange-100" :
                          "bg-green-50 border-green-100 hover:bg-green-100"
                         )}
                       >
                          <p className={cn(
                            "text-3xl font-black",
                            stage.color === 'orange' ? "text-neuro-orange" : 
                            stage.color === 'blue' ? "text-blue-600" :
                            stage.color === 'purple' ? "text-purple-600" : "text-green-600"
                          )}>{stage.count}</p>
                          <p className={cn(
                            "text-[10px] font-black uppercase tracking-widest mt-1",
                            stage.color === 'orange' ? "text-orange-400" : 
                            stage.color === 'blue' ? "text-blue-400" :
                            stage.color === 'purple' ? "text-purple-400" : "text-green-400"
                          )}>{stage.label}</p>

                          {stage.label === 'New' && stage.count > 0 && (
                            <div className="mt-4 flex flex-col items-center gap-1">
                              <button 
                                onClick={(e) => handleZap(e, jobApps.find(a => a.stage === 'New')?.id)}
                                disabled={isZapping || zapSuccess}
                                className={cn(
                                  "px-3 py-1.5 rounded-xl transition-all shadow-lg flex items-center gap-2",
                                  zapSuccess ? "bg-green-500 text-white" : "bg-neuro-navy text-white hover:bg-neuro-orange"
                                )}
                              >
                                {zapSuccess ? (
                                  <CheckCircle2 className="w-3 h-3" />
                                ) : (
                                  <Zap className={cn("w-3 h-3", isZapping && "animate-pulse")} />
                                )}
                                <span className="text-[8px] font-black uppercase tracking-tighter">
                                  {isZapping ? "Zapping..." : zapSuccess ? "Invites Sent" : "Zap to Interview"}
                                </span>
                              </button>
                            </div>
                          )}
                       </div>
                     ))}
                  </div>

                  <div className="flex gap-3">
                     <button 
                       onClick={() => { setSelectedJob(job); setActiveModal('Review-Applicants'); }}
                       className="flex-1 py-4 bg-neuro-navy text-white font-black rounded-2xl text-xs hover:bg-neuro-navy-light transition-all shadow-xl shadow-neuro-navy/20 flex items-center justify-center gap-2 group"
                     >
                        Review Applicants <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                     </button>
                  </div>
               </div>
             );
           })}

           {/* Hiring Tools - Mothballed for Phase 1 Stability */}
           {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                onClick={() => setActiveModal('Interview-Scorecards')}
                className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-start gap-4 hover:border-neuro-orange transition-all cursor-pointer group hover:shadow-lg relative overflow-hidden"
              >
                 <div className="absolute top-4 right-4 bg-neuro-orange/10 text-neuro-orange text-[8px] font-black px-2 py-1 rounded-full flex items-center gap-1 border border-neuro-orange/20">
                    <Award className="w-2 h-2" /> ELITE FEATURE
                 </div>
                 <div className="p-4 bg-neuro-navy rounded-2xl text-white group-hover:bg-neuro-orange transition-colors shadow-lg">
                    <FileText className="w-6 h-6" />
                 </div>
                 <div>
                    <h4 className="font-bold text-neuro-navy text-lg">Interview Scorecards</h4>
                    <p className="text-xs text-gray-500 mt-1">Standardize your hiring process with AI-driven scoring.</p>
                 </div>
              </div>
              <div 
                onClick={() => setActiveModal('90-Day-Success-Plan')}
                className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-start gap-4 hover:border-neuro-orange transition-all cursor-pointer group hover:shadow-lg relative overflow-hidden"
              >
                 <div className="absolute top-4 right-4 bg-neuro-orange/10 text-neuro-orange text-[8px] font-black px-2 py-1 rounded-full flex items-center gap-1 border border-neuro-orange/20">
                    <Award className="w-2 h-2" /> ELITE FEATURE
                 </div>
                 <div className="p-4 bg-neuro-navy rounded-2xl text-white group-hover:bg-neuro-orange transition-colors shadow-lg">
                    <Calendar className="w-6 h-6" />
                 </div>
                 <div>
                    <h4 className="font-bold text-neuro-navy text-lg">90-Day Success Plan</h4>
                    <p className="text-xs text-gray-500 mt-1">Generate clinical onboarding blueprints for your staff.</p>
                 </div>
              </div>
           </div> */}
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
           <section className="bg-gradient-to-br from-neuro-navy to-neuro-navy-dark rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-neuro-orange/20 blur-3xl -mr-16 -mt-16"></div>
              <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-8">
                    <Sparkles className="w-5 h-5 text-neuro-orange" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-neuro-orange">Smart Match</span>
                 </div>
                 <h3 className="text-2xl font-heading font-black mb-6 text-white">Talent Recommendations</h3>
                 
                 <div className="space-y-4 mb-10">
                    {recommendations.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No recommendations yet. Post a job to start matching.</p>
                    ) : recommendations.map((student, i) => (
                      <div 
                        key={i} 
                        className="p-4 bg-white/10 rounded-2xl border border-white/5 group relative"
                      >
                         <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-xs">
                                  {student.name[0]}
                               </div>
                               <div>
                                  <p className="text-sm font-bold group-hover:text-neuro-orange transition-colors">{student.name}</p>
                                  <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black">{student.school}</p>
                               </div>
                            </div>
                            <span className="text-xs font-black text-neuro-orange">{student.matchScore}%</span>
                         </div>
                         
                         <button 
                           onClick={() => openPitchDeck(student)}
                           className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all group/btn"
                         >
                            <Sparkles className="w-3 h-3 text-neuro-orange group-hover/btn:scale-125 transition-transform" /> Generate Dream Pitch
                         </button>
                      </div>
                    ))}
                 </div>

                 <button 
                   onClick={() => setActiveModal('Review-Applicants')}
                   className="w-full py-4 bg-white text-neuro-navy font-black rounded-2xl hover:bg-neuro-orange hover:text-white transition-all shadow-xl text-xs uppercase tracking-widest"
                 >
                    View All Matches
                 </button>
              </div>
           </section>

           {/* Market Competitiveness Benchmarking */}
           <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4">
                 <div className="w-10 h-10 bg-neuro-navy/5 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-neuro-navy" />
                 </div>
              </div>
              
              <h4 className="font-bold text-neuro-navy mb-6 text-sm uppercase tracking-widest flex items-center gap-2">
                 <ShieldCheck className="w-4 h-4 text-neuro-orange" /> Market Pulse
              </h4>

              <div className="space-y-6">
                 {/* Job Score Widget */}
                 <div className="p-6 bg-neuro-cream/30 rounded-3xl border border-neuro-navy/5">
                    <div className="flex justify-between items-end mb-4">
                       <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Your Job Score</p>
                          <p className="text-3xl font-black text-neuro-navy">{talentScore}<span className="text-sm text-gray-400">/100</span></p>
                       </div>
                       <div className="text-right">
                          <p className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            talentScore > 80 ? "text-green-500" : "text-neuro-orange"
                          )}>
                            {talentScore > 80 ? "Highly Competitive" : "Improving"}
                          </p>
                       </div>
                    </div>
                    
                    <div className="space-y-3">
                       <div className="flex items-center justify-between text-[10px]">
                          <span className="text-gray-500 font-bold">Base Salary (${(jobPostings[0]?.salary_min / 1000) || 0}k)</span>
                          <span className={cn(
                            "font-black",
                            jobPostings[0]?.salary_min > benchmarks?.avg_salary_min ? "text-green-600" : "text-neuro-orange"
                          )}>
                            {jobPostings[0]?.salary_min > benchmarks?.avg_salary_min ? `+${Math.round((jobPostings[0]?.salary_min / benchmarks?.avg_salary_min - 1) * 100)}%` : "Below Avg"}
                          </span>
                       </div>
                       <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className={cn("h-full", talentScore > 80 ? "bg-green-500" : "bg-neuro-orange")} style={{ width: `${talentScore}%` }}></div>
                       </div>
                    </div>
                 </div>
              </div>
           </section>
        </div>
      </div>
    </div>
  );
}
