"use client";

import Link from "next/link";

interface MilestoneData {
  firstCourseStarted: boolean;
  firstCourseCompleted: boolean;
  firstJobApp: boolean;
  contractReviewed: boolean;
  financialPlanCreated: boolean;
}

interface PipelinePreviewProps {
  milestones: MilestoneData;
  modulesCompleted: number;
}

const STAGES = [
  { id: "learn", label: "Learn", href: "/student/academy", check: (m: MilestoneData) => m.firstCourseCompleted, active: (m: MilestoneData) => m.firstCourseStarted && !m.firstCourseCompleted },
  { id: "techniques", label: "Techniques", href: "/student/techniques", check: (_m: MilestoneData, mods: number) => mods >= 6, active: (m: MilestoneData) => m.firstCourseCompleted },
  { id: "interview", label: "Interview", href: "/student/interview-prep", check: (_m: MilestoneData, mods: number) => mods >= 12, active: (_m: MilestoneData, mods: number) => mods >= 6 },
  { id: "jobs", label: "Apply", href: "/student/jobs", check: (m: MilestoneData) => m.firstJobApp, active: (_m: MilestoneData, mods: number) => mods >= 10 },
  { id: "contract", label: "Contract", href: "/student/contract-lab", check: (m: MilestoneData) => m.contractReviewed, active: (m: MilestoneData) => m.firstJobApp },
  { id: "finance", label: "Finance", href: "/student/financial-planner", check: (m: MilestoneData) => m.financialPlanCreated, active: (m: MilestoneData) => m.contractReviewed },
];

export default function PipelinePreview({ milestones, modulesCompleted }: PipelinePreviewProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/25">Pipeline</p>
        <Link href="/student/career-pipeline" className="text-[10px] text-[#D66829] hover:underline">
          View all
        </Link>
      </div>

      {/* Gauge bar */}
      <div className="flex h-2 rounded-full overflow-hidden gap-px">
        {STAGES.map((stage) => {
          const done = stage.check(milestones, modulesCompleted);
          const active = !done && stage.active(milestones, modulesCompleted);
          return (
            <Link
              key={stage.id}
              href={stage.href}
              className={`flex-1 rounded-sm transition-colors ${
                done
                  ? "bg-[#D66829]"
                  : active
                  ? "bg-[#D66829]/30"
                  : "bg-white/[0.06]"
              }`}
            />
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex mt-2">
        {STAGES.map((stage) => {
          const done = stage.check(milestones, modulesCompleted);
          const active = !done && stage.active(milestones, modulesCompleted);
          return (
            <span
              key={stage.id}
              className={`flex-1 text-[8px] text-center transition-colors ${
                done ? "text-[#D66829]" : active ? "text-white/40" : "text-white/15"
              }`}
            >
              {stage.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
