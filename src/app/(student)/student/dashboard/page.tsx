"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass, ClipboardList, Briefcase, FileText, DollarSign,
  Check, ArrowRight, Loader2, ChevronDown, ChevronUp,
} from "lucide-react";
import { getCareerReadinessData } from "./actions";
import { getVerificationStatus } from "../actions/verify-school";
import SchoolVerificationBanner from "./school-verification-banner";
import { getMatchedJobsCount } from "./actions";

// ── Pipeline stages ──

const STAGES = [
  {
    id: "technique", number: 1,
    title: "Find Your Technique",
    task: "Explore 18 techniques and take the Find Your Fit quiz",
    icon: Compass,
    href: "/student/techniques",
    check: () => false, // no completion tracking without Academy
  },
  {
    id: "interview", number: 2,
    title: "Prepare for Interviews",
    task: "Practice the 20 questions doctors actually ask",
    icon: ClipboardList,
    href: "/student/interview-prep",
    check: () => false,
  },
  {
    id: "jobs", number: 3,
    title: "Find Your Job",
    task: "Browse open positions and apply",
    icon: Briefcase,
    href: "/student/jobs",
    check: (m: any) => m?.firstJobApp,
  },
  {
    id: "contract", number: 4,
    title: "Review Your Contract",
    task: "Run your offer through the Contract Lab before you sign",
    icon: FileText,
    href: "/student/contract-lab",
    check: (m: any) => m?.contractReviewed,
  },
  {
    id: "money", number: 5,
    title: "Plan Your Finances",
    task: "Model your first-year budget and loan repayment",
    icon: DollarSign,
    href: "/student/financial-planner",
    check: (m: any) => m?.financialPlanCreated,
  },
];

export default function StudentDashboard() {
  const [readiness, setReadiness] = useState<any>(null);
  const [verification, setVerification] = useState<any>(null);
  const [jobCount, setJobCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getCareerReadinessData(),
      getVerificationStatus(),
      getMatchedJobsCount(),
    ]).then(([r, v, j]) => {
      setReadiness(r);
      setVerification(v);
      setJobCount(j);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-5 h-5 text-[#D66829] animate-spin" />
      </div>
    );
  }

  const milestones = readiness?.milestones || {};
  const gradYear = readiness?.raw?.graduationYear || verification?.graduationYear;
  const studentName = readiness?.raw?.name?.split(' ')[0] || '';

  // Graduation countdown
  let gradLine = '';
  if (gradYear) {
    const gradDate = new Date(gradYear, 4, 15); // May of grad year
    const now = new Date();
    const monthsLeft = Math.max(0, Math.round((gradDate.getTime() - now.getTime()) / (30.44 * 24 * 60 * 60 * 1000)));
    if (monthsLeft > 0) {
      gradLine = `Graduating ${gradYear} · ${monthsLeft} month${monthsLeft !== 1 ? 's' : ''} until you need an offer`;
    } else {
      gradLine = `Class of ${gradYear}`;
    }
  }

  // Find current stage (first incomplete)
  const completedCount = STAGES.filter(s => s.check(milestones)).length;
  const currentStage = STAGES.find(s => !s.check(milestones)) || STAGES[STAGES.length - 1];
  const currentIndex = STAGES.indexOf(currentStage);

  return (
    <div className="p-4 md:p-10 max-w-3xl mx-auto space-y-6 pb-20">
      {/* School Verification */}
      <SchoolVerificationBanner />

      {/* Header: name + graduation countdown */}
      <div>
        {studentName && (
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">{studentName}</h1>
        )}
        {gradLine ? (
          <p className="text-sm text-white/40">{gradLine}</p>
        ) : (
          <Link href="/student/profile" className="text-sm text-[#D66829] hover:underline">
            Set your graduation year to see your countdown
          </Link>
        )}
      </div>

      {/* Current stage — hero */}
      <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-[#D66829]/30 shadow-lg shadow-black/20 p-5 md:p-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D66829]">
            Stage {currentStage.number} of {STAGES.length}
          </span>
          <span className="text-[10px] text-white/20">·</span>
          <span className="text-[10px] text-white/20">{completedCount} complete</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">{currentStage.title}</h2>
        <p className="text-sm text-white/50 mb-6">{currentStage.task}</p>
        <Link
          href={currentStage.href}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#D66829] text-white rounded-xl font-bold text-sm hover:bg-[#e8834a] shadow-lg shadow-[#D66829]/20 transition-colors min-h-[44px]"
        >
          {currentStage.id === 'jobs' && jobCount ? `Browse ${jobCount} Open Jobs` : 'Start'}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1">
        {STAGES.map((stage) => {
          const done = stage.check(milestones);
          const isCurrent = stage.id === currentStage.id;
          return (
            <div
              key={stage.id}
              className={`flex-1 h-2 rounded-sm transition-all ${
                done ? "bg-gradient-to-r from-[#D66829] to-[#e8834a]"
                : isCurrent ? "bg-[#D66829]/30"
                : "bg-white/[0.06]"
              }`}
            />
          );
        })}
      </div>

      {/* All stages */}
      <div className="space-y-2">
        {STAGES.map((stage) => {
          const done = stage.check(milestones);
          const isCurrent = stage.id === currentStage.id;
          const isExpanded = expandedStage === stage.id;
          const Icon = stage.icon;

          return (
            <button
              key={stage.id}
              onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
              className={`w-full text-left rounded-xl border transition-all ${
                done ? "bg-white/[0.02] border-white/[0.06]"
                : isCurrent ? "bg-gradient-to-b from-[#1a2e40] to-[#162231] border-[#D66829]/20"
                : "bg-white/[0.01] border-white/[0.04] opacity-50"
              }`}
            >
              <div className="flex items-center gap-3 p-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  done ? "bg-[#D66829]" : isCurrent ? "bg-[#D66829]/15" : "bg-white/[0.04]"
                }`}>
                  {done ? <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    : <Icon className={`w-4 h-4 ${isCurrent ? "text-[#D66829]" : "text-white/20"}`} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${done ? "text-white/50" : "text-white"}`}>
                    {stage.title}
                  </p>
                  {!done && <p className="text-xs text-white/30 truncate">{stage.task}</p>}
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {done && <span className="text-[10px] text-[#D66829] font-bold">Done</span>}
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-white/20" /> : <ChevronDown className="w-4 h-4 text-white/20" />}
                </div>
              </div>
              {isExpanded && (
                <div className="px-4 pb-4" onClick={e => e.stopPropagation()}>
                  <Link
                    href={stage.href}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.06] text-white/60 rounded-lg text-xs font-bold hover:bg-white/[0.1] transition-colors"
                  >
                    {done ? 'Review' : 'Go'} <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-2 pt-2">
        <Link href="/directory" className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-center hover:bg-white/[0.06] transition-colors">
          <p className="text-xs font-bold text-white/50">Browse Doctors</p>
          <p className="text-[10px] text-white/20">Watch Spotlight interviews</p>
        </Link>
        <Link href="/student/mentors" className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-center hover:bg-white/[0.06] transition-colors">
          <p className="text-xs font-bold text-white/50">Find a Mentor</p>
          <p className="text-[10px] text-white/20">Message doctors in the network</p>
        </Link>
      </div>
    </div>
  );
}
