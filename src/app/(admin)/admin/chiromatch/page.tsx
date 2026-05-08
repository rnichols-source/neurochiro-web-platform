"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Shuffle, Trash2, ChevronRight } from "lucide-react";
import { getMatchCycles, createMatchCycle, updateCycleStatus, getCycleStats, deleteCycle } from "./actions";
import type { MatchCycle, CycleStatus } from "@/types/chiromatch";

const STATUS_ORDER: CycleStatus[] = ["upcoming", "ranking_open", "ranking_closed", "matching", "matched", "completed"];
const STATUS_COLORS: Record<CycleStatus, string> = {
  upcoming: "bg-gray-100 text-gray-700",
  ranking_open: "bg-green-100 text-green-700",
  ranking_closed: "bg-yellow-100 text-yellow-700",
  matching: "bg-blue-100 text-blue-700",
  matched: "bg-purple-100 text-purple-700",
  completed: "bg-gray-100 text-gray-500",
};

export default function AdminChiroMatchPage() {
  const [cycles, setCycles] = useState<MatchCycle[]>([]);
  const [stats, setStats] = useState<Record<string, { positions: number; students: number; matches: number }>>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const data = await getMatchCycles();
    setCycles(data);
    const statsMap: typeof stats = {};
    for (const c of data) {
      statsMap[c.id] = await getCycleStats(c.id);
    }
    setStats(statsMap);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    const fd = new FormData(e.currentTarget);
    await createMatchCycle({
      name: fd.get("name") as string,
      season: fd.get("season") as string,
      year: parseInt(fd.get("year") as string),
      ranking_opens_at: fd.get("ranking_opens_at") as string,
      ranking_closes_at: fd.get("ranking_closes_at") as string,
      match_day: fd.get("match_day") as string,
    });
    setShowCreate(false);
    setCreating(false);
    load();
  }

  async function handleAdvance(cycleId: string, currentStatus: CycleStatus) {
    const idx = STATUS_ORDER.indexOf(currentStatus);
    if (idx < STATUS_ORDER.length - 1) {
      const next = STATUS_ORDER[idx + 1];
      if (next === "matching") {
        // Will be handled by match algorithm action
        await updateCycleStatus(cycleId, "ranking_closed");
      } else {
        await updateCycleStatus(cycleId, next);
      }
      load();
    }
  }

  async function handleDelete(cycleId: string) {
    if (!confirm("Delete this cycle and all its data permanently?")) return;
    await deleteCycle(cycleId);
    load();
  }

  if (loading) {
    return <div className="p-8 flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shuffle className="w-6 h-6 text-neuro-orange" />
          <h1 className="text-2xl font-heading font-black text-neuro-navy">ChiroMatch</h1>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-neuro-orange text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-neuro-orange/90">
          <Plus className="w-4 h-4" /> New Cycle
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-bold text-neuro-navy">Create Match Cycle</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Name</label>
              <input name="name" required placeholder="Fall 2026" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Season</label>
              <select name="season" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                <option value="spring">Spring</option>
                <option value="fall">Fall</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Year</label>
              <input name="year" type="number" required defaultValue={new Date().getFullYear()} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ranking Opens</label>
              <input name="ranking_opens_at" type="datetime-local" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ranking Closes</label>
              <input name="ranking_closes_at" type="datetime-local" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Match Day</label>
              <input name="match_day" type="datetime-local" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={creating} className="px-6 py-2 bg-neuro-navy text-white rounded-lg text-sm font-bold disabled:opacity-50">
              {creating ? "Creating..." : "Create Cycle"}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-400 text-sm">Cancel</button>
          </div>
        </form>
      )}

      {/* Cycles List */}
      {cycles.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Shuffle className="w-10 h-10 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400">No match cycles yet. Create your first one.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cycles.map((cycle) => {
            const s = stats[cycle.id] || { positions: 0, students: 0, matches: 0 };
            const canAdvance = STATUS_ORDER.indexOf(cycle.status) < STATUS_ORDER.length - 1;
            return (
              <div key={cycle.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-neuro-navy">{cycle.name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${STATUS_COLORS[cycle.status]}`}>
                        {cycle.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-400">
                      <span>Ranking: {new Date(cycle.ranking_opens_at).toLocaleDateString()} – {new Date(cycle.ranking_closes_at).toLocaleDateString()}</span>
                      <span>Match Day: {new Date(cycle.match_day).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {canAdvance && (
                      <button
                        onClick={() => handleAdvance(cycle.id, cycle.status)}
                        className="px-3 py-1.5 bg-neuro-orange text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-neuro-orange/90"
                      >
                        Advance <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(cycle.id)} className="p-1.5 text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex gap-6 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
                  <span><strong className="text-neuro-navy">{s.positions}</strong> positions</span>
                  <span><strong className="text-neuro-navy">{s.students}</strong> students ranking</span>
                  <span><strong className="text-neuro-navy">{s.matches}</strong> matches</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
