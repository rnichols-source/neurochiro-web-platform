"use client";

import { 
  User, 
  School, 
  Calendar, 
  Heart, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Video, 
  FileText, 
  Bookmark, 
  Zap, 
  Upload, 
  Play, 
  ChevronRight,
  X,
  Plus,
  Camera,
  Trash2,
  Lock,
  Bell,
  LogOut,
  CreditCard,
  ExternalLink,
  ShieldAlert,
  Trophy
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Automations } from "@/lib/automations";
import { useStudentTier } from "@/context/StudentTierContext";

export default function ProfilePage() {
  const { tier, isFoundation, isProfessional, isAccelerator } = useStudentTier();
  const [profile, setProfile] = useState({
    name: "Raymond Nichols",
    email: "raymond.nichols@life.edu",
    school: "Life University",
    gradYear: "2027",
    interests: ["Pediatrics", "Clinical Neurology", "Practice Management", "Neuro-Scanning"],
    readinessScore: 85
  });

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleUpdateProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updatedData = Object.fromEntries(formData.entries());
    setProfile(prev => ({ ...prev, ...updatedData }));
    Automations.onProfileUpdate("std-1", updatedData);
    triggerSuccess("Profile updated successfully!");
    setActiveModal(null);
  };

  const triggerSuccess = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleAddInterest = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const interest = new FormData(e.currentTarget).get('interest') as string;
    if (interest && !profile.interests.includes(interest)) {
      setProfile(prev => ({ ...prev, interests: [...prev.interests, interest] }));
      Automations.onProfileUpdate("std-1", { addedInterest: interest });
      triggerSuccess("Specialty added!");
    }
    setActiveModal(null);
  };

  const removeInterest = (interest: string) => {
    setProfile(prev => ({ ...prev, interests: prev.interests.filter(i => i !== interest) }));
    Automations.onProfileUpdate("std-1", { removedInterest: interest });
  };

  const getTierIcon = (t: string) => {
    switch(t) {
      case "Accelerator": return <Sparkles className="w-3 h-3 text-neuro-orange" />;
      case "Professional": return <Zap className="w-3 h-3 text-neuro-orange" />;
      case "Foundation": return <Trophy className="w-3 h-3 text-neuro-orange" />;
      default: return null;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 relative">
      <AnimatePresence>
        {successToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[300] bg-green-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold"
          >
            <CheckCircle2 className="w-5 h-5" />
            {successToast}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-heading font-black text-neuro-navy">My Identity</h1>
          <p className="text-neuro-gray mt-2 text-lg">Your professional clinical profile and career assets.</p>
        </div>
        
        {/* Readiness Score Block */}
        <div className="relative group">
          <div className={`bg-neuro-navy text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-4 cursor-default transition-all ${!isProfessional ? 'blur-[2px] opacity-50 grayscale' : ''}`}>
             <div className="flex flex-col">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Career Readiness</span>
                <span className="text-xl font-black">{profile.readinessScore}%</span>
             </div>
             <div className="w-12 h-12 rounded-full border-4 border-neuro-orange/30 border-t-neuro-orange flex items-center justify-center font-bold text-xs group-hover:rotate-12 transition-transform">
                GOAL
             </div>
          </div>
          {!isProfessional && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[1px] rounded-2xl z-20">
               <Lock className="w-5 h-5 text-neuro-navy" />
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* MAIN COLUMN */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Hero Profile Block */}
          <section className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-neuro-orange/5 rounded-bl-[5rem] pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="relative">
                <div className="w-32 h-32 rounded-[2rem] bg-neuro-navy flex items-center justify-center text-white text-4xl font-black shadow-2xl transition-transform hover:scale-105 duration-500">
                  RN
                </div>
                <button 
                  onClick={() => setActiveModal('avatar')}
                  className="absolute -bottom-2 -right-2 bg-neuro-orange text-white p-2.5 rounded-xl shadow-lg border-4 border-white hover:scale-110 active:scale-95 transition-all"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>
              <div className="text-center md:text-left space-y-4">
                <div className="space-y-1">
                  <h2 className="text-4xl font-heading font-black text-neuro-navy">{profile.name}</h2>
                  <p className="text-gray-500 font-medium text-lg">{profile.email}</p>
                </div>
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  <span className="px-4 py-1.5 bg-neuro-navy text-white text-[10px] font-black rounded-full uppercase tracking-widest flex items-center gap-2 border border-white/10 shadow-lg">
                    {getTierIcon(tier)}
                    Student {tier}
                  </span>
                  <span className="px-4 py-1.5 bg-neuro-orange/10 text-neuro-orange text-[10px] font-black rounded-full uppercase tracking-widest border border-neuro-orange/20">Verified Student</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
              <div onClick={() => setActiveModal('edit-profile')} className="space-y-2 cursor-pointer group">
                <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest flex items-center gap-2 ml-2">
                  <School className="w-3.5 h-3.5 text-neuro-orange" /> Chiropractic School
                </label>
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-neuro-navy group-hover:border-neuro-orange/30 transition-all flex justify-between items-center shadow-inner">
                  {profile.school}
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </div>
              <div onClick={() => setActiveModal('edit-profile')} className="space-y-2 cursor-pointer group">
                <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest flex items-center gap-2 ml-2">
                  <Calendar className="w-3.5 h-3.5 text-neuro-orange" /> Graduation Year
                </label>
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-neuro-navy group-hover:border-neuro-orange/30 transition-all flex justify-between items-center shadow-inner">
                  Class of {profile.gradYear}
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </div>
            </div>

            <div className="mt-12">
               <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest block mb-6 ml-2">Clinical Interests & Specialties</label>
               <div className="flex flex-wrap gap-3">
                 {profile.interests.map((interest) => (
                   <span key={interest} className="px-6 py-3 bg-white border border-gray-200 text-neuro-navy text-sm font-bold rounded-2xl hover:border-neuro-orange hover:text-neuro-orange transition-all cursor-default shadow-sm flex items-center gap-3 group">
                     {interest}
                     <button onClick={(e) => { e.stopPropagation(); removeInterest(interest); }} className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all">
                        <X className="w-4 h-4" />
                     </button>
                   </span>
                 ))}
                 <button 
                  onClick={() => setActiveModal('add-specialty')}
                  className="px-6 py-3 border-2 border-dashed border-gray-200 text-gray-400 text-sm font-bold rounded-2xl hover:border-neuro-orange hover:text-neuro-orange transition-all active:scale-95 flex items-center gap-2"
                 >
                   <Plus className="w-4 h-4" /> Add Specialty
                 </button>
               </div>
            </div>
          </section>

          {/* Video & Resume Section (Segmented) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             
             {/* Intro Video Card */}
             <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm relative overflow-hidden flex flex-col h-full">
                {!isProfessional && (
                   <div className="absolute inset-0 z-30 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
                      <Lock className="w-10 h-10 text-neuro-orange mb-4 shadow-xl shadow-neuro-orange/10" />
                      <h4 className="text-xl font-black text-neuro-navy mb-2">Video Gated</h4>
                      <p className="text-xs text-gray-500 mb-6 max-w-xs">Intro Videos are a Professional feature. Clinics are 4x more likely to contact students with a video.</p>
                      <Link href="/pricing" className="px-6 py-2.5 bg-neuro-orange text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Upgrade</Link>
                   </div>
                )}
                <div className="flex items-center justify-between mb-8">
                   <h3 className="font-bold text-neuro-navy flex items-center gap-2">
                      <Video className="w-5 h-5 text-neuro-orange" /> Intro Video
                   </h3>
                   <span className="text-[10px] font-black text-neuro-orange bg-neuro-orange/10 px-2 py-0.5 rounded uppercase tracking-widest">Required</span>
                </div>
                <div 
                  onClick={() => isProfessional && setActiveModal('video')}
                  className={`aspect-video bg-neuro-navy rounded-3xl flex flex-col items-center justify-center relative group cursor-pointer overflow-hidden border-4 border-white shadow-2xl ${!isProfessional ? 'blur-sm grayscale' : ''}`}
                >
                   <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform backdrop-blur-md border border-white/20 shadow-xl">
                      <Play className="w-7 h-7 text-white fill-current" />
                   </div>
                   <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mt-4">Record Intro</p>
                </div>
                <p className="text-[10px] text-gray-400 mt-6 leading-relaxed text-center italic">
                   "Patients and clinics value hearing your philosophy in your own voice."
                </p>
             </section>

             {/* Resume Card */}
             <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm relative overflow-hidden flex flex-col h-full">
                {!isProfessional && (
                   <div className="absolute inset-0 z-30 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
                      <Lock className="w-10 h-10 text-blue-600 mb-4 shadow-xl shadow-blue-600/10" />
                      <h4 className="text-xl font-black text-neuro-navy mb-2">Resume Locked</h4>
                      <p className="text-xs text-gray-500 mb-6 max-w-xs">Professional members can upload their CV for direct clinic applications.</p>
                      <Link href="/pricing" className="px-6 py-2.5 bg-neuro-navy text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neuro-orange transition-all">Upgrade</Link>
                   </div>
                )}
                <div className="flex items-center justify-between mb-8">
                   <h3 className="font-bold text-neuro-navy flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" /> Resume / CV
                   </h3>
                   <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase tracking-widest">Active</span>
                </div>
                <div 
                  onClick={() => isProfessional && setActiveModal('resume')}
                  className={`flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-100 rounded-3xl hover:border-neuro-orange transition-all cursor-pointer group bg-gray-50/50 ${!isProfessional ? 'blur-sm grayscale' : ''}`}
                >
                   <Upload className="w-10 h-10 text-gray-300 group-hover:text-neuro-orange mb-4 transition-colors" />
                   <p className="text-sm font-bold text-neuro-navy">Raymond_Nichols_CV.pdf</p>
                   <p className="text-[10px] text-gray-400 mt-1 uppercase font-black tracking-widest">Updated 2 days ago</p>
                </div>
                <button 
                  onClick={() => isProfessional && setActiveModal('resume')}
                  className="w-full mt-6 py-4 bg-white border border-gray-100 text-neuro-navy font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-colors active:scale-95 shadow-sm"
                >
                   Replace File
                </button>
             </section>
          </div>
        </div>

        {/* SIDEBAR COLUMN */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Account Status Segment */}
          <section className="bg-neuro-navy rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-neuro-orange/10 blur-[80px] pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-neuro-orange/20 rounded-xl">
                   <Sparkles className="w-6 h-6 text-neuro-orange" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-neuro-orange">Care Identity Status</span>
              </div>
              
              <div className="mb-10">
                 <p className="text-gray-400 text-[10px] uppercase font-black tracking-widest mb-2">Current Tier</p>
                 <h3 className="text-3xl font-heading font-black">Student {tier}</h3>
                 <div className="flex items-center gap-2 mt-3 text-[10px] font-black uppercase tracking-widest text-neuro-orange">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {tier === "Free" ? 'Foundation Access Only' : `${tier} Plan Active`}
                 </div>
              </div>

              <div className="space-y-4 mb-10">
                 <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest p-5 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-gray-400">Monthly Mentorships</span>
                    <span className={!isAccelerator ? 'text-gray-500' : 'text-neuro-orange'}>{isAccelerator ? 'Unlimited' : '0 / 0'}</span>
                 </div>
                 <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest p-5 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-gray-400">Clinical Playbooks</span>
                    <span className={!isProfessional ? 'text-gray-500' : 'text-green-500'}>{isProfessional ? 'Unlimited' : 'None'}</span>
                 </div>
              </div>

              <Link 
                href="/pricing"
                className="w-full py-5 bg-white text-neuro-navy hover:bg-neuro-orange hover:text-white transition-all rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl flex items-center justify-center gap-3 active:scale-95"
              >
                {tier === "Accelerator" ? 'Manage Billing' : 'Upgrade Membership'} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </section>

          {/* Shortlist Segment */}
          <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
             <h4 className="font-heading font-black text-neuro-navy mb-8 flex items-center gap-3">
                <Bookmark className="w-5 h-5 text-neuro-orange" /> Saved Shortlist
             </h4>
             <div className="space-y-4">
                <div onClick={() => alert("Opening saved clinics...")} className="flex items-center justify-between group cursor-pointer p-2 hover:bg-gray-50 rounded-xl transition-all">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl group-hover:bg-neuro-orange/10 transition-colors flex items-center justify-center">
                         <ShieldCheck className="w-5 h-5 text-gray-400 group-hover:text-neuro-orange" />
                      </div>
                      <span className="text-sm font-bold text-neuro-navy group-hover:text-neuro-orange transition-colors">Saved Clinics</span>
                   </div>
                   <span className="bg-gray-50 px-3 py-1 rounded-full text-xs font-black text-gray-400">12</span>
                </div>
                <div onClick={() => alert("Opening saved seminars...")} className="flex items-center justify-between group cursor-pointer p-2 hover:bg-gray-50 rounded-xl transition-all">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl group-hover:bg-neuro-orange/10 transition-colors flex items-center justify-center">
                         <Calendar className="w-5 h-5 text-gray-400 group-hover:text-neuro-orange" />
                      </div>
                      <span className="text-sm font-bold text-neuro-navy group-hover:text-neuro-orange transition-colors">Saved Seminars</span>
                   </div>
                   <span className="bg-gray-50 px-3 py-1 rounded-full text-xs font-black text-gray-400">4</span>
                </div>
             </div>
             <button 
              onClick={() => setActiveModal('saves')}
              className="w-full mt-8 py-4 flex items-center justify-center gap-3 text-[10px] font-black text-neuro-orange uppercase tracking-widest hover:bg-neuro-orange/5 rounded-2xl transition-all active:scale-95 border-2 border-dashed border-gray-100"
             >
                View All Saves <ArrowRight className="w-3.5 h-3.5" />
             </button>
          </section>

          {/* Account Actions Segment */}
          <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
             <h4 className="font-heading font-black text-neuro-navy mb-6 px-2">Account Actions</h4>
             <div className="space-y-2">
                <button 
                  onClick={() => setActiveModal('privacy')}
                  className="w-full py-4 text-left px-4 hover:bg-gray-50 rounded-2xl text-xs font-black uppercase tracking-widest text-neuro-navy transition-all flex items-center justify-between active:scale-95 group"
                >
                   Privacy Settings <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-neuro-orange" />
                </button>
                <button 
                  onClick={() => setActiveModal('notifications')}
                  className="w-full py-4 text-left px-4 hover:bg-gray-50 rounded-2xl text-xs font-black uppercase tracking-widest text-neuro-navy transition-all flex items-center justify-between active:scale-95 group"
                >
                   Notification Preferences <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-neuro-orange" />
                </button>
                <button 
                  onClick={() => setActiveModal('signout')}
                  className="w-full py-4 text-left px-4 hover:bg-red-50 rounded-2xl text-xs font-black uppercase tracking-widest text-red-500 transition-all active:scale-95"
                >
                   Sign Out
                </button>
             </div>
          </section>
        </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 backdrop-blur-md bg-neuro-navy/40">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/20"
            >
              {/* EDIT PROFILE MODAL */}
              {activeModal === 'edit-profile' && (
                <form onSubmit={handleUpdateProfile}>
                  <div className="p-10 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-2xl font-black text-neuro-navy">Edit Professional Identity</h3>
                    <button type="button" onClick={() => setActiveModal(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                  </div>
                  <div className="p-10 space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Full Name</label>
                      <input name="name" type="text" autoComplete="name" defaultValue={profile.name} required className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-neuro-orange/20 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Chiropractic School</label>
                      <input name="school" type="text" autoComplete="organization" defaultValue={profile.school} required className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-neuro-orange/20 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Graduation Year</label>
                      <input name="gradYear" type="text" autoComplete="off" defaultValue={profile.gradYear} required className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-neuro-orange/20 outline-none" />
                    </div>
                    <button type="submit" className="w-full py-5 bg-neuro-orange text-white font-black rounded-2xl hover:bg-neuro-orange-light shadow-xl shadow-neuro-orange/20 transition-all uppercase tracking-widest text-sm">Save Changes</button>
                  </div>
                </form>
              )}

              {/* ADD SPECIALTY MODAL */}
              {activeModal === 'add-specialty' && (
                <form onSubmit={handleAddInterest}>
                  <div className="p-10 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-2xl font-black text-neuro-navy">Add Clinical Interest</h3>
                    <button type="button" onClick={() => setActiveModal(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                  </div>
                  <div className="p-10 space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Specialty Name</label>
                      <input name="interest" placeholder="e.g. Sports Rehab" required className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-neuro-orange/20 outline-none" />
                    </div>
                    <button type="submit" className="w-full py-5 bg-neuro-navy text-white font-black rounded-2xl hover:bg-neuro-navy-light shadow-xl transition-all uppercase tracking-widest text-sm">Add to Profile</button>
                  </div>
                </form>
              )}

              {/* VIDEO MODAL */}
              {activeModal === 'video' && (
                <div className="p-10 space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black text-neuro-navy">Intro Video</h3>
                    <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                  </div>
                  <div className="aspect-video bg-neuro-navy rounded-[2.5rem] flex flex-col items-center justify-center border-4 border-gray-100 shadow-2xl relative overflow-hidden">
                     <div className="absolute inset-0 bg-neuro-orange/5 blur-3xl"></div>
                     <Camera className="w-12 h-12 text-white/20 mb-4 relative z-10" />
                     <p className="text-white/50 text-sm font-bold relative z-10">Record your philosophy...</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <button onClick={() => triggerSuccess("Video recording started")} className="py-4 bg-red-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-all">Start Recording</button>
                     <button onClick={() => triggerSuccess("Upload interface opened")} className="py-4 bg-gray-100 text-neuro-navy font-black rounded-2xl text-[10px] uppercase tracking-widest border border-gray-200 active:scale-95 transition-all">Upload File</button>
                  </div>
                </div>
              )}

              {/* RESUME MODAL */}
              {activeModal === 'resume' && (
                <div className="p-10 space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black text-neuro-navy">Replace Resume/CV</h3>
                    <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                  </div>
                  <div className="p-12 border-4 border-dashed border-gray-100 rounded-[3rem] flex flex-col items-center justify-center text-center bg-gray-50/50">
                     <Upload className="w-12 h-12 text-gray-300 mb-4" />
                     <p className="font-bold text-neuro-navy mb-1">Drag and drop your new CV</p>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">PDF, DOCX up to 10MB</p>
                  </div>
                  <button onClick={() => triggerSuccess("Resume replaced successfully")} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 uppercase tracking-widest text-sm active:scale-95 transition-all">Browse Files</button>
                </div>
              )}

              {/* FALLBACK FOR OTHERS */}
              {(activeModal === 'avatar' || activeModal === 'saves' || activeModal === 'privacy' || activeModal === 'notifications') && (
                <div className="p-10 space-y-8 text-center">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black text-neuro-navy capitalize">{activeModal.replace('-', ' ')}</h3>
                    <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                  </div>
                  <div className="py-12">
                     <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-10 h-10 text-gray-200" />
                     </div>
                     <p className="font-black text-neuro-navy uppercase tracking-widest text-[10px] text-gray-400">Restricted in Live Demo</p>
                  </div>
                  <button onClick={() => setActiveModal(null)} className="w-full py-4 bg-neuro-navy text-white font-black rounded-2xl uppercase tracking-widest text-xs active:scale-95 transition-all">Close Window</button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
