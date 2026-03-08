"use client";

import Hero from "@/components/landing/Hero";
import BentoGrid from "@/components/landing/BentoGrid";
import FeatureSection from "@/components/landing/FeatureSection";
import SectionHeader from "@/components/landing/SectionHeader";
import IntentGateway from "@/components/landing/IntentGateway";
import NeuralPulse from "@/components/landing/NeuralPulse";
import CallToAction from "@/components/landing/CallToAction";
import Footer from "@/components/landing/Footer";
import Link from "next/link";
import { Zap, Activity, Brain as BrainIcon, BookOpen, Stethoscope } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-neuro-cream overflow-x-hidden">
      
      {/* 1. HERO - Movement introduction */}
      <Hero />

      {/* 2. INTENT GATEWAY - The Interactive Entry Point */}
      <IntentGateway />

      {/* 3. THE PROBLEM / MISSION - Text Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <SectionHeader 
            subtitle="The Mission"
            title="Chiropractic Needs an Evolution"
            description="For too long, the profession has been fragmented. Patients struggle to find specific care. Students feel lost in their career path. We built the NeuroChiro ecosystem to solve this."
          />
        </div>
      </section>

      {/* 3.5 NERVOUS SYSTEM EXPERIENCE - Immersive Promo */}
      <section className="py-24 px-6 bg-neuro-navy text-white relative overflow-hidden">
        {/* Visual Depth Background */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-neuro-orange/20 blur-[140px] -mr-64 -mt-64 rounded-full opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 blur-[120px] -ml-32 -mb-32 rounded-full opacity-30"></div>
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 relative z-10">
            <div className="relative">
              <span className="text-neuro-orange font-black uppercase tracking-[0.4em] text-[10px] mb-4 block drop-shadow-sm">Interactive Exhibit</span>
              <h2 className="text-5xl md:text-6xl font-heading font-black leading-[1.1] drop-shadow-2xl text-white">
                Explore Your <br />
                <span className="text-neuro-orange">Nervous System</span>
              </h2>

            </div>
            <p className="text-gray-200 text-lg md:text-xl leading-relaxed max-w-xl font-medium drop-shadow-md">
              Understand how your body processes stress, adapts to the environment, and how clinical regulation can transform your health. Launch our flagship interactive educational experience.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link 
                href="/nervous-system" 
                className="px-10 py-5 bg-neuro-orange hover:bg-neuro-orange-light text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-2xl shadow-neuro-orange/20 transition-all transform hover:scale-105 flex items-center gap-3"
              >
                Launch Experience <Zap className="w-4 h-4 fill-current" />
              </Link>
              <div className="flex items-center gap-2 text-white/60 text-[10px] font-black uppercase tracking-widest px-6 border border-white/20 rounded-2xl backdrop-blur-sm">
                <Activity className="w-4 h-4 text-green-400 animate-pulse" /> System Live
              </div>
            </div>
          </div>
          
          <div className="relative group cursor-pointer" onClick={() => window.location.href='/nervous-system'}>
            <div className="absolute inset-0 bg-gradient-to-tr from-neuro-orange/30 to-blue-500/10 rounded-[3rem] blur-2xl group-hover:blur-[100px] transition-all opacity-50"></div>
            <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 relative z-10 backdrop-blur-2xl aspect-square flex flex-col items-center justify-center text-center shadow-2xl group-hover:border-white/20 transition-all">
               <div className="w-32 h-32 bg-neuro-orange/30 rounded-full flex items-center justify-center mb-8 relative">
                  <div className="absolute inset-0 bg-neuro-orange/40 rounded-full animate-ping"></div>
                  <BrainIcon className="w-16 h-16 text-white relative z-10 drop-shadow-lg" />
               </div>
               <h3 className="text-3xl font-black mb-4 text-white">Neural Mapping v1.0</h3>
               <p className="text-gray-300 text-sm max-w-xs font-medium leading-relaxed">An interactive guide through the brain, spine, and autonomic regulation.</p>
               <div className="mt-10 flex gap-3">
                  {[1,2,3,4].map(i => <div key={i} className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-neuro-orange' : 'bg-white/20'}`}></div>)}
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PLATFORM ECOSYSTEM - Bento Grid */}
      <section className="bg-neuro-cream">
         <div className="pt-24 pb-12 px-6">
           <SectionHeader 
             subtitle="The Ecosystem"
             title="A Unified Platform"
             description="Everything you need to practice, learn, and grow in one place."
           />
         </div>
         <BentoGrid />
      </section>

      {/* 4. THE NEUROCHIRO MODEL - Feature 1 */}
      <div className="bg-white">
        <FeatureSection 
          subtitle="For Patients"
          title="Precision Care, Found Easily."
          description="Patients shouldn't have to guess. Our intelligent directory connects them with verified nervous-system focused doctors, complete with verified reviews and practice details."
          features={[
            "Verified Credentials",
            "Nervous System Focus",
            "Transparent Reviews",
            "Direct Booking"
          ]}
        />
      </div>

      {/* 5. STUDENT CAREER - Feature 2 */}
      <div className="bg-neuro-cream">
        <FeatureSection 
          subtitle="For Students"
          title="Your Career, Accelerated."
          description="Don't just graduate—launch. Connect with mentorship clinics, find preceptorships, and access our exclusive job board designed for neuro-focused practices."
          features={[
            "Mentorship Matching",
            "Exclusive Job Board",
            "Clinical Playbooks",
            "Global Community"
          ]}
          reversed
        />
      </div>

      {/* 6. PROOF - Living Pulse */}
      <NeuralPulse />

      {/* 6.5 EDUCATION HUB PREVIEW */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <span className="text-neuro-orange font-black uppercase tracking-[0.4em] text-[10px]">Pre-Educated Care</span>
              <h2 className="text-5xl md:text-6xl font-heading font-black text-neuro-navy leading-[1.1]">
                Understand Your <br />
                <span className="text-neuro-orange">Nervous System.</span>
              </h2>
              <p className="text-gray-500 text-lg md:text-xl leading-relaxed font-medium">
                We believe the best clinical outcomes start with education. Explore our curated library to understand why nervous system chiropractic is the future of healthcare.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/learn" className="px-10 py-5 bg-neuro-navy text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-xl hover:bg-neuro-navy-light transition-all flex items-center justify-center gap-2">
                  Explore Education Hub <BookOpen className="w-4 h-4" />
                </Link>
                <Link href="/learn/faq" className="px-10 py-5 bg-neuro-cream text-neuro-navy font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
                  View Common FAQs
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               {[
                 { title: "Foundations", desc: "What is NeuroChiro?", icon: Zap, link: "/learn/foundations" },
                 { title: "Consistency", desc: "Why Repetition?", icon: Activity, link: "/learn/repetition" },
                 { title: "Experience", desc: "What to Expect?", icon: Stethoscope, link: "/learn/experience" },
                 { title: "The FAQ", desc: "Common Answers", icon: BrainIcon, link: "/learn/faq" }
               ].map((card, i) => (
                 <Link key={i} href={card.link} className="p-8 bg-neuro-cream rounded-[2.5rem] hover:bg-neuro-orange/10 transition-all group">
                    <card.icon className="w-8 h-8 text-neuro-orange mb-4 group-hover:scale-110 transition-transform" />
                    <h4 className="font-bold text-neuro-navy mb-1">{card.title}</h4>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{card.desc}</p>
                 </Link>
               ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. CALL TO ACTION */}
      <CallToAction />

      {/* 8. FOOTER */}
      <Footer />
    </div>
  );
}
