"use client";

import Link from "next/link";
import type { ChiroScoreResult } from "@/lib/chiroscore";

function getBarColor(score: number): string {
  if (score >= 75) return "linear-gradient(90deg, #16a34a, #22c55e)";
  if (score >= 40) return "linear-gradient(90deg, #D66829, #e8834a)";
  return "#DDE2E5";
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
    <div className="bg-white border border-[#e3e8ed] rounded-2xl border border-[#e3e8ed] p-6 md:p-8 shadow-lg shadow-black/20">
      {/* Score — no letter grade */}
      <div className="mb-2">
        <div className="flex items-end gap-3">
          <span className="text-5xl font-bold text-portal-ink leading-none tabular-nums tracking-tight">{totalScore}</span>
          <div className="pb-1">
            <span className="text-lg text-portal-ink-2 font-light">/100</span>
          </div>
        </div>
        <p className="text-xs tracking-[0.2em] text-[#D66829] font-semibold mt-2">Career Readiness</p>
        <p className="text-xs text-portal-ink-2 mt-1">{status}</p>
      </div>

      {/* Category Bars */}
      <div className="space-y-3.5 mt-6">
        {Object.entries(breakdown).map(([key, cat]) => (
          <Link key={key} href={cat.href} className="group block">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] text-portal-ink-2 font-medium group-hover:text-[#D66829] transition-colors">
                {cat.label}
              </span>
              <span className="text-xs text-portal-ink-2 tabular-nums font-medium">{cat.score}%</span>
            </div>
            <div className="h-2 bg-[#f7f8fa] rounded-full overflow-hidden">
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
          className="mt-6 flex items-center justify-between p-4 rounded-xl bg-[#f7f8fa] border border-[#e3e8ed] hover:border-[#D66829]/30 transition-all group"
        >
          <div>
            <p className="text-[13px] font-medium text-portal-ink-2">Next step</p>
            <p className="text-xs text-portal-ink-2">{topRecommendation.category}</p>
          </div>
          <span className="text-[#D66829] text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
        </Link>
      )}
    </div>
  );
}
