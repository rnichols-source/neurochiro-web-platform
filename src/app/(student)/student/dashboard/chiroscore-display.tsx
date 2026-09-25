"use client";

import Link from "next/link";
import type { ChiroScoreResult } from "@/lib/chiroscore";

function getBarColor(score: number): string {
  if (score >= 75) return "linear-gradient(90deg, #16a34a, #22c55e)";
  if (score >= 40) return "linear-gradient(90deg, #D66829, #e8834a)";
  return "rgba(255,255,255,0.08)";
}

function getStatusLabel(score: number): string {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Building";
  if (score >= 30) return "In Progress";
  return "Getting Started";
}

export default function ChiroScoreDisplay({ data }: { data: ChiroScoreResult }) {
  const { totalScore, breakdown, topRecommendation } = data;
  const status = getStatusLabel(totalScore);

  return (
    <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-6 md:p-8 shadow-lg shadow-black/20">
      {/* Score — no letter grade */}
      <div className="mb-2">
        <div className="flex items-end gap-3">
          <span className="text-5xl font-bold text-white leading-none tabular-nums tracking-tight">{totalScore}</span>
          <div className="pb-1">
            <span className="text-lg text-white/20 font-light">/100</span>
          </div>
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#D66829] font-semibold mt-2">Career Readiness</p>
        <p className="text-xs text-white/40 mt-1">{status}</p>
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

      {/* Next step */}
      {topRecommendation && (
        <Link
          href={topRecommendation.href}
          className="mt-6 flex items-center justify-between p-4 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:border-[#D66829]/30 transition-all group"
        >
          <div>
            <p className="text-[13px] font-medium text-white/70">Next step</p>
            <p className="text-[11px] text-white/30">{topRecommendation.category}</p>
          </div>
          <span className="text-[#D66829] text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
        </Link>
      )}
    </div>
  );
}
