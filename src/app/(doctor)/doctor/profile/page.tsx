"use client";

import { 
  Building2, 
  MapPin, 
  Globe, 
  FileText, 
  Camera, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  ArrowRight,
  Plus,
  Loader2,
  X,
  Sparkles,
  Bell,
  Mail,
  MessageSquare,
  AlertCircle,
  ExternalLink,
  Save,
  ChevronRight
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  getDoctorProfile, 
  updateDoctorProfile, 
  uploadAvatar, 
  updateNotificationPreferences,
  generateAIProfileBio 
} from "./actions";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: "", type: 'success' });
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const data = await getDoctorProfile();
      console.log("Profile data loaded:", data);
      setProfile(data);
      setLoading(false);
    }
    load();
  }, []);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setShowToast({ show: true, message, type });
    setTimeout(() => setShowToast({ show: false, message: "", type: 'success' }), 4000);
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    
    // Optimistic UI Update
    const updatedFields = Object.fromEntries(formData.entries());
    setProfile((prev: any) => ({ ...prev, ...updatedFields }));

    const result = await updateDoctorProfile(formData);
    setSaving(false);
    
    if (result.success) {
      triggerToast("Profile synchronized with NeuroChiro network.");
    } else {
      triggerToast(result.error || "Failed to update profile", "error");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || saving) return;

    setSaving(true);
    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadAvatar(formData);
    setSaving(false);

    if (result.success) {
      setProfile((prev: any) => ({ ...prev, photo_url: result.publicUrl, avatar_url: result.publicUrl }));
      triggerToast("Clinic photo updated successfully.");
    } else {
      triggerToast(result.error || "Failed to upload image", "error");
    }
  };

  const handleNotificationToggle = async (key: string, value: boolean) => {
    if (!profile) return;
    const newPrefs = { ...profile.notification_preferences, [key]: value };
    setProfile((prev: any) => ({ ...prev, notification_preferences: newPrefs }));
    
    const result = await updateNotificationPreferences(newPrefs);
    if (result.success) {
      triggerToast("Notification preferences updated.");
    } else {
      triggerToast(result.error || "Failed to update notifications", "error");
    }
  };

  const handleAIMagicWrite = async () => {
    if (!profile) return;
    setIsGeneratingBio(true);
    const result = await generateAIProfileBio(profile?.clinic_name || "", profile?.bio || "");
    setIsGeneratingBio(false);
    
    if (result.success) {
      setProfile((prev: any) => ({ ...prev, bio: result.bio }));
      triggerToast("AI Bio generated. Review and save below.");
    }
  };

  // Profile Strength Calculation
  const calculateStrength = () => {
    if (!profile) return 0;
    let score = 0;
    if (profile.bio) score += 20;
    if (profile.photo_url || profile.avatar_url) score += 30;
    if (profile.website_url) score += 10;
    if (profile.clinic_name) score += 10;
    if (Array.isArray(profile.specialties) && profile.specialties.length > 0) score += 10;
    if (profile.location_lat) score += 20;
    return score;
  };

  const strength = calculateStrength();

  const getTierDisplay = (tier: string) => {
    if (['starter', 'growth', 'pro'].includes(tier)) return tier;
    return 'starter'; // Default fallback
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neuro-cream">
        <Loader2 className="w-10 h-10 text-neuro-orange animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast.show && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={cn(
              "fixed bottom-10 right-10 z-[300] text-white px-8 py-4 rounded-2xl shadow-2xl border flex items-center gap-3",
              showToast.type === 'error' ? "bg-red-600 border-red-500" : "bg-neuro-navy border-white/10"
            )}
          >
            {showToast.type === 'error' ? <AlertCircle className="w-5 h-5 text-white" /> : <CheckCircle2 className="w-5 h-5 text-green-400" />}
            <span className="font-bold text-sm">{showToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-heading font-black text-neuro-navy">Practice Profile</h1>
          <p className="text-neuro-gray mt-2 text-lg">Your public identity and clinical visibility settings.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveModal('Notifications')}
            className="px-6 py-4 bg-white border border-gray-200 text-neuro-navy font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <Bell className="w-4 h-4" /> Notification Settings
          </button>
          <Link 
            href={`/directory/${profile?.slug || '#'}`}
            target="_blank"
            className="bg-neuro-navy text-white px-8 py-4 rounded-2xl shadow-xl hover:bg-neuro-navy-light transition-all transform hover:scale-105 flex items-center gap-3"
          >
            <ExternalLink className="w-5 h-5" />
            <span className="font-black uppercase tracking-widest text-sm">View Public Profile</span>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Data Entry */}
        <div className="lg:col-span-2 space-y-8">
          <form onSubmit={handleUpdateProfile} className="space-y-8">
             {/* Profile Header Card */}
             <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-neuro-orange/5 blur-3xl -mr-32 -mt-32"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                   <div className="relative">
                      <div className="w-40 h-40 rounded-[2.5rem] bg-neuro-cream overflow-hidden border-4 border-white shadow-xl">
                         {profile?.photo_url || profile?.avatar_url ? (
                           <img src={profile?.photo_url || profile?.avatar_url || ''} alt="Clinic" className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center">
                              <Building2 className="w-16 h-16 text-gray-300" />
                           </div>
                         )}
                      </div>
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={saving}
                        className="absolute -bottom-4 -right-4 p-4 bg-neuro-orange text-white rounded-2xl shadow-xl hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                         {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        className="hidden" 
                        accept="image/*"
                      />
                   </div>
                   
                   <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                         <h2 className="text-3xl font-heading font-black text-neuro-navy">
                           {profile?.clinic_name || "Untitled Clinic"}
                         </h2>
                         {profile?.verification_status === 'verified' && (
                           <div className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 border border-green-100">
                              <ShieldCheck className="w-3 h-3" /> Verified Clinic
                           </div>
                         )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 font-medium">
                         <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-neuro-orange" /> {profile?.city || 'Location'}, {profile?.state || 'State'}</span>
                         <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-blue-500" /> {profile?.website_url || "No website"}</span>
                      </div>
                   </div>
                </div>
             </div>

             {/* Bio Section */}
             <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                   <h3 className="text-xl font-heading font-black text-neuro-navy flex items-center gap-3">
                      <FileText className="w-6 h-6 text-neuro-orange" />
                      Clinic Vision & Bio
                   </h3>
                   <button 
                    type="button"
                    onClick={handleAIMagicWrite}
                    disabled={isGeneratingBio}
                    className="px-4 py-2 bg-neuro-navy text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-neuro-orange transition-all flex items-center gap-2 shadow-lg shadow-neuro-navy/10"
                   >
                      {isGeneratingBio ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      AI Magic Write
                   </button>
                </div>
                <textarea 
                  name="bio"
                  value={profile?.bio || ""}
                  onChange={(e) => setProfile((p: any) => ({ ...p, bio: e.target.value }))}
                  rows={6}
                  placeholder="Tell the NeuroChiro network about your clinical focus..."
                  className="w-full p-8 bg-gray-50 border border-gray-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 transition-all text-sm leading-relaxed"
                />
             </div>

             {/* Core Details Grid */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-sm space-y-6">
                   <h3 className="text-xl font-heading font-black text-neuro-navy">Clinic Information</h3>
                   <div className="space-y-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Clinic Name</label>
                         <input name="clinic_name" defaultValue={profile?.clinic_name || ''} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Website URL</label>
                         <input name="website" defaultValue={profile?.website_url || ''} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none" />
                      </div>
                   </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-sm space-y-6">
                   <h3 className="text-xl font-heading font-black text-neuro-navy">Location Hub</h3>
                   <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">City</label>
                            <input name="city" defaultValue={profile?.city || ''} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">State</label>
                            <input name="state" defaultValue={profile?.state || ''} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none" />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Country</label>
                         <input name="country" defaultValue={profile?.country || "United States"} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none" />
                      </div>
                   </div>
                </div>
             </div>

             <div className="flex justify-end">
                <button 
                  type="submit"
                  disabled={saving}
                  className="px-12 py-5 bg-neuro-orange text-white font-black rounded-[2rem] shadow-2xl shadow-neuro-orange/30 hover:bg-neuro-orange-light transition-all transform hover:scale-[1.02] active:scale-95 flex items-center gap-3 uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                   Save Profile Updates
                </button>
             </div>
          </form>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-8">
           {/* Profile Strength Card */}
           <section className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-end mb-6">
                 <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Profile Strength</p>
                    <p className="text-4xl font-black text-neuro-navy">{strength}%</p>
                 </div>
                 <div className="text-right">
                    <TrendingUp className="w-6 h-6 text-neuro-orange" />
                 </div>
              </div>
              
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-8">
                 <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${strength}%` }}
                    className="h-full bg-neuro-orange shadow-[0_0_20px_rgba(214,104,41,0.4)]"
                 />
              </div>

              <div className="space-y-4">
                 <p className="text-xs font-bold text-neuro-navy mb-4 uppercase tracking-widest">Network Status Checklist</p>
                 {[
                   { label: "Directory Indexing", status: profile?.clinic_name && profile?.bio ? 'Active' : 'Missing Data', ok: !!(profile?.clinic_name && profile?.bio) },
                   { label: "Geocoding Verification", status: profile?.location_lat ? 'Verified' : 'Pending', ok: !!profile?.location_lat },
                   { label: "ROI Tracking Sync", status: getTierDisplay(profile?.tier || 'starter') === 'pro' ? 'Active' : 'Pro Only', ok: getTierDisplay(profile?.tier || 'starter') === 'pro' }
                 ].map((item, i) => (
                   <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <span className="text-xs font-bold text-neuro-navy">{item.label}</span>
                      <div className="flex items-center gap-2">
                         <span className={`text-[9px] font-black uppercase tracking-widest ${item.ok ? 'text-green-500' : 'text-neuro-orange'}`}>{item.status}</span>
                         {item.ok ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-neuro-orange" />}
                      </div>
                   </div>
                 ))}
              </div>
           </section>

           {/* Real Impact Widget */}
           <section className="bg-neuro-navy rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-neuro-orange/20 blur-3xl -mr-16 -mt-16"></div>
              <div className="relative z-10 space-y-6">
                 <h4 className="font-heading font-black text-xl">Directory Impact</h4>
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                       <p className="text-3xl font-black text-neuro-orange">{profile?.profile_views || 0}</p>
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Profile Views</p>
                    </div>
                    <div>
                       <p className="text-3xl font-black text-white">{profile?.patient_leads || 0}</p>
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Inbound Leads</p>
                    </div>
                 </div>
                 <Link 
                  href="/doctor/analytics"
                  className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl flex items-center justify-center gap-2 transition-all group"
                 >
                    <span className="text-xs font-black uppercase tracking-widest">Performance Reports</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                 </Link>
              </div>
           </section>
        </div>
      </div>

      {/* NOTIFICATION SETTINGS MODAL */}
      <AnimatePresence>
        {activeModal === 'Notifications' && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-neuro-navy/40">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-neuro-navy text-white">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-neuro-orange/20 rounded-2xl flex items-center justify-center text-neuro-orange">
                    <Bell className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl uppercase tracking-tight">Notification Command</h3>
                    <p className="text-[10px] uppercase font-black text-white/50 tracking-widest">Alert Preferences</p>
                  </div>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-10 space-y-8">
                 <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100 group transition-all">
                       <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-2xl shadow-sm text-neuro-orange">
                             <Mail className="w-5 h-5" />
                          </div>
                          <div>
                             <p className="text-sm font-black text-neuro-navy block">New Referral Alerts</p>
                             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Email Notification</p>
                          </div>
                       </div>
                       <button 
                        onClick={() => handleNotificationToggle('email_referrals', !profile?.notification_preferences?.email_referrals)}
                        className={`w-14 h-8 rounded-full transition-all relative ${profile?.notification_preferences?.email_referrals ? 'bg-neuro-orange' : 'bg-gray-200'}`}
                       >
                          <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${profile?.notification_preferences?.email_referrals ? 'left-7' : 'left-1'}`} />
                       </button>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100 group transition-all">
                       <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-2xl shadow-sm text-neuro-navy">
                             <MessageSquare className="w-5 h-5" />
                          </div>
                          <div>
                             <p className="text-sm font-black text-neuro-navy block">Candidate SMS Alerts</p>
                             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Direct to Phone</p>
                          </div>
                       </div>
                       <button 
                        onClick={() => handleNotificationToggle('sms_applications', !profile?.notification_preferences?.sms_applications)}
                        className={`w-14 h-8 rounded-full transition-all relative ${profile?.notification_preferences?.sms_applications ? 'bg-neuro-orange' : 'bg-gray-200'}`}
                       >
                          <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${profile?.notification_preferences?.sms_applications ? 'left-7' : 'left-1'}`} />
                       </button>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100 group transition-all">
                       <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-500">
                             <Zap className="w-5 h-5" />
                          </div>
                          <div>
                             <p className="text-sm font-black text-neuro-navy block">ROI Milestones</p>
                             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">System Intelligence</p>
                          </div>
                       </div>
                       <button 
                        onClick={() => handleNotificationToggle('system_roi_milestones', !profile?.notification_preferences?.system_roi_milestones)}
                        className={`w-14 h-8 rounded-full transition-all relative ${profile?.notification_preferences?.system_roi_milestones ? 'bg-neuro-orange' : 'bg-gray-200'}`}
                       >
                          <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${profile?.notification_preferences?.system_roi_milestones ? 'left-7' : 'left-1'}`} />
                       </button>
                    </div>
                 </div>

                 <button 
                  onClick={() => setActiveModal(null)}
                  className="w-full py-5 bg-neuro-navy text-white font-black rounded-2xl hover:bg-neuro-navy-light transition-all uppercase tracking-widest text-xs"
                 >
                    Close Settings
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
