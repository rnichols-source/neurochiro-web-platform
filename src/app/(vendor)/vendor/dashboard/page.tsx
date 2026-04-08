"use client";

import { 
  BarChart3, 
  Tag, 
  Settings, 
  Eye, 
  MousePointerClick, 
  CheckCircle2, 
  AlertCircle,
  Save,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getVendorDashboardData } from "./actions";
import { updateVendorOffer, updateVendorProfile } from "@/app/actions/vendors";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function VendorDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [offerActive, setOfferActive] = useState(true);
  const [offerForm, setOfferForm] = useState({
    title: "",
    description: "",
    discountType: "",
    discountValue: "",
    redemptionInstructions: "",
    couponCode: "",
    expirationDate: "",
    active: true
  });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    companyName: "",
    website: "",
    shortDescription: "",
    category: "Neurological Tech"
  });
  const [profileSaveStatus, setProfileSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    const fetchData = async () => {
      const result = await getVendorDashboardData();
      if (result) {
        setData(result);
        setOfferForm(result.offer);
        setOfferActive(result.offer.active);
        setProfileForm({
          companyName: result.profile.name || "",
          website: result.profile.website_url || "",
          shortDescription: result.profile.short_description || "",
          category: result.profile.categories?.[0] || "Neurological Tech"
        });
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus("saving");
    
    const result = await updateVendorOffer(offerForm);
    if (result.success) {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } else {
      alert("Failed to save offer: " + result.error);
      setSaveStatus("idle");
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaveStatus("saving");

    const result = await updateVendorProfile(profileForm);
    if (result.success) {
      setProfileSaveStatus("saved");
      setTimeout(() => {
        setProfileSaveStatus("idle");
        setIsEditingProfile(false);
      }, 1500);
    } else {
      alert("Failed to update profile: " + result.error);
      setProfileSaveStatus("idle");
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-neuro-cream">
        <Loader2 className="w-10 h-10 text-neuro-orange animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10 bg-neuro-cream min-h-dvh text-neuro-navy">
      <header className="mb-10">
        <h1 className="text-4xl font-heading font-black">Vendor Command Center</h1>
        <p className="text-gray-500 mt-2 text-lg">Manage your marketplace presence and NeuroChiro Pro offers.</p>
      </header>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Profile Views</p>
            <p className="text-3xl font-black">{data?.stats?.views?.toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Eye className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Outbound Clicks</p>
            <p className="text-3xl font-black">{data?.stats?.clicks?.toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
            <MousePointerClick className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Offer Engagement</p>
            <p className="text-3xl font-black text-neuro-orange">{data?.stats?.engagement?.toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 bg-neuro-orange/10 text-neuro-orange rounded-2xl flex items-center justify-center">
            <Tag className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Partner Offer Management */}
          <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-neuro-navy text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neuro-orange/20 rounded-xl">
                  <Tag className="w-5 h-5 text-neuro-orange" />
                </div>
                <h2 className="text-xl font-heading font-black">NeuroChiro Partner Offer</h2>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                  {offerActive ? "Active" : "Disabled"}
                </span>
                <div 
                  onClick={() => setOfferActive(!offerActive)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${offerActive ? 'bg-neuro-orange' : 'bg-gray-600'}`}
                >
                  <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${offerActive ? 'left-7' : 'left-1'}`}></div>
                </div>
              </label>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Offer Title</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-neuro-orange font-bold text-neuro-navy"
                  value={offerForm.title}
                  onChange={(e) => setOfferForm({...offerForm, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Description</label>
                <textarea 
                  rows={3}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-neuro-orange font-medium text-neuro-navy resize-none"
                  value={offerForm.description}
                  onChange={(e) => setOfferForm({...offerForm, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Coupon Code</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-neuro-orange font-mono font-black text-neuro-orange"
                    value={offerForm.couponCode}
                    onChange={(e) => setOfferForm({...offerForm, couponCode: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Expiration Date</label>
                  <input 
                    type="date" 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-neuro-orange font-bold text-neuro-navy"
                    value={offerForm.expirationDate}
                    onChange={(e) => setOfferForm({...offerForm, expirationDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  type="submit"
                  disabled={saveStatus !== "idle"}
                  className={cn(
                    "px-10 py-4 font-black uppercase tracking-widest text-xs rounded-2xl transition-all flex items-center gap-2 shadow-xl shadow-neuro-navy/10",
                    saveStatus === "idle" ? "bg-neuro-navy text-white hover:bg-neuro-navy-light" : "bg-green-600 text-white"
                  )}
                >
                  {saveStatus === "saving" ? (
                    <>Saving Changes... <Loader2 className="w-4 h-4 animate-spin" /></>
                  ) : saveStatus === "saved" ? (
                    <>Changes Saved <CheckCircle2 className="w-4 h-4" /></>
                  ) : (
                    <>Save Offer Details <Save className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>

        <div className="space-y-8">
          {/* Profile Visibility Score */}
          <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
            <h3 className="font-heading font-black text-lg text-neuro-navy mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" /> Marketplace Pulse
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2 text-xs font-bold">
                  <span className="text-neuro-navy">Profile Strength</span>
                  <span className="text-green-500">92%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-[92%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2 text-xs font-bold">
                  <span className="text-neuro-navy">Engagement Rank</span>
                  <span className="text-neuro-orange">Top 15</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-neuro-orange w-[85%]"></div>
                </div>
              </div>
            </div>
          </section>

          {/* Compliance & Settings */}
          <section className="bg-neuro-navy rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-400" /> Vendor Settings
              </h3>
              <div className="space-y-3">
                <button 
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-left px-4 flex items-center justify-between group transition-all"
                >
                  Edit Public Profile <ChevronRight className={`w-4 h-4 text-gray-500 group-hover:text-white transition-all ${isEditingProfile ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                </button>
                
                {isEditingProfile && (
                  <form onSubmit={handleProfileSave} className="p-4 bg-white/5 rounded-xl space-y-4 border border-white/10 mt-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Company Name</label>
                      <input 
                        type="text" 
                        required
                        className="w-full p-2 bg-white/10 border border-white/20 rounded focus:outline-neuro-orange text-white text-sm"
                        value={profileForm.companyName}
                        onChange={(e) => setProfileForm({...profileForm, companyName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Website</label>
                      <input 
                        type="url" 
                        required
                        className="w-full p-2 bg-white/10 border border-white/20 rounded focus:outline-neuro-orange text-white text-sm"
                        value={profileForm.website}
                        onChange={(e) => setProfileForm({...profileForm, website: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</label>
                      <select 
                        className="w-full p-2 bg-white/10 border border-white/20 rounded focus:outline-neuro-orange text-white text-sm"
                        value={profileForm.category}
                        onChange={(e) => setProfileForm({...profileForm, category: e.target.value})}
                      >
                        <option className="text-black">Neurological Tech</option>
                        <option className="text-black">Practice Management</option>
                        <option className="text-black">EHR Systems</option>
                        <option className="text-black">Marketing</option>
                        <option className="text-black">Equipment</option>
                        <option className="text-black">Supplements</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Short Description</label>
                      <textarea 
                        rows={2}
                        className="w-full p-2 bg-white/10 border border-white/20 rounded focus:outline-neuro-orange text-white text-sm resize-none"
                        value={profileForm.shortDescription}
                        onChange={(e) => setProfileForm({...profileForm, shortDescription: e.target.value})}
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={profileSaveStatus !== "idle"}
                      className="w-full py-2 bg-neuro-orange text-white rounded font-bold text-xs hover:bg-neuro-orange-dark transition-colors"
                    >
                      {profileSaveStatus === "saving" ? "Saving..." : profileSaveStatus === "saved" ? "Saved!" : "Save Profile"}
                    </button>
                  </form>
                )}

                <button 
                  onClick={() => alert("Billing portal integration coming soon.")}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-left px-4 flex items-center justify-between group transition-all"
                >
                  Billing & Subscription <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>
                <button 
                  onClick={() => alert("API keys will be available in V2.")}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-left px-4 flex items-center justify-between group transition-all"
                >
                  API & Integrations <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </div>
          </section>

          {/* Quick Support */}
          <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="font-bold text-neuro-navy mb-1">Need Assistance?</h3>
            <p className="text-xs text-gray-500 mb-6">Our partner success team is here to help you maximize your ROI.</p>
            <button 
              onClick={() => alert("Opening support ticket...")}
              className="text-[10px] font-black text-neuro-orange uppercase tracking-widest hover:underline"
            >
              Contact Success Team
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
