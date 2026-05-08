"use client";

import type { PracticeHealthResult } from "@/lib/practice-health";

const GRADE_COLORS: Record<string, { ring: string; text: string; bg: string }> = {
  A: { ring: "stroke-green-400", text: "text-green-400", bg: "bg-green-400/10" },
  B: { ring: "stroke-blue-400", text: "text-blue-400", bg: "bg-blue-400/10" },
  C: { ring: "stroke-yellow-400", text: "text-yellow-400", bg: "bg-yellow-400/10" },
  D: { ring: "stroke-orange-400", text: "text-orange-400", bg: "bg-orange-400/10" },
  F: { ring: "stroke-red-400", text: "text-red-400", bg: "bg-red-400/10" },
};

function getBarColor(score: number) {
  if (score >= 75) return "bg-green-400";
  if (score >= 50) return "bg-neuro-orange";
  if (score >= 25) return "bg-yellow-400";
  return "bg-white/10";
}

export default function PracticeHealthGauge({ data }: { data: PracticeHealthResult }) {
  const { totalScore, grade, breakdown } = data;
  const colors = GRADE_COLORS[grade] || GRADE_COLORS.C;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (totalScore / 100) * circumference;

  return (
    <div className="flex items-center gap-6">
      {/* Circular Gauge */}
      <div className="relative w-28 h-28 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="45" fill="none"
            className={colors.ring}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white">{totalScore}</span>
          <span className={`text-xs font-bold ${colors.text}`}>{grade}</span>
        </div>
      </div>

      {/* Category Bars */}
      <div className="flex-1 space-y-2">
        {Object.values(breakdown).map((cat) => (
          <div key={cat.label}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[11px] text-white/40">{cat.label}</span>
              <span className="text-[10px] text-white/20 tabular-nums">{cat.score}%</span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${getBarColor(cat.score)} transition-all duration-700`} style={{ width: `${Math.max(cat.score, 2)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
