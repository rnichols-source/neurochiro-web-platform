"use client";

import { useState, useEffect } from "react";
import { Loader2, User, Eye, Users, Calendar, Briefcase, Award, Shuffle, Trophy, Star, Gift, Lock } from "lucide-react";
import { getDoctorBadges } from "./actions";
import { BADGE_DEFINITIONS } from "@/lib/badges";

const ICON_MAP: Record<string, any> = { User, Eye, Users, Calendar, Briefcase, Award, Shuffle, Trophy, Star, Gift };

const COLOR_MAP: Record<string, { bg: string; border: string; icon: string; locked: string }> = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500', locked: 'bg-gray-50 border-gray-200' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-500', locked: 'bg-gray-50 border-gray-200' },
  violet: { bg: 'bg-violet-50', border: 'border-violet-200', icon: 'text-violet-500', locked: 'bg-gray-50 border-gray-200' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-500', locked: 'bg-gray-50 border-gray-200' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-500', locked: 'bg-gray-50 border-gray-200' },
};

export default function BadgesPage() {
  const [data, setData] = useState<{ earned: any[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoctorBadges().then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) {
    return <div className="p-10 flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-neuro-orange" /></div>;
  }

  const earnedIds = new Set((data?.earned || []).map((b: any) => b.badge_id));
  const earnedMap = new Map((data?.earned || []).map((b: any) => [b.badge_id, b]));

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Award className="w-6 h-6 text-neuro-orange" />
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Achievements</h1>
        </div>
        <p className="text-white/30 text-sm">{earnedIds.size} of {BADGE_DEFINITIONS.length} badges earned</p>
      </div>

      {/* Progress Bar */}
      <div className="bg-[#162231] rounded-2xl border border-white/[0.06] p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/40">Badge Progress</span>
          <span className="text-xs font-bold text-neuro-orange">{Math.round((earnedIds.size / BADGE_DEFINITIONS.length) * 100)}%</span>
        </div>
        <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-neuro-orange to-neuro-orange-light transition-all" style={{ width: `${(earnedIds.size / BADGE_DEFINITIONS.length) * 100}%` }} />
        </div>
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {BADGE_DEFINITIONS.map(badge => {
          const isEarned = earnedIds.has(badge.id);
          const earnedData = earnedMap.get(badge.id);
          const Icon = ICON_MAP[badge.icon] || Award;
          const colors = COLOR_MAP[badge.color] || COLOR_MAP.blue;

          return (
            <div
              key={badge.id}
              className={`rounded-2xl border p-5 text-center transition-all ${
                isEarned ? `${colors.bg} ${colors.border}` : 'bg-white/[0.02] border-white/[0.06] opacity-40'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center ${
                isEarned ? `${colors.bg}` : 'bg-white/[0.04]'
              }`}>
                {isEarned ? (
                  <Icon className={`w-6 h-6 ${colors.icon}`} />
                ) : (
                  <Lock className="w-5 h-5 text-white/20" />
                )}
              </div>
              <p className={`text-sm font-bold mb-1 ${isEarned ? 'text-neuro-navy' : 'text-white/40'}`}>{badge.name}</p>
              <p className={`text-[10px] ${isEarned ? 'text-gray-500' : 'text-white/20'}`}>{badge.description}</p>
              {isEarned && earnedData && (
                <p className="text-[9px] text-neuro-orange font-bold mt-2">
                  Earned {new Date(earnedData.earned_at).toLocaleDateString()}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
