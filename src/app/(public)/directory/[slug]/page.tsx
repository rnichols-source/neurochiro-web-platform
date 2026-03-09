"use client";

import { MOCK_DOCTORS } from "@/lib/mock-data";
import { notFound, useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "",
    message: ""
  });
  
  // Normalize a slug for comparison: remove leading 'dr' if it's a prefix, lowercase, and remove non-alphanumeric
  const normalize = (s: string) => s?.toLowerCase()?.replace(/^dr(\.|\-|\s+|$)/, '')?.replace(/[^a-z0-9]/g, '') || '';
  
  const targetSlug = normalize(slug);
  
  // Attempt to find doctor in MOCK_DOCTORS
  const doctor = MOCK_DOCTORS.find(d => {
    const mockSlug = normalize(d.slug);
    const nameSlug = normalize(`${d.first_name}-${d.last_name}`);
    return mockSlug === targetSlug || nameSlug === targetSlug || d.id === slug;
  });

  // Debug logging for the user to see in their console
  useEffect(() => {
    console.log("🔍 Doctor Profile Lookup:", {
      requestedSlug: slug,
      normalizedTarget: targetSlug,
      found: !!doctor,
      doctorId: doctor?.id
    });
  }, [slug, targetSlug, doctor]);

  if (!doctor) {
    console.error("❌ Doctor not found for slug:", slug);
    return (
      <div className="min-h-screen bg-neuro-cream flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-black text-neuro-navy mb-4">PROFILE NOT FOUND</h1>
        <p className="text-gray-500 mb-8">We couldn't find a doctor profile matching "{slug}".</p>
        <Link href="/directory" className="px-8 py-4 bg-neuro-navy text-white rounded-2xl font-black uppercase tracking-widest text-xs">
          Return to Directory
        </Link>
      </div>
    );
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
        message: `Your referral for ${doctor?.first_name} ${doctor?.last_name} has been processed successfully and sent to their clinic.`
      });
    } catch (err) {
      console.error(err);
      setModalState({
        isOpen: true,
        title: "Error",
        message: "There was an issue processing your referral. Please try again later."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBooking = () => {
    // In a real app, this might open a Calendly modal or redirect to a booking URL
    if (doctor.website_url) {
      window.open(doctor.website_url, '_blank', 'noopener,noreferrer');
    } else {
      setModalState({
        isOpen: true,
        title: "Booking Information",
        message: `Please contact ${doctor.clinic_name} directly at their office to schedule your appointment.`
      });
    }
  };

  return (
    <div className="min-h-screen bg-neuro-cream pb-32">
      <div className="bg-neuro-navy pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background Orbs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neuro-orange/10 blur-[120px] -mr-64 -mt-64"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] -ml-64 -mb-64"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-10">
            <Breadcrumbs light />
          </div>

          <div className="flex flex-col lg:flex-row gap-12 items-start text-white">
            {/* Avatar / Identity */}
            <div className="w-full lg:w-1/3 sticky top-32">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-md rounded-[3rem] p-8 border border-white/10 shadow-2xl relative"
              >
                <div className="relative mb-12 group">
                  <div className="absolute inset-0 bg-neuro-orange blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                  <div className="w-48 h-48 rounded-[2.5rem] bg-neuro-navy border-4 border-neuro-orange/30 mx-auto flex items-center justify-center text-neuro-orange font-heading font-black text-7xl relative z-10 shadow-2xl shadow-black/20">
                    {doctor.first_name[0]}{doctor.last_name[0]}
                  </div>
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-neuro-orange text-white px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-xl flex items-center gap-2 z-20 whitespace-nowrap border-2 border-neuro-navy/50">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Doctor
                  </div>
                </div>

                <div className="text-center space-y-3 mb-10">
                  <h1 className="text-4xl font-heading font-black leading-tight">{doctor.first_name} {doctor.last_name}</h1>
                  <p className="text-neuro-orange font-black text-sm uppercase tracking-[0.15em] opacity-90">{doctor.clinic_name}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 group hover:bg-white/10 transition-colors">
                    <div className="p-2 bg-neuro-orange/20 rounded-lg text-neuro-orange">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-slate-200">{doctor.city}, {doctor.state}</span>
                  </div>
                  <Link 
                    href={doctor.website_url || "#"} 
                    target="_blank"
                    className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 group hover:bg-white/10 transition-all"
                  >
                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 group-hover:scale-110 transition-transform">
                      <Globe className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-slate-200">Visit Official Website</span>
                  </Link>
                </div>

                <div className="flex gap-4 mt-10">
                  <Link 
                    href={doctor.instagram_url || "https://instagram.com"} 
                    target="_blank"
                    aria-label="Follow on Instagram"
                    className="flex-1 py-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 border border-white/10 hover:border-white/30 hover:scale-[1.02] active:scale-95"
                  >
                    <Instagram className="w-5 h-5" />
                  </Link>
                  <Link 
                    href={doctor.facebook_url || "https://facebook.com"} 
                    target="_blank"
                    aria-label="Follow on Facebook"
                    className="flex-1 py-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 border border-white/10 hover:border-white/30 hover:scale-[1.02] active:scale-95"
                  >
                    <Facebook className="w-5 h-5" />
                  </Link>
                </div>
              </motion.div>
            </div>

            {/* Profile Content */}
            <div className="w-full lg:w-2/3 space-y-10">
              <section className="bg-white/5 backdrop-blur-sm rounded-[3rem] p-10 border border-white/10 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-neuro-orange/5 blur-[80px] -mr-32 -mt-32 transition-all group-hover:bg-neuro-orange/10"></div>
                
                <h3 className="text-2xl font-heading font-black mb-8 flex items-center gap-4">
                  <div className="p-3 bg-neuro-orange rounded-2xl shadow-lg shadow-neuro-orange/20">
                    <Zap className="w-6 h-6 text-white fill-current" />
                  </div>
                  Clinical Excellence
                </h3>
                
                <p className="text-xl text-slate-200 leading-relaxed mb-10 font-medium italic opacity-90 border-l-4 border-neuro-orange/30 pl-8">
                  "{doctor.bio}"
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-5">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Core Focus Areas</h4>
                    <div className="flex flex-wrap gap-3">
                      {doctor.specialties.map((s, i) => (
                        <span key={i} className="px-5 py-2.5 bg-neuro-orange/10 border border-neuro-orange/20 text-neuro-orange rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-neuro-orange/20 transition-colors">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-5">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Clinic Infrastructure</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm font-black text-slate-200 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" /> 
                        Nervous System Scanning Active
                      </div>
                      <div className="flex items-center gap-3 text-sm font-black text-slate-200 bg-white/5 p-4 rounded-2xl border border-white/5 opacity-60">
                        <ShieldCheck className="w-5 h-5 text-blue-400" /> 
                        HIPAA Compliant Practice
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-neuro-navy border-2 border-neuro-orange/30 rounded-[2.5rem] p-10 relative group overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-neuro-orange/10 blur-3xl group-hover:bg-neuro-orange/20 transition-all duration-500"></div>
                  <h4 className="text-2xl font-black mb-4 flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-neuro-orange" />
                    Book an Exam
                  </h4>
                  <p className="text-slate-400 text-sm mb-8 leading-relaxed font-medium">Secure your clinical neuro-developmental assessment directly with the office.</p>
                  <button 
                    onClick={handleBooking}
                    className="w-full py-5 bg-neuro-orange text-white rounded-2xl font-black uppercase tracking-[0.15em] text-xs hover:bg-neuro-orange-light transition-all shadow-xl shadow-neuro-orange/20 hover:scale-[1.02] active:scale-95"
                  >
                    Check Availability
                  </button>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 blur-3xl group-hover:bg-blue-500/10 transition-all duration-500"></div>
                  <h4 className="text-2xl font-black mb-4 flex items-center gap-3">
                    <Users className="w-6 h-6 text-blue-400" />
                    Refer a Patient
                  </h4>
                  <p className="text-slate-400 text-sm mb-8 leading-relaxed font-medium">Secure HIPAA-compliant referral for nervous-system-first collaborative care.</p>
                  <button 
                    onClick={handleReferral}
                    disabled={isLoading}
                    className="w-full py-5 bg-white/10 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-xs hover:bg-white/20 transition-all border border-white/10 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      "Send Secure Referral"
                    )}
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
