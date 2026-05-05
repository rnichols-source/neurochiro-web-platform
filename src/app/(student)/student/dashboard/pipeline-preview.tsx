"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";

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
    <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-sm font-semibold text-[#1E2D3B]">Career Pipeline</h2>
          <p className="text-xs text-[#1E2D3B]/40">Your path from student to associate</p>
        </div>
        <Link href="/student/career-pipeline" className="text-[11px] text-[#D66829] font-medium hover:underline">
          View all
        </Link>
      </div>

      {/* Horizontal pipeline */}
      <div className="flex items-center gap-0">
        {STAGES.map((stage, idx) => {
          const done = stage.check(milestones, modulesCompleted);
          const active = !done && stage.active(milestones, modulesCompleted);

          return (
            <div key={stage.id} className="flex items-center flex-1 min-w-0">
              {idx > 0 && (
                <div className={`h-px flex-1 transition-colors ${done ? "bg-[#1E2D3B]" : "bg-gray-100"}`} />
              )}
              <Link href={stage.href} className="flex flex-col items-center group">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    done
                      ? "bg-[#1E2D3B]"
                      : active
                      ? "bg-white border-2 border-[#D66829]"
                      : "bg-white border border-gray-200"
                  }`}
                >
                  {done ? (
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <span className={`text-[9px] font-semibold ${active ? "text-[#D66829]" : "text-gray-300"}`}>
                      {idx + 1}
                    </span>
                  )}
                </div>
                <span className={`text-[9px] mt-1.5 text-center transition-colors ${
                  done ? "text-[#1E2D3B] font-medium" : active ? "text-[#D66829] font-medium" : "text-gray-300"
                } group-hover:text-[#D66829]`}>
                  {stage.label}
                </span>
              </Link>
              {idx < STAGES.length - 1 && (
                <div className={`h-px flex-1 transition-colors ${done ? "bg-[#1E2D3B]" : "bg-gray-100"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
