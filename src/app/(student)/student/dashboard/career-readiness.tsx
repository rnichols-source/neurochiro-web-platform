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

function getGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

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
  const grade = getGrade(totalScore);
  const lowest = getLowestCategory(breakdown);
  const circumference = 2 * Math.PI * 58;
  const strokeDashoffset = circumference - (totalScore / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
      <div className="flex flex-col sm:flex-row items-center gap-8">
        {/* Score Ring */}
        <div className="relative flex-shrink-0">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="58" fill="none" stroke="#f0eeea" strokeWidth="6" />
            <circle
              cx="70" cy="70" r="58" fill="none"
              stroke="#D66829"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 70 70)"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-light text-[#1E2D3B]">{totalScore}</span>
            <span className="text-[10px] font-medium text-[#1E2D3B]/40 uppercase tracking-wider">{grade}</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex-1 w-full">
          <h2 className="text-sm font-semibold text-[#1E2D3B] mb-1">Career Readiness</h2>
          <p className="text-xs text-[#1E2D3B]/40 mb-5">Progress across all dimensions</p>
          <div className="space-y-3">
            {Object.entries(breakdown).map(([key, cat]) => (
              <Link key={key} href={CATEGORY_LINKS[key] || "#"} className="group block">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#1E2D3B]/60 group-hover:text-[#D66829] transition-colors">
                    {cat.label}
                  </span>
                  <span className="text-[10px] text-[#1E2D3B]/30 tabular-nums">{cat.score}%</span>
                </div>
                <div className="h-1 bg-[#F5F3EF] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.max(cat.score, 2)}%`,
                      backgroundColor: cat.score >= 80 ? "#1E2D3B" : cat.score >= 40 ? "#D66829" : "#1E2D3B20",
                    }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Next action */}
      {lowest && lowest.score < 100 && (
        <Link
          href={lowest.href}
          className="mt-6 flex items-center justify-between p-3.5 rounded-xl bg-[#F5F3EF] hover:bg-[#eae7e1] transition-colors group"
        >
          <div>
            <p className="text-xs font-medium text-[#1E2D3B]">Boost your score</p>
            <p className="text-[11px] text-[#1E2D3B]/40">
              {lowest.label} needs attention
            </p>
          </div>
          <span className="text-[#D66829] text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Go &rarr;
          </span>
        </Link>
      )}
    </div>
  );
}
