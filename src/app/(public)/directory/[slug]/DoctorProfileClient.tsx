"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, 
  Globe, 
  Instagram, 
  Facebook, 
  ShieldCheck, 
  Users, 
  Calendar,
  ChevronRight,
  CheckCircle2,
  Zap,
  Mail,
  ExternalLink,
  MessageSquare,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { onReferralSentAction } from "@/app/actions/automations";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import GoogleReviews from "@/components/directory/GoogleReviews";
import Image from "next/image";

export default function DoctorProfileClient({ doctor, slug }: { doctor: any, slug: string }) {
  const [referring, setReferring] = useState(false);
  const [session, setSession] = useState<any>(null);
  const supabase = createClient();
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "",
    message: ""
  });

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };
    fetchSession();
  }, [supabase]);

  const handleReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    setReferring(true);
    try {
      await onReferralSentAction(
        session?.user?.id || "guest",
        session?.user?.user_metadata?.full_name || "Guest User",
        doctor.id,
        doctor.email || "doctor@example.com",
        doctor.phone || "555-0199",
        "Patient Referral"
      );
      setModalState({
        isOpen: true,
        title: "Referral Sent",
        message: `Your referral for ${doctor?.first_name} ${doctor?.last_name} has been processed successfully.`
      });
    } catch (err) {
      console.error(err);
      setModalState({
        isOpen: true,
        title: "Error",
        message: "There was an issue processing your referral."
      });
    } finally {
      setReferring(false);
    }
  };

  const handleBooking = () => {
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

  const handleEmail = () => {
    if (doctor.email) {
      window.location.href = `mailto:${doctor.email}?subject=Referral Inquiry via NeuroChiro`;
    } else {
      setModalState({
        isOpen: true,
        title: "Contact Info",
        message: `Direct email for ${doctor.first_name} is not available. Please visit their official website or use the secure referral button.`
      });
    }
  };

  return (
    <div className="min-h-screen bg-neuro-cream pb-32">
      <div className="bg-neuro-navy pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-neuro-orange/10 blur-[150px] -mr-80 -mt-80 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 blur-[150px] -ml-80 -mb-80 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-10">
            <Breadcrumbs light />
          </div>

          <div className="flex flex-col lg:flex-row gap-12 items-start">
            <div className="w-full lg:w-1/3 lg:sticky lg:top-32">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-md rounded-[3rem] p-8 border border-white/20 shadow-2xl relative"
              >
                <div className="relative mb-14 group">
                  <div className="absolute inset-0 bg-neuro-orange blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
                  
                  <div className="w-56 h-56 rounded-[3rem] bg-neuro-navy border-4 border-neuro-orange/30 mx-auto flex items-center justify-center text-neuro-orange font-heading font-black text-7xl relative z-10 shadow-2xl shadow-black/40 overflow-hidden text-center">
                    {doctor.photo_url ? (
                      <Image 
                        src={doctor.photo_url} 
                        alt={`${doctor.first_name || ''} ${doctor.last_name || ''}`}
                        fill
                        className="object-cover"
                        priority
                      />
                    ) : (
                      <span aria-hidden="true">{(doctor.first_name?.[0] || 'D')}{(doctor.last_name?.[0] || 'R')}</span>
                    )}
                  </div>
                  
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-neuro-orange text-white px-8 py-3 rounded-full font-black text-[11px] uppercase tracking-[0.25em] shadow-2xl flex items-center gap-2.5 z-20 whitespace-nowrap border-4 border-neuro-navy">
                    <ShieldCheck className="w-4 h-4" /> Verified Clinician
                  </div>
                </div>

                <div className="text-center space-y-4 mb-10">
                  <h1 className="text-5xl font-heading font-black leading-tight text-white tracking-tight">
                    {doctor.first_name || 'Neuro'} <br/> {doctor.last_name || 'Clinician'}
                  </h1>
                  <div className="inline-block">
                    <p className="text-neuro-orange font-black text-[10px] uppercase tracking-[0.3em] bg-neuro-orange/10 py-2.5 px-6 rounded-full border border-neuro-orange/20">
                      {doctor.clinic_name || 'Private Practice'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-5 bg-white/5 rounded-3xl border border-white/10 group hover:bg-white/10 transition-all cursor-default">
                    <div className="p-2.5 bg-neuro-orange/20 rounded-xl text-neuro-orange group-hover:bg-neuro-orange/30 transition-colors">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-slate-100 tracking-wide">
                      {doctor.city || 'Global'}{doctor.state ? `, ${doctor.state}` : ''}
                    </span>
                  </div>
                  
                  <Link 
                    href={doctor.website_url || "#"} 
                    target="_blank"
                    className="flex items-center gap-4 p-5 bg-white/5 rounded-3xl border border-white/10 group hover:bg-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-400 group-hover:scale-110 group-hover:bg-blue-500/30 transition-all">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        Official Website <ExternalLink className="w-3 h-3 opacity-50" />
                      </p>
                    </div>
                  </Link>

                  {session ? (
                    <Link
                      href={`/doctor/messages?to=${doctor.id}`}
                      className="w-full flex items-center gap-4 p-5 bg-white/5 rounded-3xl border border-white/10 group hover:bg-white/10 hover:border-white/20 transition-all text-left"
                    >
                      <div className="p-2.5 bg-neuro-orange/20 rounded-xl text-neuro-orange group-hover:bg-neuro-orange/30 transition-all">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold text-slate-100 block">Direct Message</span>
                    </Link>
                  ) : (
                    <button
                      onClick={handleEmail}
                      className="w-full flex items-center gap-4 p-5 bg-white/5 rounded-3xl border border-white/10 group hover:bg-white/10 hover:border-white/20 transition-all text-left"
                    >
                      <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400 group-hover:bg-emerald-500/30 transition-all">
                        <Mail className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold text-slate-100 block">Contact via Email</span>
                    </button>
                  )}
                </div>

                {/* Claim Profile Section for Unclaimed Listings */}
                {!doctor.user_id && (
                  <div className="mt-8 p-6 bg-neuro-orange/10 border border-neuro-orange/30 rounded-[2rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-neuro-orange/10 blur-2xl -mr-12 -mt-12 group-hover:bg-neuro-orange/20 transition-all"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-neuro-orange fill-current" />
                        <span className="text-[10px] font-black text-neuro-orange uppercase tracking-widest">Unclaimed Listing</span>
                      </div>
                      <p className="text-xs font-bold text-slate-100 mb-5 leading-relaxed">
                        Are you {doctor.first_name ? `Dr. ${doctor.last_name}` : 'the owner of this practice'}? Claim this profile to manage your clinic's presence.
                      </p>
                      <Link 
                        href={`/register?role=doctor&claim_id=${doctor.id}&tier=starter`}
                        className="w-full py-4 bg-neuro-orange text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-neuro-orange-light transition-all flex items-center justify-center gap-2 shadow-lg shadow-neuro-orange/20"
                      >
                        Claim My Profile <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 mt-10">
                  <Link 
                    href={doctor.instagram_url || "https://instagram.com"} 
                    target="_blank"
                    className="flex-1 py-5 bg-white/5 rounded-3xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 border border-white/10 hover:border-white/30 hover:scale-[1.02] active:scale-95 group"
                  >
                    <Instagram className="w-6 h-6 group-hover:text-neuro-orange transition-colors" />
                  </Link>
                  <Link 
                    href={doctor.facebook_url || "https://facebook.com"} 
                    target="_blank"
                    className="flex-1 py-5 bg-white/5 rounded-3xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 border border-white/10 hover:border-white/30 hover:scale-[1.02] active:scale-95 group"
                  >
                    <Facebook className="w-6 h-6 group-hover:text-blue-400 transition-colors" />
                  </Link>
                </div>
              </motion.div>
            </div>

            <div className="w-full lg:w-2/3 space-y-10">
              <section className="bg-white/5 backdrop-blur-sm rounded-[3.5rem] p-12 border border-white/10 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-neuro-orange/5 blur-[100px] -mr-48 -mt-48 transition-all duration-1000 group-hover:bg-neuro-orange/10 pointer-events-none"></div>
                
                <h3 className="text-3xl font-heading font-black mb-10 flex items-center gap-5 text-white">
                  <div className="p-4 bg-neuro-orange rounded-[1.25rem] shadow-2xl shadow-neuro-orange/30">
                    <Zap className="w-7 h-7 text-white fill-current" />
                  </div>
                  Clinical Excellence
                </h3>
                
                <div className="relative">
                  <p className="text-2xl text-slate-100 leading-[1.6] mb-12 font-medium italic opacity-95 border-l-4 border-neuro-orange/40 pl-10 py-2">
                    "{doctor.bio}"
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-white/10 pb-4">Core Focus Areas</h4>
                    <div className="flex flex-wrap gap-3">
                      {(doctor.specialties || []).map((s: string, i: number) => (
                        <span key={i} className="px-6 py-3 bg-neuro-orange/10 border border-neuro-orange/20 text-neuro-orange rounded-2xl text-[12px] font-black uppercase tracking-wider hover:bg-neuro-orange/20 transition-all hover:-translate-y-0.5">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-white/10 pb-4">Clinic Infrastructure</h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-sm font-black text-slate-100 bg-white/5 p-5 rounded-[1.5rem] border border-white/5 hover:bg-white/10 transition-colors">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" /> 
                        Nervous System Scanning Active
                      </div>
                      <div className="flex items-center gap-4 text-sm font-black text-slate-100 bg-white/5 p-5 rounded-[1.5rem] border border-white/5 opacity-80 hover:opacity-100 transition-all">
                        <ShieldCheck className="w-6 h-6 text-blue-400" /> 
                        HIPAA Compliant Secure Facility
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-8">
                <h3 className="text-3xl font-heading font-black text-white flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-xl">
                    <MessageSquare className="w-6 h-6 text-blue-400" />
                  </div>
                  Patient Experience
                </h3>
                <GoogleReviews 
                  placeId={doctor.google_place_id} 
                  doctorName={`${doctor.first_name} ${doctor.last_name}`} 
                />
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-neuro-navy border-2 border-neuro-orange/40 rounded-[3rem] p-12 relative group overflow-hidden shadow-2xl transition-all hover:border-neuro-orange">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-neuro-orange/10 blur-[80px] -mr-24 -mt-24 transition-all duration-700 group-hover:bg-neuro-orange/20 pointer-events-none"></div>
                  <h4 className="text-3xl font-black mb-5 flex items-center gap-4 text-white">
                    <Calendar className="w-8 h-8 text-neuro-orange" />
                    Book an Exam
                  </h4>
                  <p className="text-slate-400 text-base mb-10 leading-relaxed font-medium">Secure your clinical neuro-developmental assessment directly with the office.</p>
                  <button 
                    onClick={handleBooking}
                    className="w-full py-6 bg-neuro-orange text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-neuro-orange-light transition-all shadow-2xl shadow-neuro-orange/30 hover:scale-[1.03] active:scale-95"
                  >
                    Check Availability
                  </button>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 group relative overflow-hidden transition-all hover:border-white/20">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] -mr-24 -mt-24 transition-all duration-700 group-hover:bg-blue-500/10 pointer-events-none"></div>
                  <h4 className="text-3xl font-black mb-5 flex items-center gap-4 text-white">
                    <Users className="w-8 h-8 text-blue-400" />
                    Refer a Patient
                  </h4>
                  <p className="text-slate-400 text-base mb-10 leading-relaxed font-medium">Secure HIPAA-compliant referral for nervous-system-first collaborative care.</p>
                  <button 
                    onClick={handleReferral}
                    disabled={referring}
                    className="w-full py-6 bg-white/10 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-white/20 transition-all border border-white/10 flex items-center justify-center gap-4 hover:scale-[1.03] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group shadow-2xl"
                  >
                    {referring ? (
                      <>
                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span className="tracking-[0.1em]">Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Secure Referral</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {modalState.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-neuro-navy/60">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[3.5rem] p-12 max-w-md w-full shadow-2xl border border-gray-100 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-neuro-orange to-blue-500"></div>
              <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-3xl font-heading font-black text-neuro-navy mb-4 tracking-tight">{modalState.title}</h3>
              <p className="text-gray-500 font-medium leading-relaxed mb-12">{modalState.message}</p>
              <button 
                onClick={() => setModalState({ ...modalState, isOpen: false })}
                className="w-full py-6 bg-neuro-navy text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-neuro-navy/30 active:scale-95 transition-all hover:bg-slate-800"
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
