"use client";

import { useState, useEffect } from "react";
import { Shuffle, Plus, Loader2, Calendar, Users, MapPin, DollarSign, XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getActiveCycle, getMyMatchPositions } from "./actions";
import type { MatchCycle, MatchPosition } from "@/types/chiromatch";
import UpgradeGate from "@/components/doctor/UpgradeGate";

export default function DoctorChiroMatchPage() {
  return (
    <UpgradeGate feature="ChiroMatch" requiredTier="pro" description="Residency-style matching to find your ideal associate or next opportunity. Post positions and rank candidates automatically.">
      <DoctorChiroMatchContent />
    </UpgradeGate>
  );
}

function DoctorChiroMatchContent() {
  const [cycle, setCycle] = useState<MatchCycle | null>(null);
  const [positions, setPositions] = useState<MatchPosition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getActiveCycle(), getMyMatchPositions()]).then(([c, p]) => {
      setCycle(c);
      setPositions(p);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="min-h-dvh flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-neuro-orange" /></div>;
  }

  const canCreatePosition = cycle && (cycle.status === 'upcoming' || cycle.status === 'ranking_open');
  const cyclePositions = cycle ? positions.filter(p => p.cycle_id === cycle.id && p.status === 'active') : [];

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shuffle className="w-6 h-6 text-neuro-orange" />
            <h1 className="text-3xl font-bold text-white tracking-tight">ChiroMatch</h1>
          </div>
          <p className="text-white/30 text-sm">Match with top chiropractic talent through structured cycles</p>
        </div>
        {canCreatePosition && (
          <Link
            href="/doctor/chiromatch/create"
            className="px-5 py-3 bg-neuro-orange text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-neuro-orange/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Position
          </Link>
        )}
      </div>

      {/* Cycle Status */}
      {cycle ? (
        <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-neuro-orange font-semibold mb-1">Current Cycle</p>
              <h2 className="text-xl font-bold text-white">{cycle.name}</h2>
            </div>
            <span className="px-3 py-1 bg-neuro-orange/10 text-neuro-orange text-xs font-bold rounded-full uppercase">
              {cycle.status.replace('_', ' ')}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Ranking Opens</p>
              <p className="text-sm font-bold text-white">{new Date(cycle.ranking_opens_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Ranking Closes</p>
              <p className="text-sm font-bold text-white">{new Date(cycle.ranking_closes_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Match Day</p>
              <p className="text-sm font-bold text-neuro-orange">{new Date(cycle.match_day).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-8 text-center">
          <Shuffle className="w-10 h-10 text-white/10 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">No Active Cycle</h2>
          <p className="text-white/30 text-sm">The next ChiroMatch cycle hasn&apos;t been announced yet. Check back soon.</p>
        </div>
      )}

      {/* My Positions */}
      <div>
        <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4">My Match Positions</h2>
        {cyclePositions.length === 0 ? (
          <div className="bg-[#162231] rounded-2xl border border-white/[0.06] p-8 text-center">
            <p className="text-white/30 text-sm mb-4">You haven&apos;t created any positions for this cycle yet.</p>
            {canCreatePosition && (
              <Link href="/doctor/chiromatch/create" className="text-neuro-orange text-sm font-bold hover:underline inline-flex items-center gap-1">
                Create your first position <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {cyclePositions.map(pos => (
              <div key={pos.id} className="bg-[#162231] rounded-2xl border border-white/[0.06] p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white">{pos.title}</h3>
                    <div className="flex items-center gap-4 mt-1 text-xs text-white/30">
                      {pos.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{pos.city}{pos.state ? `, ${pos.state}` : ''}</span>}
                      {pos.salary_min && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />${pos.salary_min.toLocaleString()}{pos.salary_max ? ` – $${pos.salary_max.toLocaleString()}` : ''}</span>}
                      {pos.mentorship_offered && <span className="text-green-400">Mentorship</span>}
                    </div>
                  </div>
                  <Link href={`/doctor/chiromatch/candidates?position=${pos.id}`} className="px-3 py-1.5 bg-white/[0.06] text-white/60 text-xs font-bold rounded-lg hover:text-neuro-orange hover:border-neuro-orange/20 transition-colors flex items-center gap-1">
                    <Users className="w-3 h-3" /> View Candidates
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
