"use client";

import { useState, useEffect, useRef } from "react";
import { GripVertical, X, Loader2, Save, CheckCircle2, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { getActiveCycleForStudent, getMyRankings, getAvailablePositions, saveRankings } from "../actions";
import type { MatchPositionWithDoctor } from "@/types/chiromatch";

interface RankedPosition {
  position_id: string;
  rank: number;
  position: MatchPositionWithDoctor | null;
}

export default function RankingsPage() {
  const [rankings, setRankings] = useState<RankedPosition[]>([]);
  const [available, setAvailable] = useState<MatchPositionWithDoctor[]>([]);
  const [cycleId, setCycleId] = useState<string | null>(null);
  const [isRankingOpen, setIsRankingOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    getActiveCycleForStudent().then(async (cycle) => {
      if (cycle) {
        setCycleId(cycle.id);
        setIsRankingOpen(cycle.status === 'ranking_open');
        const [r, a] = await Promise.all([getMyRankings(cycle.id), getAvailablePositions(cycle.id)]);
        setRankings(r.map((item: any) => ({ position_id: item.position_id, rank: item.rank, position: item.position })));
        setAvailable(a);
      }
      setLoading(false);
    });
  }, []);

  const handleDragStart = (idx: number) => { dragItem.current = idx; };
  const handleDragEnter = (idx: number) => { dragOverItem.current = idx; };
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const items = [...rankings];
    const [dragged] = items.splice(dragItem.current, 1);
    items.splice(dragOverItem.current, 0, dragged);
    setRankings(items.map((item, i) => ({ ...item, rank: i + 1 })));
    dragItem.current = null;
    dragOverItem.current = null;
    setSaved(false);
  };

  const handleRemove = (idx: number) => {
    const items = rankings.filter((_, i) => i !== idx).map((item, i) => ({ ...item, rank: i + 1 }));
    setRankings(items);
    setSaved(false);
  };

  const handleAdd = (position: MatchPositionWithDoctor) => {
    if (rankings.length >= 10) return;
    if (rankings.some(r => r.position_id === position.id)) return;
    setRankings([...rankings, { position_id: position.id, rank: rankings.length + 1, position }]);
    setShowAdd(false);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!cycleId) return;
    setSaving(true);
    const result = await saveRankings(cycleId, rankings.map(r => ({ position_id: r.position_id, rank: r.rank })));
    setSaving(false);
    if (result.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    else alert(result.error || 'Failed to save');
  };

  const unranked = available.filter(p => !rankings.some(r => r.position_id === p.id));

  if (loading) {
    return <div className="min-h-dvh flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-neuro-orange" /></div>;
  }

  return (
    <div className="p-4 md:p-10 max-w-2xl mx-auto space-y-6">
      <Link href="/student/chiromatch" className="text-xs text-white/30 hover:text-neuro-orange transition-colors">&larr; Back to ChiroMatch</Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Rankings</h1>
          <p className="text-white/30 text-sm mt-1">Drag to reorder. Your #1 is your top choice.</p>
        </div>
        {isRankingOpen && rankings.length > 0 && (
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-5 py-2.5 font-bold rounded-xl text-sm flex items-center gap-2 transition-colors ${
              saved ? 'bg-green-600 text-white' : 'bg-neuro-orange text-white hover:bg-neuro-orange/90'
            }`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Rankings'}
          </button>
        )}
      </div>

      {!isRankingOpen && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-sm text-yellow-400">
          Rankings are currently closed for this cycle.
        </div>
      )}

      {/* Rankings List */}
      {rankings.length === 0 ? (
        <div className="bg-[#162231] rounded-2xl border border-white/[0.06] p-8 text-center">
          <p className="text-white/30 text-sm mb-4">You haven&apos;t ranked any positions yet.</p>
          <Link href="/student/chiromatch/positions" className="text-neuro-orange text-sm font-bold hover:underline">
            Browse available positions &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {rankings.map((item, idx) => (
            <div
              key={item.position_id}
              draggable={isRankingOpen}
              onDragStart={() => handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className="bg-[#162231] rounded-xl border border-white/[0.06] p-4 flex items-center gap-3 cursor-grab active:cursor-grabbing hover:border-neuro-orange/20 transition-colors"
            >
              {isRankingOpen && <GripVertical className="w-4 h-4 text-white/10 shrink-0" />}
              <span className="w-8 h-8 rounded-lg bg-neuro-orange/10 text-neuro-orange font-bold text-sm flex items-center justify-center shrink-0">
                {item.rank}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm truncate">{item.position?.title || 'Unknown Position'}</p>
                <p className="text-xs text-white/30 truncate">
                  {item.position?.doctor.clinic_name}
                  {item.position?.city ? ` — ${item.position.city}${item.position.state ? `, ${item.position.state}` : ''}` : ''}
                </p>
              </div>
              {isRankingOpen && (
                <button onClick={() => handleRemove(idx)} className="p-1 text-white/10 hover:text-red-400 transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add More */}
      {isRankingOpen && rankings.length < 10 && (
        <div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="w-full py-3 border-2 border-dashed border-white/[0.08] rounded-xl text-white/20 text-sm font-bold hover:border-neuro-orange/20 hover:text-neuro-orange transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Position ({rankings.length}/10)
          </button>

          {showAdd && unranked.length > 0 && (
            <div className="mt-2 bg-[#162231] rounded-xl border border-white/[0.06] p-3 space-y-2 max-h-64 overflow-y-auto">
              {unranked.map(pos => (
                <button
                  key={pos.id}
                  onClick={() => handleAdd(pos)}
                  className="w-full text-left p-3 rounded-lg hover:bg-white/[0.04] transition-colors"
                >
                  <p className="text-sm font-bold text-white">{pos.title}</p>
                  <p className="text-xs text-white/30">{pos.doctor.clinic_name}{pos.city ? ` — ${pos.city}` : ''}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
