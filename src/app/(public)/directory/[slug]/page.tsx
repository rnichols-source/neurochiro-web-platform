"use client";

import { MOCK_DOCTORS } from "@/lib/mock-data";
import { notFound, useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, 
  Globe, 
  Instagram, 
  Facebook, 
  ShieldCheck, 
  Briefcase, 
  Users, 
  Calendar,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  X,
  Zap
} from "lucide-react";
import Link from "next/link";
import { onReferralSentAction } from "@/app/actions/automations";
import Breadcrumbs from "@/components/layout/Breadcrumbs";

export default function DoctorProfile() {
  const { slug } = useParams();
  const router = useRouter();
  const doctor = MOCK_DOCTORS.find(d => d.slug === slug);
  const [modalState, setModalState] = useState<{isOpen: boolean, title: string, message: string}>({ isOpen: false, title: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);

  if (!doctor) {
    notFound();
  }

  const handleReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (doctor) {
        await onReferralSentAction(
          "current-user-id",
          "Dr. Referrer",
          doctor.id,
          doctor.email || "doctor@example.com",
          "555-0199",
          "Patient Name"
        );
      }
      setModalState({
        isOpen: true,
        title: "Referral Sent",
        message: `Your referral for ${doctor?.first_name} ${doctor?.last_name} has been processed successfully.`
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const breadcrumbs = [
    { label: "Directory", href: "/directory" },
    { label: doctor.clinic_name, href: `/directory/${doctor.slug}`, active: true }
  ];

  return (
    <div className="min-h-screen bg-neuro-cream pb-32">
      <div className="bg-neuro-navy pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background Orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-neuro-orange/10 blur-[120px] -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 blur-[120px] -ml-48 -mb-48"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-10">
            <Breadcrumbs items={breadcrumbs} light />
          </div>

          <div className="flex flex-col lg:flex-row gap-12 items-start text-white">
            {/* Avatar / Identity */}
            <div className="w-full lg:w-1/3">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-md rounded-[3rem] p-8 border border-white/10 shadow-2xl"
              >
                <div className="relative mb-8 group">
                  <div className="absolute inset-0 bg-neuro-orange blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                  <div className="w-48 h-48 rounded-[2.5rem] bg-neuro-navy border-4 border-neuro-orange/30 mx-auto flex items-center justify-center text-neuro-orange font-heading font-black text-7xl relative z-10">
                    {doctor.first_name[0]}{doctor.last_name[0]}
                  </div>
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-neuro-orange text-white px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Verified Doctor
                  </div>
                </div>

                <div className="text-center space-y-2 mb-8">
                  <h1 className="text-4xl font-heading font-black">{doctor.first_name} {doctor.last_name}</h1>
                  <p className="text-neuro-orange font-bold text-lg uppercase tracking-wider">{doctor.clinic_name}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <MapPin className="w-5 h-5 text-neuro-orange" />
                    <span className="text-sm font-medium">{doctor.city}, {doctor.state}</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <Globe className="w-5 h-5 text-neuro-orange" />
                    <span className="text-sm font-medium">Verified Website</span>
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button className="flex-1 py-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 border border-white/10">
                    <Instagram className="w-5 h-5" />
                  </button>
                  <button className="flex-1 py-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 border border-white/10">
                    <Facebook className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Profile Content */}
            <div className="w-full lg:w-2/3 space-y-10">
              <section className="bg-white/5 backdrop-blur-sm rounded-[3rem] p-10 border border-white/10 shadow-xl">
                <h3 className="text-2xl font-heading font-black mb-6 flex items-center gap-3">
                  <Zap className="w-6 h-6 text-neuro-orange fill-current" />
                  Clinical Excellence
                </h3>
                <p className="text-lg text-gray-300 leading-relaxed mb-8 italic">"{doctor.bio}"</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-500">Core Focus</h4>
                    <div className="flex flex-wrap gap-3">
                      {doctor.specialties.map((s, i) => (
                        <span key={i} className="px-4 py-2 bg-neuro-orange/10 border border-neuro-orange/20 text-neuro-orange rounded-xl text-xs font-black uppercase tracking-widest">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-500">Infrastructure</h4>
                    <div className="flex items-center gap-3 text-sm font-bold text-gray-300">
                      <CheckCircle2 className="w-5 h-5 text-neuro-orange" /> Nervous System Scanning Active
                    </div>
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-neuro-navy border-2 border-neuro-orange/30 rounded-[2.5rem] p-8 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-neuro-orange/5 blur-3xl group-hover:bg-neuro-orange/10 transition-all"></div>
                  <h4 className="text-xl font-black mb-2 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-neuro-orange" />
                    Book an Exam
                  </h4>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">Secure your clinical neuro-developmental assessment directly with the office.</p>
                  <button className="w-full py-4 bg-neuro-orange text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-neuro-orange-light transition-all shadow-lg shadow-neuro-orange/20">Check Availability</button>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 group">
                  <h4 className="text-xl font-black mb-2 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Refer a Patient
                  </h4>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">Secure HIPAA-compliant referral for nervous-system-first collaborative care.</p>
                  <button 
                    onClick={handleReferral}
                    disabled={isLoading}
                    className="w-full py-4 bg-white/10 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-white/20 transition-all border border-white/10 flex items-center justify-center gap-2"
                  >
                    {isLoading ? <span className="animate-pulse">Processing...</span> : "Send Secure Referral"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {modalState.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-neuro-navy/60">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl border border-gray-100 text-center"
            >
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-heading font-black text-neuro-navy mb-4">{modalState.title}</h3>
              <p className="text-gray-500 font-medium leading-relaxed mb-10">{modalState.message}</p>
              <button 
                onClick={() => setModalState({ ...modalState, isOpen: false })}
                className="w-full py-5 bg-neuro-navy text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-neuro-navy/20 active:scale-95 transition-all"
              >
                Continue Exploring
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
