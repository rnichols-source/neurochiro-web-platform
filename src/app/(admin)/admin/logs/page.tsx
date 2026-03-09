"use client";

import { 
  History, 
  Search, 
  Filter, 
  Shield, 
  Activity, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Database, 
  Globe,
  Clock,
  Download,
  X
} from "lucide-react";
import { useState } from "react";

export default function AdminLogs() {
  const [filter, setFilter] = useState("All");

  const logs = [
    { id: 1, type: "Security", event: "Admin Login Succeeded", user: "Super_Admin", target: "System", time: "2m ago", status: "Success", severity: "Low" },
    { id: 2, type: "Automation", event: "Broadcast Dispatched", user: "Admin_US", target: "All Students", time: "14m ago", status: "Success", severity: "Medium" },
    { id: 3, type: "System", event: "API Rate Limit Warning", user: "System", target: "Google_Places_Proxy", time: "1h ago", status: "Warning", severity: "High" },
    { id: 4, type: "Data", event: "Doctor Profile Updated", user: "Dr. Chris Brown", target: "Profile_ID_902", time: "3h ago", status: "Success", severity: "Low" },
    { id: 5, type: "Security", event: "Failed Verification Attempt", user: "Guest_User", target: "Verification_Portal", time: "5h ago", status: "Failed", severity: "High" },
  ];

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-10">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 text-white">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-neuro-orange">
            <Shield className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-[0.4em]">Audit Infrastructure</span>
          </div>
          <h1 className="text-4xl font-heading font-black tracking-tight">System Logs</h1>
          <p className="text-gray-400 text-lg font-medium">Immutable record of platform events and security actions.</p>
        </div>

        <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all">
          <Download className="w-4 h-4" /> Download Audit Archive
        </button>
      </header>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white/5 p-2 rounded-[2rem] border border-white/5 backdrop-blur-md inline-flex">
        {["All", "Security", "Automation", "System", "Data"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              filter === f ? "bg-neuro-orange text-white" : "text-gray-500 hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Logs Table */}
      <section className="bg-white/5 border border-white/5 rounded-[3rem] overflow-hidden">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-heading font-black text-white">Live Event Stream</h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
              <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Real-time</span>
            </div>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              placeholder="Search logs..." 
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs focus:outline-none focus:border-neuro-orange text-white" 
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] font-black text-gray-500 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Event Details</th>
                <th className="px-8 py-4">Origin</th>
                <th className="px-8 py-4">Target</th>
                <th className="px-8 py-4 text-center">Severity</th>
                <th className="px-8 py-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${
                        log.status === 'Warning' ? 'text-amber-500' : log.status === 'Failed' ? 'text-red-500' : 'text-blue-500'
                      }`}>
                        {log.status === 'Warning' ? <AlertTriangle className="w-5 h-5" /> : log.status === 'Failed' ? <X className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{log.event}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-black">{log.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-medium text-gray-300">{log.user}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-medium text-gray-400 font-mono">{log.target}</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      log.severity === 'High' ? 'bg-red-500/10 text-red-500' : log.severity === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-gray-500/10 text-gray-500'
                    }`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 text-[10px] font-bold text-gray-600">
                      <Clock className="w-3 h-3" />
                      {log.time}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-6 bg-white/5 border-t border-white/5 text-center">
          <button className="text-xs font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors">Stream Older Events</button>
        </div>
      </section>
    </div>
  );
}
