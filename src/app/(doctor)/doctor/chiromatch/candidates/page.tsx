"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, GripVertical, Save, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { getMyMatchPositions, getCandidatesForPosition, saveDoctorRankings, getActiveCycle } from "../actions";
import ChiroScoreInline from "../../jobs/ChiroScoreInline";

function CandidatesContent() {
  const searchParams = useSearchParams();
  const positionId = searchParams.get("position");
  const [positions, setPositions] = useState<any[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    getActiveCycle().then(async (cycle) => {
      if (cycle) {
        const pos = await getMyMatchPositions(cycle.id);
        const active = pos.filter((p: any) => p.status === 'active' || p.status === 'filled');
        setPositions(active);
        const initial = positionId || active[0]?.id;
        if (initial) {
          setSelectedPosition(initial);
          const cands = await getCandidatesForPosition(initial);
          setCandidates(cands);
        }
      }
      setLoading(false);
    });
  }, [positionId]);

  const loadCandidates = async (pid: string) => {
    setSelectedPosition(pid);
    setLoading(true);
    const cands = await getCandidatesForPosition(pid);
    setCandidates(cands);
    setLoading(false);
  };

  const handleDragStart = (idx: number) => { dragItem.current = idx; };
  const handleDragEnter = (idx: number) => { dragOverItem.current = idx; };
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const items = [...candidates];
    const [dragged] = items.splice(dragItem.current, 1);
    items.splice(dragOverItem.current, 0, dragged);
    setCandidates(items.map((c, i) => ({ ...c, doctor_rank: i + 1 })));
    dragItem.current = null;
    dragOverItem.current = null;
    setSaved(false);
  };

  const handleSave = async () => {
    if (!selectedPosition) return;
    setSaving(true);
    const rankings = candidates.map((c, i) => ({
      student_id: c.student_id,
      rank: i + 1,
      notes: c.notes || undefined,
    }));
    const result = await saveDoctorRankings(selectedPosition, rankings);
    setSaving(false);
    if (result.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
  };

  if (loading) {
    return <div className="min-h-dvh flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-neuro-orange" /></div>;
  }

  return (
    <div className="p-4 md:p-10 max-w-3xl mx-auto space-y-6">
      <Link href="/doctor/chiromatch" className="text-xs text-white/30 hover:text-neuro-orange transition-colors inline-flex items-center gap-1">
        <ArrowLeft className="w-3 h-3" /> Back to ChiroMatch
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Rank Candidates</h1>
        {candidates.length > 0 && (
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

      {/* Position Selector */}
      {positions.length > 1 && (
        <select
          value={selectedPosition}
          onChange={e => loadCandidates(e.target.value)}
          className="w-full p-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-neuro-orange"
        >
          {positions.map((p: any) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      )}

      <p className="text-white/30 text-sm">Drag to rank candidates in your order of preference. Only students who ranked your position are shown.</p>

      {/* Candidates */}
      {candidates.length === 0 ? (
        <div className="bg-[#162231] rounded-2xl border border-white/[0.06] p-8 text-center">
          <p className="text-white/30 text-sm">No students have ranked this position yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {candidates.map((cand, idx) => (
            <div
              key={cand.student_id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragEnd={handleDragEnd}
              onDragOver={e => e.preventDefault()}
              className="bg-[#162231] rounded-xl border border-white/[0.06] p-4 flex items-center gap-3 cursor-grab active:cursor-grabbing hover:border-neuro-orange/20 transition-colors"
            >
              <GripVertical className="w-4 h-4 text-white/10 shrink-0" />
              <span className="w-8 h-8 rounded-lg bg-neuro-orange/10 text-neuro-orange font-bold text-sm flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white text-sm">{cand.full_name}</p>
                  {cand.student_id && <ChiroScoreInline candidateId={cand.student_id} />}
                </div>
                <div className="flex gap-3 text-xs text-white/30 mt-0.5">
                  {cand.school && <span>{cand.school}</span>}
                  {cand.graduation_year && <span>Class of {cand.graduation_year}</span>}
                </div>
                {cand.skills && cand.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {cand.skills.slice(0, 5).map((s: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-white/[0.04] text-white/30 text-[10px] rounded">{s}</span>
                    ))}
                  </div>
                )}
              </div>
              {cand.resume_url && (
                <a href={cand.resume_url} target="_blank" rel="noopener noreferrer" className="text-neuro-orange text-xs font-bold hover:underline shrink-0">
                  Resume
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CandidatesPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-neuro-orange" /></div>}>
      <CandidatesContent />
    </Suspense>
  );
}
