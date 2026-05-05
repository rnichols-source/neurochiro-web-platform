"use client";

import Link from "next/link";
import {
  UserCircle,
  BookOpen,
  Award,
  Briefcase,
  FileText,
  DollarSign,
  CheckCircle,
  ChevronRight,
  Compass,
  Star,
} from "lucide-react";

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
  { key: "profileComplete", label: "Profile Completed", icon: UserCircle, href: "/student/profile", color: "#3b82f6" },
  { key: "firstCourseStarted", label: "First Course Started", icon: BookOpen, href: "/student/academy", color: "#8b5cf6" },
  { key: "firstCourseCompleted", label: "First Course Completed", icon: Award, href: "/student/academy", color: "#8b5cf6" },
  { key: "firstJobApp", label: "First Job Application", icon: Briefcase, href: "/student/jobs", color: "#e97325" },
  { key: "contractReviewed", label: "First Contract Reviewed", icon: FileText, href: "/student/contract-lab", color: "#22c55e" },
  { key: "financialPlanCreated", label: "Financial Plan Created", icon: DollarSign, href: "/student/financial-planner", color: "#06b6d4" },
  { key: "allCoursesComplete", label: "All Courses Completed", icon: Star, href: "/student/academy", color: "#f59e0b" },
] as const;

export default function MilestoneTimeline({ milestones }: MilestoneTimelineProps) {
  const completedCount = MILESTONES.filter((m) => milestones[m.key as keyof MilestoneData]).length;
  const total = MILESTONES.length;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-heading font-black text-[#1a2744]">Milestones</h2>
          <p className="text-xs text-gray-400">
            {completedCount} of {total} achieved
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {MILESTONES.map((m) => (
            <div
              key={m.key}
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: milestones[m.key as keyof MilestoneData] ? m.color : "#e5e7eb",
              }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-1">
        {MILESTONES.map((m, idx) => {
          const done = milestones[m.key as keyof MilestoneData];
          const Icon = m.icon;
          const isNext = !done && (idx === 0 || milestones[MILESTONES[idx - 1].key as keyof MilestoneData]);

          return (
            <Link
              key={m.key}
              href={m.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                done
                  ? "bg-gray-50"
                  : isNext
                  ? "bg-[#e97325]/5 border border-[#e97325]/10"
                  : "hover:bg-gray-50"
              }`}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: done ? `${m.color}15` : isNext ? `${m.color}15` : "#f3f4f6",
                }}
              >
                {done ? (
                  <CheckCircle className="w-4 h-4" style={{ color: m.color }} />
                ) : (
                  <Icon className="w-4 h-4" style={{ color: isNext ? m.color : "#9ca3af" }} />
                )}
              </div>
              <span
                className={`text-sm font-medium flex-1 ${
                  done ? "text-gray-500 line-through" : isNext ? "text-[#1a2744] font-bold" : "text-gray-400"
                }`}
              >
                {m.label}
              </span>
              {isNext && (
                <ChevronRight className="w-4 h-4 text-[#e97325] group-hover:translate-x-0.5 transition-transform" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
