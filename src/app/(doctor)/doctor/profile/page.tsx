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
  FileText
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
    website: "",
    bio: "",
    specialties: [] as string[],
    avatar_url: "",
    subscription_status: ""
  });

  useEffect(() => {
    async function loadProfile() {
      const data = await getDoctorProfile();
      if (data) {
        setProfileData({
          full_name: data.full_name || "",
          clinic_name: data.clinic_name || "",
          location_city: data.location_city || "",
          website: data.website_url || data.website || "",
          bio: data.bio || "",
          specialties: data.specialties || [],
          avatar_url: data.avatar_url || data.photo_url || "",
          subscription_status: data.subscription_status || ""
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
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('full_name', profileData.full_name);
      formData.append('clinic_name', profileData.clinic_name);
      formData.append('city', profileData.location_city);
      formData.append('website', profileData.website);
      formData.append('bio', profileData.bio);
      formData.append('specialties', profileData.specialties.join(','));

      await updateDoctorProfile(formData);
      setSuccess(true);
      setHasChanges(false);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
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
      setProfileData(prev => ({ ...prev, avatar_url: result.publicUrl }));
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to upload photo");
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
        <div>
          <h1 className="text-4xl font-heading font-black text-neuro-navy">Practice Profile</h1>
          <p className="text-neuro-gray mt-2 text-lg">Manage your clinic details and network status.</p>
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
            <span className={cn("w-2 h-2 rounded-full", profileData.subscription_status === 'active' ? "bg-green-500 animate-pulse" : "bg-gray-400")}></span>
            <span className="text-sm font-bold text-neuro-navy">Status: {profileData.subscription_status === 'active' ? `${membershipLabel} Member` : 'Inactive'}</span>
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

            <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-32 h-32 rounded-[2.5rem] bg-gray-50 flex items-center justify-center text-gray-300 border-2 border-dashed border-gray-200 cursor-pointer hover:border-neuro-orange transition-all group overflow-hidden"
              >
                {profileData.avatar_url ? (
                  <>
                    <img src={profileData.avatar_url} alt="Clinic" className="w-full h-full object-cover" />
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
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Practitioner Name</label>
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
                    profileData.subscription_status === 'active' ? "bg-green-50 text-green-600 border-green-100" : "bg-gray-100 text-gray-400 border-gray-200"
                  )}>
                    {profileData.subscription_status === 'active' ? "Verified Clinic" : "Verification Pending"}
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
                  placeholder="e.g. Austin, TX"
                />
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
                  <button 
                    type="button"
                    onClick={handleGenerateBio}
                    className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-neuro-orange hover:text-neuro-orange-light transition-colors bg-neuro-orange/5 px-3 py-1.5 rounded-lg border border-neuro-orange/20"
                  >
                    <Sparkles className="w-3 h-3" /> AI Magic Write
                  </button>
                </div>
                <textarea 
                  value={profileData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-medium text-neuro-navy focus:ring-2 focus:ring-neuro-orange/20 focus:border-neuro-orange/30 outline-none transition-all min-h-[150px]"
                  placeholder="Share your clinical philosophy and how you help patients reach their outcomes..."
                />
                <p className="text-[9px] text-gray-400 italic">Pro Tip: Focus on outcomes, not just techniques. Patients want results.</p>
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

            <div className="mt-12 flex items-center justify-between pt-8 border-t border-gray-50">
              <p className="text-xs text-gray-400 font-medium italic">Changes update immediately in the global directory.</p>
              <button 
                type="submit"
                disabled={saving || !hasChanges}
                className="px-8 py-4 bg-neuro-orange text-white font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-neuro-orange-dark transition-all disabled:opacity-50 flex items-center gap-3 shadow-lg shadow-neuro-orange/20"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Practice Profile
              </button>
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
                  { title: "Exclusive Events", desc: "Member-only rates for masterminds and seminars.", icon: Calendar, link: "/doctor/seminars" }
                ].map((item, i) => (
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
