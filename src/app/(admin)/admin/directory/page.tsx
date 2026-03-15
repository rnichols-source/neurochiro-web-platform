"use client";

import { 
  Stethoscope, 
  Search, 
  MapPin, 
  Globe, 
  Mail, 
  ChevronRight, 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  Loader2,
  Building2,
  ShieldCheck,
  MoreVertical,
  Plus
} from "lucide-react";
import { useState, useEffect } from "react";
import { getAllDoctors, updateDoctorManually, deleteDoctorManually } from "./actions";
import { motion, AnimatePresence } from "framer-motion";

export default function DirectoryManager() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async (query?: string) => {
    setLoading(true);
    try {
      const data = await getAllDoctors(query);
      setDoctors(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDoctors(searchQuery);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    setIsUpdating(true);
    
    // Surgical update object to avoid sending primary keys or metadata columns
    const updates = {
      first_name: selectedDoctor.first_name,
      last_name: selectedDoctor.last_name,
      email: selectedDoctor.email,
      slug: selectedDoctor.slug,
      clinic_name: selectedDoctor.clinic_name,
      address: selectedDoctor.address,
      city: selectedDoctor.city,
      state: selectedDoctor.state,
      country: selectedDoctor.country,
      latitude: parseFloat(selectedDoctor.latitude) || 0,
      longitude: parseFloat(selectedDoctor.longitude) || 0,
      bio: selectedDoctor.bio,
      website_url: selectedDoctor.website_url,
      instagram_url: selectedDoctor.instagram_url,
      verification_status: selectedDoctor.verification_status,
      membership_tier: selectedDoctor.membership_tier
    };

    const res = await updateDoctorManually(selectedDoctor.id, updates);
    if (res.success) {
      alert("Doctor profile updated successfully.");
      setSelectedDoctor(null);
      fetchDoctors(searchQuery);
    } else {
      alert("Error: " + res.error);
    }
    setIsUpdating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this doctor? This action cannot be undone.")) return;
    
    // Optimistic update
    const previousDoctors = [...doctors];
    setDoctors(doctors.filter(d => d.id !== id));
    
    const res = await deleteDoctorManually(id);
    if (!res.success) {
      alert("Error: " + res.error);
      setDoctors(previousDoctors); // Rollback
    } else {
      // Refresh to ensure everything is in sync
      fetchDoctors(searchQuery);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 text-white min-h-screen">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-neuro-orange">
            <Stethoscope className="w-5 h-5" />
            <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-white">Clinical Operations</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-black">Directory Manager</h1>
          <p className="text-gray-400 mt-2 text-base md:text-lg font-medium">Manually edit, verify, or remove listings from the global network.</p>
        </div>

        <form onSubmit={handleSearch} className="relative w-full lg:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, clinic, or email..."
            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-neuro-orange transition-all"
          />
        </form>
      </header>

      <section className="bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        {loading && (
          <div className="absolute inset-0 bg-neuro-navy/40 backdrop-blur-[2px] z-50 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-neuro-orange animate-spin" />
          </div>
        )}

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/[0.03]">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">Doctor & Clinic</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">Location</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">Tier</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right border-b border-white/5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {doctors.length === 0 && !loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-gray-500 font-bold uppercase tracking-widest text-xs">
                    No clinical listings found.
                  </td>
                </tr>
              ) : (
                doctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-white/[0.03] transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-neuro-navy border border-white/5 flex items-center justify-center text-neuro-orange font-black text-xl shadow-lg shrink-0">
                          {doc.last_name?.[0] || 'D'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white text-lg truncate">Dr. {doc.first_name} {doc.last_name}</p>
                          <p className="text-xs text-gray-500 truncate">{doc.clinic_name || 'No Clinic Name'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-gray-400">
                        <MapPin className="w-3 h-3 text-neuro-orange shrink-0" />
                        <span className="text-xs font-medium truncate">{doc.city}, {doc.state || doc.country}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/5 ${
                        doc.verification_status === 'verified' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                        doc.verification_status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-gray-500/10 text-gray-500'
                      }`}>
                        {doc.verification_status}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                        {doc.membership_tier}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setSelectedDoctor({...doc})}
                          className="p-3 bg-white/5 hover:bg-neuro-orange text-white rounded-xl transition-all border border-white/5 shadow-xl"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(doc.id)}
                          className="p-3 bg-white/5 hover:bg-red-500 text-white rounded-xl transition-all border border-white/5 shadow-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {selectedDoctor && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 backdrop-blur-md bg-neuro-navy/60">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0A0D14] rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden border border-white/10 max-h-[90vh] flex flex-col"
            >
              <header className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6 min-w-0">
                  <div className="w-16 h-16 rounded-[2rem] bg-neuro-navy flex items-center justify-center text-neuro-orange font-black text-3xl shadow-xl border border-white/10 shrink-0">
                    {selectedDoctor.last_name?.[0] || 'D'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-2xl font-black text-white truncate">Edit Clinical Profile</h3>
                    <p className="text-[10px] font-black text-neuro-orange uppercase tracking-[0.2em] mt-1 truncate">Doctor ID: {selectedDoctor.id}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedDoctor(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-500 shrink-0">
                  <X className="w-8 h-8" />
                </button>
              </header>

              <form onSubmit={handleUpdate} className="flex-1 overflow-y-auto p-8 md:p-10 space-y-10 custom-scrollbar">
                {/* 1. Core Identity */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2 ml-2">Identity & Contact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-600 uppercase ml-4">First Name</label>
                      <input 
                        value={selectedDoctor.first_name || ""}
                        onChange={(e) => setSelectedDoctor({...selectedDoctor, first_name: e.target.value})}
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-neuro-orange outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-600 uppercase ml-4">Last Name</label>
                      <input 
                        value={selectedDoctor.last_name || ""}
                        onChange={(e) => setSelectedDoctor({...selectedDoctor, last_name: e.target.value})}
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-neuro-orange outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-600 uppercase ml-4">Email Address</label>
                      <input 
                        value={selectedDoctor.email || ""}
                        onChange={(e) => setSelectedDoctor({...selectedDoctor, email: e.target.value})}
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-neuro-orange outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-600 uppercase ml-4">Directory Slug</label>
                      <input 
                        value={selectedDoctor.slug || ""}
                        onChange={(e) => setSelectedDoctor({...selectedDoctor, slug: e.target.value})}
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-neuro-orange outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Clinical Info */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2 ml-2">Practice Details</h4>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-600 uppercase ml-4">Clinic Name</label>
                      <input 
                        value={selectedDoctor.clinic_name || ""}
                        onChange={(e) => setSelectedDoctor({...selectedDoctor, clinic_name: e.target.value})}
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-neuro-orange outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-600 uppercase ml-4">Full Address</label>
                      <textarea 
                        value={selectedDoctor.address || ""}
                        onChange={(e) => setSelectedDoctor({...selectedDoctor, address: e.target.value})}
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-neuro-orange outline-none h-24 resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-600 uppercase ml-4">City</label>
                        <input 
                          value={selectedDoctor.city || ""}
                          onChange={(e) => setSelectedDoctor({...selectedDoctor, city: e.target.value})}
                          className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-neuro-orange outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-600 uppercase ml-4">State</label>
                        <input 
                          value={selectedDoctor.state || ""}
                          onChange={(e) => setSelectedDoctor({...selectedDoctor, state: e.target.value})}
                          className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-neuro-orange outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-600 uppercase ml-4">Country</label>
                        <input 
                          value={selectedDoctor.country || ""}
                          onChange={(e) => setSelectedDoctor({...selectedDoctor, country: e.target.value})}
                          className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-neuro-orange outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Map Data */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2 ml-2">Mapping & Coordinates</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-600 uppercase ml-4">Latitude</label>
                      <input 
                        type="number" step="any"
                        value={selectedDoctor.latitude || 0}
                        onChange={(e) => setSelectedDoctor({...selectedDoctor, latitude: e.target.value})}
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-neuro-orange outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-600 uppercase ml-4">Longitude</label>
                      <input 
                        type="number" step="any"
                        value={selectedDoctor.longitude || 0}
                        onChange={(e) => setSelectedDoctor({...selectedDoctor, longitude: e.target.value})}
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-neuro-orange outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Bio & Socials */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2 ml-2">Profile Content</h4>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-600 uppercase ml-4">Biography</label>
                      <textarea 
                        value={selectedDoctor.bio || ""}
                        onChange={(e) => setSelectedDoctor({...selectedDoctor, bio: e.target.value})}
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-neuro-orange outline-none h-48 resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-600 uppercase ml-4">Website URL</label>
                        <input 
                          value={selectedDoctor.website_url || ""}
                          onChange={(e) => setSelectedDoctor({...selectedDoctor, website_url: e.target.value})}
                          className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-neuro-orange outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-600 uppercase ml-4">Instagram URL</label>
                        <input 
                          value={selectedDoctor.instagram_url || ""}
                          onChange={(e) => setSelectedDoctor({...selectedDoctor, instagram_url: e.target.value})}
                          className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-neuro-orange outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Status & Governance */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2 ml-2">Governance</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-600 uppercase ml-4">Verification Status</label>
                      <select 
                        value={selectedDoctor.verification_status}
                        onChange={(e) => setSelectedDoctor({...selectedDoctor, verification_status: e.target.value})}
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-neuro-orange outline-none text-white"
                      >
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                        <option value="hidden">Hidden</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-600 uppercase ml-4">Membership Tier</label>
                      <select 
                        value={selectedDoctor.membership_tier}
                        onChange={(e) => setSelectedDoctor({...selectedDoctor, membership_tier: e.target.value})}
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-neuro-orange outline-none text-white"
                      >
                        <option value="starter">Starter</option>
                        <option value="growth">Growth</option>
                        <option value="pro">Pro</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 pt-8 pb-4 bg-[#0A0D14] flex justify-end gap-4 border-t border-white/5">
                  <button 
                    type="button"
                    onClick={() => setSelectedDoctor(null)}
                    className="px-8 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isUpdating}
                    className="px-10 py-4 bg-neuro-orange text-white rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs shadow-xl shadow-neuro-orange/20 hover:bg-neuro-orange-light transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {isUpdating ? "Saving Changes..." : "Commit Profile Updates"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
