"use client";

import { useState, useEffect } from "react";
import { 
  Zap, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter,
  Play,
  Pause,
  Trash2,
  ShieldCheck,
  Mail,
  MessageSquare,
  CreditCard,
  MapPin,
  Settings
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { retryAutomationAction } from "@/app/actions/automations";
import { formatDistanceToNow } from "date-fns";

export default function AutomationCommandCenter() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isLive, setIsLive] = useState(true);

  const supabase = createClient();

  const fetchQueue = async () => {
    let query = supabase
      .from('automation_queue')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter !== "all") {
      query = query.eq('status', filter);
    }

    const { data } = await query.limit(50);
    if (data) setQueue(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchQueue();
    if (isLive) {
      const interval = setInterval(fetchQueue, 5000);
      return () => clearInterval(interval);
    }
  }, [filter, isLive]);

  const handleRetry = async (id: string) => {
    setProcessingId(id);
    const result = await retryAutomationAction(id);
    if (result.success) {
      await fetchQueue();
    } else {
      alert(`Retry failed: ${result.error}`);
    }
    setProcessingId(null);
  };

  const filteredQueue = queue.filter(item => 
    item.event_type.toLowerCase().includes(search.toLowerCase()) ||
    JSON.stringify(item.payload).toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    pending: queue.filter(q => q.status === 'pending').length,
    failed: queue.filter(q => q.status === 'failed').length,
    completed: queue.filter(q => q.status === 'completed').length
  };

  return (
    <div className="py-12 px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-neuro-orange/10 rounded-2xl">
              <Zap className="w-8 h-8 text-neuro-orange animate-pulse" />
            </div>
            <h1 className="text-4xl font-black text-neuro-navy uppercase tracking-tighter">Command Center</h1>
          </div>
          <p className="text-gray-500 font-medium uppercase tracking-widest text-xs">LIVE PLATFORM AUTOMATION & OPERATIONAL LOGS</p>
        </div>

        <div className="flex items-center gap-3">
           <button 
             onClick={() => setIsLive(!isLive)}
             className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
               isLive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-100 text-gray-500'
             }`}
           >
             {isLive ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
             {isLive ? 'Live Monitoring' : 'Monitoring Paused'}
           </button>
           <button 
             onClick={fetchQueue}
             className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all text-gray-400"
           >
             <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
           </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Active Queue</p>
          <p className="text-4xl font-black text-neuro-navy">{stats.pending + stats.failed}</p>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-orange-500">
            <Clock className="w-4 h-4" /> Processing Now
          </div>
        </div>
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-red-500">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Failed Jobs</p>
          <p className="text-4xl font-black text-red-600">{stats.failed}</p>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-red-400">
            <AlertCircle className="w-4 h-4" /> Requires Attention
          </div>
        </div>
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Successfully Run</p>
          <p className="text-4xl font-black text-emerald-600">{stats.completed}</p>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-400">
            <CheckCircle2 className="w-4 h-4" /> Automation Health: 98%
          </div>
        </div>
        <div className="bg-neuro-navy p-8 rounded-2xl shadow-xl shadow-neuro-navy/20 relative overflow-hidden">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Operational Status</p>
          <p className="text-2xl font-black text-white uppercase tracking-tight">OPTIMAL</p>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-400">
            <ShieldCheck className="w-4 h-4" /> All Systems Nominal
          </div>
        </div>
      </div>

      {/* Global Kill Switches */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-neuro-navy" />
          <h2 className="text-xl font-black text-neuro-navy uppercase tracking-tight">Global Workflow Controls</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "Welcome Sequences", icon: Mail, status: "Active" },
            { name: "Directory Alerts", icon: MapPin, status: "Active" },
            { name: "Revenue Workflows", icon: CreditCard, status: "Active" }
          ].map(gate => (
            <div key={gate.name} className="flex items-center justify-between p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <gate.icon className="w-5 h-5 text-neuro-navy" />
                </div>
                <div>
                  <p className="text-sm font-black text-neuro-navy uppercase tracking-tight">{gate.name}</p>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">{gate.status}</p>
                </div>
              </div>
              <button className="w-12 h-6 bg-emerald-500 rounded-full relative">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
          <input 
            type="text" 
            placeholder="Search payload, events, or errors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 transition-all font-medium"
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'pending', 'completed', 'failed'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${
                filter === s ? 'bg-neuro-navy text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Live Queue Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Automation Type</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Payload</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Triggered</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredQueue.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      job.status === 'failed' ? 'bg-red-50 text-red-500' : 
                      job.status === 'completed' ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'
                    }`}>
                      <Zap className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-black text-neuro-navy uppercase tracking-tight">{job.event_type.replace(/_/g, ' ')}</p>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <p className="text-[10px] text-gray-400 font-mono truncate max-w-xs">{JSON.stringify(job.payload)}</p>
                </td>
                <td className="px-8 py-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                    job.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                    job.status === 'failed' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {job.status}
                  </span>
                  {job.status === 'failed' && (
                    <p className="text-xs text-red-400 mt-1 font-bold uppercase truncate max-w-[150px]">{job.last_error}</p>
                  )}
                </td>
                <td className="px-8 py-6">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                  </p>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {job.status === 'failed' && (
                      <button 
                        onClick={() => handleRetry(job.id)}
                        disabled={processingId === job.id}
                        className="p-2 bg-neuro-orange/10 text-neuro-orange rounded-xl hover:bg-neuro-orange hover:text-white transition-all border border-neuro-orange/20"
                        title="Retry Job"
                      >
                        <RefreshCw className={`w-4 h-4 ${processingId === job.id ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                    <button className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-red-500 transition-all border border-transparent hover:border-red-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredQueue.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-8 py-12 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">No matching automations in queue</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
