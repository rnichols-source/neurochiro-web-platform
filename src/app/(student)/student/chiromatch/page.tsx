"use client";

import { useState, useEffect } from "react";
import { Shuffle, Loader2, ArrowRight, Calendar, Users, List } from "lucide-react";
import Link from "next/link";
import { getActiveCycleForStudent, getMyRankings } from "./actions";
import type { MatchCycle } from "@/types/chiromatch";

export default function StudentChiroMatchPage() {
  const [cycle, setCycle] = useState<MatchCycle | null>(null);
  const [rankingCount, setRankingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveCycleForStudent().then(async (c) => {
      setCycle(c);
      if (c) {
        const rankings = await getMyRankings(c.id);
        setRankingCount(rankings.length);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="min-h-dvh flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-neuro-orange" /></div>;
  }

  const isRankingOpen = cycle?.status === 'ranking_open';
  const closesAt = cycle?.ranking_closes_at ? new Date(cycle.ranking_closes_at).getTime() : 0;
  const stillOpen = Boolean(isRankingOpen && closesAt > Date.now());
  const isMatched = cycle?.status === 'matched' || cycle?.status === 'completed';
  const daysUntilMatch = cycle ? Math.max(0, Math.ceil((new Date(cycle.match_day).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-2 mb-1">
        <Shuffle className="w-6 h-6 text-neuro-orange" />
        <h1 className="text-3xl font-bold text-portal-ink tracking-tight">ChiroMatch</h1>
      </div>
      <p className="text-portal-ink-2 text-sm -mt-6">Rank your preferred practices. Get matched on Match Day.</p>

      {/* Cycle Status */}
      {cycle ? (
        <div className="bg-white border border-[#e3e8ed] rounded-2xl border border-[#e3e8ed] p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs tracking-[0.2em] text-neuro-orange font-semibold mb-1">{cycle.name}</p>
              <h2 className="text-2xl font-bold text-portal-ink">
                {isMatched ? "Results are in" : stillOpen ? "Ranking is open" : "Ranking rounds are closed"}
              </h2>
            </div>
            <span className="px-3 py-1 bg-neuro-orange/10 text-neuro-orange text-xs font-bold rounded-full uppercase">
              {cycle.status.replace('_', ' ')}
            </span>
          </div>

          {/* Timeline */}
          <div className="grid grid-cols-3 gap-4 text-center mb-6">
            <div className={`p-3 rounded-xl ${cycle.status === 'ranking_open' ? 'bg-neuro-orange/10 border border-neuro-orange/20' : 'bg-[#f7f8fa]'}`}>
              <Calendar className="w-4 h-4 text-portal-ink-2 mx-auto mb-1" />
              <p className="text-xs text-portal-ink-2 tracking-widest mb-1">Ranking Opens</p>
              <p className="text-sm font-bold text-portal-ink">{new Date(cycle.ranking_opens_at).toLocaleDateString()}</p>
            </div>
            <div className={`p-3 rounded-xl ${cycle.status === 'ranking_closed' ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-[#f7f8fa]'}`}>
              <List className="w-4 h-4 text-portal-ink-2 mx-auto mb-1" />
              <p className="text-xs text-portal-ink-2 tracking-widest mb-1">Ranking Closes</p>
              <p className="text-sm font-bold text-portal-ink">{new Date(cycle.ranking_closes_at).toLocaleDateString()}</p>
            </div>
            <div className={`p-3 rounded-xl ${isMatched ? 'bg-green-500/10 border border-green-500/20' : 'bg-[#f7f8fa]'}`}>
              <Users className="w-4 h-4 text-portal-ink-2 mx-auto mb-1" />
              <p className="text-xs text-portal-ink-2 tracking-widest mb-1">Match Day</p>
              <p className="text-sm font-bold text-neuro-orange">{new Date(cycle.match_day).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-6 text-sm">
            <span className="text-portal-ink-2">Rankings submitted: <strong className="text-portal-ink">{rankingCount}/10</strong></span>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#e3e8ed] rounded-2xl border border-[#e3e8ed] p-8 text-center">
          <Shuffle className="w-10 h-10 text-portal-ink-2 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-portal-ink mb-2">Next Cycle Coming Soon</h2>
          <p className="text-portal-ink-2 text-sm">ChiroMatch runs twice a year — Spring and Fall. Check back for the next cycle.</p>
        </div>
      )}

      {/* Action Cards */}
      {cycle && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/student/chiromatch/positions"
            className="bg-white rounded-2xl border border-[#e3e8ed] p-5 hover:border-neuro-orange/20 transition-all group"
          >
            <Users className="w-5 h-5 text-neuro-orange mb-3" />
            <h3 className="font-bold text-portal-ink mb-1">Browse Positions</h3>
            <p className="text-portal-ink-2 text-xs">View participating practices and find your best matches</p>
            <span className="text-neuro-orange text-xs font-bold mt-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Explore <ArrowRight className="w-3 h-3" />
            </span>
          </Link>

          <Link
            href="/student/chiromatch/rankings"
            className="bg-white rounded-2xl border border-[#e3e8ed] p-5 hover:border-neuro-orange/20 transition-all group"
          >
            <List className="w-5 h-5 text-neuro-orange mb-3" />
            <h3 className="font-bold text-portal-ink mb-1">My Rankings</h3>
            <p className="text-portal-ink-2 text-xs">Manage your ranked preferences ({rankingCount} submitted)</p>
            <span className="text-neuro-orange text-xs font-bold mt-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Manage <ArrowRight className="w-3 h-3" />
            </span>
          </Link>

          {isMatched && (
            <Link
              href="/student/chiromatch/results"
              className="bg-white rounded-2xl border border-neuro-orange/30 p-5 hover:border-neuro-orange/50 transition-all group"
            >
              <Shuffle className="w-5 h-5 text-neuro-orange mb-3" />
              <h3 className="font-bold text-portal-ink mb-1">Match Results</h3>
              <p className="text-portal-ink-2 text-xs">See who you matched with</p>
              <span className="text-neuro-orange text-xs font-bold mt-3 flex items-center gap-1">
                View Results <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
