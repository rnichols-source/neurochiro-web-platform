"use client";

import { useState, useEffect } from "react";
import { getContentTrackerData, updateDoctorTracking } from "./actions";
import { CheckCircle2, Clock, X, Search, Video, Mic2, Image, Calendar, Loader2 } from "lucide-react";

const ONBOARDING_STATUS: Record<string, { label: string; color: string }> = {
  completed: { label: "Done", color: "bg-green-500/15 text-green-400" },
  booked: { label: "Booked", color: "bg-blue-500/15 text-blue-400" },
  not_booked: { label: "Not Booked", color: "bg-red-500/15 text-red-400" },
};

const SPOTLIGHT_STATUS: Record<string, { label: string; color: string }> = {
  completed: { label: "Done", color: "bg-green-500/15 text-green-400" },
  scheduled: { label: "Scheduled", color: "bg-blue-500/15 text-blue-400" },
  not_scheduled: { label: "Not Scheduled", color: "bg-white/[0.06] text-white/30" },
};

const LIVE_STATUS: Record<string, { label: string; color: string }> = {
  completed: { label: "Done", color: "bg-green-500/15 text-green-400" },
  scheduled: { label: "Scheduled", color: "bg-blue-500/15 text-blue-400" },
  not_scheduled: { label: "Not Scheduled", color: "bg-white/[0.06] text-white/30" },
};

export default function ContentTrackerPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    getContentTrackerData().then((data) => {
      setDoctors(data);
      setLoading(false);
    });
  }, []);

  const refresh = async () => {
    setLoading(true);
    const data = await getContentTrackerData();
    setDoctors(data);
    setLoading(false);
  };

  const handleUpdate = async (doctorId: string, field: string, value: any) => {
    setUpdating(doctorId);
    await updateDoctorTracking(doctorId, { [field]: value });
    await refresh();
    setUpdating(null);
  };

  const filtered = doctors.filter((d) => {
    const name = `${d.first_name} ${d.last_name}`.toLowerCase();
    const matchesSearch = !search || name.includes(search.toLowerCase()) || (d.city || '').toLowerCase().includes(search.toLowerCase());

    if (filter === "all") return matchesSearch;
    if (filter === "needs_onboarding") return matchesSearch && d.onboarding_call_status !== "completed";
    if (filter === "needs_interview") return matchesSearch && d.spotlight_status !== "completed";
    if (filter === "needs_live") return matchesSearch && d.live_feature_status !== "completed";
    if (filter === "needs_content") return matchesSearch && !d.content_created;
    if (filter === "complete") return matchesSearch && d.onboarding_call_status === "completed" && d.spotlight_status === "completed" && d.content_created;
    return matchesSearch;
  });

  // Stats
  const total = doctors.length;
  const onboarded = doctors.filter(d => d.onboarding_call_status === 'completed').length;
  const interviewed = doctors.filter(d => d.spotlight_status === 'completed').length;
  const livesFeatured = doctors.filter(d => d.live_feature_status === 'completed').length;
  const contentDone = doctors.filter(d => d.content_created).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-neuro-orange animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Content Tracker</h1>
        <p className="text-sm text-white/40 mt-1">Track onboarding, interviews, lives, and content for every member.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total Members", value: total, color: "text-white" },
          { label: "Onboarded", value: `${onboarded}/${total}`, color: "text-green-400" },
          { label: "Interviewed", value: `${interviewed}/${total}`, color: "text-blue-400" },
          { label: "Live Featured", value: `${livesFeatured}/${total}`, color: "text-violet-400" },
          { label: "Content Created", value: `${contentDone}/${total}`, color: "text-neuro-orange" },
        ].map((s) => (
          <div key={s.label} className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-xl border border-white/[0.08] p-4 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/25 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-xl border border-white/[0.08] p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-white/40 font-bold">Overall Progress</p>
          <p className="text-xs text-neuro-orange font-bold">{Math.round(((onboarded + interviewed + contentDone) / (total * 3)) * 100)}%</p>
        </div>
        <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
          <div className="h-full bg-neuro-orange rounded-full transition-all" style={{ width: `${((onboarded + interviewed + contentDone) / (total * 3)) * 100}%` }} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <input
            type="text"
            placeholder="Search by name or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:border-neuro-orange"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: "all", label: "All" },
            { key: "needs_onboarding", label: "Needs Onboarding" },
            { key: "needs_interview", label: "Needs Interview" },
            { key: "needs_live", label: "Needs Live" },
            { key: "needs_content", label: "Needs Content" },
            { key: "complete", label: "Complete" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${filter === f.key ? 'bg-neuro-orange text-white' : 'bg-white/[0.04] text-white/40 hover:bg-white/[0.08]'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-xl border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-white/30 uppercase tracking-wider">Doctor</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold text-white/30 uppercase tracking-wider">Onboarding</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold text-white/30 uppercase tracking-wider">Spotlight</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold text-white/30 uppercase tracking-wider">Live Feature</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold text-white/30 uppercase tracking-wider">Content</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold text-white/30 uppercase tracking-wider">Last Featured</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => {
                const onb = ONBOARDING_STATUS[doc.onboarding_call_status] || ONBOARDING_STATUS.not_booked;
                const spot = SPOTLIGHT_STATUS[doc.spotlight_status] || SPOTLIGHT_STATUS.not_scheduled;
                const live = LIVE_STATUS[doc.live_feature_status] || LIVE_STATUS.not_scheduled;
                const isUpdating = updating === doc.id;

                return (
                  <tr key={doc.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">Dr. {doc.first_name} {doc.last_name}</p>
                      <p className="text-[11px] text-white/30">{doc.city}{doc.state ? `, ${doc.state}` : ''}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${onb.color}`}>{onb.label}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <select
                        value={doc.spotlight_status || 'not_scheduled'}
                        onChange={(e) => handleUpdate(doc.id, 'spotlight_status', e.target.value)}
                        disabled={isUpdating}
                        className="bg-transparent text-xs text-white/60 border border-white/[0.1] rounded px-2 py-1 outline-none cursor-pointer"
                      >
                        <option value="not_scheduled">Not Scheduled</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Done</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <select
                        value={doc.live_feature_status || 'not_scheduled'}
                        onChange={(e) => handleUpdate(doc.id, 'live_feature_status', e.target.value)}
                        disabled={isUpdating}
                        className="bg-transparent text-xs text-white/60 border border-white/[0.1] rounded px-2 py-1 outline-none cursor-pointer"
                      >
                        <option value="not_scheduled">Not Scheduled</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Done</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleUpdate(doc.id, 'content_created', !doc.content_created)}
                        disabled={isUpdating}
                        className={`w-6 h-6 rounded flex items-center justify-center transition-all ${doc.content_created ? 'bg-green-500/20' : 'bg-white/[0.06]'}`}
                      >
                        {doc.content_created ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                          <div className="w-3 h-3 rounded-sm border border-white/20" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-[11px] text-white/30">
                        {doc.last_featured_date
                          ? new Date(doc.last_featured_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-white/20 text-sm">No doctors match your filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
