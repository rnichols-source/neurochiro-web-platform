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
    <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-6 md:p-8 shadow-lg shadow-black/20">
      {/* Score */}
      <div className="flex items-end gap-3 mb-8">
        <span className="text-6xl font-bold text-white leading-none tabular-nums tracking-tight">{totalScore}</span>
        <div className="pb-1.5">
          <span className="text-xl text-white/20 font-light">/100</span>
        </div>
      </div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#D66829] font-semibold mb-6 -mt-4">Career Readiness</p>

      {/* Bars */}
      <div className="space-y-4">
        {Object.entries(breakdown).map(([key, cat]) => (
          <Link key={key} href={CATEGORY_LINKS[key] || "#"} className="group block">
            <div className="flex items-center justify-between mb-1.5">
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
                  background: cat.score >= 40 ? "linear-gradient(90deg, #D66829, #e8834a)" : "rgba(255,255,255,0.08)",
                }}
              />
            </div>
          </Link>
        ))}
      </div>

      {/* Boost */}
      {lowest && lowest.score < 100 && (
        <Link
          href={lowest.href}
          className="mt-6 flex items-center justify-between p-4 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:border-[#D66829]/30 transition-all group"
        >
          <div>
            <p className="text-[13px] font-medium text-white/70">Boost your score</p>
            <p className="text-[11px] text-white/30">{lowest.label} needs attention</p>
          </div>
          <span className="text-[#D66829] text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
        </Link>
      )}
    </div>
  );
}
