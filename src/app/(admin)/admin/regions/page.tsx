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
  X,
  Loader2,
  CheckCircle2,
  Server
} from "lucide-react";
import { useState, useEffect } from "react";
import { 
  getRegionalStats, 
  getGlobalSettings, 
  toggleGlobalSetting, 
  addRegion, 
  getSupportMetrics, 
  triggerCDNSync 
} from "./actions";

export default function RegionalControl() {
  const [isAddRegionModalOpen, setIsAddRegionModalOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<any>(null);
  const [isAssignRoleModalOpen, setIsAssignRoleModalOpen] = useState(false);
  
  // Data States
  const [loading, setLoading] = useState(true);
  const [regions, setRegions] = useState<any[]>([]);
  const [stats, setStats] = useState<Record<string, any>>({});
  const [settings, setSettings] = useState({ strictIsolation: true, crossBorder: false });
  const [supportMetrics, setSupportMetrics] = useState({ complianceTickets: 0, licensingReviews: 0 });
  const [syncing, setSyncing] = useState(false);

  // New Region Form State
  const [newRegionData, setNewRegionData] = useState({ name: "", code: "", currency: "USD", admin: "" });
  const [addingRegion, setAddingRegion] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      
      const [statsRes, settingsRes, supportRes] = await Promise.all([
        getRegionalStats(),
        getGlobalSettings(),
        getSupportMetrics()
      ]);

      if (statsRes.success) {
        setRegions(statsRes.regions || []);
        setStats(statsRes.stats || {});
      }
      
      if (settingsRes.success) {
        setSettings(settingsRes.settings || { strictIsolation: true, crossBorder: false });
      }

      if (supportRes.success) {
        setSupportMetrics({
          complianceTickets: supportRes.complianceTickets || 0,
          licensingReviews: supportRes.licensingReviews || 0
        });
      }

      setLoading(false);
    }

    loadDashboardData();
  }, []);

  const handleToggleIsolation = async () => {
    const newValue = !settings.strictIsolation;
    // Optimistic update
    setSettings(prev => ({ ...prev, strictIsolation: newValue }));
    await toggleGlobalSetting('strictIsolation', newValue);
  };

  const handleToggleCrossBorder = async () => {
    const newValue = !settings.crossBorder;
    // Optimistic update
    setSettings(prev => ({ ...prev, crossBorder: newValue }));
    await toggleGlobalSetting('crossBorder', newValue);
  };

  const handleSyncCDN = async () => {
    setSyncing(true);
    await triggerCDNSync();
    setSyncing(false);
    alert("Global CDN has been synchronized across all edge nodes.");
  };

  const handleAddRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRegionData.name || !newRegionData.code) {
      alert("Please provide at least a Region Name and Code.");
      return;
    }

    setAddingRegion(true);
    const res = await addRegion(newRegionData);
    
    if (res.success) {
      // Refresh the stats to include the new region
      const statsRes = await getRegionalStats();
      if (statsRes.success) {
        setRegions(statsRes.regions || []);
        setStats(statsRes.stats || {});
      }
      setIsAddRegionModalOpen(false);
      setNewRegionData({ name: "", code: "", currency: "USD", admin: "" });
    }
    setAddingRegion(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-neuro-orange">
          <Loader2 className="w-12 h-12 animate-spin" />
          <p className="font-black uppercase tracking-widest text-xs">Initializing Infrastructure...</p>
        </div>
      </div>
    );
  }

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
              <h3 className="text-xl font-heading font-black text-white flex items-center gap-3">
                <Server className="w-5 h-5 text-gray-400" /> Active Regional Nodes
              </h3>
              <span className="px-4 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                All Nodes Online
              </span>
            </div>
            <div className="divide-y divide-white/5">
              {regions.length === 0 ? (
                 <div className="p-12 text-center text-gray-500">No regional nodes configured.</div>
              ) : (
                regions.map((regionConfig, i) => {
                  const regionStats = stats[regionConfig.code] || { admin: "None", users: "0", revenue: "$0", status: "Inactive" };
                  return (
                    <div key={i} className="p-8 flex items-center justify-between hover:bg-white/5 transition-all group">
                      <div className="flex items-center gap-8">
                        <div className="w-16 h-16 rounded-3xl bg-neuro-navy flex items-center justify-center text-neuro-orange shadow-lg border border-white/10">
                          <MapPin className="w-8 h-8" />
                        </div>
                        <div>
                          <h4 className="text-2xl font-black text-white mb-1 flex items-center gap-3">
                            {regionConfig.name}
                            <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded text-gray-400 tracking-widest uppercase">{regionConfig.code}</span>
                          </h4>
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-blue-500" /> Admin: <span className="text-gray-200">{regionStats.admin}</span>
                            </span>
                            <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                              <Users className="w-3 h-3 text-emerald-500" /> <span className="text-gray-200">{regionStats.users} Users</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">MTD Revenue</p>
                          <p className="text-xl font-black text-white">{regionStats.revenue}</p>
                        </div>
                        <button 
                          onClick={() => setSelectedRegion({ ...regionConfig, ...regionStats })}
                          className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:bg-neuro-orange transition-all active:scale-90 border border-white/10"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
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
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                {settings.strictIsolation 
                  ? "Regional data is strictly isolated to comply with GDPR, HIPAA, and AU Privacy Laws." 
                  : "Data residency rules are currently relaxed. Data may cross regional boundaries."}
              </p>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-xs font-black uppercase text-gray-500 tracking-widest">Status</span>
                {settings.strictIsolation ? (
                  <span className="text-xs font-black text-blue-500 uppercase flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Compliant
                  </span>
                ) : (
                  <span className="text-xs font-black text-amber-500 uppercase flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Mixed Mode
                  </span>
                )}
              </div>
            </section>
            
            <section className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white">Access Control</h3>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                Regional Admins can {settings.strictIsolation ? "only access data and users within their assigned geo-fence." : "currently access cross-border user data."}
              </p>
              <button 
                onClick={() => setIsAssignRoleModalOpen(true)}
                className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" /> Audit Admin Permissions
              </button>
            </section>
          </div>
        </div>

        {/* Settings Sidebar */}
        <div className="space-y-8">
          <section className="bg-neuro-navy rounded-[3rem] p-10 shadow-2xl relative overflow-hidden border border-white/5">
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
                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-all duration-300 ${settings.strictIsolation ? 'bg-neuro-orange' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${settings.strictIsolation ? 'right-1' : 'left-1'}`}></div>
                  </div>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">Prevents any user data from being visible outside its home region. Required for full compliance.</p>
              </div>

              <div className="space-y-4 pt-8 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-white">Cross-Border Referrals</p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold mt-1 tracking-widest">Allow Global Network</p>
                  </div>
                  <div 
                    onClick={handleToggleCrossBorder}
                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-all duration-300 ${settings.crossBorder ? 'bg-neuro-orange' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${settings.crossBorder ? 'right-1' : 'left-1'}`}></div>
                  </div>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">Allows doctors to refer patients to verified clinics in other regions globally.</p>
              </div>

              <button 
                onClick={handleSyncCDN}
                disabled={syncing}
                className="w-full mt-8 py-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 group hover:bg-white/10 transition-all disabled:opacity-50"
              >
                {syncing ? <Loader2 className="w-5 h-5 text-neuro-orange animate-spin" /> : <Zap className="w-5 h-5 text-neuro-orange" />}
                <span className="text-xs font-black uppercase tracking-widest text-white">
                  {syncing ? "Synchronizing..." : "Sync Global CDN"}
                </span>
              </button>
            </div>
          </section>

          <section className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8">
            <h3 className="text-lg font-black text-white mb-6">Regional Support Hub</h3>
            <div className="space-y-4">
              <button className="w-full p-4 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl border border-white/5 flex items-center justify-between group">
                <span className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors">Compliance Tickets</span>
                {supportMetrics.complianceTickets > 0 ? (
                  <span className="px-3 py-1 bg-neuro-orange/20 border border-neuro-orange/30 text-neuro-orange rounded-lg text-[10px] font-black shadow-sm">
                    {supportMetrics.complianceTickets} Open
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-500/10 text-gray-500 rounded-lg text-[10px] font-black">All Clear</span>
                )}
              </button>
              
              <button className="w-full p-4 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl border border-white/5 flex items-center justify-between group">
                <span className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors">Licensing Reviews</span>
                {supportMetrics.licensingReviews > 0 ? (
                  <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-[10px] font-black shadow-sm">
                    {supportMetrics.licensingReviews} Pending
                  </span>
                ) : (
                   <span className="px-3 py-1 bg-gray-500/10 text-gray-500 rounded-lg text-[10px] font-black">All Clear</span>
                )}
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* MODALS */}

      {/* Add Region Modal */}
      {isAddRegionModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-neuro-navy/60">
          <div className="bg-[#0A0D14] rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/10 p-10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-white flex items-center gap-3">
                <Globe className="w-6 h-6 text-neuro-orange" /> Add Global Region
              </h3>
              <button onClick={() => setIsAddRegionModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full"><X className="text-gray-500" /></button>
            </div>
            <form onSubmit={handleAddRegion} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Region Name</label>
                <input 
                  required
                  value={newRegionData.name}
                  onChange={e => setNewRegionData({...newRegionData, name: e.target.value})}
                  placeholder="e.g. European Union" 
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-neuro-orange transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Region Code (ISO)</label>
                <input 
                  required
                  maxLength={2}
                  value={newRegionData.code}
                  onChange={e => setNewRegionData({...newRegionData, code: e.target.value.toUpperCase()})}
                  placeholder="e.g. EU" 
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-neuro-orange transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Primary Currency</label>
                <select 
                  value={newRegionData.currency}
                  onChange={e => setNewRegionData({...newRegionData, currency: e.target.value})}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none appearance-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="AUD">AUD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Assign Admin (Optional)</label>
                <input 
                  value={newRegionData.admin}
                  onChange={e => setNewRegionData({...newRegionData, admin: e.target.value})}
                  placeholder="Admin Username or Email" 
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-neuro-orange transition-all" 
                />
              </div>
              <button 
                type="submit"
                disabled={addingRegion}
                className="w-full py-5 bg-neuro-orange text-white font-black rounded-2xl uppercase tracking-widest text-sm shadow-xl shadow-neuro-orange/20 mt-4 hover:bg-neuro-orange-light transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {addingRegion ? <Loader2 className="w-5 h-5 animate-spin" /> : "Initialize Node"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Region Details Modal */}
      {selectedRegion && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-neuro-navy/60">
          <div className="bg-[#0A0D14] rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-white/10">
            <div className="p-10 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-black text-white flex items-center gap-3">
                  {selectedRegion.name}
                  <span className="text-[10px] bg-white/10 px-3 py-1 rounded-lg text-gray-300 tracking-widest uppercase border border-white/10">
                    {selectedRegion.code}
                  </span>
                </h3>
                <p className="text-xs font-black text-neuro-orange uppercase tracking-[0.2em] mt-2">Regional Management Node</p>
              </div>
              <button onClick={() => setSelectedRegion(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="text-gray-500" /></button>
            </div>
            <div className="p-10 grid grid-cols-2 gap-8">
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3 text-blue-500" /> Regional Admin
                </p>
                <p className="text-lg font-bold text-white">{selectedRegion.admin}</p>
              </div>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Database className="w-3 h-3 text-emerald-500" /> MTD Revenue
                </p>
                <p className="text-lg font-bold text-white">{selectedRegion.revenue}</p>
              </div>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Users className="w-3 h-3 text-purple-500" /> Active Users
                </p>
                <p className="text-lg font-bold text-white">{selectedRegion.users}</p>
              </div>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Server className="w-3 h-3 text-neuro-orange" /> Node Status
                </p>
                <p className="text-lg font-bold text-green-500 flex items-center gap-2">
                   <CheckCircle2 className="w-4 h-4" /> {selectedRegion.status}
                </p>
              </div>
              <div className="col-span-2 pt-6 border-t border-white/5">
                <button className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                  <LayoutDashboard className="w-4 h-4 text-neuro-orange" /> Enter Regional Dashboard Environment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Audit Modal */}
      {isAssignRoleModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-neuro-navy/60">
          <div className="bg-[#0A0D14] rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden border border-white/10">
            <div className="p-10 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                  <Lock className="w-6 h-6 text-purple-500" /> Admin Permissions Audit
                </h3>
                <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mt-2">Verify Access Control & Scopes</p>
              </div>
              <button onClick={() => setIsAssignRoleModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="text-gray-500" /></button>
            </div>
            
            <div className="overflow-x-auto max-h-[50vh]">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-[10px] font-black text-gray-500 uppercase tracking-widest sticky top-0 backdrop-blur-md">
                  <tr>
                    <th className="px-8 py-5 border-b border-white/5">Administrator</th>
                    <th className="px-8 py-5 border-b border-white/5 text-center">Assigned Scope</th>
                    <th className="px-8 py-5 border-b border-white/5">Permissions</th>
                    <th className="px-8 py-5 border-b border-white/5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-white">Raymond Nichols</p>
                      <p className="text-[10px] text-gray-500">raymond@neurochiro.com</p>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="px-3 py-1.5 bg-neuro-orange/20 text-neuro-orange border border-neuro-orange/30 rounded-lg text-[9px] font-black uppercase tracking-widest">
                        Global
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs text-gray-300">Full System Architecture, Billing, Logic</span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="text-xs font-bold text-green-500 flex items-center justify-center gap-1"><ShieldCheck className="w-3 h-3"/> Active</span>
                    </td>
                  </tr>
                  {regions.filter(r => r.admin !== 'Unassigned').map((r, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-white">{r.admin}</p>
                        <p className="text-[10px] text-gray-500">admin.{r.code.toLowerCase()}@neurochiro.com</p>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest">
                          Region: {r.code}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs text-gray-300">Local Users, Local Billing, Support</span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="text-xs font-bold text-green-500 flex items-center justify-center gap-1"><ShieldCheck className="w-3 h-3"/> Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 bg-white/[0.02] border-t border-white/5 flex justify-end gap-4">
               <button className="px-6 py-3 border border-white/10 rounded-xl text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                 Export Access Log
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
