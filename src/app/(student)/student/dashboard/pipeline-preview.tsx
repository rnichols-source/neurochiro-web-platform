"use client";

import Link from "next/link";
import { CheckCircle, BookOpen, Compass, ClipboardList, Briefcase, FileText, DollarSign } from "lucide-react";

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
  {
    id: "learn",
    label: "Learn",
    desc: "Build your foundation",
    icon: BookOpen,
    href: "/student/academy",
    color: "#8b5cf6",
    check: (m: MilestoneData) => m.firstCourseCompleted,
    active: (m: MilestoneData) => m.firstCourseStarted && !m.firstCourseCompleted,
  },
  {
    id: "techniques",
    label: "Techniques",
    desc: "Find your fit",
    icon: Compass,
    href: "/student/techniques",
    color: "#3b82f6",
    check: (m: MilestoneData, mods: number) => mods >= 6,
    active: (m: MilestoneData) => m.firstCourseCompleted,
  },
  {
    id: "interview",
    label: "Interview",
    desc: "Prep for success",
    icon: ClipboardList,
    href: "/student/interview-prep",
    color: "#f59e0b",
    check: (m: MilestoneData, mods: number) => mods >= 12,
    active: (m: MilestoneData, mods: number) => mods >= 6,
  },
  {
    id: "jobs",
    label: "Jobs",
    desc: "Land your position",
    icon: Briefcase,
    href: "/student/jobs",
    color: "#e97325",
    check: (m: MilestoneData) => m.firstJobApp,
    active: (m: MilestoneData, mods: number) => mods >= 10,
  },
  {
    id: "contract",
    label: "Contract",
    desc: "Review your deal",
    icon: FileText,
    href: "/student/contract-lab",
    color: "#22c55e",
    check: (m: MilestoneData) => m.contractReviewed,
    active: (m: MilestoneData) => m.firstJobApp,
  },
  {
    id: "finance",
    label: "Finance",
    desc: "Plan your future",
    icon: DollarSign,
    href: "/student/financial-planner",
    color: "#06b6d4",
    check: (m: MilestoneData) => m.financialPlanCreated,
    active: (m: MilestoneData) => m.contractReviewed,
  },
];

export default function PipelinePreview({ milestones, modulesCompleted }: PipelinePreviewProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-heading font-black text-[#1a2744]">Career Pipeline</h2>
          <p className="text-xs text-gray-400">Your path from student to associate</p>
        </div>
        <Link
          href="/student/career-pipeline"
          className="text-xs font-bold text-[#e97325] hover:underline"
        >
          View Full Pipeline
        </Link>
      </div>

      {/* Horizontal stepper */}
      <div className="flex items-start overflow-x-auto pb-2 gap-0">
        {STAGES.map((stage, idx) => {
          const done = stage.check(milestones, modulesCompleted);
          const active = !done && stage.active(milestones, modulesCompleted);
          const Icon = stage.icon;

          return (
            <div key={stage.id} className="flex items-start flex-shrink-0">
              {idx > 0 && (
                <div className="flex items-center mt-5">
                  <div
                    className="w-6 md:w-10 h-0.5"
                    style={{ backgroundColor: done ? stage.color : "#e5e7eb" }}
                  />
                </div>
              )}
              <Link href={stage.href} className="flex flex-col items-center w-16 md:w-20 group">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
                  style={{
                    backgroundColor: done
                      ? stage.color
                      : active
                      ? `${stage.color}20`
                      : "#f3f4f6",
                    border: active ? `2px solid ${stage.color}` : "2px solid transparent",
                  }}
                >
                  {done ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <Icon
                      className="w-4 h-4"
                      style={{ color: active ? stage.color : "#9ca3af" }}
                    />
                  )}
                </div>
                <span
                  className="text-[10px] font-bold mt-1.5 text-center leading-tight"
                  style={{ color: done ? stage.color : active ? "#1a2744" : "#9ca3af" }}
                >
                  {stage.label}
                </span>
                <span className="text-[8px] text-gray-400 text-center leading-tight hidden md:block">
                  {stage.desc}
                </span>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
