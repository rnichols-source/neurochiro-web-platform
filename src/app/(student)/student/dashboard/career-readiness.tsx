"use client";

import Link from "next/link";

interface ReadinessBreakdown {
  score: number;
  weight: number;
  label: string;
}

interface CareerReadinessProps {
  totalScore: number;
  breakdown: Record<string, ReadinessBreakdown>;
}

const CATEGORY_LINKS: Record<string, string> = {
  profile: "/student/profile",
  academy: "/student/academy",
  interview: "/student/interview-prep",
  jobs: "/student/jobs",
  contract: "/student/contract-lab",
  financial: "/student/financial-planner",
};

function getLowestCategory(breakdown: Record<string, ReadinessBreakdown>): { key: string; label: string; href: string; score: number } | null {
  let lowest: { key: string; score: number } | null = null;
  for (const [key, val] of Object.entries(breakdown)) {
    if (!lowest || val.score < lowest.score) {
      lowest = { key, score: val.score };
    }
  }
  if (!lowest || lowest.score >= 100) return null;
  const cat = breakdown[lowest.key];
  return { key: lowest.key, label: cat.label, href: CATEGORY_LINKS[lowest.key] || "/student/dashboard", score: lowest.score };
}

export default function CareerReadiness({ totalScore, breakdown }: CareerReadinessProps) {
  const lowest = getLowestCategory(breakdown);

  return (
    <div>
      {/* Score hero */}
      <div className="flex items-end gap-4 mb-8">
        <span className="text-7xl font-extralight text-white leading-none tabular-nums">{totalScore}</span>
        <div className="pb-2">
          <span className="text-lg text-white/15 font-light">/100</span>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/25 mt-1">Career Readiness</p>
        </div>
      </div>

      {/* Dimension bars */}
      <div className="space-y-3">
        {Object.entries(breakdown).map(([key, cat]) => (
          <Link key={key} href={CATEGORY_LINKS[key] || "#"} className="group block">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-white/40 group-hover:text-[#D66829] transition-colors">
                {cat.label}
              </span>
              <span className="text-[10px] text-white/20 tabular-nums">{cat.score}%</span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.max(cat.score, 2)}%`,
                  backgroundColor: cat.score >= 80 ? "#D66829" : cat.score >= 40 ? "#D66829" : "rgba(255,255,255,0.1)",
                }}
              />
            </div>
          </Link>
        ))}
      </div>

      {/* Boost prompt */}
      {lowest && lowest.score < 100 && (
        <Link
          href={lowest.href}
          className="mt-6 flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-[#D66829]/20 transition-all group"
        >
          <div>
            <p className="text-xs text-white/60">Boost your score</p>
            <p className="text-[11px] text-white/25">{lowest.label} needs attention</p>
          </div>
          <span className="text-[#D66829] text-xs opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
        </Link>
      )}
    </div>
  );
}
