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
  Check
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDoctorTier } from "@/context/DoctorTierContext";

export default function PracticeProfile() {
  const router = useRouter();
  const { tier, isMember, isGrowth, isPro } = useDoctorTier();
  const [isVerified, setIsVerified] = useState(false);
  const [photoUploaded, setPhotoUploaded] = useState(false);

  const profile = {
    name: "West Side Neuro-Life",
    owner: "Dr. Natalie West",
    location: "Phoenix, AZ",
    specialties: ["Pediatrics", "Structural Correction"],
  };

  const membershipLabel = tier.charAt(0).toUpperCase() + tier.slice(1);

  const handleApply = () => {
    router.push("/pricing");
  };

  const handleSignOut = () => {
    document.cookie = "nc_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  const handlePhotoUpload = () => {
    setPhotoUploaded(true);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-heading font-black text-neuro-navy">Practice Profile</h1>
          <p className="text-neuro-gray mt-2 text-lg">Manage your clinic details and network status.</p>
        </div>
        <div className="bg-white/50 border border-neuro-navy/10 px-4 py-2 rounded-full flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full", isMember ? "bg-green-500 animate-pulse" : "bg-gray-400")}></span>
          <span className="text-sm font-bold text-neuro-navy">Status: {isMember ? `${membershipLabel} Member` : 'Non-Member'}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Profile Info */}
          <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
            <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
              <div 
                onClick={handlePhotoUpload}
                className="w-32 h-32 rounded-[2.5rem] bg-gray-100 flex items-center justify-center text-gray-300 border-2 border-dashed border-gray-200 cursor-pointer hover:border-neuro-orange transition-all group overflow-hidden"
              >
                {photoUploaded ? (
                  <div className="w-full h-full bg-neuro-orange/10 flex flex-col items-center justify-center text-neuro-orange">
                    <Check className="w-8 h-8" />
                    <span className="text-[8px] font-black uppercase mt-1">Uploaded</span>
                  </div>
                ) : (
                  <Plus className="w-8 h-8 group-hover:text-neuro-orange" />
                )}
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-bold text-neuro-navy mb-1">{profile.name}</h2>
                <p className="text-gray-500 font-medium mb-4">{profile.owner}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  <span className={cn(
                    "px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest border transition-colors",
                    isMember ? "bg-green-50 text-green-600 border-green-100" : "bg-gray-100 text-gray-400 border-gray-200"
                  )}>
                    {isMember ? "Verified Clinic" : "Non-Member Clinic"}
                  </span>
                  <button 
                    onClick={() => setIsVerified(!isVerified)}
                    className={cn(
                      "px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest border transition-all",
                      isVerified ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-neuro-navy/5 text-neuro-navy text-neuro-navy/10 hover:bg-neuro-navy/10"
                    )}
                  >
                    {isVerified ? "Verification Complete" : "Verification Pending"}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> Clinic Location
                </label>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-neuro-navy flex items-center justify-between">
                  {profile.location}
                  <button className="text-[10px] text-neuro-orange hover:underline font-black uppercase">Edit</button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest flex items-center gap-2">
                   Clinical Focus
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                   {profile.specialties.map((spec, i) => (
                     <span key={i} className="px-3 py-1 bg-neuro-cream rounded-full text-[10px] font-black uppercase text-neuro-navy border border-neuro-navy/5">
                        {spec}
                     </span>
                   ))}
                   <button className="px-3 py-1 bg-gray-50 text-gray-400 text-[10px] font-black rounded-full uppercase border border-dashed border-gray-200 hover:border-neuro-orange hover:text-neuro-orange transition-all">
                      + Add
                   </button>
                </div>
              </div>
            </div>

            {!isMember && (
              <div className="mt-10 p-6 bg-orange-50 rounded-3xl border border-orange-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-neuro-orange rounded-2xl flex items-center justify-center text-white">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-neuro-navy">Visibility Locked</h4>
                      <p className="text-xs text-gray-500">Become a member to list your clinic on the public directory.</p>
                    </div>
                </div>
                <button 
                  onClick={handleApply}
                  className="px-6 py-3 bg-neuro-navy text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-neuro-navy-light transition-all whitespace-nowrap"
                >
                    Apply Now
                </button>
              </div>
            )}
          </section>

          {/* Membership Benefits Grid */}
          <section className="space-y-6">
             <h3 className="text-2xl font-heading font-black text-neuro-navy text-center">Why join the NeuroChiro network?</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: "Public Directory", desc: "List your clinic on our global 'Find a Doctor' map.", icon: Search, link: "/directory" },
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
          {!isMember && (
            <section className="bg-gradient-to-br from-neuro-navy to-neuro-navy-dark rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-neuro-orange/20 blur-3xl -mr-16 -mt-16"></div>
              <div className="relative z-10 text-center">
                <Sparkles className="w-10 h-10 text-neuro-orange mx-auto mb-6" />
                <h3 className="text-2xl font-heading font-black mb-4">Elevate Your Practice</h3>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                  The world's premier ecosystem for nervous-system-first chiropractic care.
                </p>
                
                <div className="space-y-3 mb-8">
                  {[
                    "Verified Clinic Badge",
                    "Search Optimization",
                    "Student Matching",
                    "Clinical Masterminds"
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-bold text-gray-300 justify-center">
                        <CheckCircle2 className="w-4 h-4 text-neuro-orange" /> {text}
                    </div>
                  ))}
                </div>

                <button 
                  onClick={handleApply}
                  className="w-full py-4 bg-neuro-orange text-white font-black rounded-2xl hover:bg-neuro-orange-light transition-all shadow-xl shadow-neuro-orange/20"
                >
                  Apply for Full Access
                </button>
              </div>
            </section>
          )}

          <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
             <h4 className="font-bold text-neuro-navy mb-4">Account Settings</h4>
             <div className="space-y-2">
                <Link href="/doctor/billing" className="w-full py-3 text-left px-4 hover:bg-gray-50 rounded-xl text-sm font-bold text-neuro-navy transition-colors flex items-center gap-3">
                   <CreditCard className="w-4 h-4 text-gray-400" /> Payment Methods
                </Link>
                <button className="w-full py-3 text-left px-4 hover:bg-gray-50 rounded-xl text-sm font-bold text-neuro-navy transition-colors flex items-center gap-3">
                   <Bell className="w-4 h-4 text-gray-400" /> Notification Settings
                </button>
                <button 
                  onClick={handleSignOut}
                  className="w-full py-3 text-left px-4 hover:bg-red-50 rounded-xl text-sm font-bold text-red-500 transition-colors flex items-center gap-3"
                >
                   <LogOut className="w-4 h-4" /> Sign Out
                </button>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// Helper function for conditional classes
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
