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
  CreditCard
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRegion } from "@/context/RegionContext";
import { REGIONS } from "@/lib/regions";
import { getAdminDashboardStats } from "./actions";

export default function AdminDashboard() {
  const { region: currentRegion } = useRegion();
  const [viewRegion, setViewRegion] = useState<string>("ALL");
  const [activeTimeFilter, setActiveTimeFilter] = useState("1M");
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-10">
      {/* 1. Global Infrastructure Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 text-white">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-neuro-orange">
            <Globe className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-[0.4em]">Global Operations Console</span>
          </div>
          <h1 className="text-5xl font-heading font-black tracking-tight">NeuroChiro Command</h1>
          <p className="text-gray-400 text-lg font-medium">Real-time governance across all regional nodes.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-white/5 p-2 rounded-[2rem] border border-white/5 backdrop-blur-md">
          <button 
            onClick={() => setViewRegion("ALL")}
            className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${viewRegion === 'ALL' ? 'bg-neuro-orange text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}
          >
            All Regions
          </button>
          {Object.entries(REGIONS).map(([code, reg]) => (
            <button 
              key={code}
              onClick={() => setViewRegion(code)}
              className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${viewRegion === code ? 'bg-neuro-navy border border-neuro-orange/30 text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}
            >
              {reg.label}
            </button>
          ))}
        </div>
      </header>

      {/* 2. Critical System Pulse */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Revenue", value: stats?.revenue || "$---", trend: "+14.2%", icon: DollarSign, color: "text-green-500" },
          { label: "Active Doctors", value: stats?.doctors || "---", trend: "+8.1%", icon: ShieldCheck, color: "text-neuro-orange" },
          { label: "Talent Network", value: stats?.students || "---", trend: "+22.4%", icon: Users, color: "text-blue-500" },
          { label: "Market Health", value: stats?.engagement || "--%", trend: "+5.6%", icon: Activity, color: "text-purple-500" }
        ].map((item, i) => (
          <section key={i} className="bg-[#0A0D14] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-white/10 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl -mr-12 -mt-12 transition-all group-hover:bg-neuro-orange/10"></div>
            <div className="flex justify-between items-start mb-6">
              <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${item.color}`}>
                <item.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">{item.trend}</span>
            </div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">{item.label}</p>
            <p className="text-3xl font-black text-white">{item.value}</p>
          </section>
        ))}
      </div>

      {/* 3. Operational Logic & Data Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core Control Matrix */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white/5 border border-white/5 rounded-[3rem] p-10">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-2xl font-heading font-black text-white">System Governance</h3>
                <p className="text-gray-500 text-sm mt-1">Global logic overrides and regional isolation settings.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsAuditModalOpen(true)}
                  className="p-3 bg-white/5 rounded-xl border border-white/5 text-gray-400 hover:text-white transition-all"
                >
                  <Search className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setIsAutomationModalOpen(true)}
                  className="px-6 py-3 bg-neuro-orange text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neuro-orange-light transition-all shadow-lg"
                >
                  Automation Config
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 bg-neuro-navy rounded-[2.5rem] border border-white/5 space-y-6 group cursor-pointer hover:border-neuro-orange/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-neuro-orange">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">Data Sovereignty</h4>
                    <p className="text-[10px] text-gray-500 uppercase font-black">Active Nodes: 4</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">Regional data centers are currently isolated. Strict GDPR/AU compliance enforced.</p>
                <Link href="/admin/regions" className="flex items-center gap-2 text-[10px] font-black uppercase text-neuro-orange group-hover:gap-4 transition-all">
                  Manage Infrastructure <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-6 group cursor-pointer hover:border-blue-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-blue-500">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">Member Verification</h4>
                    <p className="text-[10px] text-gray-500 uppercase font-black">Pending: 14</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">Manual review queue for doctor credentials and marketplace listings.</p>
                <Link href="/admin/moderation" className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-500 group-hover:gap-4 transition-all">
                  Review Queue <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </section>

          {/* Activity Pulse */}
          <section className="bg-white/5 border border-white/5 rounded-[3rem] overflow-hidden">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-heading font-black text-white">Recent Admin Actions</h3>
              <button className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white underline underline-offset-8 transition-colors">View Audit Log</button>
            </div>
            <div className="divide-y divide-white/5">
              {[
                { action: "Settings Toggle", user: "Admin_US", target: "Price Sync", time: "2m ago" },
                { action: "User Verified", user: "Admin_AU", target: "Dr. Sarah Chen", time: "14m ago" },
                { action: "Global Broadcast", user: "Super_Admin", target: "System Maintenance", time: "1h ago" }
              ].map((log, i) => (
                <div key={i} className="p-6 flex items-center justify-between hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-500">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{log.action}</p>
                      <p className="text-[10px] text-gray-500">{log.user} → {log.target}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-600">{log.time}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Intelligence Sidebar */}
        <div className="space-y-8">
          <section className="bg-neuro-navy rounded-[3rem] p-10 shadow-2xl relative overflow-hidden text-white border border-white/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neuro-orange/10 blur-3xl -mr-16 -mt-16"></div>
            <h3 className="text-2xl font-heading font-black mb-8">System Health</h3>
            
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs font-bold text-gray-400">Database Engine</span>
                </div>
                <span className="text-xs font-black uppercase text-green-500">Optimal</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs font-bold text-gray-400">Auth Gateway</span>
                </div>
                <span className="text-xs font-black uppercase text-green-500">Optimal</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-neuro-orange"></div>
                  <span className="text-xs font-bold text-gray-400">Automation Queue</span>
                </div>
                <span className="text-xs font-black uppercase text-neuro-orange">Processing</span>
              </div>

              <div className="pt-8 border-t border-white/10 space-y-6">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Revenue Velocity</h4>
                <div className="flex items-end gap-2">
                  {[40, 70, 55, 90, 60, 85, 100].map((h, i) => (
                    <div key={i} className="flex-1 bg-white/5 rounded-t-md relative group">
                      <div 
                        className="w-full bg-neuro-orange/40 group-hover:bg-neuro-orange transition-all rounded-t-md" 
                        style={{ height: `${h}%` }}
                      ></div>
                    </div>
                  ))}
                </div>
              </div>

              <button className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all">
                <BarChart3 className="w-5 h-5 text-neuro-orange" />
                <span className="text-xs font-black uppercase tracking-widest">Intelligence Report</span>
              </button>
            </div>
          </section>

          <section className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 text-white">
            <h3 className="text-lg font-black mb-6">Internal Alerts</h3>
            <div className="space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-xs font-bold">API Latency Spike</p>
                  <p className="text-[9px] text-gray-500">Node: Admin_UK • 2m ago</p>
                </div>
              </div>
              <div className="p-4 bg-neuro-orange/10 border border-neuro-orange/20 rounded-2xl flex items-center gap-4">
                <Bell className="w-5 h-5 text-neuro-orange" />
                <div>
                  <p className="text-xs font-bold">System Maintenance</p>
                  <p className="text-[9px] text-gray-500">Scheduled: Oct 20th</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* AUTOMATION MODAL */}
      {isAutomationModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-neuro-navy/40">
          <div className="bg-[#0A0D14] rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden border border-white/10 p-10 text-white">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black">Global Automation</h3>
              <button onClick={() => setIsAutomationModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X /></button>
            </div>
            
            <div className="space-y-8">
              <div className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/5">
                <div>
                  <p className="font-bold">Real-time Lead Notifications</p>
                  <p className="text-xs text-gray-500 mt-1">Triggers immediately on referral capture.</p>
                </div>
                <div className="w-12 h-6 bg-neuro-orange rounded-full relative cursor-pointer" onClick={toggleAutomationLogic}>
                  <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/5">
                <div>
                  <p className="font-bold">Automated Member Invoicing</p>
                  <p className="text-xs text-gray-500 mt-1">Managed via global Stripe account.</p>
                </div>
                <div className="w-12 h-6 bg-neuro-orange rounded-full relative cursor-pointer" onClick={toggleAutomationLogic}>
                  <div className={`absolute top-1 right-1 w-4 h-4 bg-white rounded-full`}></div>
                </div>
              </div>
              <button className="w-full py-5 bg-neuro-orange text-white font-black rounded-2xl uppercase tracking-widest text-sm shadow-xl shadow-neuro-orange/20 mt-4">Sync Configuration</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
