"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass, ClipboardList, Briefcase, FileText, DollarSign,
  Check, ArrowRight, Loader2, ChevronDown, ChevronUp,
} from "lucide-react";
import { getCareerReadinessData, getStudentDashboardData, getMatchedJobsCount } from "./actions";
import { getVerificationStatus } from "../actions/verify-school";
import SchoolVerificationBanner from "./school-verification-banner";

// ── Color tokens ──
const T = {
  paper:    '#EFF1F2',
  paper2:   '#F7F8F9',
  ink:      '#16222D',
  inkMuted: '#5A6873',
  navy:     '#1E2D3B',
  orange:   '#D66829',
  slate:    '#3E6B7C',
  moss:     '#4A7A5E',
  line:     '#DDE2E5',
};

// ── Pipeline stages ──

const STAGES = [
  {
    id: "technique", number: 1,
    title: "Find Your Technique",
    task: "Explore 18 techniques and take the Find Your Fit quiz",
    icon: Compass,
    href: "/student/techniques",
    check: () => false,
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
    task: "Check your offer before you sign",
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
  const [profileData, setProfileData] = useState<any>(null);
  const [verification, setVerification] = useState<any>(null);
  const [jobCount, setJobCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getCareerReadinessData(),
      getStudentDashboardData(),
      getVerificationStatus(),
      getMatchedJobsCount(),
    ]).then(([r, p, v, j]) => {
      setReadiness(r);
      setProfileData(p);
      setVerification(v);
      setJobCount(j);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: T.slate }} />
      </div>
    );
  }

  const milestones = readiness?.milestones || {};
  const gradYear = profileData?.profile?.gradYear || verification?.graduationYear;
  const studentName = profileData?.profile?.name || '';

  let gradLine = '';
  if (gradYear) {
    const gradDate = new Date(gradYear, 4, 15);
    const now = new Date();
    const monthsLeft = Math.max(0, Math.round((gradDate.getTime() - now.getTime()) / (30.44 * 24 * 60 * 60 * 1000)));
    if (monthsLeft > 0) {
      gradLine = `Graduating ${gradYear} · ${monthsLeft} month${monthsLeft !== 1 ? 's' : ''} until you need an offer`;
    } else {
      gradLine = `Class of ${gradYear}`;
    }
  }

  const currentStage = STAGES.find(s => !s.check(milestones)) || STAGES[STAGES.length - 1];

  return (
    <div className="p-5 md:p-10 max-w-2xl mx-auto space-y-8 pb-24">
      {/* School Verification */}
      <SchoolVerificationBanner />

      {/* Name + graduation countdown */}
      <div>
        {studentName && (
          <h1 className="text-3xl font-bold tracking-tight mb-1" style={{ color: T.ink }}>{studentName}</h1>
        )}
        {gradLine ? (
          <p className="text-sm" style={{ color: T.inkMuted }}>{gradLine}</p>
        ) : (
          <Link href="/student/profile" className="text-sm hover:underline" style={{ color: T.slate }}>
            Set your graduation year to see your countdown
          </Link>
        )}
      </div>

      {/* Current stage — navy inverted card (the "where you are" surface) */}
      <div className="rounded-2xl p-6 md:p-8" style={{ background: T.navy }}>
        <p className="text-xs font-medium mb-3" style={{ color: T.slate }}>
          Stage {currentStage.number} of {STAGES.length}
        </p>
        <h2 className="text-xl font-bold text-white mb-2">{currentStage.title}</h2>
        <p className="text-sm text-white/50 mb-6">{currentStage.task}</p>
        {/* Orange: the single primary action on this screen */}
        <Link
          href={currentStage.href}
          className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl font-bold text-sm transition-colors min-h-[44px]"
          style={{ background: T.orange }}
        >
          {currentStage.id === 'jobs' && jobCount ? `Browse ${jobCount} Open Jobs` : 'Start'}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1.5">
        {STAGES.map((stage) => {
          const done = stage.check(milestones);
          const isCurrent = stage.id === currentStage.id;
          return (
            <div
              key={stage.id}
              className="flex-1 h-2 rounded-sm"
              style={{
                background: done ? T.moss
                  : isCurrent ? T.orange
                  : T.line,
              }}
            />
          );
        })}
      </div>

      {/* Remaining stages */}
      <div className="space-y-2">
        {STAGES.filter(s => s.id !== currentStage.id).map((stage) => {
          const done = stage.check(milestones);
          const isExpanded = expandedStage === stage.id;
          const Icon = stage.icon;

          return (
            <button
              key={stage.id}
              onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
              className="w-full text-left rounded-xl transition-all"
              style={{
                background: done ? T.paper2 : 'transparent',
                border: done ? `1px solid ${T.line}` : 'none',
                opacity: done ? 1 : 0.6,
              }}
            >
              <div className="flex items-center gap-3 p-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: done ? T.moss : T.line }}>
                  {done
                    ? <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    : <Icon className="w-4 h-4" style={{ color: T.inkMuted }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: done ? T.inkMuted : T.ink }}>
                    {stage.title}
                  </p>
                  {!done && <p className="text-xs truncate" style={{ color: T.inkMuted }}>{stage.task}</p>}
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {done && <span className="text-[10px] font-bold" style={{ color: T.moss }}>Done</span>}
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4" style={{ color: T.line }} />
                    : <ChevronDown className="w-4 h-4" style={{ color: T.line }} />}
                </div>
              </div>
              {isExpanded && (
                <div className="px-4 pb-4" onClick={e => e.stopPropagation()}>
                  <Link
                    href={stage.href}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                    style={{ background: T.paper, color: T.ink, border: `1px solid ${T.line}` }}
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
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link href="/directory" className="p-4 rounded-xl text-center transition-colors"
          style={{ background: T.paper2, border: `1px solid ${T.line}` }}>
          <p className="text-xs font-bold" style={{ color: T.ink }}>Browse Doctors</p>
          <p className="text-[10px] mt-0.5" style={{ color: T.inkMuted }}>See who they are and how they practice</p>
        </Link>
        <Link href="/student/mentors" className="p-4 rounded-xl text-center transition-colors"
          style={{ background: T.paper2, border: `1px solid ${T.line}` }}>
          <p className="text-xs font-bold" style={{ color: T.ink }}>Talk to a Doctor</p>
          <p className="text-[10px] mt-0.5" style={{ color: T.inkMuted }}>Ask about their practice or a job</p>
        </Link>
      </div>
    </div>
  );
}
