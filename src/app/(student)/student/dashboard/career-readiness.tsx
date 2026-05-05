"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

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

const CATEGORY_COLORS: Record<string, string> = {
  profile: "#3b82f6",
  academy: "#8b5cf6",
  interview: "#f59e0b",
  jobs: "#e97325",
  contract: "#22c55e",
  financial: "#06b6d4",
};

function getGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

function getLowestCategory(breakdown: Record<string, ReadinessBreakdown>): { key: string; label: string; href: string } | null {
  let lowest: { key: string; score: number } | null = null;
  for (const [key, val] of Object.entries(breakdown)) {
    if (!lowest || val.score < lowest.score) {
      lowest = { key, score: val.score };
    }
  }
  if (!lowest || lowest.score >= 100) return null;
  const cat = breakdown[lowest.key];
  return { key: lowest.key, label: cat.label, href: CATEGORY_LINKS[lowest.key] || "/student/dashboard" };
}

export default function CareerReadiness({ totalScore, breakdown }: CareerReadinessProps) {
  const grade = getGrade(totalScore);
  const lowest = getLowestCategory(breakdown);
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (totalScore / 100) * circumference;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Score Ring */}
        <div className="relative flex-shrink-0">
          <svg width="128" height="128" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r="54" fill="none" stroke="#f3f4f6" strokeWidth="8" />
            <circle
              cx="64" cy="64" r="54" fill="none"
              stroke="#e97325"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 64 64)"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-[#1a2744]">{totalScore}</span>
            <span className="text-xs font-bold text-gray-400">{grade}</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex-1 w-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-heading font-black text-[#1a2744]">Career Readiness</h2>
              <p className="text-xs text-gray-400">Your score across all career dimensions</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {Object.entries(breakdown).map(([key, cat]) => (
              <Link key={key} href={CATEGORY_LINKS[key] || "#"} className="group block">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold text-gray-600 group-hover:text-[#e97325] transition-colors">
                    {cat.label}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">{cat.score}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${cat.score}%`,
                      backgroundColor: CATEGORY_COLORS[key] || "#e97325",
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
          className="mt-5 flex items-center gap-3 p-3 rounded-xl bg-[#e97325]/5 border border-[#e97325]/10 hover:bg-[#e97325]/10 transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg bg-[#e97325] flex items-center justify-center flex-shrink-0">
            <ArrowRight className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#1a2744]">Boost your score</p>
            <p className="text-xs text-gray-500">
              Your {lowest.label.toLowerCase()} needs attention — start there.
            </p>
          </div>
        </Link>
      )}
    </div>
  );
}
