"use client";

import { 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  Scale, 
  MessageSquare, 
  FileCheck,
  ArrowRight,
  Upload,
  PlayCircle,
  Briefcase,
  X,
  AlertTriangle,
  Lightbulb,
  Search,
  Sparkles,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  UserCheck,
  MapPin,
  Clock,
  DollarSign,
  Activity,
  Zap,
  Lock,
  LineChart,
  Download,
  Users,
  Target,
  Info,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getContractsAction, analyzeContractAction } from "./actions";

export default function ContractLabPage() {
  const [activeTab, setActiveTab] = useState("intelligence");
  const [isUploading, setIsUploading] = useState(false);
  const [contractText, setContractText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [pastContracts, setPastContracts] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await getContractsAction();
        setPastContracts(data);
      } catch (e) {
        console.error("Failed to load history:", e);
      } finally {
        setLoadingHistory(false);
      }
    }
    loadHistory();
  }, []);

  const handleAnalyzeContract = async () => {
    if (!contractText.trim() || contractText.trim().length < 100) {
      setAnalysisError("Please paste at least 100 characters of contract text.");
      return;
    }
    setIsUploading(true);
    setAnalysisError(null);
    try {
      const result = await analyzeContractAction(contractText);
      if (result.error) {
        setAnalysisError(result.error);
      } else if (result.analysis) {
        setAnalysisResult(result.analysis);
        // Refresh history
        const history = await getContractsAction();
        setPastContracts(history);
      }
    } catch (err: any) {
      setAnalysisError(err.message || "Analysis failed.");
    }
    setIsUploading(false);
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-12 relative bg-neuro-cream min-h-screen">
      
      {/* High-Value Hero Section */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 bg-neuro-navy p-10 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-neuro-orange/10 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="px-3 py-1 bg-neuro-orange text-white text-[10px] font-black uppercase tracking-widest rounded-md shadow-lg flex items-center gap-1">
              <Zap className="w-3 h-3" /> Elite Systems
            </div>
            <div className="px-3 py-1 bg-green-500/20 text-green-300 text-[10px] font-black uppercase tracking-widest rounded-md border border-green-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Career Protection Protocol
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-black text-white leading-tight">
            The Contract Lab
          </h1>
          <p className="text-gray-300 mt-6 text-lg md:text-xl leading-relaxed">
            Never sign blindly. This intelligence engine analyzes predatory clauses, simulates lifetime income, and arms you with the exact negotiation leverage needed to secure an elite associate contract.
          </p>
        </div>
      </header>

      {/* Main System Navigation */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden sticky top-4 z-50">
        <div className="flex overflow-x-auto hide-scrollbar">
          {[
            { id: "intelligence", label: "1. AI Contract Analyzer", icon: Search },
            { id: "comparison", label: "2. Offer Matrix", icon: Scale },
            { id: "risk", label: "3. Career Risk Audit", icon: AlertTriangle },
            { id: "simulator", label: "4. Income Simulator", icon: LineChart },
            { id: "library", label: "5. Template Vault", icon: FileCheck }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-8 py-6 text-xs font-black uppercase tracking-[0.1em] transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'text-neuro-orange bg-neuro-orange/5 border-b-4 border-neuro-orange' 
                  : 'text-gray-400 hover:text-neuro-navy hover:bg-gray-50 border-b-4 border-transparent'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[600px]">
        
        {/* SECTION 1: CONTRACT INTELLIGENCE ENGINE */}
        <AnimatePresence mode="wait">
          {activeTab === 'intelligence' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Uploader Column */}
                  <div className="lg:col-span-4 space-y-6">
                     <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col min-h-[400px]">
                        <h2 className="text-2xl font-black text-neuro-navy mb-2">Upload Contract</h2>
                        <p className="text-sm text-gray-500 mb-8">Upload your PDF or paste the text. Our system will decode the legal jargon into clinical reality.</p>
                        
                        {!analysisResult ? (
                          <div className="flex-1 flex flex-col gap-4">
                            <textarea
                              value={contractText}
                              onChange={(e) => setContractText(e.target.value)}
                              placeholder="Paste your employment contract text here..."
                              className="flex-1 p-4 border-2 border-gray-200 rounded-2xl resize-none focus:outline-neuro-orange focus:border-neuro-orange text-sm min-h-[200px]"
                            />
                            {analysisError && (
                              <p className="text-red-500 text-xs font-bold">{analysisError}</p>
                            )}
                            <button
                              onClick={handleAnalyzeContract}
                              disabled={isUploading || !contractText.trim()}
                              className="w-full py-4 bg-neuro-navy text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-neuro-navy/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {isUploading ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                  Analyzing with AI...
                                </>
                              ) : (
                                <>
                                  <ShieldAlert className="w-4 h-4" /> Analyze Contract
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 bg-green-50 border border-green-200 rounded-[2rem] flex flex-col items-center justify-center p-8 text-center">
                             <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                             <h3 className="font-black text-green-900 mb-2">Analysis Complete</h3>
                             <p className="text-xs text-green-700 font-medium">14 clauses decoded.</p>
                             <button onClick={() => setAnalysisResult(null)} className="mt-8 text-xs font-black uppercase tracking-widest text-neuro-navy hover:underline">Scan Another</button>
                          </div>
                        )}
                     </div>

                     {/* Past Analyses Sidebar */}
                     <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                        <h3 className="text-sm font-black text-neuro-navy uppercase tracking-widest mb-6 flex items-center gap-2">
                           <Clock className="w-4 h-4 text-neuro-orange" /> Previous Analyses
                        </h3>
                        
                        <div className="space-y-3">
                           {loadingHistory ? (
                              <div className="py-10 text-center">
                                 <Loader2 className="w-6 h-6 text-gray-200 animate-spin mx-auto mb-2" />
                                 <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Retrieving Vault...</p>
                              </div>
                           ) : pastContracts.length > 0 ? (
                              pastContracts.map((contract) => (
                                 <button 
                                    key={contract.id}
                                    onClick={() => setAnalysisResult(contract.analysis_results)}
                                    className="w-full text-left p-4 rounded-2xl border border-gray-50 hover:border-neuro-orange hover:bg-gray-50 transition-all group flex items-center justify-between"
                                 >
                                    <div className="min-w-0">
                                       <p className="text-xs font-bold text-neuro-navy truncate">{contract.title}</p>
                                       <p className="text-[10px] text-gray-400">{new Date(contract.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <span className="text-xs font-black text-orange-500 italic ml-4">
                                       {contract.analysis_results?.overallScore || contract.analysis_results?.overallGrade || 'N/A'}
                                    </span>
                                 </button>
                              ))
                           ) : (
                              <div className="py-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Your vault is empty</p>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Results Column */}
                  <div className="lg:col-span-8">
                     {analysisResult ? (
                        <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-gray-100">
                           <div className="flex items-center justify-between mb-8 pb-8 border-b border-gray-100">
                              <div>
                                <h2 className="text-3xl font-black text-neuro-navy mb-2">Intelligence Report</h2>
                                <p className="text-gray-500 font-medium">{analysisResult.summary}</p>
                              </div>
                              <div className="text-center shrink-0 ml-8">
                                <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Score</span>
                                <span className="text-5xl font-black text-orange-500 italic">{analysisResult.overallScore || analysisResult.overallGrade || 'N/A'}</span>
                                {analysisResult.overallRecommendation && (
                                  <span className={`block text-xs font-black uppercase tracking-widest mt-1 ${analysisResult.overallRecommendation === 'Accept' ? 'text-green-500' : analysisResult.overallRecommendation === 'Walk Away' ? 'text-red-500' : 'text-orange-500'}`}>{analysisResult.overallRecommendation}</span>
                                )}
                              </div>
                           </div>

                           <div className="space-y-6">
                              {(analysisResult.clauses || []).map((clause: any, i: number) => {
                                const risk = clause.risk || clause.status || 'Medium';
                                const isLow = risk === 'Low' || risk === 'safe';
                                const isHigh = risk === 'High' || risk === 'Critical' || risk === 'danger';
                                return (
                                <div key={i} className={`p-6 rounded-2xl border ${isLow ? 'bg-green-50/50 border-green-100' : isHigh ? 'bg-red-50/50 border-red-100' : 'bg-orange-50/50 border-orange-100'}`}>
                                   <div className="flex items-start gap-4">
                                      <div className="mt-1">
                                         {isLow && <ShieldCheck className="w-6 h-6 text-green-500" />}
                                         {!isLow && !isHigh && <AlertTriangle className="w-6 h-6 text-orange-500" />}
                                         {isHigh && <ShieldAlert className="w-6 h-6 text-red-500" />}
                                      </div>
                                      <div className="flex-1">
                                         <div className="flex items-center gap-2 mb-1">
                                           <h4 className="font-black text-neuro-navy uppercase tracking-widest text-xs">{clause.name || clause.type}</h4>
                                           <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${isLow ? 'bg-green-100 text-green-600' : isHigh ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>{risk}</span>
                                         </div>
                                         <p className="text-sm font-bold text-gray-800 mb-3">{clause.finding || clause.text}</p>

                                         <div className="space-y-3">
                                            {(clause.insight || clause.recommendation) && (
                                            <div className="flex gap-2">
                                              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                              <div>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Recommendation</span>
                                                <p className="text-sm text-gray-600 leading-relaxed">{clause.recommendation || clause.insight}</p>
                                              </div>
                                            </div>
                                            )}

                                            {clause.negotiation && (
                                              <div className="flex gap-2 mt-4 pt-4 border-t border-black/5">
                                                <MessageSquare className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                                                <div>
                                                  <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest block mb-0.5">Negotiation Strategy</span>
                                                  <p className="text-sm text-gray-800 font-medium leading-relaxed">{clause.negotiation}</p>
                                                </div>
                                              </div>
                                            )}
                                         </div>
                                      </div>
                                   </div>
                                </div>
                              );
                              })}
                           </div>
                        </div>
                     ) : (
                        <div className="bg-neuro-navy/5 rounded-[2.5rem] border border-dashed border-neuro-navy/20 h-full flex flex-col items-center justify-center p-12 text-center min-h-[500px]">
                           <Search className="w-16 h-16 text-gray-300 mb-6" />
                           <h3 className="text-2xl font-black text-gray-400 mb-2">Awaiting Contract Data</h3>
                           <p className="text-gray-500 max-w-md">Upload a document on the left to reveal hidden risks and generate an automated negotiation strategy.</p>
                        </div>
                     )}
                  </div>
               </div>
            </motion.div>
          )}

          {/* SECTION 2: OFFER COMPARISON MATRIX */}
          {activeTab === 'comparison' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
               <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100 overflow-x-auto">
                 <div className="flex items-center justify-between mb-8 min-w-[800px]">
                    <div>
                      <h2 className="text-3xl font-black text-neuro-navy mb-2">The Offer Matrix</h2>
                      <p className="text-gray-500">Compare the holistic value of opportunities, not just the salary.</p>
                    </div>
                    <button className="px-6 py-3 bg-neuro-navy text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-neuro-navy-light transition-all">Add Offer +</button>
                 </div>

                 <div className="min-w-[800px]">
                    <div className="grid grid-cols-4 gap-4 mb-4">
                       <div className="col-span-1"></div>
                       <div className="col-span-1 p-4 bg-gray-50 rounded-t-2xl border-b-4 border-blue-500 text-center">
                         <h4 className="font-black text-lg text-neuro-navy">Offer A (Volume Clinic)</h4>
                         <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-widest rounded-full mt-2">Score: B</span>
                       </div>
                       <div className="col-span-1 p-4 bg-gray-50 rounded-t-2xl border-b-4 border-green-500 text-center relative">
                         <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-neuro-orange text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md">Winner</div>
                         <h4 className="font-black text-lg text-neuro-navy">Offer B (Mentorship)</h4>
                         <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-[10px] font-black uppercase tracking-widest rounded-full mt-2">Score: A-</span>
                       </div>
                       <div className="col-span-1 p-4 bg-gray-50 border border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                         Empty Slot
                       </div>
                    </div>

                    <div className="space-y-2">
                       {[
                         { label: "Base Salary", a: "$85,000", b: "$70,000", winner: "a" },
                         { label: "Bonus Trigger", a: "Over $25k", b: "Over $15k", winner: "b" },
                         { label: "Non-Compete", a: "15 Miles (Danger)", b: "5 Miles (Safe)", winner: "b" },
                         { label: "Mentorship", a: "None written", b: "4 hrs / week", winner: "b" },
                         { label: "CE Allowance", a: "$0", b: "$3,000 / yr", winner: "b" },
                         { label: "Ownership Path", a: "Verbal", b: "Written 24-mo review", winner: "b" },
                       ].map((row, i) => (
                         <div key={i} className="grid grid-cols-4 gap-4 items-center p-4 hover:bg-gray-50 rounded-xl transition-colors">
                            <div className="col-span-1 text-xs font-black text-gray-400 uppercase tracking-widest">{row.label}</div>
                            <div className={`col-span-1 p-4 rounded-xl text-center font-bold text-sm ${row.winner === 'a' ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-white border border-gray-100 text-gray-600'}`}>{row.a}</div>
                            <div className={`col-span-1 p-4 rounded-xl text-center font-bold text-sm ${row.winner === 'b' ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-white border border-gray-100 text-gray-600'}`}>{row.b}</div>
                            <div className="col-span-1"></div>
                         </div>
                       ))}
                    </div>
                 </div>
               </div>
            </motion.div>
          )}

          {/* SECTION 3: CAREER RISK AUDIT */}
          {activeTab === 'risk' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
               <div className="bg-neuro-navy text-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 blur-[100px] rounded-full"></div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                     <div>
                        <h2 className="text-3xl font-black mb-4">Clinic Culture & Risk Audit</h2>
                        <p className="text-gray-300 leading-relaxed mb-8">
                           The contract is just paper. The daily environment is your reality. Answer these 5 questions based on your interview to determine if the clinic is a growth engine or a burnout trap.
                        </p>
                        
                        {riskScore === null ? (
                          <div className="space-y-6">
                            {[
                              "Did they show you the actual P&L or collection numbers, or just make verbal promises?",
                              "Did you meet the other associates/staff without the owner present?",
                              "Is their marketing system documented, or do they rely on you doing spinal screenings on weekends?",
                              "Do they have a specific, documented training manual for new doctors?",
                              "Has an associate ever successfully bought into this practice before?"
                            ].map((q, i) => (
                              <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                 <p className="text-sm font-bold mb-4">{i+1}. {q}</p>
                                 <div className="flex gap-2">
                                    <button className="flex-1 py-2 bg-green-500/20 text-green-400 font-bold rounded-lg text-xs border border-green-500/30 hover:bg-green-500/40 transition-all">YES</button>
                                    <button className="flex-1 py-2 bg-red-500/20 text-red-400 font-bold rounded-lg text-xs border border-red-500/30 hover:bg-red-500/40 transition-all">NO</button>
                                 </div>
                              </div>
                            ))}
                            <button onClick={() => setRiskScore(85)} className="w-full py-4 bg-neuro-orange text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg mt-4">Calculate Risk Rating</button>
                          </div>
                        ) : (
                          <div className="bg-white/10 border border-white/20 rounded-[2rem] p-8 text-center backdrop-blur-md">
                             <ShieldAlert className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                             <h3 className="text-2xl font-black mb-2">Moderate Risk (Score: {riskScore})</h3>
                             <p className="text-sm text-gray-300 leading-relaxed mb-6">
                               While the financial structure appears sound, the lack of documented training systems and opaque marketing strategy suggests you will be "figuring it out" on your own. Prepare for a steep, stressful learning curve.
                             </p>
                             <button onClick={() => setRiskScore(null)} className="text-xs font-black uppercase tracking-widest text-neuro-orange hover:underline">Retake Audit</button>
                          </div>
                        )}
                     </div>
                     <div className="bg-black/20 rounded-[2rem] p-8 border border-white/5">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">The 4 Levels of Clinic Risk</h4>
                        <div className="space-y-6">
                           <div>
                              <p className="text-green-400 font-bold text-sm mb-1 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Low Risk (Growth Engine)</p>
                              <p className="text-xs text-gray-400">Total transparency, structured training, fair non-compete. Rare.</p>
                           </div>
                           <div>
                              <p className="text-yellow-400 font-bold text-sm mb-1 flex items-center gap-2"><Lightbulb className="w-4 h-4"/> Moderate Risk</p>
                              <p className="text-xs text-gray-400">Good intentions, but lacks systems. You will have to manage up.</p>
                           </div>
                           <div>
                              <p className="text-orange-400 font-bold text-sm mb-1 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> High Risk (Volume Trap)</p>
                              <p className="text-xs text-gray-400">High quotas, high burnout, predatory non-compete. Avoid unless desperate.</p>
                           </div>
                           <div>
                              <p className="text-red-500 font-bold text-sm mb-1 flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> Predatory</p>
                              <p className="text-xs text-gray-400">1099 misclassification, illegal penalties, toxic culture. Run.</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

          {/* SECTION 4: INCOME SIMULATOR */}
          {activeTab === 'simulator' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
               <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100">
                  <div className="max-w-3xl mb-10">
                     <h2 className="text-3xl font-black text-neuro-navy mb-4">5-Year Lifetime Income Simulator</h2>
                     <p className="text-gray-500 text-lg leading-relaxed">
                        A $10,000 difference in base salary today is mathematically irrelevant compared to a 5% difference in your bonus tier in Year 3. Visualize the compounding math of your contract.
                     </p>
                  </div>

                  <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-200">
                     <div className="flex flex-col md:flex-row items-end justify-between h-64 gap-8 px-4 relative">
                        {/* Y-Axis Labels */}
                        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] font-black text-gray-400 py-4">
                           <span>$250k</span>
                           <span>$150k</span>
                           <span>$75k</span>
                        </div>
                        
                        <div className="w-full flex justify-around ml-8 h-full items-end">
                           {[
                             { year: "Year 1", o1: 75000, o2: 70000 },
                             { year: "Year 2", o1: 85000, o2: 95000 },
                             { year: "Year 3", o1: 95000, o2: 135000 },
                             { year: "Year 4", o1: 105000, o2: 180000 },
                             { year: "Year 5", o1: 110000, o2: 220000 }
                           ].map((data, i) => (
                             <div key={i} className="flex flex-col items-center justify-end group h-full w-16">
                                <div className="flex gap-2 items-end h-full">
                                   {/* Offer 1 Bar */}
                                   <motion.div 
                                     className="w-6 bg-gray-300 rounded-t-md relative"
                                     initial={{ height: 0 }}
                                     animate={{ height: `${(data.o1 / 250000) * 100}%` }}
                                     transition={{ duration: 1, delay: i * 0.1 }}
                                   >
                                     <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-black text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">${(data.o1/1000).toFixed(0)}k</span>
                                   </motion.div>
                                   {/* Offer 2 Bar */}
                                   <motion.div 
                                     className="w-6 bg-neuro-orange rounded-t-md relative"
                                     initial={{ height: 0 }}
                                     animate={{ height: `${(data.o2 / 250000) * 100}%` }}
                                     transition={{ duration: 1, delay: i * 0.1 }}
                                   >
                                     <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-black text-neuro-orange opacity-0 group-hover:opacity-100 transition-opacity">${(data.o2/1000).toFixed(0)}k</span>
                                   </motion.div>
                                </div>
                                <p className="mt-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">{data.year}</p>
                             </div>
                           ))}
                        </div>
                     </div>
                     
                     <div className="mt-12 flex flex-wrap justify-center gap-8">
                        <div className="flex items-center gap-3">
                           <div className="w-4 h-4 bg-gray-300 rounded-sm"></div>
                           <div>
                             <p className="text-xs font-bold text-neuro-navy">Offer A (High Base, No Mentorship)</p>
                             <p className="text-[10px] text-gray-500">Stalls out as skill plateaus.</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="w-4 h-4 bg-neuro-orange rounded-sm"></div>
                           <div>
                             <p className="text-xs font-bold text-neuro-navy">Offer B (Low Base, Elite Mentorship)</p>
                             <p className="text-[10px] text-gray-500">Compounds rapidly via skill acquisition.</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

          {/* SECTION 5: TEMPLATE VAULT */}
          {activeTab === 'library' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { title: "The 'Gold Standard' Associate Agreement", desc: "Fair base, scalable bonus, protected radius, and written mentorship clauses.", type: "W-2 Employee" },
                    { title: "The Written Buy-In Protocol", desc: "Addendum template defining exact valuation methods and timelines for future partnership.", type: "Equity Addendum" },
                    { title: "The Independent Space Rental", desc: "True 1099 contractor agreement. You pay rent, you own your patients, you control your schedule.", type: "1099 Contractor" }
                  ].map((doc, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full">
                       <div className="p-4 bg-gray-50 rounded-2xl w-fit mb-6 group-hover:bg-neuro-orange/10 transition-colors">
                          <FileText className="w-8 h-8 text-gray-400 group-hover:text-neuro-orange transition-colors" />
                       </div>
                       <span className="text-[9px] font-black uppercase tracking-widest text-neuro-orange mb-2 block">{doc.type}</span>
                       <h3 className="text-xl font-bold text-neuro-navy mb-3">{doc.title}</h3>
                       <p className="text-sm text-gray-500 mb-8 leading-relaxed flex-1">{doc.desc}</p>
                       <button className="flex items-center justify-center gap-2 w-full py-4 bg-gray-50 text-neuro-navy font-black text-xs uppercase tracking-widest rounded-xl hover:bg-neuro-navy hover:text-white transition-all">
                          <Download className="w-4 h-4" /> Download DOCX
                       </button>
                    </div>
                  ))}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}