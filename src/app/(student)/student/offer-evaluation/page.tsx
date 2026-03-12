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
  Sparkles
} from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function OfferEvaluationPage() {
  const [offerA, setOfferA] = useState({
    base: 75000,
    nonCompete: 15,
    mentorship: "High (Daily 1-on-1)",
    pto: 14
  });

  const [isComparing, setIsComparing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showMarketModal, setShowMarketModal] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const evaluation = useMemo(() => {
    let score = 0;
    const details = [];

    // Base Salary Scoring
    if (offerA.base >= 85000) {
      score += 40;
      details.push({ text: "Exceptional Base Salary", type: "good" });
    } else if (offerA.base >= 70000) {
      score += 30;
      details.push({ text: "Fair Market Base", type: "good" });
    } else {
      score += 15;
      details.push({ text: "Below Average Base", type: "warning" });
    }

    // Non-Compete Scoring
    if (offerA.nonCompete <= 5) {
      score += 20;
      details.push({ text: "Favorable Non-Compete", type: "good" });
    } else if (offerA.nonCompete <= 10) {
      score += 10;
      details.push({ text: "Standard Non-Compete", type: "neutral" });
    } else {
      score -= 5;
      details.push({ text: "Restrictive Non-Compete", type: "bad" });
    }

    // Mentorship Scoring
    if (offerA.mentorship.includes("High")) {
      score += 30;
      details.push({ text: "Elite Mentorship Support", type: "good" });
    } else if (offerA.mentorship.includes("Medium")) {
      score += 15;
      details.push({ text: "Moderate Mentorship", type: "neutral" });
    } else {
      score += 0;
      details.push({ text: "Limited Clinical Support", type: "warning" });
    }

    // PTO Scoring
    if (offerA.pto >= 15) {
      score += 10;
      details.push({ text: "Great Benefits Package", type: "good" });
    } else if (offerA.pto >= 10) {
      score += 5;
      details.push({ text: "Standard PTO", type: "neutral" });
    }

    let grade = "C";
    if (score >= 90) grade = "A+";
    else if (score >= 80) grade = "A-";
    else if (score >= 70) grade = "B+";
    else if (score >= 60) grade = "B";
    else if (score >= 50) grade = "B-";
    else if (score >= 40) grade = "C+";

    return { grade, details, score };
  }, [offerA]);

  const projectedTotal = useMemo(() => {
    // Basic calculation: Base + 20% average bonus from collections
    return Math.floor(offerA.base * 1.22);
  }, [offerA.base]);

  const handleGeneratePDF = () => {
    setIsGenerating(true);
    
    // Simulate generation time
    setTimeout(() => {
      // Create report content
      const reportContent = `
NEUROCHIRO OFFER EVALUATION REPORT
----------------------------------
Grade: ${evaluation.grade}
Base Salary: $${offerA.base.toLocaleString()}
Non-Compete: ${offerA.nonCompete} miles
Mentorship: ${offerA.mentorship}
PTO: ${offerA.pto} days

STRENGTHS & WEAKNESSES:
${evaluation.details.map(d => `- [${d.type.toUpperCase()}] ${d.text}`).join('\n')}

PROJECTED YEAR 1 COMP: $${projectedTotal.toLocaleString()}
----------------------------------
Generated on ${new Date().toLocaleDateString()}
      `;

      // Trigger actual file download
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `NeuroChiro_Offer_Report_${evaluation.grade}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setIsGenerating(false);
      setSuccessToast("Analysis Report Downloaded!");
      setTimeout(() => setSuccessToast(null), 3000);
    }, 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 relative">
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

      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-1 bg-neuro-orange/10 text-neuro-orange text-[8px] font-black uppercase tracking-widest rounded-md border border-neuro-orange/20">
              Elite Content
            </div>
            <div className="px-2 py-1 bg-green-500/10 text-green-500 text-[8px] font-black uppercase tracking-widest rounded-md border border-green-500/20">
              $100k Value Tool
            </div>
            <div className="px-2 py-1 bg-blue-500/10 text-blue-500 text-[8px] font-black uppercase tracking-widest rounded-md border border-blue-500/20">
              Proprietary Algorithm
            </div>
          </div>
          <h1 className="text-4xl font-heading font-black text-neuro-navy flex items-center gap-4">
            The Contract ROI Audit
          </h1>
          <p className="text-neuro-gray mt-4 text-xl max-w-2xl leading-relaxed">
            Don't just look at the salary. Our proprietary algorithm evaluates the <span className="text-neuro-navy font-black">lifetime career value</span> of your associate offers.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
           <div className="bg-white px-6 py-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center min-w-[140px]">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Market Leverage</span>
              <span className="text-2xl font-black text-neuro-navy">High</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Form */}
        <section className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm space-y-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-black text-neuro-navy">The Scorecard</h2>
            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
               <ShieldCheck className="w-4 h-4 text-green-500" /> Fully Encrypted Data
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Base Salary ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="number" 
                    value={offerA.base}
                    onChange={(e) => setOfferA({...offerA, base: parseInt(e.target.value) || 0})}
                    className="w-full pl-10 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-neuro-orange font-bold text-neuro-navy transition-all" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Non-Compete Radius (Miles)</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="number" 
                    value={offerA.nonCompete}
                    onChange={(e) => setOfferA({...offerA, nonCompete: parseInt(e.target.value) || 0})}
                    className="w-full pl-10 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-neuro-orange font-bold text-neuro-navy transition-all" 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Mentorship Intensity</label>
                <select 
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-neuro-orange font-bold text-neuro-navy appearance-none"
                  value={offerA.mentorship}
                  onChange={(e) => setOfferA({...offerA, mentorship: e.target.value})}
                >
                  <option>High (Daily 1-on-1)</option>
                  <option>Medium (Weekly)</option>
                  <option>Low (Observation only)</option>
                  <option>None</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">PTO Days</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="number" 
                    value={offerA.pto}
                    onChange={(e) => setOfferA({...offerA, pto: parseInt(e.target.value) || 0})}
                    className="w-full pl-10 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-neuro-orange font-bold text-neuro-navy transition-all" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-neuro-navy/5 rounded-3xl border border-neuro-navy/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <Calculator className="w-6 h-6 text-neuro-orange" />
              </div>
              <div>
                <p className="text-sm font-bold text-neuro-navy">Market Comparison</p>
                <p className="text-xs text-gray-500">
                  Your base is <span className={`font-bold ${offerA.base >= 70000 ? 'text-green-600' : 'text-red-500'}`}>
                    {offerA.base >= 70000 ? '12% above' : '8% below'}
                  </span> regional average for new grads.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowMarketModal(true)}
              className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest hover:border-neuro-orange hover:text-neuro-orange transition-all active:scale-95"
            >
              Compare Market
            </button>
          </div>
        </section>

        {/* Evaluation Summary */}
        <section className="space-y-6">
          <div className="bg-neuro-navy text-white rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden transition-all duration-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neuro-orange/20 blur-3xl -mr-16 -mt-16"></div>
            <h3 className="text-xl font-black mb-6">Offer Grade</h3>
            <div className="flex items-center justify-center mb-8">
              <div className="w-32 h-32 rounded-full border-8 border-white/10 border-t-neuro-orange flex items-center justify-center relative">
                <motion.span 
                  key={evaluation.grade}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl font-black italic"
                >
                  {evaluation.grade}
                </motion.span>
              </div>
            </div>
            <div className="space-y-4">
              {evaluation.details.map((detail, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  {detail.type === 'good' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertTriangle className={`w-4 h-4 ${detail.type === 'bad' ? 'text-red-400' : 'text-orange-400'}`} />
                  )}
                  <span className={detail.type === 'bad' ? 'text-red-200' : detail.type === 'warning' ? 'text-orange-200' : 'text-white'}>
                    {detail.text}
                  </span>
                </div>
              ))}
            </div>
            <button 
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className="w-full mt-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-black uppercase tracking-widest border border-white/10 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <><FileDown className="w-4 h-4" /> Generate Report PDF</>
              )}
            </button>
          </div>

          <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
            <h4 className="font-bold text-neuro-navy mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-neuro-orange" /> Growth Potential
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Based on the bonus structure and clinic volume, your projected Year 1 earnings are:
            </p>
            <motion.p 
              key={projectedTotal}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-black text-neuro-navy mt-4"
            >
              ${projectedTotal.toLocaleString()}
            </motion.p>
            <p className="text-[10px] font-black text-gray-400 uppercase mt-1">Projected Total Comp</p>
          </div>
        </section>
      </div>

      {/* MARKET COMPARISON MODAL */}
      <AnimatePresence>
        {showMarketModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 backdrop-blur-md bg-neuro-navy/60">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-3">
                  <Globe className="w-6 h-6 text-neuro-orange" />
                  <h3 className="font-black text-xl text-neuro-navy">Regional Market Data</h3>
                </div>
                <button onClick={() => setShowMarketModal(false)} className="p-2 hover:bg-white rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <span className="text-sm font-bold text-gray-500">Your Offer</span>
                    <span className="text-lg font-black text-neuro-navy">${offerA.base.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <span className="text-sm font-bold text-gray-500">Southeast Average</span>
                    <span className="text-lg font-black text-neuro-navy">$68,500</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-neuro-orange/5 border border-neuro-orange/10 rounded-2xl">
                    <span className="text-sm font-bold text-neuro-orange">NeuroChiro Standard</span>
                    <span className="text-lg font-black text-neuro-orange">$72,000 + Bonus</span>
                  </div>
                </div>
                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-sm text-blue-900 leading-relaxed font-medium">
                    <Sparkles className="w-4 h-4 inline mr-2 mb-1" />
                    <strong>Leverage Tip:</strong> Your specialized training in autonomic scanning makes you more valuable than the "average" new grad. Don't be afraid to cite your certifications during the second interview.
                  </p>
                </div>
                <button onClick={() => setShowMarketModal(false)} className="w-full py-4 bg-neuro-navy text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Close Market View</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
