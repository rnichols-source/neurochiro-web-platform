"use client";

import { motion } from "framer-motion";
import { Zap, Brain, Activity, ArrowRight, ShieldCheck, Heart, Info } from "lucide-react";
import Link from "next/link";

export default function FoundationsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-neuro-navy text-white pt-32 pb-24 px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neuro-orange/10 blur-[120px] rounded-full -mr-64 -mt-64"></div>
        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-6">
          <span className="text-neuro-orange font-black uppercase tracking-[0.4em] text-xs">Path 01: Foundations</span>
          <h1 className="text-5xl md:text-7xl font-heading font-black">What is Nervous System Chiropractic?</h1>
          <p className="text-gray-300 text-xl font-medium max-w-2xl mx-auto">
            Forget everything you think you know about "cracking backs." Discover the clinical reality of regulation.
          </p>
        </div>
      </section>

      {/* The Master Controller */}
      <section className="py-24 px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <div className="w-16 h-16 rounded-2xl bg-neuro-orange/10 flex items-center justify-center text-neuro-orange">
            <Brain className="w-8 h-8" />
          </div>
          <h2 className="text-4xl md:text-5xl font-heading font-black text-neuro-navy">The Master Control System</h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            Your nervous system is the most important part of your body. It includes your brain, spinal cord, and all the nerves that reach out to every single cell, tissue, and organ.
          </p>
          <div className="p-6 bg-neuro-cream rounded-3xl border border-gray-100 italic text-neuro-navy font-medium">
            "If your brain can't communicate with your body, your body can't heal itself. It's that simple."
          </div>
          <p className="text-gray-600 text-lg leading-relaxed">
            NeuroChiro doctors focus on ensuring this communication is clear, regulated, and free from the interference caused by chronic stress and physical strain.
          </p>
        </div>
        <div className="relative">
           <div className="absolute inset-0 bg-neuro-orange/20 blur-[100px] rounded-full"></div>
           <div className="bg-neuro-navy rounded-[3rem] p-12 relative z-10 border border-white/10 shadow-2xl text-white text-center aspect-square flex flex-col justify-center">
              <Activity className="w-20 h-20 text-neuro-orange mx-auto mb-8 animate-pulse" />
              <h3 className="text-3xl font-black mb-4">Neural Harmony</h3>
              <p className="text-gray-400 max-w-xs mx-auto">When your nervous system is regulated, your heart, lungs, digestion, and immune system work in sync.</p>
           </div>
        </div>
      </section>

      {/* The 3 Components of Communication */}
      <section className="py-24 bg-neuro-cream px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-heading font-black text-neuro-navy">How it Works</h2>
            <p className="text-gray-500 max-w-xl mx-auto font-medium text-lg">Understanding the bridge between your brain and your biology.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                title: "Communication", 
                desc: "The brain sends signals down the spine to tell your organs how to function.", 
                icon: Zap,
                color: "text-blue-500"
              },
              { 
                title: "Feedback", 
                desc: "The body sends signals back to the brain to report on its status and environment.", 
                icon: Activity,
                color: "text-neuro-orange"
              },
              { 
                title: "Adaptation", 
                desc: "Your nervous system adjusts your physiology based on this constant loop.", 
                icon: ShieldCheck,
                color: "text-purple-500"
              }
            ].map((item, i) => (
              <div key={i} className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 group hover:-translate-y-2 transition-all">
                <div className={`w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mb-6 ${item.color} group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-neuro-navy mb-4">{item.title}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Role of Chiropractic */}
      <section className="py-24 px-8 max-w-5xl mx-auto text-center space-y-12">
         <h2 className="text-4xl md:text-5xl font-heading font-black text-neuro-navy leading-tight">Support, not Suppression.</h2>
         <p className="text-gray-600 text-xl leading-relaxed">
           Traditional healthcare often focuses on suppressing symptoms (turning off the fire alarm). 
           <strong> NeuroChiro focus on the fire.</strong>
         </p>
         <p className="text-gray-600 text-xl leading-relaxed">
           By specifically adjusting the spine, we influence the neural pathways that regulate your entire system. We don't just "move bones"; we support your body's innate ability to adapt to its environment.
         </p>
         <div className="pt-12">
            <Link href="/learn/repetition" className="px-12 py-6 bg-neuro-orange text-white font-black uppercase tracking-widest rounded-2xl hover:bg-neuro-orange-light shadow-2xl inline-flex items-center gap-3">
               Next: Why Repetition Matters <ArrowRight className="w-5 h-5" />
            </Link>
         </div>
      </section>
    </div>
  );
}
