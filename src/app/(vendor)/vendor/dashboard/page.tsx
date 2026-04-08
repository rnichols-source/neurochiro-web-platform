"use client";

import { Tag, Settings, Eye, MousePointerClick, CheckCircle2, Save, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getVendorDashboardData } from "./actions";
import { updateVendorOffer, updateVendorProfile } from "@/app/actions/vendors";

export default function VendorDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [offerForm, setOfferForm] = useState({ title: "", description: "", discountType: "", discountValue: "", redemptionInstructions: "", couponCode: "", expirationDate: "", active: true });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ companyName: "", website: "", shortDescription: "", category: "Neurological Tech" });
  const [profileSaveStatus, setProfileSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    const fetchData = async () => {
      const result = await getVendorDashboardData();
      if (result) {
        setData(result);
        setOfferForm(result.offer);
        setProfileForm({ companyName: result.profile.name || "", website: result.profile.website_url || "", shortDescription: result.profile.short_description || "", category: result.profile.categories?.[0] || "Neurological Tech" });
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
      setTimeout(() => { setProfileSaveStatus("idle"); setIsEditingProfile(false); }, 1500);
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
    <div className="p-10 max-w-5xl mx-auto space-y-10 bg-neuro-cream min-h-dvh text-neuro-navy">
      <header>
        <h1 className="text-4xl font-heading font-black">Vendor Dashboard</h1>
        <p className="text-gray-500 mt-2">Manage your marketplace listing and offers.</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Profile Views</p>
            <p className="text-3xl font-black">{data?.stats?.views?.toLocaleString() ?? 0}</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Eye className="w-6 h-6" /></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Outbound Clicks</p>
            <p className="text-3xl font-black">{data?.stats?.clicks?.toLocaleString() ?? 0}</p>
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center"><MousePointerClick className="w-6 h-6" /></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Offer Engagement</p>
            <p className="text-3xl font-black text-neuro-orange">{data?.stats?.engagement?.toLocaleString() ?? 0}</p>
          </div>
          <div className="w-12 h-12 bg-neuro-orange/10 text-neuro-orange rounded-2xl flex items-center justify-center"><Tag className="w-6 h-6" /></div>
        </div>
      </div>

      {/* Offer Management */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 bg-neuro-navy text-white flex items-center gap-3">
          <Tag className="w-5 h-5 text-neuro-orange" />
          <h2 className="text-xl font-heading font-black">Partner Offer</h2>
        </div>
        <form onSubmit={handleSave} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Offer Title</label>
            <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-neuro-orange font-bold text-neuro-navy" value={offerForm.title} onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Description</label>
            <textarea rows={3} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-neuro-orange font-medium text-neuro-navy resize-none" value={offerForm.description} onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Coupon Code</label>
              <input type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-neuro-orange font-mono font-black text-neuro-orange" value={offerForm.couponCode} onChange={(e) => setOfferForm({ ...offerForm, couponCode: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Expiration Date</label>
              <input type="date" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-neuro-orange font-bold text-neuro-navy" value={offerForm.expirationDate} onChange={(e) => setOfferForm({ ...offerForm, expirationDate: e.target.value })} />
            </div>
          </div>
          <div className="pt-4 flex justify-end">
            <button type="submit" disabled={saveStatus !== "idle"} className={`px-10 py-4 font-black uppercase tracking-widest text-xs rounded-2xl transition-all flex items-center gap-2 shadow-xl shadow-neuro-navy/10 ${saveStatus === "idle" ? "bg-neuro-navy text-white hover:bg-neuro-navy-light" : "bg-green-600 text-white"}`}>
              {saveStatus === "saving" ? (<>Saving... <Loader2 className="w-4 h-4 animate-spin" /></>) : saveStatus === "saved" ? (<>Saved <CheckCircle2 className="w-4 h-4" /></>) : (<>Save Offer <Save className="w-4 h-4" /></>)}
            </button>
          </div>
        </form>
      </section>

      {/* Profile Settings */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button onClick={() => setIsEditingProfile(!isEditingProfile)} className="w-full p-8 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-heading font-black">Edit Public Profile</h2>
          </div>
          <span className="text-xs text-gray-400">{isEditingProfile ? "Close" : "Expand"}</span>
        </button>
        {isEditingProfile && (
          <form onSubmit={handleProfileSave} className="p-8 pt-0 space-y-4 border-t border-gray-100">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Company Name</label>
              <input type="text" required className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold" value={profileForm.companyName} onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Website</label>
              <input type="url" required className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold" value={profileForm.website} onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</label>
              <select className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold" value={profileForm.category} onChange={(e) => setProfileForm({ ...profileForm, category: e.target.value })}>
                <option>Neurological Tech</option>
                <option>Practice Management</option>
                <option>EHR Systems</option>
                <option>Marketing</option>
                <option>Equipment</option>
                <option>Supplements</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Short Description</label>
              <textarea rows={2} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm resize-none" value={profileForm.shortDescription} onChange={(e) => setProfileForm({ ...profileForm, shortDescription: e.target.value })} />
            </div>
            <button type="submit" disabled={profileSaveStatus !== "idle"} className="px-8 py-3 bg-neuro-orange text-white rounded-xl font-bold text-xs hover:bg-neuro-orange-dark transition-colors">
              {profileSaveStatus === "saving" ? "Saving..." : profileSaveStatus === "saved" ? "Saved!" : "Save Profile"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
