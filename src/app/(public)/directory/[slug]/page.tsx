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
import { Automations } from "@/lib/automations";
import Breadcrumbs from "@/components/layout/Breadcrumbs";

export default function DoctorProfile() {
  const { slug } = useParams();
  const router = useRouter();
  const doctor = MOCK_DOCTORS.find(d => d.slug === slug);
  const [modalState, setModalState] = useState<{isOpen: boolean, title: string, message: string}>({ isOpen: false, title: "", message: "" });

  const handleClaimProfile = () => {
    // Redirect to register with origin path so it can return after auth
    const currentPath = window.location.pathname;
    router.push(`/register?role=doctor&redirect=${encodeURIComponent(currentPath)}`);
  };

  if (!doctor) {
    notFound();
  }

  const triggerModal = (title: string, message: string) => {
    setModalState({ isOpen: true, title, message });
    setTimeout(() => setModalState({ isOpen: false, title: "", message: "" }), 3000);
  };

  const handleReferral = async () => {
    // Arguments: referrerId, referrerName, doctorId, doctorEmail, phone, patientName
    await Automations.onReferralSent(
      "Public_User", 
      "Public Visitor", 
      doctor.id, 
      "doctor@example.com", // Placeholder
      "000-000-0000", // Placeholder
      "Demo Patient"
    );
    triggerModal("Referral Sent Successfully", "The doctor has been notified and will reach out to the patient shortly.");
  };

  const handleContact = async () => {
    triggerModal("Inquiry Delivered", `Your message has been securely sent to ${doctor.clinic_name}. Expect a response within 24 hours.`);
  };

  const handleBooking = () => {
    triggerModal("Redirecting...", "Connecting you to the clinic's secure booking portal.");
    setTimeout(() => {
      if (doctor.website_url) {
        window.open(doctor.website_url, "_blank");
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-neuro-cream relative">
      
      {/* Toast Modal */}
      <AnimatePresence>
        {modalState.isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 flex items-start gap-4 min-w-[320px] max-w-md"
          >
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h4 className="font-bold text-neuro-navy">{modalState.title}</h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{modalState.message}</p>
            </div>
            <button onClick={() => setModalState({ ...modalState, isOpen: false })} className="text-gray-400 hover:text-gray-600 ml-auto">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Header */}
      <nav className="p-6 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/directory" className="flex items-center gap-2 text-neuro-navy font-bold hover:text-neuro-orange transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Directory
          </Link>
          <div className="flex items-center gap-4">
             <button 
               onClick={handleBooking}
               className="px-6 py-2 bg-neuro-navy text-white font-bold rounded-xl text-sm hover:bg-neuro-navy-light transition-colors"
             >
               Book Appointment
             </button>
          </div>
        </div>
      </nav>

      {/* Claim Profile Banner - High Prominence for Acquisition */}
      <div className="bg-neuro-navy py-4 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-neuro-orange/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8 relative z-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-neuro-orange rounded-xl flex items-center justify-center text-white shadow-lg shadow-neuro-orange/20">
                <ShieldCheck className="w-6 h-6" />
             </div>
             <p className="text-sm font-black text-white uppercase tracking-widest">Is this your clinical profile?</p>
          </div>
          <div className="flex items-center gap-4">
             <p className="text-xs text-gray-400 font-medium hidden lg:block">Verify your clinic to manage reviews, update hours, and receive direct patient referrals.</p>
             <button 
               onClick={handleClaimProfile}
               className="px-6 py-2.5 bg-neuro-orange hover:bg-neuro-orange-light text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-xl transition-all transform hover:-translate-y-0.5"
             >
                Claim & Verify Now
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 pt-8">
        <Breadcrumbs />
      </div>

      <div className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-neuro-orange/5 rounded-bl-[8rem]"></div>
            
            <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
              <div className="relative">
                <div className="w-40 h-40 rounded-[3rem] bg-neuro-navy flex items-center justify-center text-white text-5xl font-black shadow-2xl">
                  {doctor.first_name[0]}{doctor.last_name[0]}
                </div>
                {doctor.verification_status === 'verified' && (
                  <div className="absolute -bottom-2 -right-2 bg-neuro-orange text-white p-3 rounded-2xl shadow-xl border-4 border-white">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                )}
              </div>
              
              <div className="text-center md:text-left flex-1">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <span className="px-3 py-1 bg-neuro-navy/5 text-neuro-navy text-[10px] font-black uppercase tracking-widest rounded-full">
                    NeuroChiro Verified
                  </span>
                </div>
                <h1 className="text-4xl font-heading font-black text-neuro-navy mb-2">
                  Dr. {doctor.first_name} {doctor.last_name}
                </h1>
                <p className="text-xl font-bold text-neuro-orange mb-4">{doctor.clinic_name}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-gray-500 font-medium">
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-neuro-orange" /> {doctor.city}, {doctor.state}</span>
                  <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {doctor.is_hiring ? 'Hiring Associate' : 'Practice Full'}</span>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-10 border-t border-gray-50">
              <h2 className="text-xl font-heading font-black text-neuro-navy mb-4">Clinical Philosophy</h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                {doctor.bio} This clinic focuses on the foundational principles of NeuroChiro, ensuring every patient receives nervous-system-first care that addresses the root cause of their health challenges.
              </p>
            </div>

            <div className="mt-10">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Core Specialties</h3>
              <div className="flex flex-wrap gap-2">
                {doctor.specialties.map((s, i) => (
                  <span key={i} className="px-5 py-2 bg-neuro-cream text-neuro-navy font-bold rounded-2xl border border-neuro-navy/5 shadow-sm">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Social & Contact Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {doctor.instagram_url && (
              <a href={doctor.instagram_url} target="_blank" className="bg-white p-6 rounded-[2rem] border border-gray-100 flex flex-col items-center justify-center gap-3 hover:border-neuro-orange transition-all group">
                <div className="p-3 bg-pink-50 rounded-2xl text-pink-600 group-hover:bg-pink-600 group-hover:text-white transition-all">
                  <Instagram className="w-6 h-6" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-neuro-navy">Instagram</span>
              </a>
            )}
            {doctor.facebook_url && (
              <a href={doctor.facebook_url} target="_blank" className="bg-white p-6 rounded-[2rem] border border-gray-100 flex flex-col items-center justify-center gap-3 hover:border-neuro-orange transition-all group">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Facebook className="w-6 h-6" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-neuro-navy">Facebook</span>
              </a>
            )}
            {doctor.website_url && (
              <a href={doctor.website_url} target="_blank" className="bg-white p-6 rounded-[2rem] border border-gray-100 flex flex-col items-center justify-center gap-3 hover:border-neuro-orange transition-all group">
                <div className="p-3 bg-neuro-orange/5 rounded-2xl text-neuro-orange group-hover:bg-neuro-orange group-hover:text-white transition-all">
                  <Globe className="w-6 h-6" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-neuro-navy">Website</span>
              </a>
            )}
          </div>
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-8">
          <section className="bg-neuro-navy rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neuro-orange/20 blur-3xl"></div>
            <div className="relative z-10">
              <h3 className="text-2xl font-heading font-black mb-6">Patient Inquiries</h3>
              <div className="space-y-4">
                <button 
                  onClick={handleReferral}
                  className="w-full py-4 bg-neuro-orange text-white font-black rounded-2xl hover:bg-neuro-orange-light transition-all shadow-lg text-sm uppercase tracking-widest"
                >
                  Refer a Patient
                </button>
                <button 
                  onClick={handleContact}
                  className="w-full py-4 bg-white/10 text-white font-black rounded-2xl hover:bg-white/20 transition-all border border-white/10 text-sm uppercase tracking-widest"
                >
                  Contact Clinic
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-6 text-center uppercase font-bold tracking-widest leading-relaxed">
                Response time: Usually within 24 hours
              </p>
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
            <h3 className="font-heading font-black text-lg text-neuro-navy mb-6">Nervous System Focus</h3>
            <div className="space-y-6">
              {[
                { label: "Vagus Nerve Support", value: "High", color: "text-purple-500", bg: "bg-purple-50" },
                { label: "Autonomic Regulation", value: "Expert", color: "text-green-500", bg: "bg-green-50" },
                { label: "Tonal Optimization", value: "Advanced", color: "text-neuro-orange", bg: "bg-neuro-orange/10" }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${item.bg} ${item.color} flex items-center justify-center`}>
                      <Zap className="w-4 h-4 fill-current" />
                    </div>
                    <span className="text-sm font-bold text-neuro-navy">{item.label}</span>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-white border border-gray-100 shadow-sm ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-[10px] text-gray-400 leading-relaxed italic">
              This clinic utilizes advanced neurological assessment tools to measure and track your progress.
            </p>
          </section>

          <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
            <h3 className="font-heading font-black text-lg text-neuro-navy mb-6">Practice Details</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-gray-50 rounded-xl text-neuro-orange">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Address</p>
                  <p className="text-sm font-bold text-neuro-navy">{doctor.address}</p>
                  <p className="text-sm text-gray-500">{doctor.city}, {doctor.state} {doctor.country}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-gray-50 rounded-xl text-neuro-orange">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Opportunities</p>
                  <p className="text-sm font-bold text-neuro-navy">{doctor.is_mentoring ? 'Open to Mentorship' : 'Mentorship Full'}</p>
                  <p className="text-sm text-gray-500">{doctor.is_hiring ? 'Active Hiring for Associate' : 'No Active Job Openings'}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
