"use client";

import Link from "next/link";

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
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/25">
          Milestones &middot; {completedCount}/{MILESTONES.length}
        </p>
        <div className="flex items-center gap-1">
          {MILESTONES.map((m) => (
            <div
              key={m.key}
              className={`w-1 h-1 rounded-full ${
                milestones[m.key as keyof MilestoneData] ? "bg-[#D66829]" : "bg-white/10"
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
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group ${
                isNext ? "bg-white/[0.03]" : "hover:bg-white/[0.02]"
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  done
                    ? "bg-white/40"
                    : isNext
                    ? "bg-[#D66829]"
                    : "bg-white/10"
                }`}
              />
              <span
                className={`text-[12px] flex-1 ${
                  done ? "text-white/20 line-through" : isNext ? "text-white/70" : "text-white/15"
                }`}
              >
                {m.label}
              </span>
              {isNext && (
                <span className="text-[9px] text-[#D66829] opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
