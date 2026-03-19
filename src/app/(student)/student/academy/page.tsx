"use client";

import { 
  GraduationCap, 
  Sparkles,
  Lock,
  ArrowLeft,
  Loader2,
  Rocket,
  ShieldCheck,
  Zap
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AcademyComingSoon() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-neuro-orange/5 blur-[120px] rounded-full -mr-40 -mt-40 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-neuro-navy/5 blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full text-center relative z-10"
      >
        <div className="w-24 h-24 bg-neuro-orange/10 rounded-[2.5rem] flex items-center justify-center text-neuro-orange mx-auto mb-10 shadow-inner">
          <Rocket className="w-12 h-12" />
        </div>

        <div className="space-y-6 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-neuro-navy text-white rounded-full mb-4">
            <Lock className="w-3 h-3 text-neuro-orange" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Deployment in Progress</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-heading font-black text-neuro-navy leading-tight tracking-tight">
            The Academy is <br/>
            <span className="text-neuro-orange text-glow-orange">Coming Soon.</span>
          </h1>
          
          <p className="text-gray-500 text-lg md:text-xl font-medium max-w-xl mx-auto leading-relaxed">
            We're putting the finishing touches on the world's most advanced clinical neurology learning library. Get ready for 100+ hours of proprietary protocols.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {[
            { icon: Zap, label: "Clinical Protocols", desc: "Step-by-step scans" },
            { icon: ShieldCheck, label: "Research Vault", desc: "Peer-reviewed data" },
            { icon: GraduationCap, label: "Certifications", desc: "Mastery badges" }
          ].map((item, i) => (
            <div key={i} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-3">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-neuro-navy mx-auto">
                <item.icon className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-neuro-navy uppercase tracking-tight">{item.label}</h4>
              <p className="text-[10px] text-gray-400 font-medium">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/student/dashboard"
            className="flex items-center gap-2 px-8 py-4 bg-neuro-navy text-white font-black rounded-2xl hover:bg-neuro-navy-light transition-all shadow-xl uppercase tracking-widest text-xs group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-100 rounded-2xl">
            <Loader2 className="w-4 h-4 text-neuro-orange animate-spin" />
            <span className="text-[10px] font-black text-neuro-navy uppercase tracking-widest italic">Syncing Curriculum Nodes...</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
