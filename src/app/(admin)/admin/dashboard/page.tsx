"use client";

import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Briefcase, 
  Network, 
  Activity, 
  AlertCircle,
  Zap,
  Globe,
  ArrowRight,
  ChevronRight,
  Search,
  BarChart3,
  MousePointerClick,
  Database,
  MapPin,
  X,
  ShieldCheck,
  Settings,
  Bell,
  Loader2,
  CreditCard,
  Download
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRegion } from "@/context/RegionContext";
import { REGIONS } from "@/lib/regions";
import { getAdminDashboardStats, exportIntelligenceReport } from "./actions";
import { formatDistanceToNow } from "date-fns";

export default function AdminDashboard() {
  const { region: currentRegion } = useRegion();
  const [viewRegion, setViewRegion] = useState<string>("ALL");
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await getAdminDashboardStats(viewRegion);
      if (data) setStats(data);
      setLoading(false);
    };
    fetchData();
  }, [viewRegion]);

  const toggleAutomationLogic = () => {
    alert("Automation logic updated globally.");
  };

  const handleExport = async () => {
    setExporting(true);
    await exportIntelligenceReport();
    setExporting(false);
    alert("Intelligence Report generated and downloaded successfully.");
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });
  };

  const formatTrend = (val: number) => {
    return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-neuro-orange">
          <Loader2 className="w-12 h-12 animate-spin" />
          <p className="font-black uppercase tracking-widest text-xs">Initializing Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 md:space-y-10 overflow-x-hidden">
      {/* 1. Global Infrastructure Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8 text-white">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-neuro-orange">
            <Globe className="w-4 h-4 md:w-5 md:h-5 animate-pulse" />
            <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em]">Global Operations Console</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-heading font-black tracking-tight">NeuroChiro Command</h1>
          <p className="text-gray-400 text-base md:text-lg font-medium">Real-time governance across all regional nodes.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-4 bg-white/5 p-2 rounded-[2rem] border border-white/5 backdrop-blur-md">
          <button 
            onClick={() => setViewRegion("ALL")}
            className={`px-4 md:px-6 py-2 md:py-3 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${viewRegion === 'ALL' ? 'bg-neuro-orange text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}
          >
            All Regions
          </button>
          {Object.entries(REGIONS).map(([code, reg]) => (
            <button 
              key={code}
              onClick={() => setViewRegion(code)}
              className={`px-4 md:px-6 py-2 md:py-3 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${viewRegion === code ? 'bg-neuro-navy border border-neuro-orange/30 text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}
            >
              {reg.label}
            </button>
          ))}
        </div>
      </header>

      {/* 2. Critical System Pulse */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "Total Revenue", value: stats ? formatCurrency(stats.revenue) : "$0", trend: stats ? formatTrend(stats.revenueTrend) : "+0%", icon: DollarSign, color: "text-green-500" },
          { label: "Active Doctors", value: stats ? stats.doctors.toString() : "0", trend: stats ? formatTrend(stats.doctorTrend) : "+0%", icon: ShieldCheck, color: "text-neuro-orange" },
          { label: "Talent Network", value: stats ? stats.talent.toString() : "0", trend: stats ? formatTrend(stats.talentTrend) : "+0%", icon: Users, color: "text-blue-500" },
          { label: "Market Health", value: stats ? `${stats.marketHealth}%` : "0%", trend: stats ? formatTrend(stats.marketTrend) : "+0%", icon: Activity, color: "text-purple-500" }
        ].map((item, i) => (
          <section key={i} className="bg-[#0A0D14] border border-white/5 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden group hover:border-white/10 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl -mr-12 -mt-12 transition-all group-hover:bg-neuro-orange/10"></div>
            <div className="flex justify-between items-start mb-6">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/5 flex items-center justify-center ${item.color} shrink-0`}>
                <item.icon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-lg shrink-0 ${item.trend.startsWith('-') ? 'text-red-500 bg-red-500/10' : 'text-green-500 bg-green-500/10'}`}>
                {item.trend}
              </span>
            </div>
            <p className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1 truncate">{item.label}</p>
            <p className="text-2xl md:text-3xl font-black text-white truncate">{loading ? "..." : item.value}</p>
          </section>
        ))}
      </div>

      {/* 3. Operational Logic & Data Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Core Control Matrix */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <section className="bg-white/5 border border-white/5 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 md:mb-10">
              <div>
                <h3 className="text-xl md:text-2xl font-heading font-black text-white">System Governance</h3>
                <p className="text-gray-500 text-xs md:text-sm mt-1">Global logic overrides and regional isolation settings.</p>
              </div>
              <div className="flex gap-2 md:gap-3">
                <Link 
                  href="/admin/logs"
                  className="p-3 bg-white/5 rounded-xl border border-white/5 text-gray-400 hover:text-white transition-all shrink-0"
                >
                  <Search className="w-4 h-4 md:w-5 md:h-5" />
                </Link>
                <button 
                  onClick={() => setIsAutomationModalOpen(true)}
                  className="px-4 md:px-6 py-3 bg-neuro-orange text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-neuro-orange-light transition-all shadow-lg whitespace-nowrap shrink-0"
                >
                  Automation Config
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              <div className="p-6 md:p-8 bg-neuro-navy rounded-[2rem] md:rounded-[2.5rem] border border-white/5 space-y-4 md:space-y-6 group cursor-pointer hover:border-neuro-orange/30 transition-all flex flex-col">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-xl md:rounded-2xl flex items-center justify-center text-neuro-orange shrink-0">
                    <Database className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-white font-bold text-sm md:text-base truncate">Data Sovereignty</h4>
                    <p className="text-[9px] md:text-[10px] text-gray-500 uppercase font-black truncate">Active Nodes: {Object.keys(REGIONS).length}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed flex-1">Regional data centers are monitored for proper isolation and compliance mapping.</p>
                <Link href="/admin/regions" className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase text-neuro-orange group-hover:gap-3 transition-all mt-auto pt-2">
                  Manage Infrastructure <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="p-6 md:p-8 bg-white/5 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 space-y-4 md:space-y-6 group cursor-pointer hover:border-blue-500/30 transition-all flex flex-col">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-xl md:rounded-2xl flex items-center justify-center text-blue-500 shrink-0">
                    <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-white font-bold text-sm md:text-base truncate">Member Verification</h4>
                    <p className="text-[9px] md:text-[10px] text-gray-500 uppercase font-black truncate">Active Verifications</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed flex-1">Review queue for doctor credentials, licensing, and marketplace listings.</p>
                <Link href="/admin/moderation" className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase text-blue-500 group-hover:gap-3 transition-all mt-auto pt-2">
                  Review Queue <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </section>

          {/* Activity Pulse */}
          <section className="bg-white/5 border border-white/5 rounded-[2rem] md:rounded-[3rem] overflow-hidden">
            <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-lg md:text-xl font-heading font-black text-white">Recent Admin Actions</h3>
              <Link href="/admin/logs" className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white underline underline-offset-4 transition-colors">View Audit Log</Link>
            </div>
            <div className="divide-y divide-white/5">
              {loading ? (
                <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 text-gray-500 animate-spin" /></div>
              ) : stats?.adminLogs?.length === 0 ? (
                <div className="p-10 text-center text-gray-500 text-sm">No recent admin actions recorded.</div>
              ) : (
                stats?.adminLogs?.map((log: any) => (
                  <div key={log.id} className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-white/5 transition-all gap-4">
                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-500 shrink-0">
                        {log.severity === 'High' || log.severity === 'Critical' ? <AlertCircle className="w-4 h-4 text-red-500" /> : <Zap className="w-3 h-3 md:w-4 md:h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm font-bold text-white truncate">{log.event}</p>
                        <p className="text-[9px] md:text-[10px] text-gray-500 truncate">{log.user} → {log.target}</p>
                      </div>
                    </div>
                    <span className="text-[9px] md:text-[10px] font-bold text-gray-600 sm:text-right shrink-0">
                      {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Intelligence Sidebar */}
        <div className="space-y-6 md:space-y-8">
          <section className="bg-neuro-navy rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl relative overflow-hidden text-white border border-white/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neuro-orange/10 blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <h3 className="text-xl md:text-2xl font-heading font-black mb-6 md:mb-8">System Health</h3>
            
            <div className="space-y-6 md:space-y-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full ${stats?.health?.database === 'Optimal' ? 'bg-green-500' : 'bg-red-500'} animate-pulse shrink-0`}></div>
                  <span className="text-[10px] md:text-xs font-bold text-gray-400 truncate">Database Engine</span>
                </div>
                <span className={`text-[9px] md:text-[10px] font-black uppercase shrink-0 ${stats?.health?.database === 'Optimal' ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'} px-2 py-1 rounded`}>
                  {stats?.health?.database || 'Unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full ${stats?.health?.auth === 'Optimal' ? 'bg-green-500' : 'bg-amber-500'} animate-pulse shrink-0`}></div>
                  <span className="text-[10px] md:text-xs font-bold text-gray-400 truncate">Auth Gateway</span>
                </div>
                <span className={`text-[9px] md:text-[10px] font-black uppercase shrink-0 ${stats?.health?.auth === 'Optimal' ? 'text-green-500 bg-green-500/10' : 'text-amber-500 bg-amber-500/10'} px-2 py-1 rounded`}>
                  {stats?.health?.auth || 'Unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full ${stats?.health?.automation === 'Idle' ? 'bg-gray-500' : 'bg-neuro-orange'} ${stats?.health?.automation !== 'Idle' ? 'animate-pulse' : ''} shrink-0`}></div>
                  <span className="text-[10px] md:text-xs font-bold text-gray-400 truncate">Automation Queue</span>
                </div>
                <span className={`text-[9px] md:text-[10px] font-black uppercase shrink-0 ${stats?.health?.automation === 'Idle' ? 'text-gray-500 bg-gray-500/10' : 'text-neuro-orange bg-neuro-orange/10'} px-2 py-1 rounded`}>
                  {stats?.health?.automation || 'Idle'}
                </span>
              </div>

              <div className="pt-6 md:pt-8 border-t border-white/10 space-y-4 md:space-y-6">
                <div className="flex justify-between items-center">
                   <h4 className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest">Revenue Velocity</h4>
                   {stats?.health?.pendingTasks > 0 && (
                     <span className="text-[8px] font-bold text-neuro-orange animate-bounce">
                       {stats.health.pendingTasks} Queue Tasks
                     </span>
                   )}
                </div>
                <div className="flex items-end gap-1 md:gap-2 h-24">
                  {stats?.velocity ? stats.velocity.map((v: number, i: number) => {
                    const max = Math.max(...stats.velocity);
                    const h = max === 0 ? 10 : (v / max) * 100;
                    return (
                      <div key={i} className="flex-1 bg-white/5 rounded-t-md relative group h-full flex items-end">
                        <div 
                          className="w-full bg-neuro-orange/40 group-hover:bg-neuro-orange transition-all rounded-t-sm md:rounded-t-md min-h-[4px]" 
                          style={{ height: `${Math.max(h, 4)}%` }}
                        ></div>
                      </div>
                    );
                  }) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">Calculating...</div>
                  )}
                </div>
              </div>

              <button 
                onClick={handleExport}
                disabled={exporting || loading}
                className="w-full py-4 md:py-5 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 md:gap-3 hover:bg-white/10 transition-all disabled:opacity-50 active:scale-95"
              >
                {exporting ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 text-neuro-orange animate-spin" /> : <Download className="w-4 h-4 md:w-5 md:h-5 text-neuro-orange" />}
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                  {exporting ? "Generating..." : "Intelligence Report"}
                </span>
              </button>
            </div>
          </section>

          <section className="bg-white/5 border border-white/5 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white">
            <h3 className="text-base md:text-lg font-black mb-4 md:mb-6">Internal Alerts</h3>
            <div className="space-y-3 md:space-y-4">
              {loading ? (
                <div className="py-4 flex justify-center"><Loader2 className="w-5 h-5 text-gray-500 animate-spin" /></div>
              ) : stats?.alerts?.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">No active alerts.</div>
              ) : (
                stats?.alerts?.map((alert: any, i: number) => (
                  <div key={i} className={`p-4 ${alert.severity === 'High' || alert.severity === 'Critical' ? 'bg-red-500/10 border border-red-500/20' : alert.severity === 'Medium' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-neuro-orange/10 border border-neuro-orange/20'} rounded-xl md:rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4`}>
                    <div className="flex items-center gap-3">
                      {alert.severity === 'High' || alert.severity === 'Critical' ? <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-500 shrink-0" /> : <Bell className="w-4 h-4 md:w-5 md:h-5 text-neuro-orange shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate">{alert.title}</p>
                        <p className="text-[9px] text-gray-400 truncate mt-0.5">{alert.description}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-gray-500 sm:ml-auto shrink-0 self-end sm:self-auto">{alert.time === 'Active' || alert.time === 'Just now' ? alert.time : formatDistanceToNow(new Date(alert.time), { addSuffix: true })}</span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {/* AUTOMATION MODAL */}
      {isAutomationModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 backdrop-blur-md bg-neuro-navy/60">
          <div className="bg-[#0A0D14] rounded-[2rem] md:rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden border border-white/10 p-6 md:p-10 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8 md:mb-10">
              <h3 className="text-2xl md:text-3xl font-black">Global Automation</h3>
              <button onClick={() => setIsAutomationModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="space-y-6 md:space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 bg-white/5 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-sm md:text-base truncate">Real-time Lead Notifications</p>
                  <p className="text-[10px] md:text-xs text-gray-500 mt-1 truncate">Triggers immediately on referral capture.</p>
                </div>
                <div className="w-12 h-6 bg-neuro-orange rounded-full relative cursor-pointer shrink-0 self-start sm:self-auto" onClick={toggleAutomationLogic}>
                  <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 bg-white/5 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-sm md:text-base truncate">Automated Member Invoicing</p>
                  <p className="text-[10px] md:text-xs text-gray-500 mt-1 truncate">Managed via global Stripe account.</p>
                </div>
                <div className="w-12 h-6 bg-neuro-orange rounded-full relative cursor-pointer shrink-0 self-start sm:self-auto" onClick={toggleAutomationLogic}>
                  <div className={`absolute top-1 right-1 w-4 h-4 bg-white rounded-full`}></div>
                </div>
              </div>
              <button 
                onClick={() => alert("Synchronizing global platform configurations...")}
                className="w-full py-4 md:py-5 bg-neuro-orange text-white font-black rounded-xl md:rounded-2xl uppercase tracking-widest text-[10px] md:text-sm shadow-xl shadow-neuro-orange/20 mt-4 active:scale-95 transition-transform"
              >
                Sync Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
