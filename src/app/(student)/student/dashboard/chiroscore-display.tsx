"use client";

import Link from "next/link";
import type { ChiroScoreResult } from "@/lib/chiroscore";

const GRADE_COLORS: Record<string, string> = {
  A: "text-green-400",
  B: "text-blue-400",
  C: "text-yellow-400",
  D: "text-orange-400",
  F: "text-red-400",
};

const GRADE_BG: Record<string, string> = {
  A: "bg-green-400/10 border-green-400/20",
  B: "bg-blue-400/10 border-blue-400/20",
  C: "bg-yellow-400/10 border-yellow-400/20",
  D: "bg-orange-400/10 border-orange-400/20",
  F: "bg-red-400/10 border-red-400/20",
};

function getBarColor(score: number): string {
  if (score >= 75) return "linear-gradient(90deg, #16a34a, #22c55e)";
  if (score >= 40) return "linear-gradient(90deg, #D66829, #e8834a)";
  return "rgba(255,255,255,0.08)";
}

export default function ChiroScoreDisplay({ data }: { data: ChiroScoreResult }) {
  const { totalScore, breakdown, grade, topRecommendation } = data;

  return (
    <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-6 md:p-8 shadow-lg shadow-black/20">
      {/* Score + Grade */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-end gap-3">
            <span className="text-6xl font-bold text-white leading-none tabular-nums tracking-tight">{totalScore}</span>
            <div className="pb-1.5">
              <span className="text-xl text-white/20 font-light">/100</span>
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#D66829] font-semibold mt-2">ChiroScore</p>
        </div>
        <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center ${GRADE_BG[grade]}`}>
          <span className={`text-2xl font-black ${GRADE_COLORS[grade]}`}>{grade}</span>
        </div>
      </div>

      {/* Category Bars */}
      <div className="space-y-3.5 mt-6">
        {Object.entries(breakdown).map(([key, cat]) => (
          <Link key={key} href={cat.href} className="group block">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] text-white/50 font-medium group-hover:text-[#D66829] transition-colors">
                {cat.label}
              </span>
              <span className="text-[11px] text-white/30 tabular-nums font-medium">{cat.score}%</span>
            </div>
            <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.max(cat.score, 2)}%`,
                  background: getBarColor(cat.score),
                }}
              />
            </div>
          </Link>
        ))}
      </div>

      {/* Boost Recommendation */}
      {topRecommendation && (
        <Link
          href={topRecommendation.href}
          className="mt-6 flex items-center justify-between p-4 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:border-[#D66829]/30 transition-all group"
        >
          <div>
            <p className="text-[13px] font-medium text-white/70">Boost your ChiroScore</p>
            <p className="text-[11px] text-white/30">{topRecommendation.category} needs attention</p>
          </div>
          <span className="text-[#D66829] text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
        </Link>
      )}
    </div>
  );
}
