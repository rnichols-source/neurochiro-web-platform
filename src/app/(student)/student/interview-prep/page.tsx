"use client";

import { 
  Sparkles, 
  CheckCircle2, 
  MessageSquare, 
  Video, 
  UserCheck, 
  Target, 
  ArrowRight,
  ChevronRight,
  Search,
  BookOpen,
  Mic,
  Lightbulb,
  X,
  FileDown,
  ArrowLeft,
  RotateCcw,
  Volume2,
  Trophy,
  History,
  ChevronLeft,
  Zap,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Briefcase,
  Star,
  Award,
  Lock,
  PlayCircle
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function InterviewPrepPage() {
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [activeTrack, setActiveTrack] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [currentPracticeTrack, setCurrentPracticeTrack] = useState<any>(null);
  
  // Drill State
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const modules = [
    {
      id: "track-1",
      title: "The 7-Figure First Impression",
      desc: "Master the psychology of high-stakes clinical presentation. First 5 minutes is 80% of the win.",
      icon: UserCheck,
      color: "text-blue-600 bg-blue-50",
      content: [
        "The Authority Walk: Non-verbal clinical dominance.",
        "Clinical Attire: Engineering the expert image (Modern High-Density Style).",
        "The Origin Story: Architecting your journey into a compelling 60-second narrative."
      ]
    },
    {
      id: "track-2",
      title: "The Clinical Closer Drills",
      desc: "Simulate high-pressure scenario explanation. If you can't explain it, you can't sell it.",
      icon: Target,
      color: "text-purple-600 bg-purple-50",
      content: [
        "The Nervous System ROI: Explaining scanning tech as a 'Wealth & Health' investment.",
        "Handling the Clinical Skeptic: The 'Feel-Felt-Found' script for clinic owners.",
        "Volume Simulation: Explaining care plans for 150+ visits/week scenarios."
      ]
    },
    {
      id: "track-3",
      title: "The Wealth Multiplier (Salary)",
      desc: "Negotiate for total compensation, not just a base. How to ask for the 'Buy-In' roadmap.",
      icon: DollarSign,
      color: "text-neuro-orange bg-neuro-orange/5",
      content: [
        "Base vs. Bonus Paradox: Why a lower base and higher bonus makes you rich.",
        "The Mentorship Audit: Quantifying the $50k/year value of 1-on-1 clinical training.",
        "Equity Architecting: How to bring up partnership during the first meeting."
      ]
    }
  ];

  const commonQuestions = [
    {
      q: "What is your clinical philosophy?",
      hint: "Owners don't care about your philosophy; they care about clinical certainty and patient retention. Frame it as 'Certainty of Outcome'.",
      script: "My philosophy is outcome-driven certainty through nervous system integrity. I use objective scanning tech to ensure we aren't guessing. I don't treat symptoms; I restore the master controller of the body so the patient stays for life.",
      hormoziInsight: "Make the owner feel that your existence in their clinic reduces their stress and increases their profit."
    },
    {
      q: "Where do you see yourself in 3 years?",
      hint: "The owner is thinking: 'Will you open across the street?' Pivot to 'Impact & Integration'.",
      script: "In three years, I want to be the clinical anchor of this community. I'm looking for a path where I can manage 150+ visits a week and discuss a roadmap for clinical partnership or regional leadership.",
      hormoziInsight: "Commitment is the rarest currency. Show them you are an asset, not a temporary flight risk."
    },
    {
      q: "How do you handle a patient who isn't responding to care?",
      hint: "Show you are coachable and systematic. The owner needs to know you won't lose their patient assets.",
      script: "I lean on the objective data first. If the scans haven't shifted, I'll bring the case to you (the owner) for a clinical audit. I believe in 'No Patient Left Behind' and I'm here to learn your specific systems for breakthrough cases.",
      hormoziInsight: "The 'I will ask for help' answer is actually the high-confidence answer. It shows you value the result over your ego."
    }
  ];

  const handleDownload = () => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      triggerSuccess("The 100K Interview Blueprint Downloaded!");
    }, 1500);
  };

  const startDrill = (track: any) => {
    setActiveTrack(null);
    setCurrentPracticeTrack(track);
    setIsPracticeMode(true);
    setActivePromptIndex(0);
    setIsRecording(false);
    setRecordingComplete(false);
    setShowSummary(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinishDrill = () => {
    setShowSummary(true);
  };

  const nextPrompt = () => {
    if (activePromptIndex < currentPracticeTrack.content.length - 1) {
      setActivePromptIndex(activePromptIndex + 1);
      setIsRecording(false);
      setRecordingComplete(false);
    } else {
      handleFinishDrill();
    }
  };

  if (isPracticeMode && currentPracticeTrack) {
    if (showSummary) {
      return (
        <div className="p-8 max-w-2xl mx-auto space-y-8 animate-in zoom-in duration-500 text-center py-20">
          <div className="w-24 h-24 bg-neuro-orange/10 text-neuro-orange rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-neuro-orange/20 shadow-2xl">
            <Trophy className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-black text-neuro-navy uppercase italic tracking-tighter">Drill Executed.</h1>
          <p className="text-neuro-gray text-lg max-w-sm mx-auto">"You don't rise to the level of your goals, you fall to the level of your training."</p>
          
          <div className="bg-neuro-navy border border-white/10 rounded-[2rem] p-8 shadow-2xl text-left space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neuro-orange/10 blur-3xl"></div>
            <h3 className="font-black text-white flex items-center gap-2 uppercase tracking-widest text-xs">
              <ShieldCheck className="w-4 h-4 text-neuro-orange" /> Performance Audit
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Success Probability</p>
                <p className="text-3xl font-black text-neuro-orange">94%</p>
              </div>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Certainty Rating</p>
                <p className="text-3xl font-black text-white">ELITE</p>
              </div>
            </div>
            <div className="pt-4 border-t border-white/5">
               <p className="text-[10px] font-black text-neuro-orange uppercase italic">Hormozi Insight:</p>
               <p className="text-xs text-gray-400 mt-1 italic">"The person who is most certain in the room always wins. You just proved your certainty. Go collect your value."</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => startDrill(currentPracticeTrack)}
              className="flex-1 py-5 bg-white border-2 border-neuro-navy text-neuro-navy font-black rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-xs"
            >
              Restart Drill
            </button>
            <button 
              onClick={() => setIsPracticeMode(false)}
              className="flex-[2] py-5 bg-neuro-orange text-white font-black rounded-2xl shadow-xl hover:bg-neuro-orange-dark transition-all uppercase tracking-widest text-xs"
            >
              Return to Command Center
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button 
          onClick={() => setIsPracticeMode(false)}
          className="flex items-center gap-2 text-gray-400 hover:text-neuro-navy font-bold transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Exit Practice Mode
        </button>

        <header className="bg-neuro-navy rounded-[2.5rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-neuro-orange/10 blur-[120px] -mr-48 -mt-48"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className={`p-4 rounded-[2rem] bg-white/5 border border-white/10 text-neuro-orange shadow-inner`}>
                <currentPracticeTrack.icon className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter italic">{currentPracticeTrack.title}</h1>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 flex items-center gap-2">
                   <Zap className="w-3 h-3 text-neuro-orange" /> Active Simulation • Stage {activePromptIndex + 1} of {currentPracticeTrack.content.length}
                </p>
              </div>
            </div>
            <div className="flex gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
               {currentPracticeTrack.content.map((_: any, i: number) => (
                 <div key={i} className={`h-2 rounded-full transition-all duration-700 ${activePromptIndex === i ? 'w-12 bg-neuro-orange shadow-[0_0_15px_rgba(249,115,22,0.5)]' : activePromptIndex > i ? 'w-4 bg-green-500' : 'w-4 bg-white/10'}`}></div>
               ))}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <section className="bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-100 relative overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-black text-neuro-navy flex items-center gap-2 italic uppercase">
                   <Mic className="w-6 h-6 text-neuro-orange" /> Voice Lab
                 </h3>
                 {isRecording && <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black animate-pulse border border-red-100">REC</div>}
              </div>
              
              <div className="aspect-square rounded-[2.5rem] bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-8 relative overflow-hidden shadow-inner">
                {isRecording ? (
                  <>
                    <div className="absolute inset-0 bg-neuro-orange/[0.02] animate-pulse"></div>
                    <div className="relative z-10 space-y-6">
                       <div className="flex items-end gap-1 h-12">
                          {[...Array(12)].map((_, i) => (
                            <motion.div 
                              key={i}
                              animate={{ height: [10, Math.random() * 40 + 10, 10] }}
                              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
                              className="w-1.5 bg-neuro-orange rounded-full"
                            />
                          ))}
                       </div>
                       <div>
                          <p className="text-2xl font-black text-neuro-navy italic">00:14</p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Analyzing Tonal Quality...</p>
                       </div>
                    </div>
                  </>
                ) : recordingComplete ? (
                  <>
                    <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center mb-6 shadow-xl border-4 border-white">
                      <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </div>
                    <p className="text-2xl font-black text-neuro-navy italic">Captured.</p>
                    <p className="text-gray-400 text-xs mt-2 px-8 font-medium">Your response is being processed for clarity and clinical authority.</p>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-6 shadow-2xl relative group cursor-pointer active:scale-95 transition-all" onClick={() => setIsRecording(true)}>
                      <div className="absolute inset-0 bg-neuro-orange/20 rounded-full animate-ping group-hover:animate-none opacity-50"></div>
                      <div className="w-16 h-16 rounded-full bg-neuro-orange flex items-center justify-center relative z-10 shadow-lg group-hover:bg-neuro-orange-dark transition-colors">
                        <Mic className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <p className="text-xl font-black text-neuro-navy italic">Start Simulation.</p>
                    <p className="text-gray-400 text-xs mt-1 font-medium italic">"Practice like you've never won."</p>
                  </>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-8">
                <button 
                  onClick={() => {
                    setIsRecording(false);
                    setRecordingComplete(false);
                  }}
                  className="py-5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 border border-gray-200"
                >
                  Clear Attempt
                </button>
                {isRecording ? (
                  <button 
                    onClick={() => {
                      setIsRecording(false);
                      setRecordingComplete(true);
                    }}
                    className="py-5 bg-red-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl active:scale-95 animate-pulse"
                  >
                    Lock Response
                  </button>
                ) : recordingComplete ? (
                  <button 
                    onClick={nextPrompt}
                    className="py-5 bg-neuro-navy text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                  >
                    Next Prompt <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsRecording(true)}
                    className="py-5 bg-neuro-orange text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl active:scale-95"
                  >
                    Start Mic
                  </button>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-white rounded-[3rem] border border-gray-100 p-10 shadow-sm h-fit relative">
              <div className="absolute top-6 right-8">
                 <div className="px-3 py-1 bg-neuro-orange/10 text-neuro-orange text-[8px] font-black rounded-full uppercase tracking-widest border border-neuro-orange/20">Active Scenario</div>
              </div>
              <h3 className="text-xl font-black text-neuro-navy mb-8 flex items-center gap-2 italic uppercase">
                <Target className="w-6 h-6 text-neuro-orange" /> The Prompt
              </h3>
              <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 mb-8 relative">
                 <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-neuro-orange rounded-full"></div>
                 <p className="text-xl font-bold text-neuro-navy leading-tight italic">
                   "{currentPracticeTrack.content[activePromptIndex]}"
                 </p>
              </div>

              <div className="space-y-4">
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Hormozi Cheat Sheet:</h4>
                 <div className="grid grid-cols-1 gap-3">
                    <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-3">
                       <Lightbulb className="w-5 h-5 text-blue-600 shrink-0" />
                       <p className="text-xs text-blue-900 leading-relaxed font-medium">Speak 15% slower than usual. It projects authority and clinical certainty.</p>
                    </div>
                    <div className="p-5 bg-purple-50/50 rounded-2xl border border-purple-100 flex items-start gap-3">
                       <Zap className="w-5 h-5 text-purple-600 shrink-0" />
                       <p className="text-xs text-purple-900 leading-relaxed font-medium">Avoid 'I think'. Use 'The data shows'. Owners pay for data, not feelings.</p>
                    </div>
                 </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-16">
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[400] bg-neuro-navy text-white px-8 py-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 flex items-center gap-4 font-black uppercase tracking-widest text-xs"
          >
            <div className="p-1.5 bg-neuro-orange rounded-lg">
               <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="relative py-12 px-10 bg-neuro-navy rounded-[3.5rem] overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neuro-orange/10 blur-[150px] -mr-64 -mt-64"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 blur-[100px] -ml-32 -mb-32"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-4">
                 <div className="px-3 py-1 bg-neuro-orange text-white text-[9px] font-black rounded-full uppercase tracking-[0.2em] shadow-lg shadow-neuro-orange/20">Elite Accelerator</div>
                 <div className="px-3 py-1 bg-white/10 text-gray-300 text-[9px] font-black rounded-full uppercase tracking-[0.2em] border border-white/10">100K Resource</div>
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-white italic tracking-tighter leading-none mb-6">
                The Interview <span className="text-neuro-orange underline decoration-white/20">Closer.</span>
              </h1>
              <p className="text-gray-400 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
                Most students walk into interviews hoping for a job. Our members walk in <span className="text-white">dictating their value.</span> Master the psychology of clinical authority.
              </p>
           </div>
           
           <div className="shrink-0 flex flex-col items-center gap-4">
              <div className="w-32 h-32 bg-white/5 rounded-[2.5rem] border border-white/10 flex flex-col items-center justify-center text-center p-4 backdrop-blur-md">
                 <p className="text-3xl font-black text-neuro-orange">98%</p>
                 <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">Hiring Rate</p>
              </div>
              <button 
                onClick={handleDownload}
                className="px-6 py-3 bg-white text-neuro-navy font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-neuro-orange hover:text-white transition-all shadow-xl"
              >
                 Get Master Guide
              </button>
           </div>
        </div>
      </header>

      {/* Preparation Track */}
      <section className="space-y-8">
        <div className="flex items-center justify-between px-4">
           <h2 className="text-2xl font-black text-neuro-navy uppercase italic italic">Simulation Tracks</h2>
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
             <RotateCcw className="w-3 h-3" /> Updated 2 Hours Ago
           </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {modules.map((mod, i) => (
            <div 
              key={i} 
              onClick={() => setActiveTrack(mod)}
              className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all cursor-pointer group active:scale-[0.97] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                 <mod.icon className="w-32 h-32" />
              </div>
              <div className={cn("p-5 rounded-[2rem] w-fit mb-8 shadow-inner transition-colors group-hover:bg-neuro-orange group-hover:text-white", mod.color)}>
                <mod.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-neuro-navy mb-4 leading-tight italic group-hover:text-neuro-orange transition-colors">{mod.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium mb-8">{mod.desc}</p>
              <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                <span className="text-[10px] font-black text-neuro-navy uppercase tracking-widest group-hover:text-neuro-orange transition-colors">Start Simulation</span>
                <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-neuro-orange/10 group-hover:text-neuro-orange transition-colors">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Practice Questions */}
        <section className="lg:col-span-3 bg-white rounded-[3.5rem] border border-gray-100 p-10 shadow-sm">
          <div className="flex items-center justify-between mb-10">
             <h2 className="text-2xl font-black text-neuro-navy uppercase italic flex items-center gap-3">
               <div className="p-2 bg-neuro-orange/10 rounded-xl">
                 <Mic className="w-6 h-6 text-neuro-orange" />
               </div>
               The 7-Figure Script Vault
             </h2>
             <span className="px-3 py-1 bg-gray-50 text-gray-400 text-[9px] font-black rounded-full uppercase tracking-widest border border-gray-100">Most Frequently Asked</span>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {commonQuestions.map((item, i) => (
              <div 
                key={i} 
                onClick={() => setSelectedQuestion(item)}
                className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 flex items-center justify-between group cursor-pointer hover:border-neuro-orange hover:bg-white hover:shadow-xl transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-6">
                   <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-neuro-navy text-sm shadow-sm group-hover:bg-neuro-orange/10 group-hover:text-neuro-orange transition-colors">
                      {i + 1}
                   </div>
                   <div>
                      <span className="font-bold text-lg text-neuro-navy group-hover:text-neuro-orange transition-colors italic leading-none">{item.q}</span>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Psychological Trap Detected</p>
                   </div>
                </div>
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:bg-neuro-orange group-hover:text-white transition-all">
                   <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 p-8 bg-neuro-navy text-white rounded-[2.5rem] relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-neuro-orange/20 blur-3xl"></div>
             <div className="relative z-10 flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                   <PlayCircle className="w-8 h-8 text-neuro-orange" />
                </div>
                <div>
                   <h4 className="font-black text-lg italic">Masterclass: Negotiating with the Ultra-Wealthy</h4>
                   <p className="text-xs text-gray-400 mt-1">Learn how to spot a "Growth Clinic" vs a "Churn Clinic" in 10 minutes.</p>
                </div>
                <button className="ml-auto px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Watch Now</button>
             </div>
          </div>
        </section>

        {/* Essential Checklist */}
        <section className="lg:col-span-2 bg-gradient-to-br from-neuro-navy to-neuro-navy-dark text-white rounded-[3.5rem] p-12 shadow-2xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-64 h-64 bg-neuro-orange/10 blur-[100px] -mr-32 -mt-32"></div>
          
          <div className="mb-10">
             <h2 className="text-3xl font-black italic tracking-tighter mb-2">The 100K Prep <span className="text-neuro-orange underline decoration-white/20">Checklist.</span></h2>
             <p className="text-gray-400 text-sm font-medium">90% of students fail because they prepare for the job, not the <span className="text-white">win.</span></p>
          </div>

          <div className="space-y-8 flex-1">
            {[
              { title: "The Clinic Deep-Dive", detail: "Audit their social media for 'Tonal' alignment.", icon: Search },
              { title: "The 3 Case Studies", detail: "Print high-res scan results of your best wins.", icon: Award },
              { title: "The 'Certainty' Story", detail: "Why NeuroChiro? Your personal clinical why.", icon: MessageSquare },
              { title: "Physical Portfolio", detail: "High-quality CV + 5 Testimonials from mentors.", icon: Briefcase },
              { title: "The Reverse Interview", detail: "Have 5 high-stakes questions for the owner.", icon: RotateCcw }
            ].map((item, i) => (
              <div key={i} className="flex gap-6 group">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-neuro-orange/20 group-hover:border-neuro-orange/30 transition-all">
                  <item.icon className="w-6 h-6 text-neuro-orange" />
                </div>
                <div>
                   <h4 className="font-black text-white italic">{item.title}</h4>
                   <p className="text-xs text-gray-400 font-medium mt-1">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full mt-12 py-5 bg-white text-neuro-navy font-black rounded-3xl hover:bg-neuro-orange hover:text-white shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
          >
            {isDownloading ? (
              <div className="w-6 h-6 border-2 border-neuro-navy/30 border-t-neuro-navy rounded-full animate-spin"></div>
            ) : (
              <><FileDown className="w-5 h-5" /> Download The Blueprint</>
            )}
          </button>
        </section>
      </div>

      {/* Question Modal */}
      <AnimatePresence>
        {selectedQuestion && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 backdrop-blur-xl bg-neuro-navy/80">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10"
            >
              <div className="p-10 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-neuro-orange rounded-2xl text-white shadow-lg shadow-neuro-orange/20">
                    <Mic className="w-6 h-6" />
                  </div>
                  <div>
                     <h3 className="font-black text-2xl text-neuro-navy italic tracking-tighter">Script Audit.</h3>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">High-Certainty Response Logic</p>
                  </div>
                </div>
                <button onClick={() => setSelectedQuestion(null)} className="p-3 hover:bg-white rounded-full transition-colors shadow-sm"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-10 space-y-10">
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">The Question</h4>
                  <p className="text-2xl font-black text-neuro-navy leading-tight italic">"{selectedQuestion.q}"</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4">
                        <Lightbulb className="w-5 h-5 text-blue-300" />
                     </div>
                     <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">Strategy Tip</h4>
                     <p className="text-sm text-blue-900 leading-relaxed font-bold italic">"{selectedQuestion.hint}"</p>
                   </div>
                   
                   <div className="p-8 bg-neuro-orange/5 rounded-[2.5rem] border border-neuro-orange/10 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4">
                        <Sparkles className="w-5 h-5 text-neuro-orange/30" />
                     </div>
                     <h4 className="text-[10px] font-black text-neuro-orange uppercase tracking-widest mb-3">Hormozi Insight</h4>
                     <p className="text-xs text-neuro-navy leading-relaxed font-bold italic">"{selectedQuestion.hormoziInsight}"</p>
                   </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">The Expert Script</h4>
                  <div className="relative">
                     <div className="absolute -left-4 top-0 bottom-0 w-1 bg-neuro-orange rounded-full"></div>
                     <p className="text-lg font-bold text-gray-700 leading-relaxed italic bg-gray-50 p-8 rounded-3xl">
                       "{selectedQuestion.script}"
                     </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setSelectedQuestion(null)} 
                  className="w-full py-6 bg-neuro-navy text-white font-black rounded-[2rem] uppercase tracking-widest text-sm shadow-2xl active:scale-95 transition-all hover:bg-neuro-navy-light"
                >
                  Mastered. Close Audit.
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Track Detail Modal */}
      <AnimatePresence>
        {activeTrack && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 backdrop-blur-xl bg-neuro-navy/80">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white rounded-[3.5rem] w-full max-w-xl shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10"
            >
              <div className={cn("p-10 flex items-center justify-between", activeTrack.color)}>
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-white/20 rounded-[1.5rem] backdrop-blur-md shadow-inner">
                    <activeTrack.icon className="w-8 h-8" />
                  </div>
                  <div>
                     <h3 className="font-black text-2xl italic tracking-tighter">Track Intel.</h3>
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-60">High-Stake Simulation Prep</p>
                  </div>
                </div>
                <button onClick={() => setActiveTrack(null)} className="p-3 hover:bg-black/5 rounded-full transition-colors"><X className="w-7 h-7" /></button>
              </div>
              <div className="p-10 space-y-8">
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                   <p className="text-lg font-bold text-neuro-navy leading-tight italic">"{activeTrack.desc}"</p>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Simulation Modules:</h4>
                  {activeTrack.content.map((item: string, i: number) => (
                    <div key={i} className="flex items-start gap-4 p-5 bg-white border border-gray-100 rounded-3xl shadow-sm hover:border-neuro-orange/30 transition-all group">
                      <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-neuro-orange group-hover:text-white transition-colors">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-neuro-navy leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4">
                   <button 
                     onClick={() => startDrill(activeTrack)} 
                     className="w-full py-6 bg-neuro-navy text-white font-black rounded-[2rem] uppercase tracking-[0.2em] text-xs shadow-2xl active:scale-95 transition-all hover:bg-neuro-navy-light flex items-center justify-center gap-3"
                   >
                     Initiate Drill <Zap className="w-4 h-4 text-neuro-orange" />
                   </button>
                   <p className="text-[9px] text-center text-gray-400 mt-4 font-black uppercase tracking-widest">Estimated Time: 8 Minutes</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}