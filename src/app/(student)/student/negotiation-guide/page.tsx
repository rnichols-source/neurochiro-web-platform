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
  FileText
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function NegotiationGuidePage() {
  const [activeTab, setActiveTab] = useState("framework");

  const scripts = [
    {
      title: "The Counter Offer",
      useCase: "When the base salary is lower than your target.",
      script: "Thank you so much for the offer. I'm very excited about the clinical environment here. Based on my research of regional averages and my specialized training in neuro-scanning, I was hoping we could get closer to $X for the base floor. How flexible is that number?"
    },
    {
      title: "Asking for Buy-In Clarity",
      useCase: "When partnership is mentioned vaguely.",
      script: "You mentioned there's a path to partnership here, which is a major draw for me. To ensure we're aligned long-term, could we add a clause that defines a formal equity review after my 24th month, based on specific performance milestones?"
    },
    {
      title: "Reducing Non-Compete",
      useCase: "When the radius is too restrictive.",
      script: "I'm fully committed to building this practice. However, the 15-mile radius is quite broad and would impact my ability to stay in my current home if things ever changed. Can we look at adjusting that to a 5-mile radius, which is more standard for this zip code?"
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-1 bg-neuro-orange/10 text-neuro-orange text-[8px] font-black uppercase tracking-widest rounded-md border border-neuro-orange/20">
              Elite Content
            </div>
            <div className="px-2 py-1 bg-green-500/10 text-green-500 text-[8px] font-black uppercase tracking-widest rounded-md border border-green-500/20">
              $100k Value Resource
            </div>
          </div>
          <h1 className="text-5xl font-heading font-black text-neuro-navy flex items-center gap-4">
            The Negotiation Masterclass
          </h1>
          <p className="text-neuro-gray mt-4 text-xl max-w-2xl leading-relaxed">
            The difference between a "Standard" contract and an "Elite" one is often <span className="text-neuro-navy font-black">$100,000 in lifetime value</span>. Don't leave your future to chance.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
           <button className="flex items-center gap-3 px-8 py-4 bg-neuro-navy text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-neuro-navy-light transition-all shadow-xl shadow-neuro-navy/20">
              <FileText className="w-4 h-4 text-neuro-orange" /> Download PDF Playbook
           </button>
           <button className="flex items-center gap-3 px-8 py-4 bg-white border border-gray-100 text-neuro-navy font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-50 transition-all shadow-sm">
              <Star className="w-4 h-4 text-neuro-orange" /> Video Walkthrough
           </button>
        </div>
      </header>

      {/* The $100k Swing - Value Visualization */}
      <section className="bg-gradient-to-br from-neuro-navy to-[#1a2531] rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 w-96 h-96 bg-neuro-orange/10 blur-[120px] -mr-48 -mt-48"></div>
         <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            <div className="lg:col-span-2 space-y-4">
               <h2 className="text-3xl font-black italic">The "$100k Swing"</h2>
               <p className="text-gray-400 text-lg max-w-2xl">
                 A 1% difference in collections or a $1,000 monthly mentorship stipend seems small today. Over a 5-year associate term, that's the difference between a <span className="text-white font-bold">standard life</span> and a <span className="text-neuro-orange font-bold">legacy life</span>.
               </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
               <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Standard Offer</p>
                    <p className="text-2xl font-bold text-gray-400">$85,000 /yr</p>
                  </div>
                  <div className="h-px bg-white/10"></div>
                  <div>
                    <p className="text-[10px] font-black text-neuro-orange uppercase tracking-widest mb-1">Elite Negotiated Offer</p>
                    <p className="text-4xl font-black text-white">$105,000 <span className="text-xs text-green-500">+ Equity</span></p>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Strategy Tabs */}
      <section className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
        <div className="flex border-b border-gray-100">
          {["framework", "scripts", "tactics"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-6 text-xs font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab ? 'text-neuro-orange bg-neuro-orange/5 border-b-2 border-neuro-orange' : 'text-gray-400 hover:text-neuro-navy hover:bg-gray-50'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-10">
          {activeTab === 'framework' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h3 className="text-2xl font-black text-neuro-navy">The NeuroChiro Framework</h3>
                <p className="text-gray-500 leading-relaxed">
                  We don't negotiate for "more money." We negotiate for **Clinical Alignment**. When you ask for better terms, you must frame them as tools that allow you to serve patients better and stay at the clinic longer.
                </p>
                <div className="space-y-4 pt-4">
                  {[
                    { t: "Know Your Floor", d: "Never walk into a room without knowing the absolute minimum you need to live and pay your loans." },
                    { t: "The Mentorship Multiplier", d: "A $70k job with 5 hours of 1-on-1 mentorship is worth more than an $85k job with zero support." },
                    { t: "The Partnership Bridge", d: "Always negotiate for the 'Future You'. If you want to own, get the buy-in language in writing today." }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-neuro-orange/10 flex items-center justify-center shrink-0 mt-1">
                        <CheckCircle2 className="w-4 h-4 text-neuro-orange" />
                      </div>
                      <div>
                        <p className="font-bold text-neuro-navy">{item.t}</p>
                        <p className="text-sm text-gray-500">{item.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100">
                <h4 className="font-black text-xs uppercase tracking-widest text-gray-400 mb-6">The Power Balance</h4>
                <div className="space-y-6">
                  <div className="p-4 bg-white rounded-2xl shadow-sm">
                    <p className="text-xs font-bold text-neuro-navy mb-1">Clinic Needs:</p>
                    <p className="text-sm text-gray-500">Stability, clinical excellence, growth, and long-term commitment.</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl shadow-sm">
                    <p className="text-xs font-bold text-neuro-orange mb-1">You Need:</p>
                    <p className="text-sm text-gray-500">Fair pay, mentorship, reasonable boundaries, and a career path.</p>
                  </div>
                  <div className="pt-4 flex items-center justify-center">
                    <Scale className="w-12 h-12 text-gray-200" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scripts' && (
            <div className="space-y-6">
              {scripts.map((s, i) => (
                <div key={i} className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 group hover:border-neuro-orange transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xl font-bold text-neuro-navy">{s.title}</h4>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-gray-100">{s.useCase}</span>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 italic text-gray-600 leading-relaxed relative">
                    <Mic className="absolute top-4 right-4 w-4 h-4 text-gray-200" />
                    "{s.script}"
                  </div>
                  <button className="mt-6 text-xs font-black text-neuro-orange uppercase tracking-widest flex items-center gap-2 hover:underline">
                    Copy to Clipboard <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'tactics' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { t: "Silence is a Tool", d: "After stating your counter-offer, stop talking. Let them respond first. The first person to speak often loses leverage.", i: Clock },
                { t: "Get it in Writing", d: "If it's not in the final contract, it doesn't exist. Handshakes don't pay the bills or protect your license.", i: FileText },
                { t: "The 'Walk Away' Point", d: "If a clinic owner refuses to define mentorship or offers a predatory non-compete, they don't value your future. Walk away.", i: ShieldCheck }
              ].map((item, i) => (
                <div key={i} className="p-6 bg-white border border-gray-100 rounded-3xl hover:shadow-lg transition-all">
                  <div className="p-3 bg-gray-50 w-fit rounded-xl mb-4">
                    <item.i className="w-6 h-6 text-neuro-navy" />
                  </div>
                  <h4 className="font-bold text-neuro-navy mb-2">{item.t}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.d}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
