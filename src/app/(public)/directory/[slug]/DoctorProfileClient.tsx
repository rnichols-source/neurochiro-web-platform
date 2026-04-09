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
  Loader2,
  Sparkles,
  Phone,
  Heart,
  Share2,
  Clock,
  Send
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { sendReferral } from "@/app/actions/referrals";
import { submitPatientStory, getApprovedStories } from "@/app/actions/patient-stories";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import GoogleReviews from "@/components/directory/GoogleReviews";
import Image from "next/image";

export default function DoctorProfileClient({ doctor, slug }: { doctor: any, slug: string }) {
  const { toggleSave, isSaved } = useUserPreferences();
  const [copied, setCopied] = useState(false);
  const [referring, setReferring] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralSent, setReferralSent] = useState(false);
  const [referralPatientName, setReferralPatientName] = useState('');
  const [referralNotes, setReferralNotes] = useState('');
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [stories, setStories] = useState<any[]>([]);
  const [showStoryForm, setShowStoryForm] = useState(false);
  const [storySubmitted, setStorySubmitted] = useState(false);
  const [storyForm, setStoryForm] = useState({ patientFirstName: '', conditionBefore: '', outcomeAfter: '', storyText: '' });
  const [submittingStory, setSubmittingStory] = useState(false);
  const supabase = createClient();
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "",
    message: ""
  });
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [appointmentSubmitted, setAppointmentSubmitted] = useState(false);
  const [submittingAppointment, setSubmittingAppointment] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    name: '', email: '', phone: '', preferredDate: '', message: ''
  });
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.session.user.id)
          .single();
        setUserRole(profile?.role || null);
      }
    };
    fetchSession();
    getApprovedStories(doctor.id).then(setStories);
  }, [supabase, doctor.id]);

  const handleSendReferral = async () => {
    setReferring(true);
    try {
      await sendReferral(doctor.id, referralPatientName || undefined, referralNotes || undefined);
      setReferralSent(true);
      setTimeout(() => {
        setShowReferralModal(false);
        setReferralSent(false);
        setReferralPatientName('');
        setReferralNotes('');
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to send referral');
    }
    setReferring(false);
  };

  const handleReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    setReferring(true);
    try {
      await sendReferral(doctor.id, 'Patient Referral');
      setModalState({
        isOpen: true,
        title: "Referral Sent",
        message: `Your referral for Dr. ${doctor?.first_name} ${doctor?.last_name} has been processed successfully.`
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

  const handleShare = async () => {
    const url = window.location.href;
    const title = `Dr. ${doctor.first_name} ${doctor.last_name} - ${doctor.clinic_name}`;
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-dvh bg-neuro-cream pb-32">
      <div className="bg-neuro-navy pt-32 pb-20 px-6 relative overflow-hidden">

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-10">
            <Breadcrumbs light />
          </div>

          <div className="flex flex-col lg:flex-row gap-12 items-start">
            <div className="w-full lg:w-1/3 lg:sticky lg:top-32">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl relative"
              >
                <div className="relative mb-14 group">
                  
                  <div className="w-56 h-56 rounded-2xl bg-neuro-navy border-4 border-neuro-orange/30 mx-auto flex items-center justify-center text-neuro-orange font-heading font-black text-5xl relative z-10 shadow-2xl shadow-black/40 overflow-hidden text-center">
                    {doctor.photo_url ? (
                      <Image 
                        src={doctor.photo_url} 
                        alt={`${doctor.first_name || ''} ${doctor.last_name || ''}`}
                        fill
                        className="object-cover"
                        priority
                      />
                    ) : (
                      <span className="text-white">{(doctor.first_name?.[0] || 'N').toUpperCase()}</span>
                    )}
                  </div>
                  
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-neuro-orange text-white px-8 py-3 rounded-full font-black text-[11px] uppercase tracking-[0.25em] shadow-2xl flex items-center gap-2.5 z-20 whitespace-nowrap border-4 border-neuro-navy" title="This doctor's identity and practice have been reviewed by the NeuroChiro team. This does not constitute a guarantee of clinical outcomes.">
                    <ShieldCheck className="w-4 h-4" /> Verified Clinician
                  </div>
                </div>

                <div className="text-center space-y-4 mb-10">
                  <div className="flex items-start justify-center gap-2">
                    <h1 className="text-5xl font-heading font-black leading-tight text-white tracking-tight">
                      {doctor.first_name || 'Neuro'} <br/> {doctor.last_name || 'Clinician'}
                    </h1>
                    <div className="flex flex-col gap-1 pt-1">
                      <div className="relative">
                        <button
                          onClick={() => {
                            const wasSaved = isSaved('doctors', doctor.id?.toString());
                            toggleSave('doctors', doctor.id?.toString());
                            setSaveToast(wasSaved ? "Removed" : "Saved!");
                            setTimeout(() => setSaveToast(null), 2000);
                          }}
                          className="p-2 rounded-full hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                          aria-label="Save doctor"
                        >
                          <Heart className={`w-6 h-6 ${isSaved('doctors', doctor.id?.toString()) ? 'text-red-500 fill-red-500' : 'text-white/50'}`} />
                        </button>
                        <AnimatePresence>
                          {saveToast && (
                            <motion.span
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs font-bold text-white bg-neuro-navy border border-white/20 rounded-lg px-2 py-1 shadow whitespace-nowrap"
                            >
                              {saveToast}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                      <button
                        onClick={handleShare}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label="Share profile"
                      >
                        <Share2 className={`w-6 h-6 ${copied ? 'text-green-400' : 'text-white/50'}`} />
                      </button>
                    </div>
                  </div>
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

                {/* Refer a Patient Button (visible to logged-in doctors viewing another doctor) */}
                {session && userRole === 'doctor' && doctor.user_id !== session.user.id && (
                  <button
                    onClick={() => setShowReferralModal(true)}
                    className="w-full mt-4 flex items-center gap-4 p-5 bg-neuro-orange/10 rounded-3xl border border-neuro-orange/20 group hover:bg-neuro-orange/20 hover:border-neuro-orange/40 transition-all text-left"
                  >
                    <div className="p-2.5 bg-neuro-orange/20 rounded-xl text-neuro-orange group-hover:bg-neuro-orange/30 transition-all">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-neuro-orange block">Refer a Patient</span>
                  </button>
                )}

                {/* Referral Modal */}
                <AnimatePresence>
                  {showReferralModal && (
                    <>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowReferralModal(false)} className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-sm" />
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[501] w-full max-w-md p-6">
                        <div className="bg-white rounded-3xl p-8 shadow-2xl">
                          {referralSent ? (
                            <div className="text-center py-8">
                              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                              <h3 className="text-xl font-black text-neuro-navy">Referral Sent!</h3>
                              <p className="text-gray-500 mt-2">Dr. {doctor.last_name} has been notified.</p>
                            </div>
                          ) : (
                            <>
                              <h3 className="text-xl font-black text-neuro-navy mb-1">Refer a Patient</h3>
                              <p className="text-gray-500 text-sm mb-6">Send a referral to Dr. {doctor.first_name} {doctor.last_name}</p>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Patient Name (optional)</label>
                                  <input type="text" value={referralPatientName} onChange={e => setReferralPatientName(e.target.value)} className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange" placeholder="e.g. John Smith" />
                                </div>
                                <div>
                                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Notes (optional)</label>
                                  <textarea value={referralNotes} onChange={e => setReferralNotes(e.target.value)} className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange h-24 resize-none" placeholder="e.g. Patient relocating to your area, needs continued care..." />
                                </div>
                                <div className="flex gap-3">
                                  <button onClick={() => setShowReferralModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors">Cancel</button>
                                  <button onClick={handleSendReferral} disabled={referring} className="flex-1 py-3 bg-neuro-orange text-white rounded-xl font-bold hover:bg-neuro-orange/90 transition-colors disabled:opacity-50">
                                    {referring ? 'Sending...' : 'Send Referral'}
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                {/* Are you this doctor? CTA */}
                {!doctor.user_id && (
                  <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
                    <p className="text-xs text-gray-400 mb-3">
                      Are you Dr. {doctor.last_name}? Join NeuroChiro to manage your profile and connect with patients.
                    </p>
                    <Link
                      href="/register?role=doctor"
                      className="text-xs font-bold text-neuro-orange hover:underline"
                    >
                      Create your account
                    </Link>
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
              <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-12 border border-white/10 shadow-xl relative overflow-hidden group">
                
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

                {doctor.video_url && (
                  <div className="mb-12 rounded-2xl overflow-hidden border border-white/10 shadow-2xl aspect-video bg-black">
                    <iframe 
                      src={doctor.video_url.replace('watch?v=', 'embed/').replace('vimeo.com/', 'player.vimeo.com/video/')} 
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    ></iframe>
                  </div>
                )}
                
                <div>
                  <div className="space-y-6">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-white/10 pb-4">Core Focus Areas</h4>
                    <div className="flex flex-wrap gap-3">
                      {(doctor.specialties || []).length > 0 ? (
                        (doctor.specialties || []).map((s: string, i: number) => (
                          <span key={i} className="px-6 py-3 bg-neuro-orange/10 border border-neuro-orange/20 text-neuro-orange rounded-2xl text-[12px] font-black uppercase tracking-wider hover:bg-neuro-orange/20 transition-all hover:-translate-y-0.5">
                            {s}
                          </span>
                        ))
                      ) : (
                        <p className="text-slate-400 text-sm">Specialties not yet listed.</p>
                      )}
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

              {/* Patient Transformation Stories */}
              <section className="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm">
                <h3 className="text-2xl font-heading font-black text-neuro-navy mb-8 flex items-center gap-3">
                  <Zap className="w-6 h-6 text-neuro-orange" />
                  Patient Transformation Stories
                </h3>

                {stories.length > 0 ? (
                  <div className="space-y-6 mb-8">
                    {stories.map((story) => (
                      <div key={story.id} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm font-black text-neuro-navy">{story.patient_first_name}</span>
                          <span className="text-xs text-gray-400">&middot;</span>
                          <span className="text-xs text-gray-500">{story.condition_before} &rarr; {story.outcome_after}</span>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed italic">&ldquo;{story.story_text}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm mb-8">No stories yet. Be the first to share your experience!</p>
                )}

                {storySubmitted ? (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="font-bold text-green-700">Thank you for sharing your story!</p>
                    <p className="text-green-600 text-sm">It will appear after review.</p>
                  </div>
                ) : showStoryForm ? (
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 space-y-4">
                    <h4 className="font-bold text-neuro-navy">Share Your Experience</h4>
                    <input type="text" placeholder="Your first name" value={storyForm.patientFirstName} onChange={e => setStoryForm(f => ({...f, patientFirstName: e.target.value}))} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange" required />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Condition before (e.g. chronic migraines)" value={storyForm.conditionBefore} onChange={e => setStoryForm(f => ({...f, conditionBefore: e.target.value}))} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange" required />
                      <input type="text" placeholder="Outcome after (e.g. headache-free)" value={storyForm.outcomeAfter} onChange={e => setStoryForm(f => ({...f, outcomeAfter: e.target.value}))} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange" required />
                    </div>
                    <textarea placeholder="Tell your story..." value={storyForm.storyText} onChange={e => setStoryForm(f => ({...f, storyText: e.target.value}))} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange h-28 resize-none" required />
                    <div className="flex gap-3">
                      <button onClick={() => setShowStoryForm(false)} className="px-6 py-3 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
                      <button
                        disabled={submittingStory || !storyForm.patientFirstName || !storyForm.conditionBefore || !storyForm.outcomeAfter || !storyForm.storyText}
                        onClick={async () => {
                          setSubmittingStory(true);
                          const result = await submitPatientStory(doctor.id, storyForm);
                          setSubmittingStory(false);
                          if (result.success) { setStorySubmitted(true); setShowStoryForm(false); }
                        }}
                        className="px-6 py-3 bg-neuro-orange text-white rounded-xl font-bold hover:bg-neuro-orange/90 transition-colors disabled:opacity-50"
                      >
                        {submittingStory ? 'Submitting...' : 'Submit Story'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowStoryForm(true)} className="px-6 py-3 bg-neuro-navy text-white rounded-xl font-bold text-sm hover:bg-neuro-navy/90 transition-colors">
                    Share Your Story
                  </button>
                )}
              </section>

              {/* Report a Concern */}
              <div className="text-center">
                {reportSubmitted ? (
                  <p className="text-sm text-green-600 font-bold">Thank you. Our team will review this.</p>
                ) : showReportForm ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-left">
                    <h4 className="font-bold text-neuro-navy mb-1 text-sm">Report a Concern</h4>
                    <p className="text-gray-400 text-xs mb-4">If you have a safety or credential concern about this doctor, let us know. All reports are reviewed by our team.</p>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const data = new FormData(form);
                      await fetch('/api/leads', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          email: data.get('email'),
                          first_name: data.get('name'),
                          source: 'report_concern',
                          role: 'report',
                          doctor_id: doctor.id,
                          location: `Report about Dr. ${doctor.last_name}: ${data.get('concern')}`,
                        }),
                      });
                      setReportSubmitted(true);
                    }} className="space-y-3">
                      <input type="text" name="name" required placeholder="Your name" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-neuro-orange" />
                      <input type="email" name="email" required placeholder="Your email" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-neuro-orange" />
                      <textarea name="concern" required placeholder="Describe your concern..." rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-neuro-orange resize-none" />
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setShowReportForm(false)} className="px-4 py-2 text-gray-500 text-xs font-bold hover:text-gray-700">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors">Submit Report</button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <button onClick={() => setShowReportForm(true)} className="text-xs text-gray-400 hover:text-red-500 transition-colors underline">
                    Report a concern about this doctor
                  </button>
                )}
              </div>

              {/* Request Appointment Form */}
              <section className="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm">
                <h3 className="text-2xl font-heading font-black text-neuro-navy mb-2 flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-neuro-orange" />
                  Request an Appointment
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  Send a request to {doctor.clinic_name || `Dr. ${doctor.last_name}`}. They&apos;ll get back to you directly.
                </p>

                {appointmentSubmitted ? (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="font-bold text-green-700">Request Sent!</p>
                    <p className="text-green-600 text-sm mb-3">Dr. {doctor.last_name}&apos;s office will contact you within 1-2 business days.</p>
                    <p className="text-gray-400 text-xs">You&apos;ll hear from them at the email you provided. If you don&apos;t hear back within 48 hours, try calling the office directly.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Your Name *</label>
                        <input
                          type="text"
                          required
                          value={appointmentForm.name}
                          onChange={e => setAppointmentForm(f => ({...f, name: e.target.value}))}
                          placeholder="Full name"
                          className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Email *</label>
                        <input
                          type="email"
                          required
                          value={appointmentForm.email}
                          onChange={e => setAppointmentForm(f => ({...f, email: e.target.value}))}
                          placeholder="you@email.com"
                          className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Phone (optional)</label>
                        <input
                          type="tel"
                          value={appointmentForm.phone}
                          onChange={e => setAppointmentForm(f => ({...f, phone: e.target.value}))}
                          placeholder="(555) 123-4567"
                          className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Preferred Date (optional)</label>
                        <input
                          type="date"
                          value={appointmentForm.preferredDate}
                          onChange={e => setAppointmentForm(f => ({...f, preferredDate: e.target.value}))}
                          className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Message (optional)</label>
                      <textarea
                        value={appointmentForm.message}
                        onChange={e => setAppointmentForm(f => ({...f, message: e.target.value}))}
                        placeholder="Tell them a bit about what you're looking for..."
                        className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-neuro-orange h-24 resize-none"
                      />
                    </div>
                    <button
                      disabled={submittingAppointment || !appointmentForm.name || !appointmentForm.email}
                      onClick={async () => {
                        setSubmittingAppointment(true);
                        try {
                          await fetch('/api/leads', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              email: appointmentForm.email,
                              first_name: appointmentForm.name,
                              source: 'appointment_request',
                              role: 'patient',
                              doctor_id: doctor.id,
                              location: `${doctor.city || ''}, ${doctor.state || ''}`,
                            }),
                          });
                          // Also notify the doctor
                          if (doctor.user_id) {
                            await supabase.from('notifications').insert({
                              user_id: doctor.user_id,
                              title: 'New Appointment Request',
                              body: `${appointmentForm.name} wants to book an appointment.${appointmentForm.phone ? ` Phone: ${appointmentForm.phone}` : ''} Email: ${appointmentForm.email}${appointmentForm.message ? `. Message: ${appointmentForm.message}` : ''}`,
                              type: 'appointment',
                              priority: 'important',
                              link: '/doctor/dashboard'
                            });
                          }
                          setAppointmentSubmitted(true);
                        } catch {
                          setAppointmentSubmitted(true);
                        }
                        setSubmittingAppointment(false);
                      }}
                      className="w-full py-4 bg-neuro-orange text-white rounded-xl font-bold hover:bg-neuro-orange/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submittingAppointment ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
                      ) : (
                        <><Send className="w-5 h-5" /> Send Request</>
                      )}
                    </button>
                    <p className="text-xs text-gray-400 text-center">
                      Your info is sent directly to the doctor&apos;s office. We never share it with anyone else.
                    </p>
                  </div>
                )}
              </section>

            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        <p className="text-[11px] text-gray-400 text-center leading-relaxed">
          NeuroChiro is a directory service, not a healthcare provider. The &ldquo;Verified Clinician&rdquo; badge indicates that this doctor&apos;s identity and practice have been reviewed by our team. It does not constitute a guarantee of clinical outcomes, endorsement, or recommendation. Always consult directly with a healthcare provider before making medical decisions.{" "}
          <a href="/terms" className="underline hover:text-gray-600">Terms</a> &middot;{" "}
          <a href="/privacy" className="underline hover:text-gray-600">Privacy</a>
        </p>
      </div>

      {/* Sticky mobile booking bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-4 z-50 lg:hidden">
        <div className="flex gap-3">
          <a
            href={doctor.website_url || "#"}
            target={doctor.website_url ? "_blank" : undefined}
            rel={doctor.website_url ? "noopener noreferrer" : undefined}
            className="flex-1 py-3 bg-neuro-orange text-white rounded-xl font-bold text-sm text-center hover:bg-neuro-orange-light transition-colors"
          >
            Book Appointment
          </a>
          {doctor.phone ? (
            <a
              href={`tel:${doctor.phone}`}
              className="flex-1 py-3 bg-neuro-navy text-white rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2 hover:bg-neuro-navy-light transition-colors"
            >
              <Phone className="w-4 h-4" /> Call
            </a>
          ) : (
            <button
              disabled
              className="flex-1 py-3 bg-gray-100 text-gray-400 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <Phone className="w-4 h-4" /> Call
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {modalState.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-neuro-navy/60">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl p-12 max-w-md w-full shadow-2xl border border-gray-100 text-center relative overflow-hidden"
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
