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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/25 font-semibold">
          Milestones &middot; {completedCount}/{MILESTONES.length}
        </p>
        <div className="flex items-center gap-1.5">
          {MILESTONES.map((m) => (
            <div
              key={m.key}
              className={`w-1.5 h-1.5 rounded-full ${
                milestones[m.key as keyof MilestoneData] ? "bg-[#D66829]" : "bg-white/[0.08]"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-1">
        {MILESTONES.map((m, idx) => {
          const done = milestones[m.key as keyof MilestoneData];
          const isNext = !done && (idx === 0 || milestones[MILESTONES[idx - 1].key as keyof MilestoneData]);

          return (
            <Link
              key={m.key}
              href={m.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                isNext ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  done
                    ? "bg-[#D66829]"
                    : isNext
                    ? "border-2 border-[#D66829]"
                    : "border border-white/[0.1]"
                }`}
              >
                {done && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>
              <span
                className={`text-[12px] flex-1 font-medium ${
                  done ? "text-white/25 line-through" : isNext ? "text-white/70" : "text-white/20"
                }`}
              >
                {m.label}
              </span>
              {isNext && (
                <span className="text-[10px] text-[#D66829] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
