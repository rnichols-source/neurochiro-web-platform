"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  Target, 
  BarChart3, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  Calendar, 
  MessageSquare, 
  Search, 
  Lock, 
  X,
  Plus,
  TrendingUp,
  Brain,
  ShieldCheck,
  Timer
} from "lucide-react";
import Link from "next/link";

const CouncilPage = () => {
  const [activeQuarter, setActiveQuarter] = useState(0);

  const roadmap = [
    {
      quarter: "Q1 — FOUNDATION (STABILITY)",
      months: [
        {
          name: "Month 1: Clinical Identity",
          focus: "Confidence + Certainty",
          implementation: "Developing the doctor's internal authority and removing clinical hesitation.",
          measure: "Certainty Score + Patient Commitment Rate"
        },
        {
          name: "Month 2: Communication Mastery",
          focus: "Explaining Care Clearly",
          implementation: "Simplifying complex neurology into patient-centered language that drives action.",
          measure: "Consultation-to-Exam Conversion"
        },
        {
          name: "Month 3: Care Plan Authority",
          focus: "Frequency Clarity",
          implementation: "Structuring care plans based on neuro-physiology rather than insurance or habit.",
          measure: "ROF Acceptance Rate"
        }
      ]
    },
    {
      quarter: "Q2 — SYSTEMS (CONTROL)",
      months: [
        {
          name: "Month 4: Patient Flow Systems",
          focus: "Day 1 → Day 3 Structure",
          implementation: "Hard-coding the first three visits to ensure maximum patient understanding and retention.",
          measure: "Day 3 Retention Percentage"
        },
        {
          name: "Month 5: Retention Architecture",
          focus: "Re-exams + Behavioral Patterns",
          implementation: "Installing a re-exam system that reconnects patients to their goals and progress.",
          measure: "PVA (Patient Visit Average) Growth"
        },
        {
          name: "Month 6: Team Alignment",
          focus: "Delegation + Communication",
          implementation: "Training staff to speak the language of the nervous system and own their roles.",
          measure: "Team Efficiency Score"
        }
      ]
    },
    {
      quarter: "Q3 — GROWTH (EXPANSION)",
      months: [
        {
          name: "Month 7: Marketing Clarity",
          focus: "Messaging + Positioning",
          implementation: "Defining your unique clinic identity in the local marketplace to attract 'ideal' patients.",
          measure: "New Patient Lead Quality"
        },
        {
          name: "Month 8: Conversion Optimization",
          focus: "Objection Handling",
          implementation: "Removing friction in the financial and clinical conversion process.",
          measure: "Care Plan Paid-in-Full Rate"
        },
        {
          name: "Month 9: Scaling Systems",
          focus: "Capacity + Efficiency",
          implementation: "Optimizing the physical and digital flow of the clinic to handle 20-50% more volume.",
          measure: "Collections per Hour"
        }
      ]
    },
    {
      quarter: "Q4 — ADVANCED (LEADERSHIP)",
      months: [
        {
          name: "Month 10: Culture + Leadership",
          focus: "Clinic Identity",
          implementation: "Transitioning from 'The Doctor' to 'The Leader' of a health movement.",
          measure: "Referral Rate (Internal)"
        },
        {
          name: "Month 11: Financial Clarity",
          focus: "KPIs + Decision Making",
          implementation: "Using hard data to make expansion, hiring, and investment decisions.",
          measure: "Profit Margin Stability"
        },
        {
          name: "Month 12: Business Architecture",
          focus: "Vision + Long-term Planning",
          implementation: "Designing the next 3-5 years of your practice and life legacy.",
          measure: "Net Worth / Business Value"
        }
      ]
    }
  ];

  const features = [
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "2x Monthly Live Calls",
      description: "Structured implementation reviews and deep-dive strategy sessions to keep you on track."
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Hot Seat Access",
      description: "Real-time problem solving for your specific clinical or business bottlenecks."
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Implementation Tracking",
      description: "Visual scorecards to measure exactly what systems are installed and what's missing."
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Private Community",
      description: "An elite environment of high-performers who are actually doing the work."
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: "Office/System Audits",
      description: "We look under the hood of your practice to identify friction points you've missed."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Real-time Feedback",
      description: "Get answers when you need them, not months later at a seminar."
    }
  ];

  const advancedFeatures = [
    {
      title: "The Implementation Score",
      description: "A proprietary assessment that tells you exactly where your practice is leaking revenue and impact."
    },
    {
      title: "Stuck Point Submission",
      description: "The 'bat-signal' for your business. Submit your biggest hurdle and get a framework to solve it within 48 hours."
    },
    {
      title: "Clinic Pulse Check",
      description: "A monthly deep-dive into your KPIs to ensure your nervous system and your business are both regulated."
    }
  ];

  return (
    <div className="bg-neuro-cream min-h-screen font-body text-neuro-navy selection:bg-neuro-orange selection:text-white">
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden bg-neuro-navy text-white">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-neuro-orange/20 blur-[120px] rounded-full -mr-64 -mt-64 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full -ml-32 -mb-32 opacity-30"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <span className="text-neuro-orange font-black uppercase tracking-[0.4em] text-xs mb-6 block">The Implementation Environment</span>
            <h1 className="text-6xl md:text-8xl font-heading font-black leading-[0.95] mb-8">
              Where Chiropractors Stop Guessing... <br />
              <span className="text-neuro-orange">And Start Executing.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 font-medium mb-12 leading-relaxed">
              The Mastermind gave you the knowledge. The Council gives you the <span className="text-white font-bold italic">results</span>. This is the elite ongoing coaching environment for high-performance chiropractors.
            </p>
            <div className="flex flex-wrap gap-6">
              <Link 
                href="#pricing" 
                className="px-12 py-6 bg-neuro-orange hover:bg-neuro-orange-light text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-2xl transition-all transform hover:scale-105 flex items-center gap-3"
              >
                Join the Council <ArrowRight className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3 px-8 py-6 border border-white/20 rounded-2xl backdrop-blur-sm bg-white/5">
                <Users className="w-5 h-5 text-neuro-orange" />
                <span className="text-xs font-black uppercase tracking-widest text-white/80">Limited Enrolment</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. THE PROBLEM SECTION */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl md:text-6xl font-heading font-black leading-tight">
                The "Post-Mastermind" <br />
                <span className="text-neuro-orange">Slump is Real.</span>
              </h2>
              <div className="space-y-6">
                {[
                  "You know what to do, but you don't do it consistently.",
                  "You lose momentum the moment you step back into your clinic.",
                  "Old habits and friction points keep dragging you down.",
                  "You feel isolated in your growth, with no one to call you out."
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <X className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
                    <p className="text-xl font-medium text-gray-600">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-neuro-cream p-12 rounded-[3rem] relative">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-neuro-orange rounded-full flex items-center justify-center text-white rotate-12 shadow-xl">
                <span className="font-black text-xs uppercase tracking-tighter text-center">Break The <br />Cycle</span>
              </div>
              <h3 className="text-2xl font-black mb-6">Most Doctors Fail at Implementation.</h3>
              <p className="text-gray-500 leading-relaxed mb-8 font-medium">
                Information without implementation is just entertainment. The Council was built to bridge the gap between "knowing" and "doing." We don't give you more notes; we give you a predictable rhythm of growth.
              </p>
              <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                   <div className="w-10 h-10 bg-neuro-navy rounded-lg flex items-center justify-center text-white">
                     <Timer className="w-5 h-5" />
                   </div>
                   <span className="font-bold">Consistency > Intensity</span>
                </div>
                <p className="text-sm text-gray-400">Seminars are intense. The Council is consistent. Guess which one builds a million-dollar practice?</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. WHAT THIS IS SECTION */}
      <section className="py-24 px-6 bg-neuro-cream">
        <div className="max-w-5xl mx-auto text-center mb-20">
          <span className="text-neuro-orange font-black uppercase tracking-[0.4em] text-[10px] mb-4 block">A Different Class of Support</span>
          <h2 className="text-5xl md:text-7xl font-heading font-black mb-8 leading-none">
            This is NOT a Membership. <br />
            It's an <span className="text-neuro-orange">Operating System.</span>
          </h2>
          <p className="text-xl text-gray-500 max-w-3xl mx-auto font-medium leading-relaxed">
            Forget passive content libraries. The Council is a structured coaching environment designed to install high-performance clinical and business patterns into your life.
          </p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {features.map((feature, i) => (
             <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                <div className="w-14 h-14 bg-neuro-cream rounded-2xl flex items-center justify-center text-neuro-orange mb-8 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h4 className="text-2xl font-black mb-4">{feature.title}</h4>
                <p className="text-gray-500 leading-relaxed font-medium">{feature.description}</p>
             </div>
           ))}
        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION */}
      <section className="py-24 px-6 bg-neuro-navy text-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-neuro-orange/20 blur-[100px] rounded-full"></div>
              <div className="relative z-10 space-y-8">
                <div className="inline-block px-4 py-2 bg-neuro-orange/10 border border-neuro-orange/30 rounded-xl">
                  <span className="text-neuro-orange text-[10px] font-black uppercase tracking-widest">The Coaching Rhythm</span>
                </div>
                <h2 className="text-5xl md:text-6xl font-heading font-black leading-[1.1]">
                  Predictable <br />
                  <span className="text-neuro-orange">Execution.</span>
                </h2>
                <div className="space-y-12 pt-8">
                  <div className="flex gap-8">
                    <div className="flex-shrink-0 w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-3xl font-black text-neuro-orange">A</div>
                    <div>
                      <h4 className="text-2xl font-black mb-3">Implementation Review</h4>
                      <p className="text-gray-400 font-medium">We audit the last 2 weeks. What got installed? What broke? Real case feedback and application wins.</p>
                    </div>
                  </div>
                  <div className="flex gap-8">
                    <div className="flex-shrink-0 w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-3xl font-black text-neuro-orange">B</div>
                    <div>
                      <h4 className="text-2xl font-black mb-3">Deep Coaching + Hot Seats</h4>
                      <p className="text-gray-400 font-medium">Pure problem solving. Strategy shifts. Mindset audits. We remove the specific friction blocking your next level.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6">
               {advancedFeatures.map((adv, i) => (
                 <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <h5 className="text-xl font-black text-neuro-orange">{adv.title}</h5>
                      <ShieldCheck className="w-5 h-5 text-gray-600" />
                    </div>
                    <p className="text-sm text-gray-400 font-medium leading-relaxed">{adv.description}</p>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. 12-MONTH ROADMAP SECTION */}
      <section className="py-24 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-neuro-orange font-black uppercase tracking-[0.4em] text-[10px] mb-4 block">The Full Year Vision</span>
            <h2 className="text-5xl md:text-7xl font-heading font-black mb-8 leading-none">
              A Year of <span className="text-neuro-orange">Transformed Authority.</span>
            </h2>
            <div className="flex flex-wrap justify-center gap-4 mt-12">
               {roadmap.map((q, i) => (
                 <button 
                  key={i}
                  onClick={() => setActiveQuarter(i)}
                  className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${activeQuarter === i ? 'bg-neuro-navy text-white shadow-xl' : 'bg-neuro-cream text-gray-400 hover:bg-gray-200'}`}
                 >
                   {q.quarter.split(' — ')[0]}
                 </button>
               ))}
            </div>
          </div>

          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeQuarter}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {roadmap[activeQuarter].months.map((month, i) => (
                  <div key={i} className="bg-neuro-cream rounded-[3rem] p-10 flex flex-col h-full border border-gray-100 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                       <span className="text-9xl font-black italic">{i + 1 + (activeQuarter * 3)}</span>
                    </div>
                    <div className="relative z-10 flex-grow">
                      <span className="text-neuro-orange font-black uppercase tracking-widest text-[10px] mb-4 block">{month.focus}</span>
                      <h4 className="text-2xl font-black mb-6 leading-tight">{month.name}</h4>
                      <div className="space-y-6">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Implementation</p>
                          <p className="text-sm text-gray-600 font-medium leading-relaxed">{month.implementation}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">KPI Focus</p>
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-neuro-orange/10 rounded-lg">
                            <TrendingUp className="w-3 h-3 text-neuro-orange" />
                            <span className="text-[10px] font-black text-neuro-orange uppercase tracking-widest">{month.measure}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* 6. WHO THIS IS FOR */}
      <section className="py-24 px-6 bg-neuro-cream">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
           <div className="bg-white p-16 rounded-[4rem] border border-gray-100 shadow-sm">
              <h3 className="text-3xl font-black mb-8 flex items-center gap-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
                This is FOR you if...
              </h3>
              <ul className="space-y-6">
                {[
                  "You've attended the Mastermind and want to ensure the systems actually stick.",
                  "You're tired of 'seminar highs' that fade after three days.",
                  "You value precision clinical work but struggle with the business systems to support it.",
                  "You want an elite circle of peers who won't let you play small."
                ].map((text, i) => (
                  <li key={i} className="flex gap-4 items-start text-lg font-medium text-gray-600">
                    <Plus className="w-5 h-5 text-neuro-orange mt-1 flex-shrink-0" /> {text}
                  </li>
                ))}
              </ul>
           </div>
           <div className="bg-neuro-navy p-16 rounded-[4rem] text-white">
              <h3 className="text-3xl font-black mb-8 flex items-center gap-4">
                <X className="w-8 h-8 text-red-500" />
                This is NOT for you if...
              </h3>
              <ul className="space-y-6">
                {[
                  "You're looking for a 'quick fix' or a magic bullet for your practice.",
                  "You aren't willing to track your data and look at the truth of your clinic.",
                  "You want a passive library to watch while you do nothing.",
                  "You have a 'good enough' mindset and aren't interested in elite performance."
                ].map((text, i) => (
                  <li key={i} className="flex gap-4 items-start text-lg font-medium text-gray-400">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-3 flex-shrink-0" /> {text}
                  </li>
                ))}
              </ul>
           </div>
        </div>
      </section>

      {/* 7. PRICING SECTION */}
      <section id="pricing" className="py-32 px-6 bg-white relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neuro-orange/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="text-neuro-orange font-black uppercase tracking-[0.4em] text-[10px] mb-6 block">Investment in Authority</span>
          <h2 className="text-6xl md:text-8xl font-heading font-black mb-12">
            The Council <br />
            <span className="text-neuro-orange">Experience.</span>
          </h2>
          
          <div className="bg-neuro-navy p-16 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-neuro-orange/10 blur-[60px] rounded-full -mr-32 -mt-32"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col items-center mb-12">
                <span className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-4">Monthly Recurring Subscription</span>
                <div className="flex items-start gap-1">
                  <span className="text-4xl font-black mt-4 text-neuro-orange">$</span>
                  <span className="text-9xl font-black leading-none tracking-tighter">197</span>
                  <span className="text-2xl font-bold text-gray-400 self-end mb-4">/mo</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left mb-16 max-w-2xl mx-auto">
                 {[
                   "2x Monthly Coaching Calls",
                   "Full 12-Month Roadmap",
                   "Hot Seat & Case Reviews",
                   "Implementation Scorecard",
                   "Elite Community Access",
                   "No Long-term Contracts"
                 ].map((feature, i) => (
                   <div key={i} className="flex gap-3 items-center">
                     <CheckCircle2 className="w-5 h-5 text-neuro-orange" />
                     <span className="font-bold text-gray-200">{feature}</span>
                   </div>
                 ))}
              </div>

              <div className="space-y-8">
                <Link 
                  href="/checkout/council" 
                  className="w-full inline-flex items-center justify-center gap-3 px-12 py-8 bg-neuro-orange hover:bg-neuro-orange-light text-white font-black uppercase tracking-[0.2em] text-lg rounded-3xl shadow-2xl transition-all transform hover:scale-105"
                >
                  Apply to Join the Council <Lock className="w-5 h-5" />
                </Link>
                <p className="text-gray-500 font-bold italic">
                  "This is less than the value of one new patient care plan... per year."
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 flex flex-col items-center gap-4">
             <div className="flex -space-x-4">
               {[1,2,3,4,5].map(i => (
                 <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
                   <img src={`https://i.pravatar.cc/150?u=${i + 10}`} alt="doctor" className="w-full h-full object-cover" />
                 </div>
               ))}
             </div>
             <p className="text-gray-500 font-bold text-sm">Join 120+ chiropractors implementing at an elite level.</p>
          </div>
        </div>
      </section>

      {/* 8. RESULTS SECTION */}
      <section className="py-24 px-6 bg-neuro-cream border-t border-gray-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
           <div>
             <h4 className="text-5xl font-black text-neuro-navy mb-2">42%</h4>
             <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Avg Revenue Growth in Year 1</p>
           </div>
           <div>
             <h4 className="text-5xl font-black text-neuro-navy mb-2">18+</h4>
             <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">PVA Increase (Network Avg)</p>
           </div>
           <div>
             <h4 className="text-5xl font-black text-neuro-navy mb-2">100%</h4>
             <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Certainty in Clinical Outcomes</p>
           </div>
        </div>
      </section>

      {/* 9. FOOTER CTA */}
      <section className="py-24 px-6 bg-neuro-orange text-white">
        <div className="max-w-5xl mx-auto text-center space-y-12">
           <h2 className="text-5xl md:text-7xl font-heading font-black leading-none">
             Ready to Stop Guessing?
           </h2>
           <p className="text-2xl font-medium text-white/90">
             Enrollment is open for the next cohort of Council members. Lock in your implementation rhythm today.
           </p>
           <Link 
             href="/checkout/council" 
             className="inline-flex items-center gap-3 px-16 py-8 bg-neuro-navy text-white font-black uppercase tracking-[0.2em] text-lg rounded-3xl shadow-2xl transition-all transform hover:scale-105"
           >
             Join The Council <ArrowRight className="w-6 h-6" />
           </Link>
        </div>
      </section>
    </div>
  );
};

export default CouncilPage;
