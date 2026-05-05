"use client";

import Link from "next/link";
import { Check } from "lucide-react";

interface MilestoneData {
  profileComplete: boolean;
  firstCourseStarted: boolean;
  firstCourseCompleted: boolean;
  firstJobApp: boolean;
  contractReviewed: boolean;
  financialPlanCreated: boolean;
  allCoursesComplete: boolean;
}

interface MilestoneTimelineProps {
  milestones: MilestoneData;
  joinDate?: string;
}

const MILESTONES = [
  { key: "profileComplete", label: "Profile completed", href: "/student/profile" },
  { key: "firstCourseStarted", label: "First course started", href: "/student/academy" },
  { key: "firstCourseCompleted", label: "First course finished", href: "/student/academy" },
  { key: "firstJobApp", label: "First application sent", href: "/student/jobs" },
  { key: "contractReviewed", label: "Contract reviewed", href: "/student/contract-lab" },
  { key: "financialPlanCreated", label: "Financial plan created", href: "/student/financial-planner" },
  { key: "allCoursesComplete", label: "All courses completed", href: "/student/academy" },
] as const;

export default function MilestoneTimeline({ milestones }: MilestoneTimelineProps) {
  const completedCount = MILESTONES.filter((m) => milestones[m.key as keyof MilestoneData]).length;
  const total = MILESTONES.length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-[#1E2D3B]">Milestones</h2>
          <p className="text-xs text-[#1E2D3B]/40">{completedCount} of {total}</p>
        </div>
        {/* Progress dots */}
        <div className="flex items-center gap-1">
          {MILESTONES.map((m) => (
            <div
              key={m.key}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                milestones[m.key as keyof MilestoneData] ? "bg-[#1E2D3B]" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-0.5">
        {MILESTONES.map((m, idx) => {
          const done = milestones[m.key as keyof MilestoneData];
          const isNext = !done && (idx === 0 || milestones[MILESTONES[idx - 1].key as keyof MilestoneData]);

          return (
            <Link
              key={m.key}
              href={m.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                isNext ? "bg-[#F5F3EF]" : "hover:bg-[#F5F3EF]/60"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  done
                    ? "bg-[#1E2D3B]"
                    : isNext
                    ? "border-2 border-[#D66829]"
                    : "border border-gray-200"
                }`}
              >
                {done && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>
              <span
                className={`text-[13px] flex-1 ${
                  done ? "text-[#1E2D3B]/40 line-through" : isNext ? "text-[#1E2D3B] font-medium" : "text-[#1E2D3B]/30"
                }`}
              >
                {m.label}
              </span>
              {isNext && (
                <span className="text-[10px] text-[#D66829] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Start &rarr;
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
