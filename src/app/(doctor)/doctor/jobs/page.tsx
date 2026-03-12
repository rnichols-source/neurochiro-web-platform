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
  Award
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDoctorTier } from "@/context/DoctorTierContext";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function JobsPage() {
  const { tier } = useDoctorTier();
  const isMember = tier !== 'starter';
  
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showPitchPreview, setShowPitchPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'associate' | 'support'>('associate');

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

  const openPitchDeck = (applicant: any) => {
    setSelectedApplicant(applicant);
    setActiveModal('Generate-Pitch-Deck');
    setShowPitchPreview(false);
  };

  const handleGeneratePitch = () => {
    setIsGeneratingPitch(true);
    setTimeout(() => {
      setIsGeneratingPitch(false);
      setShowPitchPreview(true);
    }, 2500);
  };

  const handleZap = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsZapping(true);
    setTimeout(() => {
      setIsZapping(false);
      setZapSuccess(true);
      setTimeout(() => setZapSuccess(false), 3000);
    }, 1500);
  };

  const yearlyBonus = calcBonus * calcVolume * 50;
  const totalComp = calcBase + yearlyBonus;
  const talentScore = Math.min(100, Math.round((totalComp / 100000) * 80 + (calcBonus / 20) * 20));
  const riskScore = Math.round((calcBase / 100000) * 100);

  const activeJobs = activeTab === 'associate' ? [
    {
      title: "Associate Chiropractor",
      posted: "Oct 12, 2026",
      pipeline: {
        new: 12,
        screening: 4,
        interview: 2,
        offer: 0
      },
      status: "Active"
    }
  ] : [
    {
      title: "Front Desk Patient Concierge",
      posted: "Nov 01, 2026",
      pipeline: {
        new: 28,
        screening: 8,
        interview: 3,
        offer: 1
      },
      status: "Active"
    },
    {
      title: "Clinical Tech Assistant",
      posted: "Nov 05, 2026",
      pipeline: {
        new: 5,
        screening: 2,
        interview: 0,
        offer: 0
      },
      status: "Active"
    }
  ];

  const closeModal = () => {
    setActiveModal(null);
    setSelectedApplicant(null);
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
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const weeks = Array.from({ length: 12 }, (_, i) => i + 1);
      printWindow.document.write(`
        <html>
          <head>
            <title>NeuroChiro 90-Day Success Plan</title>
            <style>
              @media print {
                .page-break { page-break-before: always; }
              }
              body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #0a192f; line-height: 1.6; max-width: 800px; margin: 0 auto; }
              .header { border-bottom: 4px solid #f97316; padding-bottom: 20px; margin-bottom: 40px; text-align: center; }
              .logo { font-size: 28px; font-weight: bold; color: #f97316; letter-spacing: -1px; }
              h1 { font-size: 36px; margin-top: 10px; font-weight: 900; }
              h2 { font-size: 24px; color: #f97316; margin-top: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
              h3 { font-size: 18px; color: #0a192f; margin-top: 20px; }
              .section { margin-bottom: 40px; }
              .grid { display: grid; grid-cols: 2; gap: 20px; }
              .kpi-card { border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 10px; }
              .week-header { background: #0a192f; color: white; padding: 10px 20px; border-radius: 5px; font-weight: bold; margin-bottom: 15px; }
              .script-box { background: #f8fafc; border-left: 4px solid #f97316; padding: 20px; font-style: italic; margin: 20px 0; }
              .footer { margin-top: 50px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            </style>
          </head>
          <body>
            <!-- Page 1: Title & Overview -->
            <div class="header">
              <div class="logo">NEUROCHIRO</div>
              <h1>ASSOCIATE SUCCESS PLAN</h1>
              <p>12-Week Comprehensive Clinical & Business Roadmap</p>
            </div>
            
            <div class="section">
              <h2>Executive Summary</h2>
              <p>This document outlines the professional trajectory for the Associate Doctor over the first 90 days. The goal is to achieve clinical mastery, seamless cultural integration, and a self-sustaining patient base of 100+ visits per week.</p>
              <h3>Core Objectives:</h3>
              <ul>
                <li><strong>Clinical Excellence:</strong> Mastering the nervous-system-first adjusting approach.</li>
                <li><strong>Communication:</strong> Converting clinical findings into lifetime wellness care.</li>
                <li><strong>Growth:</strong> Building internal and external referral engines.</li>
              </ul>
            </div>

            <!-- Page 2: Month 1 Detail -->
            <div class="page-break">
              <h2>MONTH 1: Systems & Culture</h2>
              <p>Focus: Learning the practice "language" and observing high-volume flow.</p>
              <div class="script-box">
                "Doctor, our goal this month is for you to hear the way we speak to patients 50 times before you lead your first ROF. Consistency in message is the key to patient retention."
              </div>
              <h3>Milestones:</h3>
              <ul>
                <li>Shadow 50 Initial Exams & Reports of Findings.</li>
                <li>Complete "The Neuro-Chiro Adjusting Artistry" Module 1.</li>
                <li>Memorize the "Day 1 Discovery" Script.</li>
              </ul>
            </div>

            <!-- Page 3: The Day 1 Script -->
            <div class="page-break">
              <h2>The Clinical Scripts (Full Page)</h2>
              <h3>Initial Consult (The Discovery):</h3>
              <div class="script-box">
                "Most people come in here thinking we're looking at their back. We're actually looking at the master controller of your entire life—your nervous system. If your brain can't talk to your body, your body can't heal. Does that make sense?"
              </div>
              <h3>The ROF (Report of Findings):</h3>
              <div class="script-box">
                "Based on your scans, your system is stuck in 'Survival Mode'. This isn't just about the pain in your neck; it's about the fact that your body is failing to adapt to stress. We need to reset your system. Here is the 12-week roadmap to get you back to 'Thriving Mode'."
              </div>
            </div>

            <!-- Pages 4-9: Weekly KPI Scorecards -->
            ${weeks.map(w => `
              <div class="page-break">
                <div class="week-header">WEEK ${w} PERFORMANCE SCORECARD</div>
                <div style="display: flex; gap: 20px;">
                  <div style="flex: 1;">
                    <h3>Clinical Targets:</h3>
                    <div class="kpi-card">Patient Visits (PV): [Target: ${w * 8}]</div>
                    <div class="kpi-card">New Patients (NP): [Target: 3]</div>
                    <div class="kpi-card">Keep Rate: [Target: 90%]</div>
                  </div>
                  <div style="flex: 1;">
                    <h3>Communication Targets:</h3>
                    <div class="kpi-card">Care Plan Accept: [Target: 75%]</div>
                    <div class="kpi-card">Google Reviews: [Target: 2]</div>
                    <div class="kpi-card">Referrals Asked: [Target: 10]</div>
                  </div>
                </div>
                <h3>Notes & Clinical Growth:</h3>
                <div style="border: 1px solid #e2e8f0; height: 150px; border-radius: 8px;"></div>
              </div>
            `).join('')}

            <!-- Page 10: Marketing Schedule -->
            <div class="page-break">
              <h2>Internal Marketing Lead Gen Schedule</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="background: #f1f5f9;">
                  <th style="padding: 10px; border: 1px solid #ddd;">Week</th>
                  <th style="padding: 10px; border: 1px solid #ddd;">Activity</th>
                  <th style="padding: 10px; border: 1px solid #ddd;">Goal</th>
                </tr>
                <tr><td style="padding: 10px; border: 1px solid #ddd;">Weeks 1-4</td><td style="padding: 10px; border: 1px solid #ddd;">Patient Testimonial Drive</td><td style="padding: 10px; border: 1px solid #ddd;">10 New Reviews</td></tr>
                <tr><td style="padding: 10px; border: 1px solid #ddd;">Weeks 5-8</td><td style="padding: 10px; border: 1px solid #ddd;">Community Dinner Event</td><td style="padding: 10px; border: 1px solid #ddd;">5 New NPs</td></tr>
                <tr><td style="padding: 10px; border: 1px solid #ddd;">Weeks 9-12</td><td style="padding: 10px; border: 1px solid #ddd;">Corporate Wellness Talk</td><td style="padding: 10px; border: 1px solid #ddd;">8 New NPs</td></tr>
              </table>
            </div>

            <!-- Page 11: 90-Day Review -->
            <div class="page-break">
              <h2>The 90-Day Authority Review</h2>
              <p>At the end of Week 12, the Associate will undergo a Clinical Authority Review to transition to 'Senior Associate' status.</p>
              <h3>Promotion Criteria:</h3>
              <ul>
                <li>Averaging 80+ PV per week over the last 14 days.</li>
                <li>Demonstrated mastery of the "Survival vs. Thriving" ROF script.</li>
                <li>Perfect attendance and cultural alignment scores.</li>
              </ul>
            </div>

            <div class="footer">
              © 2026 NeuroChiro Platform | Confidential Clinical Document | Page 14 of 14
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

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
                  <div className="space-y-6">
                    <div className="p-6 bg-neuro-orange/5 border border-neuro-orange/10 rounded-2xl">
                       <p className="text-sm font-bold text-neuro-navy mb-2">Role Title</p>
                       <input type="text" placeholder="e.g. Lead Associate Chiropractor" className="w-full p-4 rounded-xl border border-gray-200 focus:outline-neuro-orange" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl">
                          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Practice Type</p>
                          <select className="w-full bg-transparent font-bold text-neuro-navy">
                             <option>Tonal / Neuro</option>
                             <option>Structural</option>
                             <option>Pediatric Focus</option>
                          </select>
                       </div>
                       <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl">
                          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Compensation</p>
                          <input type="text" placeholder="$80k - $120k+" className="w-full bg-transparent font-bold text-neuro-navy outline-none" />
                       </div>
                    </div>
                    <button className="w-full py-5 bg-neuro-orange text-white font-black rounded-2xl shadow-xl hover:bg-neuro-orange-dark transition-all uppercase tracking-widest">
                       Publish to Global Network
                    </button>
                  </div>
                )}

                {activeModal === 'Review-Applicants' && (
                  <div className="space-y-4">
                    {[
                      { name: "Dr. Sarah Miller", school: "Palmer College", match: "98%", status: "New", icon: <UserCheck className="w-4 h-4 text-blue-500" /> },
                      { name: "Dr. Jason Lee", school: "Parker University", match: "94%", status: "Screening", icon: <ClipboardList className="w-4 h-4 text-purple-500" /> },
                      { name: "Dr. Elena Rodriguez", school: "Life University", match: "91%", status: "Interview", icon: <MessageSquare className="w-4 h-4 text-orange-500" /> },
                    ].map((app, i) => (
                      <div key={i} className="flex items-center justify-between p-6 bg-white border border-gray-100 rounded-3xl hover:border-neuro-orange transition-all group cursor-pointer shadow-sm">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-neuro-navy flex items-center justify-center text-white font-bold text-lg">
                               {app.name.split(' ')[1][0]}
                            </div>
                            <div>
                               <h4 className="font-bold text-neuro-navy">{app.name}</h4>
                               <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">{app.school}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-6">
                            <div className="text-right">
                               <p className="text-xs font-black text-neuro-orange">{app.match} Match</p>
                               <div className="flex items-center gap-1 justify-end">
                                  {app.icon}
                                  <span className="text-[9px] font-bold text-gray-500">{app.status}</span>
                               </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-neuro-orange" />
                         </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeModal === 'Interview-Scorecards' && (
                  <div className="space-y-8">
                     <div className="p-8 bg-neuro-navy text-white rounded-[2.5rem] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-neuro-orange/20 blur-3xl"></div>
                        <div className="relative z-10 flex justify-between items-center">
                           <div>
                              <h4 className="text-xl font-heading font-black mb-1">Elite Standardized Scorecard</h4>
                              <p className="text-[10px] text-gray-400 uppercase tracking-widest">Objectively evaluate clinical and cultural alignment.</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-black text-neuro-orange uppercase mb-1 tracking-widest">Hiring Verdict</p>
                              <p className={cn(
                                 "text-lg font-black italic",
                                 hiringVerdict === "STRONG HIRE" ? "text-green-400" : 
                                 hiringVerdict === "POTENTIAL" ? "text-blue-400" : 
                                 hiringVerdict === "PASS" ? "text-red-400" : "text-gray-500"
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

                     <div className="bg-neuro-cream/50 p-6 rounded-[2rem] border border-neuro-navy/5 flex items-start gap-4">
                        <div className="p-2 bg-white rounded-xl text-neuro-orange shadow-sm">
                           <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-neuro-navy uppercase tracking-widest mb-1">Standardized Assessment</p>
                           <p className="text-xs text-gray-500 leading-relaxed">
                              {hiringVerdict === "STRONG HIRE" ? "This candidate demonstrates exceptional alignment with the NeuroChiro clinical standard. Proceed to final contract stage." : 
                               hiringVerdict === "POTENTIAL" ? "Candidate shows promise but requires additional clinical audit on Adjusting Artistry." : 
                               hiringVerdict === "PASS" ? "Cultural or clinical misalignment detected. High risk for long-term retention." : 
                               "Complete all categories to receive standardized hiring recommendation."}
                           </p>
                        </div>
                     </div>

                     <div className="flex gap-4">
                        <button 
                           onClick={() => {
                              const printWindow = window.open('', '_blank');
                              if (printWindow) {
                                printWindow.document.write(`
                                  <html>
                                    <head>
                                      <title>NeuroChiro Interview Scorecard</title>
                                      <style>
                                        body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #0a192f; }
                                        .header { border-bottom: 2px solid #f97316; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
                                        .logo { font-size: 24px; font-weight: bold; color: #f97316; }
                                        .verdict { font-size: 20px; font-weight: 900; font-style: italic; }
                                        .category { margin-bottom: 25px; padding: 20px; background: #f8fafc; border-radius: 8px; }
                                        .cat-header { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                                        .score-bar { height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden; margin-top: 10px; }
                                        .score-fill { height: 100%; background: #f97316; }
                                      </style>
                                    </head>
                                    <body>
                                      <div class="header">
                                        <div class="logo">NEUROCHIRO ELITE SCORECARD</div>
                                        <div class="verdict">VERDICT: ${hiringVerdict}</div>
                                      </div>
                                      ${Object.entries(scores).map(([cat, val]) => `
                                        <div class="category">
                                          <div class="cat-header">
                                            <span>${cat}</span>
                                            <span>${val}/5</span>
                                          </div>
                                          <div class="score-bar">
                                            <div class="score-fill" style="width: ${val * 20}%"></div>
                                          </div>
                                        </div>
                                      `).join('')}
                                      <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                                        <strong>Notes:</strong>
                                        <div style="height: 200px; border: 1px solid #eee; margin-top: 10px; border-radius: 4px;"></div>
                                      </div>
                                    </body>
                                  </html>
                                `);
                                printWindow.document.close();
                                printWindow.print();
                              }
                           }}
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
                               <h4 className="text-3xl font-heading font-black mb-2">12-Week Success Roadmap</h4>
                               <p className="text-xs text-gray-400 max-w-md">14 pages of clinical systems, scripts, and KPI tracking ready for your new Associate.</p>
                               
                               <div className="mt-8 grid grid-cols-3 gap-4">
                                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
                                     <p className="text-[8px] font-black text-gray-500 uppercase mb-1">Modules</p>
                                     <p className="text-xl font-black text-white">12</p>
                                  </div>
                                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
                                     <p className="text-[8px] font-black text-gray-500 uppercase mb-1">KPI Targets</p>
                                     <p className="text-xl font-black text-white">36</p>
                                  </div>
                                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
                                     <p className="text-[8px] font-black text-gray-500 uppercase mb-1">Scripts</p>
                                     <p className="text-xl font-black text-white">4</p>
                                  </div>
                               </div>
                            </div>
                         </div>

                         <div className="space-y-3">
                            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Document Contents</h5>
                            <div className="grid grid-cols-2 gap-3">
                               {[
                                 "Month 1: Systems & Culture",
                                 "Month 2: Clinical Authority",
                                 "Month 3: Retention mastery",
                                 "Weekly KPI Scorecards",
                                 "Internal Marketing Schedule",
                                 "Day 1 Discovery Scripts"
                               ].map((item, i) => (
                                 <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                                       <CheckCircle2 className="w-3 h-3 text-green-500" />
                                    </div>
                                    <span className="text-[10px] font-bold text-neuro-navy">{item}</span>
                                 </div>
                               ))}
                            </div>
                         </div>

                         <button 
                           onClick={initiateDownload}
                           className="w-full py-6 bg-neuro-orange text-white font-black rounded-3xl shadow-xl hover:bg-neuro-orange-dark transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-3 group"
                         >
                            <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
                            Download PDF Success Plan
                         </button>
                      </motion.div>
                    )}
                  </div>
                )}

                {activeModal === 'Pay-for-Performance-Calculator' && (
                  <div className="space-y-8">
                     <div className="p-6 bg-neuro-navy text-white rounded-[2.5rem] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-neuro-orange/20 blur-3xl"></div>
                        <h4 className="text-xl font-heading font-black mb-1 relative z-10 flex items-center gap-2">
                           <Calculator className="w-5 h-5 text-neuro-orange" /> Talent Offer Optimizer
                        </h4>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest relative z-10">Stop paying for presence. Start paying for performance.</p>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Sliders Area */}
                        <div className="space-y-8">
                           <div className="space-y-4">
                              <div className="flex justify-between">
                                 <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Base Salary ($)</label>
                                 <span className="text-sm font-black text-neuro-navy">${calcBase.toLocaleString()}</span>
                              </div>
                              <input 
                                 type="range" min="30000" max="120000" step="5000" value={calcBase}
                                 onChange={(e) => setCalcBase(parseInt(e.target.value))}
                                 className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-neuro-orange"
                              />
                           </div>
                           <div className="space-y-4">
                              <div className="flex justify-between">
                                 <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Bonus per Visit ($)</label>
                                 <span className="text-sm font-black text-neuro-orange">${calcBonus}</span>
                              </div>
                              <input 
                                 type="range" min="0" max="50" step="1" value={calcBonus}
                                 onChange={(e) => setCalcBonus(parseInt(e.target.value))}
                                 className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-neuro-orange"
                              />
                           </div>
                           <div className="space-y-4">
                              <div className="flex justify-between">
                                 <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Target Weekly Volume</label>
                                 <span className="text-sm font-black text-neuro-navy">{calcVolume} Visits</span>
                              </div>
                              <input 
                                 type="range" min="40" max="250" step="10" value={calcVolume}
                                 onChange={(e) => setCalcVolume(parseInt(e.target.value))}
                                 className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-neuro-navy"
                              />
                           </div>
                        </div>

                        {/* Results Area */}
                        <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 space-y-6">
                           <div>
                              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Total Associate Comp</p>
                              <p className="text-3xl font-black text-neuro-navy">${totalComp.toLocaleString()}</p>
                           </div>
                           
                           <div className="space-y-3">
                              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                 <span className="text-gray-400">Clinic Fixed Risk</span>
                                 <span className={cn(riskScore > 70 ? "text-red-500" : "text-green-500")}>
                                    {riskScore > 70 ? "HIGH" : "LOW"} RISK
                                 </span>
                              </div>
                              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                 <motion.div 
                                    className={cn("h-full", riskScore > 70 ? "bg-red-500" : "bg-green-500")}
                                    animate={{ width: `${riskScore}%` }}
                                 ></motion.div>
                              </div>
                           </div>

                           <div className="space-y-3">
                              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                 <span className="text-gray-400">Talent Attraction Score</span>
                                 <span className="text-neuro-orange font-black">{talentScore}%</span>
                              </div>
                              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                 <motion.div 
                                    className="h-full bg-neuro-orange"
                                    animate={{ width: `${talentScore}%` }}
                                 ></motion.div>
                              </div>
                           </div>

                           <div className="pt-6 border-t border-gray-200">
                              <p className="text-[9px] text-gray-400 font-bold uppercase leading-relaxed italic">
                                 "The goal is a low base to keep you alive and a high bonus to keep you rich." — Alex Hormozi
                              </p>
                           </div>
                        </div>
                     </div>

                     <button className="w-full py-5 bg-neuro-navy text-white font-black rounded-2xl shadow-xl hover:bg-neuro-navy-light transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                        Update Job Listing with this Offer <ChevronRight className="w-4 h-4" />
                     </button>
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
                        <p className="text-xs text-gray-500 max-w-sm mb-8">We're pulling your practice ROI data to show {selectedApplicant.name.split(' ')[0]} exactly how they win at your clinic.</p>
                        
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
                             <p className="text-[9px] font-black text-neuro-orange uppercase animate-pulse">Calculating Projected Earnings...</p>
                          </div>
                        ) : (
                          <button 
                            onClick={handleGeneratePitch}
                            className="px-8 py-4 bg-neuro-navy text-white font-black rounded-2xl shadow-xl hover:bg-neuro-orange transition-all uppercase tracking-widest text-xs"
                          >
                            Build Success Roadmap
                          </button>
                        )}
                      </div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-8"
                      >
                         <div className="bg-neuro-navy p-8 rounded-[2.5rem] text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-neuro-orange/10 blur-3xl -mr-24 -mt-24"></div>
                            <h4 className="text-xl font-heading font-black mb-1 relative z-10 flex items-center gap-2">
                               <TrendingUp className="w-5 h-5 text-neuro-orange" /> The Success Roadmap
                            </h4>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest relative z-10">Prepared for {selectedApplicant.name}</p>
                            
                            <div className="mt-10 grid grid-cols-2 gap-8 relative z-10">
                               <div>
                                  <p className="text-[9px] font-black text-gray-500 uppercase mb-1">Month 1 Earnings</p>
                                  <p className="text-3xl font-black text-white">${(calcBase/12).toLocaleString(undefined, {maximumFractionDigits: 0})}<span className="text-xs text-gray-400">/mo</span></p>
                               </div>
                               <div>
                                  <p className="text-[9px] font-black text-neuro-orange uppercase mb-1">Month 12 Projected</p>
                                  <p className="text-3xl font-black text-neuro-orange">${((calcBase + (calcBonus * 150 * 50))/12).toLocaleString(undefined, {maximumFractionDigits: 0})}<span className="text-xs text-gray-400">/mo</span></p>
                               </div>
                            </div>
                         </div>

                         <div className="space-y-4">
                            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Career Milestones</h5>
                            <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-gray-100">
                               {[
                                 { label: "Systems Mastery", detail: "Learning the NeuroChiro clinical workflow & scripts.", icon: <ShieldCheck className="w-3 h-3" /> },
                                 { label: "Lead Associate", detail: "Managing 100+ visits/week & leading internal talks.", icon: <Zap className="w-3 h-3" /> },
                                 { label: "Clinical Authority", detail: "Full autonomy & maximum performance bonuses.", icon: <Target className="w-3 h-3" /> }
                               ].map((m, i) => (
                                 <div key={i} className="relative">
                                    <div className="absolute -left-[29px] top-0 w-6 h-6 bg-white border border-gray-100 rounded-lg flex items-center justify-center shadow-sm z-10">
                                       <div className="text-neuro-orange">{m.icon}</div>
                                    </div>
                                    <h6 className="text-sm font-black text-neuro-navy">{m.label}</h6>
                                    <p className="text-xs text-gray-500">{m.detail}</p>
                                 </div>
                               ))}
                            </div>
                         </div>

                         <div className="flex gap-4">
                            <button className="flex-1 py-5 bg-neuro-orange text-white font-black rounded-2xl shadow-xl hover:bg-neuro-orange-dark transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3">
                               Send to {selectedApplicant.name.split(' ')[0]} <MessageSquare className="w-4 h-4" />
                            </button>
                            <button className="px-6 py-5 bg-white border border-gray-200 text-neuro-navy font-black rounded-2xl hover:bg-gray-50 transition-all">
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
           onClick={() => setActiveTab('associate')}
           className={`px-6 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'associate' ? 'bg-neuro-navy text-white shadow-md' : 'text-gray-500 hover:text-neuro-navy'}`}
         >
            Associate Doctors
         </button>
         <button 
           onClick={() => setActiveTab('support')}
           className={`px-6 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'support' ? 'bg-neuro-orange text-white shadow-md' : 'text-gray-500 hover:text-neuro-orange'}`}
         >
            Support Staff (CAs)
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Job Pipeline Management */}
        <div className="lg:col-span-2 space-y-8">
           <div className="flex items-center justify-between">
              <h2 className="text-2xl font-heading font-black text-neuro-navy">
                 {activeTab === 'associate' ? 'Active Associate Pipelines' : 'Active Support Pipelines'}
              </h2>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-100 shadow-sm">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                 <span className="text-[10px] font-black text-neuro-navy uppercase tracking-widest">Live Monitoring</span>
              </div>
           </div>
           
           {activeJobs.map((job, i) => (
             <div key={i} className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
                {!isMember && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-12 h-12 bg-neuro-orange/10 rounded-2xl flex items-center justify-center mb-4">
                       <Lock className="w-6 h-6 text-neuro-orange" />
                    </div>
                    <h3 className="font-bold text-neuro-navy mb-1">Pipeline Tracking Locked</h3>
                    <p className="text-xs text-gray-500 max-w-xs mb-4">Members can manage applicants, screen candidates, and generate success plans.</p>
                    <button className="px-6 py-2 bg-neuro-navy text-white font-black rounded-xl text-[10px] uppercase">Join the Network</button>
                  </div>
                )}
                <div className="flex items-center justify-between mb-8">
                   <div>
                      <h3 className="text-2xl font-bold text-neuro-navy group-hover:text-neuro-orange transition-colors">{job.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <Clock className="w-3 h-3" /> Posted {job.posted} • <span className="text-green-600 font-bold px-2 py-0.5 bg-green-50 rounded-full">{job.status}</span>
                      </p>
                   </div>
                   <button 
                     onClick={() => setActiveModal('Edit-Job-Listing')}
                     className="px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold text-neuro-navy hover:bg-gray-100 transition-colors"
                   >
                      Edit Listing
                   </button>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-8">
                   {[
                     { label: 'New', count: job.pipeline.new, color: 'blue' },
                     { label: 'Screening', count: job.pipeline.screening, color: 'purple' },
                     { label: 'Interview', count: job.pipeline.interview, color: 'orange' },
                     { label: 'Offer', count: job.pipeline.offer, color: 'green' }
                   ].map((stage, idx) => (
                     <div 
                       key={idx}
                       onClick={() => setActiveModal('Review-Applicants')}
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

                        {stage.label === 'New' && (
                          <div className="mt-4 flex flex-col items-center gap-1">
                            <button 
                              onClick={handleZap}
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
                            {!zapSuccess && !isZapping && (
                              <p className="text-[7px] font-black text-neuro-orange uppercase tracking-tighter animate-pulse">Speed to Lead</p>
                            )}
                          </div>
                        )}
                     </div>
                   ))}
                </div>

                <div className="flex gap-3">
                   <button 
                     onClick={() => setActiveModal('Review-Applicants')}
                     className="flex-1 py-4 bg-neuro-navy text-white font-black rounded-2xl text-xs hover:bg-neuro-navy-light transition-all shadow-xl shadow-neuro-navy/20 flex items-center justify-center gap-2 group"
                   >
                      Review Applicants <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                   </button>
                </div>
             </div>
           ))}

           {/* Hiring Tools */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
           </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
           <section className="bg-gradient-to-br from-neuro-navy to-neuro-navy-dark rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
              {!isMember && (
                <div className="absolute inset-0 bg-neuro-navy/80 backdrop-blur-[4px] z-20 flex flex-col items-center justify-center text-center p-6">
                   <Lock className="w-8 h-8 text-neuro-orange mb-4" />
                   <h4 className="font-bold mb-2 text-sm">Talent Match Locked</h4>
                   <p className="text-[10px] text-gray-400 mb-4 text-center">Join to see AI-matched talent recommendations for your roles.</p>
                   <button className="px-4 py-2 bg-neuro-orange rounded-xl text-[10px] font-black uppercase">Apply Now</button>
                </div>
              )}
              <div className="absolute top-0 right-0 w-32 h-32 bg-neuro-orange/20 blur-3xl -mr-16 -mt-16"></div>
              <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-8">
                    <Sparkles className="w-5 h-5 text-neuro-orange" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-neuro-orange">Smart Match</span>
                 </div>
                 <h3 className="text-2xl font-heading font-black mb-6 text-white">Talent Recommendations</h3>
                 
                 <div className="space-y-4 mb-10">
                    {[
                      { name: "Sarah Miller", match: "98%", school: "Palmer" },
                      { name: "Jason Lee", match: "94%", school: "Parker" }
                    ].map((student, i) => (
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
                            <span className="text-xs font-black text-neuro-orange">{student.match}</span>
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
                          <p className="text-3xl font-black text-neuro-navy">84<span className="text-sm text-gray-400">/100</span></p>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Highly Competitive</p>
                       </div>
                    </div>
                    
                    <div className="space-y-3">
                       <div className="flex items-center justify-between text-[10px]">
                          <span className="text-gray-500 font-bold">Base Salary ($85k)</span>
                          <span className="text-green-600 font-black">+15% vs Denver Avg</span>
                       </div>
                       <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 w-[85%]"></div>
                       </div>
                       
                       <div className="flex items-center justify-between text-[10px]">
                          <span className="text-gray-500 font-bold">Bonus Structure</span>
                          <span className="text-neuro-orange font-black">Bottom 30%</span>
                       </div>
                       <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-neuro-orange w-[30%]"></div>
                       </div>
                       
                       <button 
                         onClick={() => setActiveModal('Pay-for-Performance-Calculator')}
                         className="w-full py-3 bg-neuro-orange/10 text-neuro-orange text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-neuro-orange/20 transition-all flex items-center justify-center gap-2"
                       >
                          <Calculator className="w-3 h-3" /> Optimize Bonus Structure
                       </button>
                    </div>
                 </div>

                 {/* Real-time Demand Steroid */}
                 <div className="relative group/map">
                    <div className="flex items-center justify-between mb-3">
                       <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Candidate Density: 80202</p>
                       <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-neuro-orange animate-pulse"></div>
                          <span className="text-[9px] font-bold text-neuro-orange uppercase tracking-widest">High Demand</span>
                       </div>
                    </div>
                    
                    <div className="aspect-[4/3] bg-neuro-navy rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
                       <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neuro-orange via-transparent to-transparent"></div>
                       <Globe className="w-12 h-12 text-white/10 mb-2" />
                       <div className="text-center relative z-10">
                          <p className="text-xl font-black text-white">12:1</p>
                          <p className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">Students vs Open Roles</p>
                       </div>
                       
                       {/* Animated Pings */}
                       <div className="absolute top-1/4 left-1/3 w-1 h-1 bg-neuro-orange rounded-full shadow-[0_0_10px_#f97316]"></div>
                       <div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-neuro-orange rounded-full shadow-[0_0_10px_#f97316]"></div>
                    </div>
                    
                    <p className="text-[9px] text-gray-400 mt-3 leading-relaxed">
                       You are competing with 4 other clinics in a 5-mile radius for the top 12% of graduates.
                    </p>
                 </div>
              </div>
           </section>

           <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                 <h4 className="font-bold text-neuro-navy text-sm uppercase tracking-widest">Recent Activity</h4>
                 <div className="p-2 bg-gray-50 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                 </div>
              </div>
              <div className="space-y-6">
                 {activeTab === 'associate' ? (
                   <>
                     <div className="flex gap-4">
                        <div className="mt-1 min-w-[8px] h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                        <div>
                           <p className="text-xs font-bold text-neuro-navy">New Application</p>
                           <p className="text-[10px] text-gray-500 mt-0.5">Sarah Miller applied to Associate role.</p>
                           <p className="text-[9px] text-gray-400 mt-2 flex items-center gap-1 font-bold">
                             <Clock className="w-2 h-2" /> 2 hours ago
                           </p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <div className="mt-1 min-w-[8px] h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                        <div>
                           <p className="text-xs font-bold text-neuro-navy">Interview Confirmed</p>
                           <p className="text-[10px] text-gray-500 mt-0.5">Scheduled with Jason Lee for Friday.</p>
                           <p className="text-[9px] text-gray-400 mt-2 flex items-center gap-1 font-bold">
                             <Clock className="w-2 h-2" /> 5 hours ago
                           </p>
                        </div>
                     </div>
                   </>
                 ) : (
                   <>
                     <div className="flex gap-4">
                        <div className="mt-1 min-w-[8px] h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>
                        <div>
                           <p className="text-xs font-bold text-neuro-navy">Culture Fit Score: 92%</p>
                           <p className="text-[10px] text-gray-500 mt-0.5">Emma Watson completed screening questions.</p>
                           <p className="text-[9px] text-gray-400 mt-2 flex items-center gap-1 font-bold">
                             <Clock className="w-2 h-2" /> 1 hour ago
                           </p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <div className="mt-1 min-w-[8px] h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                        <div>
                           <p className="text-xs font-bold text-neuro-navy">New Resume Uploaded</p>
                           <p className="text-[10px] text-gray-500 mt-0.5">David Chen applied to Front Desk role.</p>
                           <p className="text-[9px] text-gray-400 mt-2 flex items-center gap-1 font-bold">
                             <Clock className="w-2 h-2" /> 4 hours ago
                           </p>
                        </div>
                     </div>
                   </>
                 )}
              </div>
           </section>
        </div>
      </div>
    </div>
  );
}

// GIT TRACKING TEST
