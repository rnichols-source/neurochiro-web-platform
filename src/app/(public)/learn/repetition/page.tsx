"use client";

import { motion } from "framer-motion";
import { Dumbbell, Languages, Heart, ArrowRight, Activity, Zap, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function RepetitionPage() {
  return (
    <div className="min-h-dvh bg-neuro-cream pb-32">
      {/* Hero Section */}
      <section className="bg-neuro-navy text-white pt-32 pb-24 px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neuro-orange/10 blur-[120px] rounded-full -mr-64 -mt-64"></div>
        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-6">
          <span className="text-neuro-orange font-black uppercase tracking-[0.4em] text-xs">Path 02: Consistency</span>
          <h1 className="text-5xl md:text-7xl font-heading font-black text-white">Why Repetition Matters</h1>
          <p className="text-gray-300 text-xl font-medium max-w-2xl mx-auto">
            Your nervous system doesn't change overnight. It adapts through consistent, intentional input.
          </p>
        </div>
      </section>

      {/* The Gym Analogy */}
      <section className="py-24 px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="relative">
           <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-gray-100 relative z-10 overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <Dumbbell className="w-32 h-32 text-neuro-navy" />
              </div>
              <h3 className="text-3xl font-black text-neuro-navy mb-6">The "Gym" Effect</h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                You wouldn't go to the gym once, look in the mirror, and expect a complete physical transformation. You understand that muscle growth and cardiovascular health require <strong>repetition</strong>.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed">
                Your nervous system is no different. An adjustment provides a specific input to your brain. Repetition of that input is what creates a lasting "memory" of regulation.
              </p>
           </div>
        </div>
        <div className="space-y-8">
          <div className="w-16 h-16 rounded-2xl bg-neuro-orange/10 flex items-center justify-center text-neuro-orange">
            <RefreshCw className="w-8 h-8" />
          </div>
          <h2 className="text-4xl md:text-5xl font-heading font-black text-neuro-navy">Neuroplasticity</h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            Neuroplasticity is the brain's ability to reorganize itself by forming new neural connections throughout life.
          </p>
          <div className="space-y-4">
             {[
               "Consistent input leads to permanent change.",
               "Repetition overrides old, stressful patterns.",
               "The nervous system 'learns' how to stay regulated."
             ].map((text, i) => (
               <div key={i} className="flex items-center gap-4 text-neuro-navy font-bold">
                  <div className="w-2 h-2 bg-neuro-orange rounded-full"></div>
                  {text}
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* Language Analogy */}
      <section className="py-24 bg-neuro-navy text-white px-8 overflow-hidden relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-neuro-orange/5 blur-[120px]"></div>
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-12">
           <Languages className="w-16 h-16 text-neuro-orange mx-auto mb-8" />
           <h2 className="text-4xl md:text-6xl font-heading font-black text-white">Learning a New Language</h2>
           <p className="text-gray-300 text-xl leading-relaxed max-w-3xl mx-auto">
             If you wanted to learn Italian, you wouldn't study for 8 hours one day and then never pick up a book again. You would practice for 30 minutes every day.
           </p>
           <p className="text-gray-300 text-xl leading-relaxed max-w-3xl mx-auto italic border-l-4 border-neuro-orange pl-8 text-left">
             "Chiropractic is the language of the nervous system. Consistent adjustments are the daily practice that allows your brain to become 'fluent' in regulation and healing."
           </p>
        </div>
      </section>

      {/* Care Plans */}
      <section className="py-24 px-8 max-w-5xl mx-auto text-center space-y-12">
         <h2 className="text-4xl md:text-5xl font-heading font-black text-neuro-navy leading-tight">Why Care Plans Exist</h2>
         <p className="text-gray-600 text-xl leading-relaxed">
           Based on your clinical scans and health history, your NeuroChiro doctor will recommend a specific frequency of care. This isn't random—it's a calculated strategy to ensure your nervous system receives enough input to create lasting, positive adaptation.
         </p>
         <div className="pt-12">
            <Link href="/learn/experience" className="px-12 py-6 bg-neuro-navy text-white font-black uppercase tracking-widest rounded-2xl hover:bg-neuro-navy-light shadow-2xl inline-flex items-center gap-3">
               Next: The Clinic Experience <ArrowRight className="w-5 h-5" />
            </Link>
         </div>
      </section>
    </div>
  );
}
