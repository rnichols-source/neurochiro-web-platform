"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Stethoscope, GraduationCap, Store, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

interface GetStartedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GetStartedModal({ isOpen, onClose }: GetStartedModalProps) {
  const funnels = [
    {
      title: "I need care",
      desc: "Find a nervous-system-first chiropractor near you.",
      icon: Heart,
      href: "/directory",
      color: "text-red-500",
      bg: "bg-red-50",
      cta: "Find a Doctor"
    },
    {
      title: "I am a Doctor",
      desc: "Join the elite network and scale your clinical impact.",
      icon: Stethoscope,
      href: "/pricing/doctors",
      color: "text-blue-600",
      bg: "bg-blue-50",
      cta: "Explore Tiers"
    },
    {
      title: "I am a Student",
      desc: "Access seminars, mentorship, and career opportunities.",
      icon: GraduationCap,
      href: "/pricing/students",
      color: "text-neuro-orange",
      bg: "bg-neuro-orange/10",
      cta: "Join Academy"
    },
    {
      title: "I am a Vendor",
      desc: "Offer exclusive deals to the world's best clinics.",
      icon: Store,
      href: "/marketplace",
      color: "text-purple-600",
      bg: "bg-purple-50",
      cta: "Partner with Us"
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[300] bg-neuro-navy/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[301] w-full max-w-4xl p-6"
          >
            <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden relative">
              <button 
                onClick={onClose}
                className="absolute top-8 right-8 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>

              <div className="p-12 md:p-16">
                <div className="text-center mb-12">
                  <span className="text-neuro-orange font-black uppercase tracking-[0.4em] text-[10px] block mb-4">Onboarding</span>
                  <h2 className="text-4xl font-heading font-black text-neuro-navy mb-4">How are you joining us?</h2>
                  <p className="text-gray-500 max-w-md mx-auto">Select your path to enter the NeuroChiro ecosystem.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {funnels.map((item, i) => (
                    <Link 
                      key={i} 
                      href={item.href}
                      onClick={onClose}
                      className="group flex items-start gap-6 p-8 rounded-[2.5rem] border border-gray-100 hover:border-neuro-orange/30 hover:shadow-xl hover:shadow-neuro-orange/5 transition-all bg-white relative overflow-hidden"
                    >
                      <div className={`w-14 h-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <item.icon className="w-7 h-7" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-neuro-navy flex items-center gap-2">
                          {item.title}
                          <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-neuro-orange" />
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                        <span className="inline-block pt-2 text-[10px] font-black uppercase tracking-widest text-neuro-orange">{item.cta}</span>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="mt-12 text-center">
                  <Link href="/login" onClick={onClose} className="text-sm font-bold text-gray-400 hover:text-neuro-navy transition-colors flex items-center justify-center gap-2">
                    Already have an account? <span className="text-neuro-orange">Log In</span>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
