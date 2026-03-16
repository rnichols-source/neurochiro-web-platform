"use client";

import { 
  Building2, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Plus,
  Lock,
  Zap,
  Star,
  Search,
  Users,
  Calendar,
  LogOut,
  CreditCard,
  Bell,
  Check,
  Loader2,
  Camera,
  Globe,
  User,
  Save,
  AlertCircle,
  FileText,
  Target
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDoctorTier } from "@/context/DoctorTierContext";
import { getDoctorProfile, updateDoctorProfile, uploadAvatar } from "./actions";
import { motion, AnimatePresence } from "framer-motion";

export default function PracticeProfile() {
  const router = useRouter();
  const { tier, isMember, setTier } = useDoctorTier();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [profileData, setProfileData] = useState({
    full_name: "",
    clinic_name: "",
    location_city: "",
    location_state: "",
    location_country: "United States",
    website: "",
    bio: "",
    specialties: [] as string[],
    photo_url: "",
    tier: "",
    video_url: "",
    seo_keywords: ""
  });

  // Calculate real-time profile strength
  const calculateStrength = () => {
    let score = 0;
    if (profileData.full_name) score += 15;
    if (profileData.clinic_name) score += 15;
    if (profileData.location_city && profileData.location_state) score += 10;
    if (profileData.website) score += 10;
    if (profileData.bio && profileData.bio.length > 50) score += 20;
    if (profileData.specialties.length > 0) score += 10;
    if (profileData.photo_url) score += 20;
    return score;
  };

  const strengthScore = calculateStrength();

  useEffect(() => {
    async function loadProfile() {
      const data = await getDoctorProfile();
      if (data) {
        setProfileData({
          full_name: data.full_name || "",
          clinic_name: data.clinic_name || "",
          location_city: data.city || data.location_city || "",
          location_state: data.state || "",
          location_country: data.country || "United States",
          website: data.website_url || data.website || "",
          bio: data.bio || "",
          specialties: data.specialties || [],
          photo_url: data.photo_url || data.avatar_url || "",
          tier: data.tier || "free",
          video_url: data.video_url || "",
          seo_keywords: data.seo_keywords || ""
        });
        // Sync context tier if it differs
        if (data.subscription_tier) setTier(data.subscription_tier);
      }
      setLoading(false);
    }
    loadProfile();
  }, [setTier]);

  const handleInputChange = (field: string, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setSuccess(false);
  };

  const handleGenerateBio = () => {
    const clinic = profileData.clinic_name || "our clinic";
    const name = profileData.full_name || "Dr. Chiropractic";
    const generatedBio = `${name} at ${clinic} specializes in nervous system-centric care. We focus on optimizing the master controller of the body to help our patients achieve extraordinary health outcomes. By addressing the root cause of neurological interference, we empower our community to live without limits and express their full potential.`;
    handleInputChange('bio', generatedBio);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation Logic
    if (!profileData.full_name || !profileData.clinic_name || !profileData.location_city || !profileData.location_state) {
      setError("Mandatory fields missing: Name, Clinic, City, and State are required.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (profileData.bio.length < 50) {
      setError("Your Bio is too short. Patients need to understand your clinical philosophy (min 50 chars).");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('full_name', profileData.full_name);
      formData.append('clinic_name', profileData.clinic_name);
      formData.append('city', profileData.location_city);
      formData.append('state', profileData.location_state);
      formData.append('country', profileData.location_country);
      formData.append('website', profileData.website);
      formData.append('bio', profileData.bio);
      formData.append('specialties', profileData.specialties.join(','));
      formData.append('video_url', profileData.video_url);
      formData.append('seo_keywords', profileData.seo_keywords);

      const result = await updateDoctorProfile(formData);
      
      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(true);
      setHasChanges(false);
      setError(null);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError("A critical error occurred while saving. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await uploadAvatar(formData);
      
      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.success && result.publicUrl) {
        setProfileData(prev => ({ ...prev, photo_url: result.publicUrl }));
        setSuccess(true);
        setError(null);
      }
    } catch (err: any) {
      setError("A critical error occurred while uploading. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    document.cookie = "nc_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  const membershipLabel = tier.charAt(0).toUpperCase() + tier.slice(1);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-neuro-orange mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-neuro-navy">Syncing Clinical Data...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-4xl font-heading font-black text-neuro-navy">Practice Profile</h1>
          <p className="text-neuro-gray mt-2 text-lg">Manage your clinic details and network status.</p>
          
          {/* Profile Strength Gamification */}
          <div className="mt-6 max-w-xs">
            <div className="flex justify-between items-center mb-2">
               <span className="text-[10px] font-black text-neuro-navy uppercase tracking-widest flex items-center gap-2">
                 <Target className="w-3 h-3 text-neuro-orange" /> Profile Strength
               </span>
               <span className={cn("text-xs font-black", strengthScore > 80 ? "text-green-500" : "text-neuro-orange")}>{strengthScore}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
               <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${strengthScore}%` }}
                className={cn("h-full transition-all duration-500", strengthScore > 80 ? "bg-green-500" : "bg-neuro-orange")}
               />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <AnimatePresence>
            {hasChanges && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-2 text-[10px] font-black text-neuro-orange uppercase tracking-widest"
              >
                <AlertCircle className="w-4 h-4" /> Unsaved Changes
              </motion.div>
            )}
          </AnimatePresence>
          <div className="bg-white/50 border border-neuro-navy/10 px-4 py-2 rounded-full flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full", (profileData.tier && profileData.tier !== 'free') ? "bg-green-500 animate-pulse" : "bg-gray-400")}></span>
            <span className="text-sm font-bold text-neuro-navy">Status: {(profileData.tier && profileData.tier !== 'free') ? `${membershipLabel} Member` : 'Inactive'}</span>
          </div>
        </div>
      </header>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 md:p-12 shadow-sm relative overflow-hidden">
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-0 left-0 right-0 p-4 bg-emerald-500 text-white text-center text-[10px] font-black uppercase tracking-[0.3em] z-20"
              >
                Profile Updated Successfully
              </motion.div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-0 left-0 right-0 p-4 bg-red-500 text-white text-center text-[10px] font-black uppercase tracking-[0.3em] z-20"
              >
                {error}
              </motion.div>
            )}

            <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-32 h-32 rounded-[2.5rem] bg-gray-50 flex items-center justify-center text-gray-300 border-2 border-dashed border-gray-200 cursor-pointer hover:border-neuro-orange transition-all group overflow-hidden"
              >
                {profileData.photo_url ? (
                  <>
                    <img loading="lazy" decoding="async" src={profileData.photo_url} alt="Clinic" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-neuro-navy/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Plus className="w-8 h-8 group-hover:text-neuro-orange" />
                    <span className="text-[8px] font-black uppercase">Clinic Photo</span>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
              <div className="flex-1 text-center md:text-left space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Practitioner Name</label>
                    <span className="text-[9px] font-black text-neuro-orange uppercase bg-neuro-orange/5 px-2 py-0.5 rounded-md border border-neuro-orange/10 animate-pulse">
                      Profiles with 5+ photos get 400% more clicks
                    </span>
                  </div>
                  <input 
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    className="w-full text-3xl font-bold text-neuro-navy bg-transparent border-b-2 border-transparent focus:border-neuro-orange focus:outline-none transition-all py-1"
                    placeholder="Dr. Full Name"
                  />
                </div>
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  <span className={cn(
                    "px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest border",
                    (profileData.tier && profileData.tier !== 'free') ? "bg-green-50 text-green-600 border-green-100" : "bg-gray-100 text-gray-400 border-gray-200"
                  )}>
                    {(profileData.tier && profileData.tier !== 'free') ? "Verified Clinic" : "Verification Pending"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest flex items-center gap-2 ml-1">
                  <Building2 className="w-3 h-3" /> Clinic Name
                </label>
                <input 
                  type="text"
                  value={profileData.clinic_name}
                  onChange={(e) => handleInputChange('clinic_name', e.target.value)}
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-neuro-navy focus:ring-2 focus:ring-neuro-orange/20 focus:border-neuro-orange/30 outline-none transition-all"
                  placeholder="Clinic Name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest flex items-center gap-2 ml-1">
                  <MapPin className="w-3 h-3" /> Location (City)
                </label>
                <input 
                  type="text"
                  value={profileData.location_city}
                  onChange={(e) => handleInputChange('location_city', e.target.value)}
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-neuro-navy focus:ring-2 focus:ring-neuro-orange/20 focus:border-neuro-orange/30 outline-none transition-all"
                  placeholder="e.g. Austin"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest flex items-center gap-2 ml-1">
                    State / Province
                  </label>
                  <input 
                    type="text"
                    value={profileData.location_state}
                    onChange={(e) => handleInputChange('location_state', e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-neuro-navy focus:ring-2 focus:ring-neuro-orange/20 focus:border-neuro-orange/30 outline-none transition-all"
                    placeholder="e.g. TX"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest flex items-center gap-2 ml-1">
                    Country
                  </label>
                  <input 
                    type="text"
                    value={profileData.location_country}
                    onChange={(e) => handleInputChange('location_country', e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-neuro-navy focus:ring-2 focus:ring-neuro-orange/20 focus:border-neuro-orange/30 outline-none transition-all"
                    placeholder="e.g. United States"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest flex items-center gap-2 ml-1">
                  <Globe className="w-3 h-3" /> Clinic Website
                </label>
                <input 
                  type="url"
                  value={profileData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-neuro-navy focus:ring-2 focus:ring-neuro-orange/20 focus:border-neuro-orange/30 outline-none transition-all"
                  placeholder="https://..."
                />
              </div>

              {/* Bio Section with AI Magic Button */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest flex items-center gap-2 ml-1">
                    <FileText className="w-3 h-3" /> The Patient Magnet Script (Bio)
                  </label>
                  <div className="flex items-center gap-4">
                    <span className={cn("text-[9px] font-bold", profileData.bio.length > 500 ? "text-red-500" : "text-gray-400")}>
                      {profileData.bio.length} / 500 chars
                    </span>
                    <button 
                      type="button"
                      onClick={handleGenerateBio}
                      className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-neuro-orange hover:text-neuro-orange-light transition-colors bg-neuro-orange/5 px-3 py-1.5 rounded-lg border border-neuro-orange/20"
                    >
                      <Sparkles className="w-3 h-3" /> AI Magic Write
                    </button>
                  </div>
                </div>
                <textarea 
                  value={profileData.bio}
                  maxLength={500}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-medium text-neuro-navy focus:ring-2 focus:ring-neuro-orange/20 focus:border-neuro-orange/30 outline-none transition-all min-h-[150px]"
                  placeholder="Share your clinical philosophy and how you help patients reach their outcomes..."
                />
                <p className="text-[9px] text-gray-400 italic">Pro Tip: Focus on outcomes, not just techniques. Patients want results.</p>
              </div>

              {/* Pro-Only Advanced Sections */}
              <div className="md:col-span-2 pt-8 border-t border-gray-50">
                <h3 className="text-sm font-black text-neuro-navy uppercase tracking-widest mb-6 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-neuro-orange" /> Advanced Authority Tools
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2 relative">
                    {tier !== 'pro' && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200">
                        <Lock className="w-4 h-4 text-gray-400 mb-1" />
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Elite Pro Only</span>
                      </div>
                    )}
                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest flex items-center gap-2 ml-1">
                       Video Introduction URL
                    </label>
                    <input 
                      type="url"
                      disabled={tier !== 'pro'}
                      value={profileData.video_url}
                      onChange={(e) => handleInputChange('video_url', e.target.value)}
                      className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-neuro-navy outline-none"
                      placeholder="YouTube or Vimeo Link"
                    />
                  </div>
                  <div className="space-y-2 relative">
                    {tier !== 'pro' && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200">
                        <Lock className="w-4 h-4 text-gray-400 mb-1" />
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Elite Pro Only</span>
                      </div>
                    )}
                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest flex items-center gap-2 ml-1">
                       Custom SEO Keywords
                    </label>
                    <input 
                      type="text"
                      disabled={tier !== 'pro'}
                      value={profileData.seo_keywords}
                      onChange={(e) => handleInputChange('seo_keywords', e.target.value)}
                      className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-neuro-navy outline-none"
                      placeholder="e.g. scoliosis Austin, pediatric chiro"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest flex items-center gap-2 ml-1">
                   Clinical Focus
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                   {profileData.specialties.map((spec, i) => (
                     <span key={i} className="px-3 py-1 bg-neuro-cream rounded-full text-[10px] font-black uppercase text-neuro-navy border border-neuro-navy/5 flex items-center gap-2">
                        {spec}
                        <button 
                          type="button"
                          onClick={() => handleInputChange('specialties', profileData.specialties.filter((_, idx) => idx !== i))}
                          className="hover:text-red-500"
                        >
                          &times;
                        </button>
                     </span>
                   ))}
                   <button 
                    type="button"
                    onClick={() => {
                      const s = prompt("Add specialty:");
                      if (s) handleInputChange('specialties', [...profileData.specialties, s]);
                    }}
                    className="px-3 py-1 bg-gray-50 text-gray-400 text-[10px] font-black rounded-full uppercase border border-dashed border-gray-200 hover:border-neuro-orange hover:text-neuro-orange transition-all"
                   >
                      + Add
                   </button>
                </div>
              </div>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-gray-50">
              <p className="text-xs text-gray-400 font-medium italic order-2 sm:order-1">Changes update immediately in the global directory.</p>
              <div className="flex items-center gap-4 w-full sm:w-auto order-1 sm:order-2">
                <button 
                  type="submit"
                  disabled={saving || !hasChanges}
                  className="w-full sm:w-auto px-10 py-5 bg-neuro-orange text-white font-black rounded-2xl uppercase tracking-widest text-[11px] hover:bg-neuro-orange-dark transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-neuro-orange/30 active:scale-95"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Clinical Profile
                </button>
              </div>
            </div>
          </section>

          {/* Membership Benefits Grid */}
          <section className="space-y-6">
             <h3 className="text-2xl font-heading font-black text-neuro-navy text-center">Your Network Access</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: "Public Directory", desc: "Your profile is optimized for patient search traffic.", icon: Search, link: "/directory" },
                  { title: "Elite Recruiting", desc: "Connect with students who have high readiness scores.", icon: Users, link: "/doctor/students" },
                  { title: "Global Referrals", desc: "Get high-intent referrals from other network doctors.", icon: Zap, link: "/doctor/directory" },
                  { title: "Exclusive Events", desc: "Member-only rates for masterminds and seminars.", icon: Calendar, link: "/host-a-seminar" }                ].map((item, i) => (
                  <Link href={item.link} key={i} className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm flex items-start gap-4 hover:border-neuro-orange/30 transition-all group">
                     <div className="p-3 bg-neuro-orange/5 rounded-2xl text-neuro-orange group-hover:bg-neuro-orange group-hover:text-white transition-colors">
                        <item.icon className="w-5 h-5" />
                     </div>
                     <div>
                        <h4 className="font-bold text-neuro-navy mb-1">{item.title}</h4>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                     </div>
                  </Link>
                ))}
             </div>
          </section>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
             <h4 className="font-bold text-neuro-navy mb-4">Account Control</h4>
             <div className="space-y-2">
                <Link href="/doctor/billing" className="w-full py-3 text-left px-4 hover:bg-gray-50 rounded-xl text-sm font-bold text-neuro-navy transition-colors flex items-center gap-3">
                   <CreditCard className="w-4 h-4 text-gray-400" /> Subscription & Billing
                </Link>
                <button type="button" className="w-full py-3 text-left px-4 hover:bg-gray-50 rounded-xl text-sm font-bold text-neuro-navy transition-colors flex items-center gap-3">
                   <Bell className="w-4 h-4 text-gray-400" /> Notification Settings
                </button>
                <button 
                  type="button"
                  onClick={handleSignOut}
                  className="w-full py-3 text-left px-4 hover:bg-red-50 rounded-xl text-sm font-bold text-red-500 transition-colors flex items-center gap-3"
                >
                   <LogOut className="w-4 h-4" /> Sign Out
                </button>
             </div>
          </section>

          <section className="bg-neuro-cream/30 rounded-[2rem] border border-neuro-navy/5 p-8">
            <h4 className="font-black text-neuro-navy uppercase tracking-widest text-[10px] mb-4">Network Status</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">Directory Indexing</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">Geocoding Verification</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">ROI Tracking</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
