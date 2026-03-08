"use client";

import { 
  Globe, 
  ShieldCheck, 
  MapPin, 
  Users, 
  Plus, 
  ChevronRight, 
  ArrowRight,
  Database,
  Lock,
  Zap,
  LayoutDashboard,
  X
} from "lucide-react";
import { useState } from "react";
import { onSettingsToggleAction } from "@/app/actions/automations";

export default function RegionalControl() {
  const [isAddRegionModalOpen, setIsAddRegionModalOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<any>(null);
  const [isAssignRoleModalOpen, setIsAssignRoleModalOpen] = useState(false);
  const [strictIsolation, setStrictIsolation] = useState(true);
  const [crossBorder, setCrossBorder] = useState(false);

  const regions = [
    { name: "North America", admin: "Admin_US", users: "8.4k", revenue: "$240k", status: "Active" },
    { name: "Australia", admin: "Admin_AU", users: "2.1k", revenue: "$85k", status: "Active" },
    { name: "United Kingdom", admin: "Admin_UK", users: "1.2k", revenue: "$42k", status: "Pending" }
  ];

  const handleToggleIsolation = () => {
    const newValue = !strictIsolation;
    setStrictIsolation(newValue);
    onSettingsToggleAction("super-admin", "Strict Regional Isolation", newValue);
  };

  const handleToggleCrossBorder = () => {
    const newValue = !crossBorder;
    setCrossBorder(newValue);
    onSettingsToggleAction("super-admin", "Cross-Border Referrals", newValue);
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-neuro-orange">
            <Globe className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-white">Global Infrastructure</span>
          </div>
          <h1 className="text-4xl font-heading font-black text-white">Regional Control Center</h1>
          <p className="text-gray-400 mt-2 text-lg font-medium">Manage cross-border data isolation, regional admins, and local compliance.</p>
        </div>
        
        <button 
          onClick={() => setIsAddRegionModalOpen(true)}
          className="bg-neuro-orange text-white px-8 py-4 rounded-2xl shadow-xl hover:bg-neuro-orange-light transition-all transform hover:scale-105 flex items-center gap-3 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span className="font-black uppercase tracking-widest text-sm">Add New Region</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Region List */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-heading font-black text-white text-center">Active Regional Nodes</h3>
              <span className="px-4 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black uppercase tracking-widest">All Nodes Online</span>
            </div>
            <div className="divide-y divide-white/5">
              {regions.map((region, i) => (
                <div key={i} className="p-8 flex items-center justify-between hover:bg-white/5 transition-all group">
                  <div className="flex items-center gap-8">
                    <div className="w-16 h-16 rounded-3xl bg-neuro-navy flex items-center justify-center text-neuro-orange shadow-lg">
                      <MapPin className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-white mb-1">{region.name}</h4>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Admin: {region.admin}
                        </span>
                        <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                          <Users className="w-3 h-3" /> {region.users} Users
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Mtd Revenue</p>
                      <p className="text-xl font-black text-white">{region.revenue}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedRegion(region)}
                      className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:bg-neuro-orange hover:text-white transition-all active:scale-90"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Infrastructure Health */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white">Data Residency</h3>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">Regional data is isolated by default to comply with GDPR, HIPAA, and AU Privacy Laws.</p>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-xs font-black uppercase text-gray-500 tracking-widest">Status</span>
                <span className="text-xs font-black text-blue-500 uppercase">Compliant</span>
              </div>
            </section>
            <section className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white">Access Control</h3>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">Regional Admins can only access data and users within their assigned geo-fence.</p>
              <button 
                onClick={() => setIsAssignRoleModalOpen(true)}
                className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
              >
                Audit Admin Permissions
              </button>
            </section>
          </div>
        </div>

        {/* Settings Sidebar */}
        <div className="space-y-8">
          <section className="bg-neuro-navy rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neuro-orange/10 blur-3xl -mr-16 -mt-16"></div>
            <h3 className="text-2xl font-heading font-black text-white mb-8">Global Logic</h3>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-white">Strict Isolation</p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold mt-1 tracking-widest">Enforce Geo-Fencing</p>
                  </div>
                  <div 
                    onClick={handleToggleIsolation}
                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-all duration-300 ${strictIsolation ? 'bg-neuro-orange' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${strictIsolation ? 'right-1' : 'left-1'}`}></div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">Prevents any user data from being visible outside its home region.</p>
              </div>

              <div className="space-y-4 pt-8 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-white">Cross-Border Referrals</p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold mt-1 tracking-widest">Allow Global Network</p>
                  </div>
                  <div 
                    onClick={handleToggleCrossBorder}
                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-all duration-300 ${crossBorder ? 'bg-neuro-orange' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${crossBorder ? 'right-1' : 'left-1'}`}></div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">Allows doctors to refer patients to verified clinics in other regions.</p>
              </div>

              <button className="w-full mt-8 py-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 group hover:bg-white/10 transition-all">
                <Zap className="w-5 h-5 text-neuro-orange" />
                <span className="text-xs font-black uppercase tracking-widest text-white">Sync Global CDN</span>
              </button>
            </div>
          </section>

          <section className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8">
            <h3 className="text-lg font-black text-white mb-6">Regional Support</h3>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400">Compliance Tickets</span>
                <span className="px-2 py-1 bg-neuro-orange/20 text-neuro-orange rounded-md text-[10px] font-black">12 Open</span>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400">Licensing Reviews</span>
                <span className="px-2 py-1 bg-blue-500/20 text-blue-500 rounded-md text-[10px] font-black">4 Pending</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* MODALS */}
      {isAddRegionModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-neuro-navy/40">
          <div className="bg-[#0A0D14] rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/10 p-10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-white">Add Global Region</h3>
              <button onClick={() => setIsAddRegionModalOpen(false)}><X className="text-gray-500" /></button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Region Name</label>
                <input placeholder="e.g. European Union" className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-neuro-orange" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Primary Currency</label>
                <select className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none appearance-none">
                  <option>USD ($)</option>
                  <option>AUD ($)</option>
                  <option>EUR (€)</option>
                  <option>GBP (£)</option>
                </select>
              </div>
              <button className="w-full py-5 bg-neuro-orange text-white font-black rounded-2xl uppercase tracking-widest text-sm shadow-xl shadow-neuro-orange/20 mt-4">Initialize Node</button>
            </div>
          </div>
        </div>
      )}

      {selectedRegion && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-neuro-navy/40">
          <div className="bg-[#0A0D14] rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-white/10">
            <div className="p-10 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-black text-white">{selectedRegion.name}</h3>
                <p className="text-xs font-black text-neuro-orange uppercase tracking-[0.2em] mt-1">Regional Management</p>
              </div>
              <button onClick={() => setSelectedRegion(null)}><X className="text-gray-500" /></button>
            </div>
            <div className="p-10 grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Regional Admin</p>
                <p className="text-lg font-bold text-white">{selectedRegion.admin}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">MTD Revenue</p>
                <p className="text-lg font-bold text-white">{selectedRegion.revenue}</p>
              </div>
              <div className="col-span-2 pt-6 border-t border-white/5">
                <button className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                  <LayoutDashboard className="w-4 h-4" /> Switch to Regional View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
