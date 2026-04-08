"use client";

import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Calendar, 
  Briefcase, 
  UserPlus, 
  Flag,
  Search,
  Filter,
  ChevronRight,
  Eye,
  X,
  Loader2,
  FileText,
  Activity,
  UserCheck,
  ShieldX
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  getModerationData,
  resolveAlert,
  toggleModerationSetting,
  updateComplianceGuidelines,
  moderateDoctor
} from "./actions";
import { getPendingStories, approvePatientStory, rejectPatientStory } from "@/app/actions/patient-stories";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function ModerationCenter() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  const [isGuidelinesModalOpen, setIsGuidelinesModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [moderating, setModerating] = useState<string | null>(null);
  const [pendingStories, setPendingStories] = useState<any[]>([]);
  const [storyActioning, setStoryActioning] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    getPendingStories().then(setPendingStories);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const res = await getModerationData();
    if (res.success) {
      setData(res.data);
    } else {
      console.error(res.error);
    }
    setLoading(false);
  };

  const handleModerationAction = async (action: 'Dismiss' | 'Escalate' | 'Resolve') => {
    if (!selectedAlert) return;
    setResolving(selectedAlert.id);
    
    const res = await resolveAlert(selectedAlert.id, action);
    if (res.success) {
      await fetchData(); 
      setSelectedAlert(null);
    }
    setResolving(null);
  };

  const handleModerateDoctor = async (doctorId: string, action: 'approve' | 'reject' | 'flag') => {
    setModerating(doctorId);
    const res = await moderateDoctor(doctorId, action);
    if (res.success) {
      await fetchData();
    } else {
      alert(`Moderation Error: ${res.error}`);
    }
    setModerating(null);
  };

  const handleToggleAutoApprove = async () => {
    if (!data) return;
    const newValue = !data.settings.autoApprove;
    setData({ ...data, settings: { ...data.settings, autoApprove: newValue } });
    await toggleModerationSetting('autoApprove', newValue);
  };

  const handleToggleScanLinks = async () => {
    if (!data) return;
    const newValue = !data.settings.outboundScan;
    setData({ ...data, settings: { ...data.settings, outboundScan: newValue } });
    await toggleModerationSetting('outboundScan', newValue);
  };

  const handleSaveGuidelines = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateComplianceGuidelines("Updated policies");
    setIsGuidelinesModalOpen(false);
    alert("Compliance Guidelines successfully updated and logged.");
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-red-500">
          <Loader2 className="w-12 h-12 animate-spin" />
          <p className="font-black uppercase tracking-widest text-xs">Initializing Integrity Systems...</p>
        </div>
      </div>
    );
  }

  const filteredAlerts = data?.alerts?.filter((alert: any) => 
    alert.type.toLowerCase().includes(searchQuery.toLowerCase()) || 
    alert.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
    alert.reason.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 md:space-y-8 overflow-x-hidden">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 text-white">
        <div>
          <div className="flex items-center gap-2 mb-2 text-red-500">
            <ShieldAlert className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-white">Platform Integrity</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-black">Moderation Center</h1>
          <p className="text-gray-400 mt-2 text-sm md:text-lg font-medium max-w-2xl">Protect the ecosystem through rapid content review and policy enforcement.</p>
        </div>
        
        <button 
          onClick={() => setIsGuidelinesModalOpen(true)}
          className="bg-white/5 border border-white/10 text-white px-6 md:px-8 py-4 rounded-2xl hover:bg-white/10 transition-all font-black uppercase tracking-widest text-[10px] md:text-sm active:scale-95 flex items-center justify-center gap-3"
        >
          <FileText className="w-4 h-4 md:w-5 md:h-5" /> Compliance Guidelines
        </button>
      </header>

      {/* CEO Health Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "Verified Doctors", value: data?.healthMetrics?.verifiedDoctors || 0, icon: UserCheck, color: "text-blue-500" },
          { label: "Unverified Profiles", value: data?.healthMetrics?.unverifiedDoctors || 0, icon: ShieldX, color: "text-neuro-orange" },
          { label: "Fraud Attempt Rate", value: data?.healthMetrics?.fraudAttemptRate || "0%", icon: AlertTriangle, color: "text-red-500" },
          { label: "Vendor Compliance", value: data?.healthMetrics?.vendorCompliance || "0%", icon: Briefcase, color: "text-emerald-500" }
        ].map((item, i) => (
          <section key={i} className="bg-white/5 border border-white/5 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 flex items-center justify-center ${item.color}`}>
                <item.icon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
            </div>
            <p className="text-xs md:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1 truncate">{item.label}</p>
            <p className="text-xl md:text-2xl font-black text-white">{item.value}</p>
          </section>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Verification Queues & Alerts */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            {data?.queues.map((q: any, i: number) => {
              const Icon = q.id === 'doctors' ? UserPlus : q.id === 'seminars' ? Calendar : Briefcase;
              return (
                <section 
                  key={i} 
                  onClick={() => setSelectedQueue(selectedQueue === q.id ? null : q.id)}
                  className={`bg-white/5 border rounded-[1.5rem] md:rounded-2xl p-6 md:p-8 hover:border-neuro-orange/30 transition-all cursor-pointer group active:scale-95 ${selectedQueue === q.id ? 'border-neuro-orange/50 bg-neuro-orange/5' : 'border-white/5'}`}
                >
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/5 flex items-center justify-center mb-4 md:mb-6 ${q.color}`}>
                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <h3 className="text-[10px] md:text-sm font-black text-gray-400 uppercase tracking-widest mb-1">{q.name}</h3>
                  <div className="flex items-end justify-between">
                    <p className="text-3xl md:text-4xl font-black text-white">{q.count}</p>
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-600 group-hover:text-neuro-orange transition-colors" />
                  </div>
                </section>
              );
            })}
          </div>

          {/* Review Queue Items */}
          <AnimatePresence mode="wait">
            {selectedQueue === 'doctors' && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/5 border border-white/5 rounded-[2rem] md:rounded-2xl overflow-hidden"
              >
                <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-blue-500/5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg md:text-xl font-heading font-black text-white">Doctor Application Queue</h3>
                  </div>
                  <button onClick={() => setSelectedQueue(null)} className="text-gray-500 hover:text-white"><X className="w-6 h-6" /></button>
                </div>
                <div className="divide-y divide-white/5">
                  {data?.queues.find((q: any) => q.id === 'doctors')?.items?.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 font-bold uppercase tracking-widest text-xs">
                      No pending applications in this region.
                    </div>
                  ) : (
                    data?.queues.find((q: any) => q.id === 'doctors')?.items?.map((item: any) => (
                      <div key={item.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/5 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-neuro-navy flex items-center justify-center text-neuro-orange font-black text-xl">
                            {item.last_name?.[0] || 'D'}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-lg">Dr. {item.first_name} {item.last_name}</h4>
                            <p className="text-xs text-gray-500">{item.clinic_name} • {item.city}, {item.state}</p>
                            <p className="text-xs text-gray-600 uppercase font-black mt-1">Applied {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleModerateDoctor(item.id, 'approve')}
                            disabled={moderating === item.id}
                            className="flex-1 md:flex-none px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {moderating === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Approve
                          </button>
                          <button 
                            onClick={() => handleModerateDoctor(item.id, 'flag')}
                            disabled={moderating === item.id}
                            className="flex-1 md:flex-none px-4 py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                             <Flag className="w-3 h-3" /> Flag
                          </button>
                          <button 
                            onClick={() => handleModerateDoctor(item.id, 'reject')}
                            disabled={moderating === item.id}
                            className="flex-1 md:flex-none px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                             <ShieldX className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Active Alerts */}
          <section className="bg-white/5 border border-white/5 rounded-[2rem] md:rounded-2xl overflow-hidden">
            <div className="p-6 md:p-8 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-lg md:text-xl font-heading font-black text-white">Security Alerts</h3>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter alerts..." 
                  className="w-full pl-10 md:pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs focus:outline-none focus:border-neuro-orange text-white" 
                />
              </div>
            </div>
            <div className="divide-y divide-white/5">
              {filteredAlerts.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-4 opacity-50" />
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No incidents detected.</p>
                </div>
              ) : (
                filteredAlerts.map((alert: any, i: number) => (
                  <div key={i} className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-white/5 transition-all group gap-4">
                    <div className="flex items-center gap-4 md:gap-6 min-w-0">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                        <Flag className={`w-4 h-4 md:w-5 md:h-5 ${alert.status === 'Critical' ? 'text-red-500' : 'text-orange-500'}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs md:text-xs font-black uppercase tracking-widest ${alert.status === 'Critical' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>{alert.status}</span>
                          <span className="text-xs md:text-[10px] text-gray-500 whitespace-nowrap">• {formatDistanceToNow(new Date(alert.date), { addSuffix: true })}</span>
                        </div>
                        <h4 className="font-bold text-sm md:text-base text-white truncate">{alert.type}: {alert.source}</h4>
                        <p className="text-[10px] md:text-xs text-gray-400 mt-1 truncate">{alert.reason}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedAlert(alert)}
                      className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-white hover:bg-neuro-orange transition-all active:scale-95 shrink-0"
                    >
                      Resolve
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Global Logic Sidebar */}
        <div className="space-y-6 md:space-y-8">
          <section className="bg-neuro-navy rounded-[2rem] md:rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden border border-white/5">
            <h3 className="text-xl md:text-2xl font-heading font-black text-white mb-6 md:mb-8">System Logic</h3>
            <div className="space-y-6 md:space-y-8">
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white truncate">Auto-Approve Applications</p>
                    <p className="text-xs md:text-[10px] text-gray-500 uppercase font-bold mt-1 tracking-widest truncate">Bypass Manual Review</p>
                  </div>
                  <div 
                    onClick={handleToggleAutoApprove}
                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-all duration-300 shrink-0 ${data?.settings.autoApprove ? 'bg-green-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${data?.settings.autoApprove ? 'right-1' : 'left-1'}`}></div>
                  </div>
                </div>
                <p className="text-[10px] md:text-xs text-gray-500 leading-relaxed">If disabled, all new registrations require manual admin verification before entering the directory.</p>
              </div>

              <div className="space-y-3 md:space-y-4 pt-6 md:pt-8 border-t border-white/5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white truncate">Outbound Link Scan</p>
                    <p className="text-xs md:text-[10px] text-gray-500 uppercase font-bold mt-1 tracking-widest truncate">Automated Security</p>
                  </div>
                  <div 
                    onClick={handleToggleScanLinks}
                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-all duration-300 shrink-0 ${data?.settings.outboundScan ? 'bg-neuro-orange' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${data?.settings.outboundScan ? 'right-1' : 'left-1'}`}></div>
                  </div>
                </div>
                <p className="text-[10px] md:text-xs text-gray-500 leading-relaxed">Automatically checks clinic websites and vendor links for broken URLs, malicious redirects, or phishing risks.</p>
              </div>
            </div>
          </section>

          <section className="bg-white/5 border border-white/5 rounded-[2rem] md:rounded-2xl p-6 md:p-8 text-white">
            <h3 className="text-base md:text-lg font-black mb-4 md:mb-6">Moderator Workload</h3>
            <div className="space-y-3 md:space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                <span className="text-[10px] md:text-xs font-bold text-gray-400">Total Flagged Items</span>
                <span className="text-sm font-black text-white">{data?.summary.totalFlagged}</span>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                <span className="text-[10px] md:text-xs font-bold text-gray-400">Resolved & Cleared</span>
                <span className="text-sm font-black text-green-500">{data?.summary.totalCleared}</span>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                <span className="text-[10px] md:text-xs font-bold text-gray-400">Pending Investigations</span>
                <span className="text-sm font-black text-orange-500">{data?.summary.pendingInvestigations}</span>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                <span className="text-[10px] md:text-xs font-bold text-gray-400">Escalated to Super Admin</span>
                <span className="text-sm font-black text-red-500">{data?.summary.escalated}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ALERT RESOLUTION MODAL */}
      <AnimatePresence>
        {selectedAlert && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 backdrop-blur-md bg-neuro-navy/60">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0A0D14] rounded-[2rem] md:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-white/10"
            >
              <div className="p-6 md:p-10 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-white">Resolve Incident</h3>
                  <p className="text-[10px] md:text-xs font-black text-neuro-orange uppercase tracking-[0.2em] mt-1">{selectedAlert.type}</p>
                </div>
                <button onClick={() => setSelectedAlert(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-500"><X className="w-6 h-6 md:w-8 md:h-8" /></button>
              </div>
              <div className="p-6 md:p-10 space-y-6 md:space-y-8">
                <div className="p-5 md:p-6 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-xs md:text-[10px] font-black text-gray-500 uppercase mb-2">Automated Detection Reason</p>
                  <p className="text-xs md:text-sm text-gray-300 leading-relaxed">{selectedAlert.reason}</p>
                  <p className="text-xs md:text-[10px] font-black text-gray-500 uppercase mt-4">Source Entity</p>
                  <p className="text-xs md:text-sm font-bold text-white mt-1">{selectedAlert.source}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <button 
                    onClick={() => handleModerationAction("Dismiss")}
                    disabled={resolving !== null}
                    className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] md:text-xs font-black uppercase text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {resolving === selectedAlert.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} 
                    Dismiss Alert
                  </button>
                  <button 
                    onClick={() => handleModerationAction("Escalate")}
                    disabled={resolving !== null}
                    className="w-full py-4 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] md:text-xs font-black uppercase text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {resolving === selectedAlert.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />} 
                    Escalate Priority
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* COMPLIANCE GUIDELINES MODAL */}
      <AnimatePresence>
        {isGuidelinesModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 backdrop-blur-md bg-neuro-navy/60">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0A0D14] rounded-[2rem] md:rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden border border-white/10 max-h-[90vh] flex flex-col"
            >
              <div className="p-6 md:p-10 border-b border-white/5 bg-white/5 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-xl md:text-3xl font-black text-white flex items-center gap-3">
                    <FileText className="w-6 h-6 md:w-8 md:h-8 text-neuro-orange" /> Compliance Policies
                  </h3>
                  <p className="text-xs md:text-xs font-black text-gray-500 uppercase tracking-[0.2em] mt-2">Official Platform Guidelines & Rules</p>
                </div>
                <button onClick={() => setIsGuidelinesModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-500"><X className="w-6 h-6 md:w-8 md:h-8" /></button>
              </div>
              
              <div className="p-6 md:p-10 overflow-y-auto flex-1 space-y-8 text-white">
                <form onSubmit={handleSaveGuidelines} className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-neuro-orange border-b border-white/10 pb-2">1. Doctor Verification Standards</h4>
                    <textarea 
                      className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-gray-300 focus:outline-none focus:border-neuro-orange resize-none"
                      defaultValue="All practicing chiropractors must provide a valid State/Regional License Number. If offering specialized neurologically-focused care, proof of specific seminar completion or certification (e.g., TRT, Network Spinal) must be submitted via PDF or linked verified registry."
                    />
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-blue-500 border-b border-white/10 pb-2">2. Vendor Marketplace Rules</h4>
                    <textarea 
                      className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-gray-300 focus:outline-none focus:border-blue-500 resize-none"
                      defaultValue="Vendors must not use deceptive pricing or auto-enrolling subscriptions without clear consent. All software/hardware listed must be HIPAA/GDPR compliant. Suspicious refund patterns (>10% per month) will trigger an automatic account freeze."
                    />
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-emerald-500 border-b border-white/10 pb-2">3. Communication & Spam Policy</h4>
                    <textarea 
                      className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-gray-300 focus:outline-none focus:border-emerald-500 resize-none"
                      defaultValue="Mass direct messaging (DM) is prohibited. A user sending identical messages to more than 15 unique profiles within a 24-hour period will be automatically flagged for 'Suspicious Activity' and temporarily rate-limited."
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <button type="submit" className="px-8 py-4 bg-neuro-orange text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-neuro-orange-light transition-all active:scale-95 shadow-xl">
                      Save & Publish Updates
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Patient Story Approvals */}
      {pendingStories.length > 0 && (
        <section className="bg-white/5 border border-white/5 rounded-[2rem] p-6 md:p-8 text-white">
          <h3 className="text-base md:text-lg font-black mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-neuro-orange" />
            Patient Stories Pending Approval ({pendingStories.length})
          </h3>
          <div className="space-y-3">
            {pendingStories.map((story) => (
              <div key={story.id} className="bg-white/5 border border-white/5 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-white">
                    {story.patient_first_name} — for Dr. {story.doctor?.first_name} {story.doctor?.last_name}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {story.doctor?.clinic_name}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-1">
                  <span className="text-gray-500 font-bold">Before:</span> {story.condition_before} &rarr; <span className="text-gray-500 font-bold">After:</span> {story.outcome_after}
                </p>
                <p className="text-xs text-gray-400 italic mb-3">&ldquo;{story.story_text}&rdquo;</p>
                <div className="flex gap-2">
                  <button
                    disabled={storyActioning === story.id}
                    onClick={async () => {
                      setStoryActioning(story.id);
                      await approvePatientStory(story.id);
                      setPendingStories(prev => prev.filter(s => s.id !== story.id));
                      setStoryActioning(null);
                    }}
                    className="px-4 py-2 bg-green-500/20 text-green-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-500/30 transition-colors"
                  >
                    <CheckCircle2 className="w-3 h-3 inline mr-1" /> Approve
                  </button>
                  <button
                    disabled={storyActioning === story.id}
                    onClick={async () => {
                      setStoryActioning(story.id);
                      await rejectPatientStory(story.id);
                      setPendingStories(prev => prev.filter(s => s.id !== story.id));
                      setStoryActioning(null);
                    }}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/30 transition-colors"
                  >
                    <XCircle className="w-3 h-3 inline mr-1" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
