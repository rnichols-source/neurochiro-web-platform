"use client";

import { motion } from "framer-motion";
import { Search, ClipboardList, Scan, FileText, Activity, ArrowRight, ShieldCheck, Heart } from "lucide-react";
import Link from "next/link";

export default function ExperiencePage() {
  const steps = [
    {
      title: "The Consultation",
      desc: "We start by listening. We want to understand your health history, your current stressors, and your goals for your nervous system.",
      icon: ClipboardList,
      color: "text-blue-500",
      bg: "bg-blue-50"
    },
    {
      title: "The Evaluation & Scans",
      desc: "We use state-of-the-art neuro-scanning technology to measure how your nervous system is currently functioning. No guesswork, just data.",
      icon: Scan,
      color: "text-neuro-orange",
      bg: "bg-orange-50"
    },
    {
      title: "Report of Findings",
      desc: "Your doctor will sit down with you to review your scans and explain exactly where the interference is and how we plan to address it.",
      icon: FileText,
      color: "text-purple-500",
      bg: "bg-purple-50"
    },
    {
      title: "The Adjustment",
      desc: "Specific, gentle adjustments designed to stimulate your nervous system and encourage regulation and healing.",
      icon: Activity,
      color: "text-green-500",
      bg: "bg-green-50"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-neuro-navy text-white pt-32 pb-24 px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neuro-orange/10 blur-[120px] rounded-full -mr-64 -mt-64"></div>
        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-6">
          <span className="text-neuro-orange font-black uppercase tracking-[0.4em] text-xs">Path 03: The Journey</span>
          <h1 className="text-5xl md:text-7xl font-heading font-black text-white">The Clinic Experience</h1>
          <p className="text-gray-300 text-xl font-medium max-w-2xl mx-auto">

            Step-by-step transparency. Here is exactly what to expect when you walk into a NeuroChiro clinic.
          </p>
        </div>
      </section>

      {/* The Journey Map */}
      <section className="py-24 px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative group">
               {i < steps.length - 1 && (
                 <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gray-100 -z-10"></div>
               )}
               <div className={`w-24 h-24 rounded-3xl ${step.bg} ${step.color} flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 transition-transform`}>
                  <step.icon className="w-10 h-10" />
               </div>
               <h3 className="text-2xl font-black text-neuro-navy mb-4">{step.title}</h3>
               <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Structured Care */}
      <section className="py-24 bg-neuro-cream px-8">
        <div className="max-w-5xl mx-auto bg-white rounded-[4rem] p-12 md:p-20 shadow-2xl border border-gray-100 flex flex-col items-center text-center space-y-12">
           <ShieldCheck className="w-16 h-16 text-neuro-orange" />
           <h2 className="text-4xl md:text-5xl font-heading font-black text-neuro-navy">Structured & Intentional</h2>
           <p className="text-gray-600 text-xl leading-relaxed">
             At NeuroChiro, we don't believe in "random adjustments." Every visit is part of a larger, data-driven care plan designed to track your progress and ensure your nervous system is actually improving over time.
           </p>
           <div className="flex flex-wrap justify-center gap-4">
              <div className="px-6 py-3 bg-gray-50 rounded-2xl text-neuro-navy font-bold text-sm">✓ Personalized Plans</div>
              <div className="px-6 py-3 bg-gray-50 rounded-2xl text-neuro-navy font-bold text-sm">✓ Data-Driven Progress</div>
              <div className="px-6 py-3 bg-gray-50 rounded-2xl text-neuro-navy font-bold text-sm">✓ Ongoing Evaluation</div>
           </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8 max-w-5xl mx-auto text-center space-y-12">
         <h2 className="text-4xl md:text-5xl font-heading font-black text-neuro-navy">Ready to start?</h2>
         <p className="text-gray-600 text-xl leading-relaxed">
           Education is the first step. Experience is the second. Find a doctor near you and begin your journey to clinical regulation.
         </p>
         <div className="pt-12 flex flex-wrap justify-center gap-6">
            <Link href="/directory" className="px-12 py-6 bg-neuro-orange text-white font-black uppercase tracking-widest rounded-2xl hover:bg-neuro-orange-light shadow-2xl inline-flex items-center gap-3">
               Find a Doctor <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/learn/faq" className="px-12 py-6 bg-neuro-navy text-white font-black uppercase tracking-widest rounded-2xl hover:bg-neuro-navy-light shadow-2xl inline-flex items-center gap-3">
               Read the FAQ <ArrowRight className="w-5 h-5" />
            </Link>
         </div>
      </section>
    </div>
  );
}
