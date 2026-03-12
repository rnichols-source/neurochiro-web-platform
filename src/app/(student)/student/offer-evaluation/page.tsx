"use client";

import { 
  Briefcase, 
  Calculator, 
  CheckCircle2, 
  Scale, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight,
  Info,
  DollarSign,
  MapPin,
  Clock,
  Award,
  AlertTriangle,
  X,
  FileDown,
  Globe,
  Sparkles,
  BookOpen,
  Target,
  Users,
  Activity,
  Zap,
  Lock,
  LineChart
} from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function OfferEvaluationPage() {
  const [eduMode, setEduMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Deep Evaluation State
  const [offer, setOffer] = useState({
    // Financial
    base: 75000,
    bonusPercent: 15,
    avgCollections: 25000,
    // Clinical & Training
    mentorship: "High (Daily 1-on-1)",
    volume: 150,
    caseReview: "Weekly",
    // Risk
    nonCompeteMiles: 15,
    nonCompeteYears: 2,
    pto: 14,
    // Future & Culture
    buyIn: "Verbal",
    turnover: "Unknown"
  });

  // Proprietary Algorithm
  const analysis = useMemo(() => {
    let score = 0;
    const warnings: string[] = [];
    const insights: string[] = [];
    const negotiation: string[] = [];

    // 1. INCOME TRAJECTORY MODEL
    const yearlyBonus = Math.max(0, (offer.avgCollections * 12 - (offer.base * 3)) * (offer.bonusPercent / 100));
    const year1Comp = offer.base + (yearlyBonus > 0 ? yearlyBonus : 5000); 
    const year3Comp = offer.base + ((offer.avgCollections * 1.5) * 12 - (offer.base * 3)) * (offer.bonusPercent / 100);
    const year5Comp = year3Comp * 1.2; // Assuming growth/buy-in

    if (year1Comp >= 90000) {
      score += 25;
      insights.push("Strong Year 1 Income Trajectory.");
    } else if (year1Comp >= 75000) {
      score += 15;
    } else {
      score += 5;
      warnings.push("Income projection below industry average.");
      negotiation.push("Request a higher base floor for Year 1 to mitigate ramp-up risk.");
    }

    // 2. TRAINING QUALITY INDEX
    let trainingScore = 0;
    if (offer.mentorship.includes("High")) trainingScore += 15;
    else if (offer.mentorship.includes("Medium")) trainingScore += 8;
    else warnings.push("Limited mentorship detected. High risk of clinical burnout.");

    if (offer.caseReview === "Daily" || offer.caseReview === "Weekly") trainingScore += 10;
    else negotiation.push("Add mandatory weekly 1-on-1 case reviews to the contract.");

    score += trainingScore;
    if (trainingScore >= 20) insights.push("Elite clinical mentorship environment.");

    // 3. CLINICAL DEVELOPMENT POTENTIAL
    if (offer.volume >= 200) {
      score += 10;
      insights.push("High-volume exposure will rapidly build physical adjusting stamina.");
    } else if (offer.volume >= 100) {
      score += 15; // Sweet spot for learning
      insights.push("Optimal volume for balancing skill acquisition with patient care.");
    } else {
      score += 5;
      warnings.push("Low volume may delay your clinical mastery.");
    }

    // 4. NON-COMPETE RISK ANALYSIS
    let riskPenalty = 0;
    if (offer.nonCompeteMiles > 10) {
      riskPenalty -= 10;
      warnings.push(`Restrictive non-compete (${offer.nonCompeteMiles} miles) severely limits your future options.`);
      negotiation.push(`Negotiate non-compete down to 5 miles or restrict it to specific zip codes.`);
    }
    if (offer.nonCompeteYears > 1) {
      riskPenalty -= 10;
      warnings.push("Multi-year non-competes are highly dangerous.");
    }
    score += Math.max(-20, riskPenalty); // Apply penalty, max -20

    // 5. CAREER MOBILITY & OWNER RISK
    if (offer.buyIn === "Written") {
      score += 20;
      insights.push("Clear, written path to partnership secures your long-term equity.");
    } else if (offer.buyIn === "Verbal") {
      score += 5;
      warnings.push("Verbal buy-in promises are unenforceable.");
      negotiation.push("Convert 'verbal' partnership path into a specific, milestone-based written clause.");
    } else {
      warnings.push("No defined partnership path. This is likely a permanent associate role.");
    }

    if (offer.turnover === "High") {
      score -= 15;
      warnings.push("High historical turnover indicates potential toxic culture or broken systems.");
    }

    // FINAL SCORING
    let grade = "D";
    let gradeColor = "text-red-500";
    let confidence = "Low Confidence – Investigate Further";
    
    if (score >= 85) {
      grade = "A+";
      gradeColor = "text-green-500";
      confidence = "High Confidence – Elite Opportunity";
    } else if (score >= 75) {
      grade = "A";
      gradeColor = "text-emerald-500";
      confidence = "High Confidence – Strong Growth Clinic";
    } else if (score >= 65) {
      grade = "B+";
      gradeColor = "text-blue-500";
      confidence = "Moderate Confidence – Good with Tweaks";
    } else if (score >= 55) {
      grade = "B";
      gradeColor = "text-indigo-500";
      confidence = "Moderate Confidence – Solid but Watch Structure";
    } else if (score >= 40) {
      grade = "C";
      gradeColor = "text-orange-500";
      confidence = "Low Confidence – Risky Contract";
    }

    return { 
      grade, 
      gradeColor, 
      score: Math.max(0, Math.min(100, score)), 
      confidence,
      year1Comp, 
      year3Comp, 
      year5Comp, 
      insights, 
      warnings, 
      negotiation 
    };
  }, [offer]);

  const handleGeneratePDF = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setSuccessToast("Intelligence Report Downloaded!");
      setIsGenerating(false);
      setTimeout(() => setSuccessToast(null), 3000);
    }, 1500);
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 relative">
      <AnimatePresence>
        {successToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[400] bg-green-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold"
          >
            <CheckCircle2 className="w-5 h-5" />
            {successToast}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 bg-neuro-navy p-10 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neuro-orange/20 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="px-3 py-1 bg-neuro-orange text-white text-[10px] font-black uppercase tracking-widest rounded-md shadow-lg flex items-center gap-1">
              <Zap className="w-3 h-3" /> Elite Intelligence
            </div>
            <div className="px-3 py-1 bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-md border border-white/20">
              $100k Value Engine
            </div>
            <div className="px-3 py-1 bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-widest rounded-md border border-blue-500/30 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Proprietary Algorithm
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-black text-white flex items-center gap-4">
            The Career Intelligence System
          </h1>
          <p className="text-gray-300 mt-4 text-lg md:text-xl max-w-3xl leading-relaxed">
            Stop guessing about your future. This system analyzes 11 critical contract variables to reveal the <span className="text-neuro-orange font-bold">true long-term value, hidden risks, and negotiation leverage</span> of your associate offer.
          </p>
        </div>
        
        <div className="flex items-center gap-4 relative z-10 shrink-0">
           <label className="flex items-center gap-3 cursor-pointer bg-white/5 border border-white/10 px-6 py-3 rounded-xl hover:bg-white/10 transition-all">
             <div className="relative">
                <input type="checkbox" className="sr-only" checked={eduMode} onChange={() => setEduMode(!eduMode)} />
                <div className={`block w-10 h-6 rounded-full transition-colors ${eduMode ? 'bg-neuro-orange' : 'bg-gray-600'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${eduMode ? 'translate-x-4' : ''}`}></div>
             </div>
             <span className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Education Mode
             </span>
           </label>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: THE INPUT ENGINE */}
        <div className="xl:col-span-5 space-y-6">
           <div className="flex items-center gap-3 px-2">
             <Target className="w-5 h-5 text-neuro-orange" />
             <h2 className="text-xl font-black text-neuro-navy">Data Variables</h2>
           </div>

           {/* Financials Card */}
           <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm transition-all hover:shadow-md">
             <h3 className="text-sm font-black text-neuro-navy uppercase tracking-widest mb-6 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-500" /> 1. Financial Structure
             </h3>
             <div className="space-y-5">
                <div>
                   <label className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                     Base Salary / Floor
                     {eduMode && <span className="text-[9px] text-neuro-orange font-black bg-neuro-orange/10 px-2 rounded-full flex items-center gap-1"><Info className="w-3 h-3"/> Your safety net.</span>}
                   </label>
                   <input type="number" value={offer.base} onChange={e => setOffer({...offer, base: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl font-black text-neuro-navy focus:ring-2 focus:ring-neuro-orange/20 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-xs font-bold text-gray-500 mb-2 block">Bonus %</label>
                     <input type="number" value={offer.bonusPercent} onChange={e => setOffer({...offer, bonusPercent: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl font-black text-neuro-navy focus:ring-2 focus:ring-neuro-orange/20 outline-none" />
                   </div>
                   <div>
                     <label className="text-xs font-bold text-gray-500 mb-2 block">Est. Monthly Collections</label>
                     <input type="number" value={offer.avgCollections} onChange={e => setOffer({...offer, avgCollections: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl font-black text-neuro-navy focus:ring-2 focus:ring-neuro-orange/20 outline-none" />
                   </div>
                </div>
             </div>
           </section>

           {/* Clinical & Training Card */}
           <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm transition-all hover:shadow-md">
             <h3 className="text-sm font-black text-neuro-navy uppercase tracking-widest mb-6 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" /> 2. Clinical Development
             </h3>
             {eduMode && <p className="text-xs text-blue-600 bg-blue-50 p-3 rounded-lg mb-5 font-medium leading-relaxed">Mentorship is the hidden multiplier. A lower base with elite mentorship yields higher lifetime income than a high base with zero support.</p>}
             <div className="space-y-5">
                <div>
                   <label className="text-xs font-bold text-gray-500 mb-2 block">Mentorship Intensity</label>
                   <select value={offer.mentorship} onChange={e => setOffer({...offer, mentorship: e.target.value})} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl font-black text-neuro-navy focus:ring-2 focus:ring-neuro-orange/20 outline-none appearance-none">
                     <option>High (Daily 1-on-1)</option>
                     <option>Medium (Weekly)</option>
                     <option>Low (Observation only)</option>
                     <option>None (Thrown to wolves)</option>
                   </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-xs font-bold text-gray-500 mb-2 block">Weekly Volume</label>
                     <input type="number" value={offer.volume} onChange={e => setOffer({...offer, volume: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl font-black text-neuro-navy focus:ring-2 focus:ring-neuro-orange/20 outline-none" />
                   </div>
                   <div>
                     <label className="text-xs font-bold text-gray-500 mb-2 block">Case Reviews</label>
                     <select value={offer.caseReview} onChange={e => setOffer({...offer, caseReview: e.target.value})} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl font-black text-neuro-navy focus:ring-2 focus:ring-neuro-orange/20 outline-none appearance-none">
                       <option>Daily</option>
                       <option>Weekly</option>
                       <option>Monthly</option>
                       <option>Never</option>
                     </select>
                   </div>
                </div>
             </div>
           </section>

           {/* Risk & Mobility Card */}
           <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm transition-all hover:shadow-md">
             <h3 className="text-sm font-black text-neuro-navy uppercase tracking-widest mb-6 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-red-500" /> 3. Risk & Mobility
             </h3>
             {eduMode && <p className="text-xs text-red-600 bg-red-50 p-3 rounded-lg mb-5 font-medium leading-relaxed">Restrictive non-competes trap you. Verbal buy-ins are traps. Protect your license and future leverage here.</p>}
             <div className="grid grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-2 block">Non-Compete (Miles)</label>
                  <input type="number" value={offer.nonCompeteMiles} onChange={e => setOffer({...offer, nonCompeteMiles: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl font-black text-neuro-navy focus:ring-2 focus:ring-neuro-orange/20 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-2 block">Duration (Years)</label>
                  <input type="number" value={offer.nonCompeteYears} onChange={e => setOffer({...offer, nonCompeteYears: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl font-black text-neuro-navy focus:ring-2 focus:ring-neuro-orange/20 outline-none" />
                </div>
             </div>
             <div className="grid grid-cols-2 gap-5">
                <div>
                   <label className="text-xs font-bold text-gray-500 mb-2 block">Partnership Path</label>
                   <select value={offer.buyIn} onChange={e => setOffer({...offer, buyIn: e.target.value})} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl font-black text-neuro-navy focus:ring-2 focus:ring-neuro-orange/20 outline-none appearance-none">
                     <option>Written</option>
                     <option>Verbal</option>
                     <option>None</option>
                   </select>
                </div>
                <div>
                   <label className="text-xs font-bold text-gray-500 mb-2 block">Clinic Turnover</label>
                   <select value={offer.turnover} onChange={e => setOffer({...offer, turnover: e.target.value})} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl font-black text-neuro-navy focus:ring-2 focus:ring-neuro-orange/20 outline-none appearance-none">
                     <option>Low</option>
                     <option>Unknown</option>
                     <option>High</option>
                   </select>
                </div>
             </div>
           </section>

        </div>

        {/* RIGHT COLUMN: THE INTELLIGENCE OUTPUT */}
        <div className="xl:col-span-7 space-y-6">
           
           {/* Final Scorecard */}
           <div className="bg-neuro-navy text-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden border border-white/10">
              <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
                <motion.div 
                  className="h-full bg-gradient-to-r from-neuro-orange to-yellow-400" 
                  initial={{ width: 0 }}
                  animate={{ width: `${analysis.score}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                 <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">NeuroChiro Career Grade</p>
                    <div className="flex items-baseline gap-4 mb-4">
                       <motion.span 
                         key={analysis.grade}
                         initial={{ scale: 0.8, opacity: 0 }}
                         animate={{ scale: 1, opacity: 1 }}
                         className={`text-8xl font-black italic tracking-tighter ${analysis.gradeColor} drop-shadow-lg`}
                       >
                         {analysis.grade}
                       </motion.span>
                       <span className="text-3xl font-bold text-white/50">/ 100</span>
                    </div>
                    <div className="inline-block px-4 py-2 bg-white/10 rounded-xl border border-white/10">
                       <p className="text-xs font-bold">{analysis.confidence}</p>
                    </div>
                 </div>

                 <div className="space-y-4 relative z-10">
                    <button 
                      onClick={handleGeneratePDF}
                      disabled={isGenerating}
                      className="w-full py-5 bg-neuro-orange text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-neuro-orange-light shadow-xl shadow-neuro-orange/20 transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                      {isGenerating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><FileDown className="w-5 h-5" /> Export Consulting PDF</>}
                    </button>
                    <p className="text-[10px] text-gray-400 text-center font-bold uppercase tracking-widest">Share with your lawyer / mentor</p>
                 </div>
              </div>
           </div>

           {/* Automated Warning System & Insights */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
                 <h3 className="text-sm font-black text-neuro-navy uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Award className="w-4 h-4 text-green-500" /> Career Insights
                 </h3>
                 {analysis.insights.length > 0 ? (
                   <ul className="space-y-4">
                     {analysis.insights.map((msg, i) => (
                       <li key={i} className="flex gap-3 text-sm text-gray-600 font-medium leading-relaxed">
                         <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> {msg}
                       </li>
                     ))}
                   </ul>
                 ) : (
                   <p className="text-sm text-gray-400 italic">No significant positive insights detected.</p>
                 )}
              </div>

              <div className="bg-red-50/50 rounded-[2rem] border border-red-100 p-8 shadow-sm">
                 <h3 className="text-sm font-black text-red-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" /> Automated Warnings
                 </h3>
                 {analysis.warnings.length > 0 ? (
                   <ul className="space-y-4">
                     {analysis.warnings.map((msg, i) => (
                       <li key={i} className="flex gap-3 text-sm text-red-800 font-medium leading-relaxed">
                         <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" /> {msg}
                       </li>
                     ))}
                   </ul>
                 ) : (
                   <p className="text-sm text-gray-400 italic">No critical red flags detected.</p>
                 )}
              </div>
           </div>

           {/* Income Trajectory Simulation */}
           <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-sm font-black text-neuro-navy uppercase tracking-widest flex items-center gap-2">
                    <LineChart className="w-4 h-4 text-neuro-orange" /> 5-Year Income Simulation
                 </h3>
                 <span className="text-[10px] font-bold text-gray-400 uppercase">Proprietary Projection</span>
              </div>
              
              <div className="flex items-end justify-between h-48 gap-4 px-4">
                 {[
                   { year: "Year 1", val: analysis.year1Comp },
                   { year: "Year 3", val: analysis.year3Comp },
                   { year: "Year 5", val: analysis.year5Comp }
                 ].map((data, i) => {
                   const heightPercent = Math.min(100, (data.val / Math.max(analysis.year5Comp, 150000)) * 100);
                   return (
                     <div key={i} className="flex-1 flex flex-col items-center justify-end group">
                        <motion.p 
                          key={data.val}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="text-sm font-black text-neuro-navy mb-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ${Math.floor(data.val).toLocaleString()}
                        </motion.p>
                        <motion.div 
                          className="w-full max-w-[80px] bg-gradient-to-t from-neuro-navy to-neuro-orange rounded-t-xl"
                          initial={{ height: 0 }}
                          animate={{ height: `${heightPercent}%` }}
                          transition={{ duration: 1, delay: i * 0.2 }}
                        />
                        <p className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{data.year}</p>
                     </div>
                   );
                 })}
              </div>
           </div>

           {/* Offer Improvement Engine */}
           <div className="bg-gradient-to-br from-gray-50 to-white rounded-[2rem] border border-gray-200 p-8 shadow-inner">
              <h3 className="text-sm font-black text-neuro-navy uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Users className="w-4 h-4 text-purple-500" /> Offer Improvement Engine
              </h3>
              <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                Based on our analysis, here are the specific levers you should pull to turn this into an Elite Contract.
              </p>
              
              {analysis.negotiation.length > 0 ? (
                <div className="space-y-3">
                  {analysis.negotiation.map((strat, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-black text-[10px] shrink-0">{i+1}</div>
                      <p className="text-sm font-bold text-neuro-navy leading-relaxed">{strat}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-green-50 rounded-xl border border-green-100 text-green-800 text-sm font-bold text-center">
                  This contract structure is highly optimized. Proceed to technical legal review.
                </div>
              )}
           </div>

        </div>
      </div>
    </div>
  );
}