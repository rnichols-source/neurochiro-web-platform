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
  X
} from "lucide-react";
import { useState } from "react";
import { onModerationActionAction, onSettingsToggleAction } from "@/app/actions/automations";

export default function ModerationCenter() {
  const [autoApprove, setAutoApprove] = useState(true);
  const [scanLinks, setScanLinks] = useState(true);
  const [isGuidelinesModalOpen, setIsGuidelinesModalOpen] = useState(false);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);

  const queues = [
    { name: "Doctor Applications", count: 12, icon: UserPlus, color: "text-blue-500" },
    { name: "Seminar Listings", count: 8, icon: Calendar, color: "text-neuro-orange" },
    { name: "Job Postings", count: 5, icon: Briefcase, color: "text-purple-500" }
  ];

  const alerts = [
    { id: 1, type: "Flagged Content", source: "User_123", reason: "Potential non-compliant medical claim", date: "2 hours ago", status: "Critical" },
    { id: 2, type: "Suspicious Activity", source: "User_456", reason: "Rapid bulk messaging detected", date: "4 hours ago", status: "Warning" },
    { id: 3, type: "Domain Conflict", source: "Clinic_789", reason: "Website URL mismatch with verified NPI", date: "1 day ago", status: "Info" }
  ];

  const handleModerationAction = (action: string, alert: any) => {
    onModerationActionAction("super-admin", action, alert.type, alert.source);
    setSelectedAlert(null);
    alert(`Action "${action}" taken on ${alert.type}.`);
  };

  const handleToggleAutoApprove = () => {
    const newValue = !autoApprove;
    setAutoApprove(newValue);
    onSettingsToggleAction("super-admin", "Auto-Approve Applications", newValue);
  };

  const handleToggleScanLinks = () => {
    const newValue = !scanLinks;
    setScanLinks(newValue);
    onSettingsToggleAction("super-admin", "Scan Outbound Links", newValue);
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 text-white">
        <div>
          <div className="flex items-center gap-2 mb-2 text-red-500">
            <ShieldAlert className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-white">Platform Integrity</span>
          </div>
          <h1 className="text-4xl font-heading font-black">Moderation Center</h1>
          <p className="text-gray-400 mt-2 text-lg font-medium">Protect the ecosystem through rapid content review and policy enforcement.</p>
        </div>
        
        <button 
          onClick={() => setIsGuidelinesModalOpen(true)}
          className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-2xl hover:bg-white/10 transition-all font-black uppercase tracking-widest text-sm"
        >
          Compliance Guidelines
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Verification Queues */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {queues.map((q, i) => (
              <section key={i} className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 hover:border-neuro-orange/30 transition-all cursor-pointer group">
                <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 ${q.color}`}>
                  <q.icon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-1">{q.name}</h3>
                <div className="flex items-end justify-between">
                  <p className="text-4xl font-black text-white">{q.count}</p>
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-neuro-orange transition-colors" />
                </div>
              </section>
            ))}
          </div>

          {/* Active Alerts */}
          <section className="bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-heading font-black text-white">Security Alerts</h3>
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" placeholder="Filter alerts..." className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs focus:outline-none focus:border-neuro-orange text-white" />
                </div>
              </div>
            </div>
            <div className="divide-y divide-white/5">
              {alerts.map((alert, i) => (
                <div key={i} className="p-6 flex items-center justify-between hover:bg-white/5 transition-all group">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                      <Flag className={`w-5 h-5 ${alert.status === 'Critical' ? 'text-red-500' : 'text-orange-500'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${alert.status === 'Critical' ? 'text-red-500' : 'text-orange-500'}`}>{alert.status}</span>
                        <span className="text-[10px] text-gray-500">• {alert.date}</span>
                      </div>
                      <h4 className="font-bold text-lg text-white">{alert.type}: {alert.source}</h4>
                      <p className="text-xs text-gray-400 mt-1">{alert.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setSelectedAlert(alert)}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-white hover:bg-neuro-orange transition-all"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Global Logic Sidebar */}
        <div className="space-y-8">
          <section className="bg-neuro-navy rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl -mr-16 -mt-16"></div>
            <h3 className="text-2xl font-heading font-black text-white mb-8">System Logic</h3>
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-white">Auto-Approve</p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold mt-1 tracking-widest">New Applications</p>
                  </div>
                  <div 
                    onClick={handleToggleAutoApprove}
                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-all duration-300 ${autoApprove ? 'bg-green-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${autoApprove ? 'right-1' : 'left-1'}`}></div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed text-center">If disabled, all new registrations require manual admin verification.</p>
              </div>

              <div className="space-y-4 pt-8 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-white">Outbound Scan</p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold mt-1 tracking-widest">Link Verification</p>
                  </div>
                  <div 
                    onClick={handleToggleScanLinks}
                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-all duration-300 ${scanLinks ? 'bg-neuro-orange' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${scanLinks ? 'right-1' : 'left-1'}`}></div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed text-center">Automatically checks clinic websites for broken links or security risks.</p>
              </div>
            </div>
          </section>

          <section className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 text-white">
            <h3 className="text-lg font-black mb-6">Moderator Summary</h3>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400">Total Cleared</span>
                <span className="text-sm font-black text-green-500">1,245</span>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400">Escalated</span>
                <span className="text-sm font-black text-red-500">3</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ALERT RESOLUTION MODAL */}
      {selectedAlert && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-neuro-navy/40">
          <div className="bg-[#0A0D14] rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/10">
            <div className="p-10 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-white">Resolve Alert</h3>
                <p className="text-xs font-black text-neuro-orange uppercase tracking-[0.2em] mt-1">{selectedAlert.type}</p>
              </div>
              <button onClick={() => setSelectedAlert(null)}><X className="text-gray-500" /></button>
            </div>
            <div className="p-10 space-y-8">
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Internal Reason</p>
                <p className="text-sm text-gray-300 leading-relaxed">{selectedAlert.reason}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleModerationAction("Dismiss", selectedAlert)}
                  className="py-4 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Dismiss
                </button>
                <button 
                  onClick={() => handleModerationAction("Escalate", selectedAlert)}
                  className="py-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-black uppercase text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <ShieldAlert className="w-4 h-4" /> Escalate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
