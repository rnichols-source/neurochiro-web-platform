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
  X,
  Loader2,
  FileJson,
  FileText
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { getAuditLogs, generateLiveEvent } from "./actions";
import { AuditLog } from "@/types/admin";
import { formatDistanceToNow } from "date-fns";

export default function AdminLogs() {
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch initial logs
  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      const data = await getAuditLogs({ category: filter, search: searchQuery });
      setLogs(data);
      setLoading(false);
    }
    loadLogs();
  }, [filter, searchQuery]);

  // Simulate Live Stream
  useEffect(() => {
    const interval = setInterval(async () => {
      // 30% chance of a new event appearing every 5 seconds
      if (Math.random() > 0.7) {
        const newEvent = await generateLiveEvent();
        setLogs(prev => [newEvent, ...prev].slice(0, 100));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleExport = (format: 'csv' | 'json') => {
    setIsExporting(true);
    
    // Simulate generation delay
    setTimeout(() => {
      const data = format === 'json' 
        ? JSON.stringify(logs, null, 2)
        : "ID,Category,Event,User,Target,Timestamp,Status,Severity\n" + 
          logs.map(l => `${l.id},${l.category},${l.event},${l.user},${l.target},${l.timestamp},${l.status},${l.severity}`).join("\n");

      const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsExporting(false);
    }, 1000);
  };

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

        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleExport('csv')}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Export CSV
          </button>
          <button 
            onClick={() => handleExport('json')}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileJson className="w-4 h-4" />}
            Export JSON
          </button>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white/5 p-2 rounded-[2rem] border border-white/5 backdrop-blur-md inline-flex">
        {["All", "Security", "Automation", "System", "Data"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              filter === f ? "bg-neuro-orange text-white shadow-lg shadow-neuro-orange/20" : "text-gray-500 hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Logs Table */}
      <section className="bg-white/5 border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-heading font-black text-white">Live Event Stream</h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
              <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Real-time Feed</span>
            </div>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by event, user, or target node..." 
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs focus:outline-none focus:border-neuro-orange text-white transition-all" 
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/[0.03] text-[10px] font-black text-gray-500 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5 border-b border-white/5">Event Details</th>
                <th className="px-8 py-5 border-b border-white/5">Origin</th>
                <th className="px-8 py-5 border-b border-white/5">Target Node</th>
                <th className="px-8 py-5 border-b border-white/5 text-center">Severity</th>
                <th className="px-8 py-5 border-b border-white/5 text-right">Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <Loader2 className="w-10 h-10 text-neuro-orange animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Synchronizing Audit Trail...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <History className="w-10 h-10 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No Events Found for this Criteria</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.03] transition-all group border-b border-white/5 last:border-0">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 ${
                          log.status === 'Warning' ? 'text-amber-500' : log.status === 'Failed' ? 'text-red-500' : 'text-blue-500'
                        }`}>
                          {log.status === 'Warning' ? <AlertTriangle className="w-5 h-5" /> : log.status === 'Failed' ? <X className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white group-hover:text-neuro-orange transition-colors">{log.event}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-2 py-0.5 bg-white/5 rounded-md">{log.category}</span>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${
                              log.status === 'Success' ? 'text-emerald-500' : log.status === 'Failed' ? 'text-red-500' : 'text-amber-500'
                            }`}>{log.status}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-gray-400 border border-white/10 uppercase">
                          {log.user.substring(0, 2)}
                        </div>
                        <span className="text-xs font-bold text-gray-300">{log.user}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Database className="w-3 h-3 text-gray-600" />
                        <span className="text-xs font-medium font-mono tracking-tight">{log.target}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 ${
                        log.severity === 'Critical' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' :
                        log.severity === 'High' ? 'bg-red-500/10 text-red-500' : 
                        log.severity === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 
                        'bg-gray-500/10 text-gray-500'
                      }`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                          <Clock className="w-3 h-3 text-neuro-orange" />
                          {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                        </div>
                        <span className="text-[9px] text-gray-600 font-mono mt-1">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && logs.length > 0 && (
          <div className="p-8 bg-white/[0.02] border-t border-white/5 text-center">
            <button className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all active:scale-95 shadow-xl">
              Stream Older Historical Events
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
