"use client";

import { 
  MessageSquare, 
  Target, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight,
  ChevronRight,
  BookOpen,
  Mic,
  Lightbulb,
  X,
  Plus,
  Users,
  Star,
  Scale,
  Clock,
  FileText,
  AlertTriangle,
  Zap,
  Lock,
  LineChart,
  Briefcase,
  PlayCircle,
  Download,
  CheckSquare,
  TrendingUp
} from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function NegotiationGuidePage() {
  const [activeTab, setActiveTab] = useState("framework");
  const [simulatorStep, setSimulatorStep] = useState(0);
  const [calcBase1, setCalcBase1] = useState(70000);
  const [calcBase2, setCalcBase2] = useState(85000);
  const [isGenerating, setIsGenerating] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const scripts = [
    {
      category: "Compensation",
      title: "Negotiating Base Salary",
      useCase: "When the floor is below your minimum viable number.",
      script: "Thank you for the offer. I'm very excited about the clinical environment here. Based on my research of regional averages and my specialized training in neuro-scanning, I was hoping we could get closer to $X for the base floor to ensure my basic living expenses and loan minimums are covered without stress. How flexible is that number?",
      tone: "Collaborative, data-driven, respectful but firm.",
      pushback: "We start all new grads at $70k.",
      rebuttal: "I understand that's standard for general associates. Because I'm bringing immediate value with my scanning certifications, I believe I can ramp up collections faster. Could we look at an $80k floor that drops to $70k after 6 months once my volume is established?"
    },
    {
      category: "Growth",
      title: "Negotiating Mentorship Time",
      useCase: "When training is 'implied' but not scheduled.",
      script: "I value the fast-paced nature of this clinic. Because I want to handle high volume safely and effectively, I need to ensure my clinical skills are constantly refining. Can we explicitly add 2 hours of dedicated, 1-on-1 case review per week into my required schedule?",
      tone: "Eager to grow, focused on patient safety and clinic revenue.",
      pushback: "We do case reviews on the fly between patients.",
      rebuttal: "I appreciate the open-door policy. However, to ensure I don't disrupt your flow during busy hours, having a scheduled, uninterrupted 60-minute block on Friday mornings would allow us to review scans deeply. Would that work?"
    },
    {
      category: "Protection",
      title: "Reducing Non-Compete Radius",
      useCase: "When the radius forces you to move if you quit.",
      script: "I'm fully committed to building this practice and staying long-term. However, a 15-mile radius in this dense metropolitan area effectively restricts me from the entire city if unforeseen circumstances occur. Can we adjust this to a 5-mile radius, or restrict it to specific zip codes?",
      tone: "Committed but protective of personal life.",
      pushback: "Our lawyer says 15 miles is standard.",
      rebuttal: "I understand. I'm willing to agree to a strict non-solicitation clause for your patients and staff. I have no intention of taking your business, but I need to protect my ability to live and work in my current home. Can we drop the radius if the non-solicitation is ironclad?"
    },
    {
      category: "Future",
      title: "Asking for Buy-In Clarity",
      useCase: "When partnership is vaguely promised verbally.",
      script: "You mentioned there's a path to partnership here, which is the main reason I'm drawn to this offer. To ensure we're aligned long-term, could we add a clause that defines a formal equity review after my 24th month, based on specific, measurable performance milestones?",
      tone: "Visionary, serious, looking for commitment.",
      pushback: "We like to see how things go for a few years first.",
      rebuttal: "I respect that. I'm not asking for equity today. I'm asking to define the 'rules of the game.' If I hit $40k/month in collections and stay for 2 years, I want to know exactly what the buy-in conversation will look like. Can we outline those triggers?"
    },
    {
      category: "Compensation",
      title: "Negotiating Production Bonuses",
      useCase: "When the tier thresholds are too high to reach.",
      script: "I love the performance-based model. Looking at the tiers, the first bonus doesn't kick in until $30k in collections. Since I'll be building a patient base from scratch, could we implement a graduated tier system—perhaps 15% on everything over $15k for the first 6 months—so I'm incentivized while I build momentum?",
      tone: "Ambitious, strategic, realistic.",
      pushback: "The clinic isn't profitable on an associate until $30k.",
      rebuttal: "I understand the overhead. What if we tied a smaller bonus to specific leading indicators, like new patient conversions or care plan renewals, during those first 6 months?"
    }
  ];

  const simulatorScenarios = [
    {
      employer: "We usually start all our new grad associates at a flat $70,000 base with no bonus for the first year while you learn.",
      options: [
        { text: "Okay, that sounds fair since I'll be learning.", strength: "Weak", feedback: "Never accept the first offer immediately. You are giving up leverage and accepting a zero-upside year." },
        { text: "I need at least $85,000 or I can't accept.", strength: "Aggressive", feedback: "Too combative. You risk losing the offer entirely without exploring creative solutions." },
        { text: "I understand $70k is the baseline. Since I already have my pediatric and scanning certifications, could we add a 15% collection bonus once I cross $15k/month to incentivize my growth?", strength: "Elite", feedback: "Perfect. You validated their baseline, cited your unique value, and proposed a win-win performance structure." }
      ]
    },
    {
      employer: "Our non-compete is 20 miles for 3 years. It's standard, our lawyer makes us use it.",
      options: [
        { text: "I understand, I'm planning to stay forever anyway.", strength: "Weak", feedback: "Never sign a 20-mile/3-year non-compete. It is a massive career trap if the relationship sours." },
        { text: "I'm fully committed to this clinic, but 20 miles in this city is too broad. I'm happy to sign a strict non-solicitation, but could we reduce the radius to 5 miles?", strength: "Elite", feedback: "Excellent. You offered protection (non-solicitation) in exchange for freedom (radius reduction)." },
        { text: "I won't sign a non-compete.", strength: "Aggressive", feedback: "Unrealistic. Most owners require some protection. Negotiate the terms, don't demand total removal." }
      ]
    }
  ];

  const calcDiff5Year = (calcBase2 * 5) - (calcBase1 * 5);

  const handleGeneratePDF = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setSuccessToast("Negotiation Playbook Downloaded!");
      setIsGenerating(false);
      setTimeout(() => setSuccessToast(null), 3000);
    }, 1500);
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-12 relative bg-neuro-cream min-h-dvh">
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

      {/* High-Value Hero Section */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 bg-neuro-navy p-10 rounded-2xl text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="px-3 py-1 bg-neuro-orange text-white text-[10px] font-black uppercase tracking-widest rounded-md shadow-lg flex items-center gap-1">
              <Zap className="w-3 h-3" /> Elite Strategy
            </div>
            <div className="px-3 py-1 bg-green-500/20 text-green-300 text-[10px] font-black uppercase tracking-widest rounded-md border border-green-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> $100k Career Protection
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-black text-white leading-tight">
            The Negotiation Intelligence System
          </h1>
          <p className="text-gray-300 mt-6 text-lg md:text-xl leading-relaxed">
            The difference between a "Standard" contract and an "Elite" one is often <span className="text-neuro-orange font-bold">$100,000 in lifetime value</span> and years of freedom. Stop guessing. Use this system to decode contracts, predict employer reactions, and secure your future.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 relative z-10 shrink-0">
           <button 
             onClick={handleGeneratePDF}
             disabled={isGenerating}
             className="flex items-center justify-center gap-3 px-8 py-5 bg-neuro-orange text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-neuro-orange-light transition-all shadow-xl shadow-neuro-orange/20 active:scale-95"
           >
              {isGenerating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Download className="w-5 h-5" /> Download Playbook PDF</>}
           </button>
        </div>
      </header>

      {/* Main System Navigation */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-4 z-50">
        <div className="flex overflow-x-auto hide-scrollbar">
          {[
            { id: "framework", label: "1. The Framework", icon: Scale },
            { id: "intelligence", label: "2. Contract Intel", icon: FileText },
            { id: "scripts", label: "3. Live Scripts", icon: MessageSquare },
            { id: "simulator", label: "4. Simulator", icon: PlayCircle },
            { id: "strategy", label: "5. Career Strategy", icon: Target }
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
        {/* SECTION 1: THE FRAMEWORK */}
        <AnimatePresence mode="wait">
          {activeTab === 'framework' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
               <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100">
                  <h2 className="text-3xl font-black text-neuro-navy mb-4">The Core Principle</h2>
                  <div className="p-8 bg-neuro-navy text-white rounded-[2rem] shadow-xl italic text-2xl font-bold text-center border border-neuro-orange/20 relative overflow-hidden">
                     "We do not negotiate for money. We negotiate for career architecture."
                  </div>
                  <p className="mt-8 text-gray-600 text-lg leading-relaxed max-w-4xl">
                     Most students fight over $5,000 in base salary and lose $500,000 in equity, mentorship, and geographic freedom. The NeuroChiro framework teaches you to negotiate the **variables that compound over time**.
                  </p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 group hover:border-neuro-orange transition-all">
                     <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-neuro-orange transition-colors">
                        <Scale className="w-6 h-6 text-neuro-orange group-hover:text-white" />
                     </div>
                     <h3 className="text-xl font-black text-neuro-navy mb-3">The Leverage Triangle</h3>
                     <p className="text-gray-500 leading-relaxed mb-6">
                        You can only maximize two of the three primary contract variables. You must choose your priorities before you enter the room.
                     </p>
                     <ul className="space-y-4">
                        <li className="flex gap-3 text-sm font-bold text-neuro-navy"><CheckCircle2 className="w-5 h-5 text-green-500" /> High Base Salary</li>
                        <li className="flex gap-3 text-sm font-bold text-neuro-navy"><CheckCircle2 className="w-5 h-5 text-green-500" /> Elite 1-on-1 Mentorship</li>
                        <li className="flex gap-3 text-sm font-bold text-neuro-navy"><CheckCircle2 className="w-5 h-5 text-green-500" /> Geographic Freedom (Low Non-Compete)</li>
                     </ul>
                  </div>

                  <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 group hover:border-neuro-orange transition-all">
                     <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-500 transition-colors">
                        <TrendingUp className="w-6 h-6 text-blue-500 group-hover:text-white" />
                     </div>
                     <h3 className="text-xl font-black text-neuro-navy mb-3">The Mentorship Multiplier</h3>
                     <p className="text-gray-500 leading-relaxed mb-6">
                        A lower salary in Year 1 is acceptable ONLY if the clinical development allows you to out-produce the market in Year 3.
                     </p>
                     <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-sm font-bold text-red-500 mb-1">Bad Trade:</p>
                        <p className="text-xs text-gray-600 mb-4">$85k Base + Zero Mentorship (You stall at $85k)</p>
                        <p className="text-sm font-bold text-green-500 mb-1">Elite Trade:</p>
                        <p className="text-xs text-gray-600">$70k Base + 4hrs/week Mentorship (You reach $150k in Year 3)</p>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

          {/* SECTION 2: CONTRACT INTELLIGENCE */}
          {activeTab === 'intelligence' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
               <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100">
                 <h2 className="text-3xl font-black text-neuro-navy mb-6">Contract Decoder</h2>
                 <p className="text-gray-500 text-lg mb-8">Understand exactly what you are signing. Hover or click to reveal the truth behind standard clauses.</p>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[
                      { 
                        title: "The Non-Compete (Radius)", 
                        meaning: "The area you cannot practice in after leaving.",
                        good: "Under 5 miles in suburbs, under 2 miles in cities.",
                        bad: "10+ miles in a dense area.",
                        redFlag: "Radius that forces you to relocate your family."
                      },
                      { 
                        title: "Bonus Triggers (Thresholds)", 
                        meaning: "The collection amount you must hit before receiving a percentage.",
                        good: "Tied to your base salary (e.g., Base x 3).",
                        bad: "Arbitrary high numbers ($40k+) designed to prevent payouts.",
                        redFlag: "A 'Discretionary' bonus decided by the owner at year-end."
                      },
                      { 
                        title: "Non-Solicitation", 
                        meaning: "Agreement not to steal patients or staff.",
                        good: "Clear language protecting the owner's database.",
                        bad: "Vague language that prevents you from marketing generally in the city.",
                        redFlag: "Combined with a massive non-compete radius."
                      },
                      { 
                        title: "Mentorship Clauses", 
                        meaning: "The legal requirement for them to train you.",
                        good: "Defined weekly hours of 1-on-1 time.",
                        bad: "No mention of training in the contract.",
                        redFlag: "'Training provided as needed' (This means zero training)."
                      }
                    ].map((item, i) => (
                      <div key={i} className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                         <h4 className="font-black text-lg text-neuro-navy mb-2 flex items-center gap-2">
                           <FileText className="w-5 h-5 text-neuro-orange" /> {item.title}
                         </h4>
                         <p className="text-sm text-gray-600 mb-4 italic">{item.meaning}</p>
                         <div className="space-y-3">
                            <div className="flex gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                              <div><span className="text-xs font-bold text-gray-700 block uppercase tracking-widest">What Good Looks Like</span><span className="text-sm text-gray-600">{item.good}</span></div>
                            </div>
                            <div className="flex gap-2">
                              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                              <div><span className="text-xs font-bold text-gray-700 block uppercase tracking-widest">Red Flag</span><span className="text-sm text-gray-600">{item.redFlag}</span></div>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
               </div>
            </motion.div>
          )}

          {/* SECTION 3: LIVE SCRIPTS */}
          {activeTab === 'scripts' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 space-y-4">
                     <h2 className="text-3xl font-black text-neuro-navy mb-4">The Armory</h2>
                     <p className="text-gray-500 leading-relaxed mb-6">Never freeze on a phone call again. These conversational scripts are designed to maintain respect while ruthlessly protecting your value.</p>
                     
                     <div className="bg-neuro-navy p-6 rounded-3xl text-white">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-neuro-orange mb-4">Golden Rules of Delivery</h4>
                        <ul className="space-y-3 text-sm">
                           <li className="flex gap-2"><Clock className="w-4 h-4 text-gray-400" /> Use silence after asking. Let them talk.</li>
                           <li className="flex gap-2"><Users className="w-4 h-4 text-gray-400" /> Always frame your ask as a benefit to the clinic.</li>
                           <li className="flex gap-2"><ShieldCheck className="w-4 h-4 text-gray-400" /> Never make it an ultimatum unless you will walk.</li>
                        </ul>
                     </div>
                  </div>
                  
                  <div className="lg:col-span-2 space-y-6">
                     {scripts.map((s, i) => (
                       <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm group hover:shadow-md transition-all">
                          <div className="flex items-center justify-between mb-4">
                             <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest rounded-md">{s.category}</span>
                                <h3 className="text-xl font-bold text-neuro-navy">{s.title}</h3>
                             </div>
                          </div>
                          <p className="text-xs font-bold text-neuro-orange mb-4 uppercase tracking-widest">Situation: {s.useCase}</p>
                          
                          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 relative mb-4">
                             <Mic className="absolute top-4 right-4 w-5 h-5 text-gray-300" />
                             <p className="text-neuro-navy font-medium leading-relaxed italic text-lg">"{s.script}"</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
                             <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">They Might Say...</p>
                                <p className="text-sm text-gray-600 bg-red-50 p-3 rounded-lg border border-red-100">"{s.pushback}"</p>
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-neuro-orange uppercase tracking-widest mb-1">Your Rebuttal</p>
                                <p className="text-sm text-neuro-navy font-medium bg-green-50 p-3 rounded-lg border border-green-100">"{s.rebuttal}"</p>
                             </div>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </motion.div>
          )}

          {/* SECTION 4: SIMULATOR */}
          {activeTab === 'simulator' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
               <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100">
                 <div className="flex items-center justify-between mb-8">
                   <div>
                     <h2 className="text-3xl font-black text-neuro-navy mb-2">Live Negotiation Simulator</h2>
                     <p className="text-gray-500 text-lg">Test your reflexes. Choose the best response to common owner tactics.</p>
                   </div>
                   <div className="px-4 py-2 bg-neuro-navy text-white font-black text-xs uppercase tracking-widest rounded-xl">
                      Scenario {simulatorStep + 1} of {simulatorScenarios.length}
                   </div>
                 </div>

                 {simulatorStep < simulatorScenarios.length ? (
                   <div className="space-y-8">
                     <div className="bg-blue-50 p-8 rounded-[2rem] border border-blue-100 relative">
                        <Users className="absolute top-6 left-6 w-8 h-8 text-blue-200" />
                        <div className="pl-12">
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Clinic Owner</p>
                          <p className="text-2xl font-bold text-neuro-navy leading-relaxed">"{simulatorScenarios[simulatorStep].employer}"</p>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Choose your response:</p>
                        {simulatorScenarios[simulatorStep].options.map((opt, i) => (
                           <div key={i} className="group relative">
                              <button 
                                onClick={() => {
                                  alert(`Feedback: ${opt.feedback}`);
                                  if (opt.strength === "Elite" && simulatorStep < simulatorScenarios.length - 1) {
                                    setSimulatorStep(prev => prev + 1);
                                  } else if (opt.strength === "Elite") {
                                    alert("Simulation Complete! You are ready.");
                                    setSimulatorStep(0);
                                  }
                                }}
                                className="w-full text-left p-6 bg-white border border-gray-200 rounded-2xl hover:border-neuro-orange hover:shadow-md transition-all font-medium text-gray-700 focus:outline-none"
                              >
                                "{opt.text}"
                              </button>
                           </div>
                        ))}
                     </div>
                   </div>
                 ) : null}
               </div>
            </motion.div>
          )}

          {/* SECTION 5: CAREER STRATEGY TOOLKIT & CALCULATOR */}
          {activeTab === 'strategy' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Career Strategy Concepts */}
                  <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 space-y-8">
                     <h2 className="text-3xl font-black text-neuro-navy">The "Forever" Trap</h2>
                     <p className="text-gray-600 leading-relaxed text-lg">
                        90% of associates leave their first job within 18 months. Stop negotiating your first contract as if it's your final destination. 
                     </p>
                     
                     <div className="space-y-6">
                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
                           <h4 className="font-bold text-neuro-navy mb-2 flex items-center gap-2"><Target className="w-5 h-5 text-neuro-orange" /> Optimize for Skill, Not Cash</h4>
                           <p className="text-sm text-gray-500">Your first 2 years dictate your clinical confidence for the next 40. Taking a $90k job where you don't adjust and only do exams is a career death sentence. Take the $70k job where you adjust 150 patients a week.</p>
                        </div>
                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
                           <h4 className="font-bold text-neuro-navy mb-2 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-neuro-orange" /> The Value of "No"</h4>
                           <p className="text-sm text-gray-500">A bad contract costs more than being unemployed for 3 months. If the owner refuses to define mentorship or demands a 20-mile radius, they view you as a threat, not a partner. Walk away.</p>
                        </div>
                     </div>
                  </div>

                  {/* Career Value Calculator */}
                  <div className="bg-neuro-navy rounded-2xl p-10 shadow-2xl text-white relative overflow-hidden">
                     <h2 className="text-2xl font-black mb-2 relative z-10">The $100k Calculator</h2>
                     <p className="text-gray-400 text-sm mb-8 relative z-10">See how small negotiations compound over a 5-year associate period.</p>
                     
                     <div className="space-y-6 relative z-10">
                        <div>
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Offer A: Standard Base ($)</label>
                           <input type="number" value={calcBase1} onChange={e => setCalcBase1(Number(e.target.value))} className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-xl font-black text-white outline-none focus:border-neuro-orange" />
                        </div>
                        <div>
                           <label className="text-[10px] font-black uppercase tracking-widest text-neuro-orange block mb-2">Offer B: Negotiated Base ($)</label>
                           <input type="number" value={calcBase2} onChange={e => setCalcBase2(Number(e.target.value))} className="w-full bg-neuro-orange/20 border border-neuro-orange/50 rounded-xl p-4 text-xl font-black text-white outline-none focus:border-neuro-orange" />
                        </div>

                        <div className="pt-6 border-t border-white/10 mt-6">
                           <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-center mb-2">5-Year Lifetime Difference</p>
                           <p className="text-5xl font-black text-center text-green-400 drop-shadow-lg">+${calcDiff5Year.toLocaleString()}</p>
                           <p className="text-xs text-center text-gray-400 mt-4">This is the cash value of a 15-minute uncomfortable conversation.</p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Pre-Signing Checklist */}
               <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-8">
                     <h2 className="text-2xl font-black text-neuro-navy">Pre-Signing Checklist</h2>
                     <button className="text-xs font-black text-neuro-orange uppercase tracking-widest hover:underline flex items-center gap-1"><Download className="w-4 h-4"/> Get PDF</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {[
                       "Is the base salary guaranteed for year 1?",
                       "Is the bonus structure mathematically achievable?",
                       "Is the non-compete under 10 miles?",
                       "Are mentorship hours written into the schedule?",
                       "Is malpractice insurance covered?",
                       "Are continuing education (CE) costs covered?",
                       "Is there a 30-day 'without cause' exit clause?",
                       "Are patient split percentages defined post-termination?"
                     ].map((item, i) => (
                       <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <CheckSquare className="w-5 h-5 text-gray-300 shrink-0" />
                          <span className="text-sm font-bold text-neuro-navy">{item}</span>
                       </div>
                     ))}
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}