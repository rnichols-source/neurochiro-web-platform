"use client";

import { useState } from "react";
import { 
  Building2, 
  Globe, 
  Mail, 
  User, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Star,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function VendorApplyPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tiers = [
    { id: 'basic', name: 'Basic Listing', price: '$99', icon: Building2 },
    { id: 'pro', name: 'Professional', price: '$299', icon: Zap },
    { id: 'partner', name: 'Featured Partner', price: '$799', icon: Star }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep(3);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-neuro-cream pt-24 pb-20 overflow-x-hidden">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12 space-y-4">
           <span className="text-neuro-orange font-black uppercase tracking-[0.4em] text-[10px] block">Partnership</span>
           <h1 className="text-4xl md:text-5xl font-heading font-black text-neuro-navy">Join the Marketplace.</h1>
           <p className="text-gray-500">Connect your product with high-volume, nervous-system-first clinics.</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-12">
           {[1, 2, 3].map(i => (
             <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step === i ? 'bg-neuro-navy text-white shadow-xl scale-110' : step > i ? 'bg-green-500 text-white' : 'bg-white text-gray-300 border border-gray-100'}`}>
                {step > i ? <CheckCircle2 className="w-5 h-5" /> : i}
             </div>
           ))}
        </div>

        <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-gray-100 shadow-2xl relative overflow-hidden">
           <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.form 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">Company Name</label>
                         <input type="text" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-neuro-orange transition-all" placeholder="NeuralTech Inc." />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">Website</label>
                         <input type="url" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-neuro-orange transition-all" placeholder="https://..." />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">Primary Category</label>
                      <select className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-neuro-orange transition-all">
                         <option>Neurological Tech</option>
                         <option>Practice Management</option>
                         <option>Marketing</option>
                         <option>Consulting</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">How does your product serve Tonal Chiropractors?</label>
                      <textarea rows={4} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-neuro-orange transition-all resize-none" placeholder="Describe clinical alignment..."></textarea>
                   </div>
                   <button 
                     onClick={() => setStep(2)}
                     type="button"
                     className="w-full py-5 bg-neuro-navy text-white font-black uppercase tracking-widest rounded-2xl hover:bg-neuro-navy-light transition-all flex items-center justify-center gap-2 group"
                   >
                      Choose Your Tier <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                   </button>
                </motion.form>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                   <div className="grid grid-cols-1 gap-4">
                      {tiers.map(tier => (
                        <div key={tier.id} className="p-6 border-2 border-gray-50 bg-gray-50 rounded-3xl hover:border-neuro-orange transition-all cursor-pointer group flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                 <tier.icon className="w-6 h-6 text-neuro-navy group-hover:text-neuro-orange transition-colors" />
                              </div>
                              <div>
                                 <h4 className="font-bold text-neuro-navy">{tier.name}</h4>
                                 <p className="text-xs text-gray-400">Includes profile & one category</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-xl font-black text-neuro-navy">{tier.price}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase">Per Month</p>
                           </div>
                        </div>
                      ))}
                   </div>
                   <div className="flex gap-4">
                      <button onClick={() => setStep(1)} className="flex-1 py-5 bg-gray-100 text-gray-500 font-bold uppercase tracking-widest rounded-2xl hover:bg-gray-200 transition-all">Back</button>
                      <button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
                        className="flex-[2] py-5 bg-neuro-orange text-white font-black uppercase tracking-widest rounded-2xl hover:bg-neuro-orange-dark transition-all flex items-center justify-center gap-2 shadow-xl shadow-neuro-orange/20"
                      >
                         {isSubmitting ? "Processing..." : "Submit Application"}
                      </button>
                   </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12 space-y-6"
                >
                   <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
                      <ShieldCheck className="w-12 h-12 text-green-500" />
                   </div>
                   <h2 className="text-3xl font-heading font-black text-neuro-navy uppercase tracking-tight">Application Received</h2>
                   <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
                      Our clinical vetting team will review your application for philosophy alignment. Expect a response within 48 hours.
                   </p>
                   <Link href="/marketplace" className="inline-block px-10 py-5 bg-neuro-navy text-white font-black uppercase tracking-widest rounded-2xl hover:bg-neuro-navy-light transition-all shadow-xl">
                      Return to Marketplace
                   </Link>
                </motion.div>
              )}
           </AnimatePresence>
        </div>

        {/* Requirements Box */}
        <div className="mt-12 p-8 bg-neuro-navy rounded-[2.5rem] text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-neuro-orange/10 rounded-full blur-3xl"></div>
           <div className="relative z-10 flex items-start gap-6">
              <div className="p-3 bg-white/10 rounded-2xl">
                 <ShieldCheck className="w-6 h-6 text-neuro-orange" />
              </div>
              <div className="space-y-4">
                 <h4 className="font-heading font-black text-xl">Approval Standards</h4>
                 <p className="text-white/60 text-sm leading-relaxed">
                    NeuroChiro is a curated ecosystem. We only approve vendors that demonstrate a clear commitment to nervous-system-centered chiropractic care and clinical excellence.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
