"use client";

import {
  Loader2,
  ArrowRight,
  GraduationCap,
  Briefcase,
  Calendar,
  Map,
  Users,
  Compass,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  getStudentDashboardData,
  getAcademyProgress,
  getCareerReadinessData,
  getMatchedJobsCount,
  transitionToDoctorAction,
} from "./actions";
import CareerReadiness from "./career-readiness";
import PipelinePreview from "./pipeline-preview";
import MilestoneTimeline from "./milestone-timeline";

export default function StudentDashboard() {
  const [data, setData] = useState<any>(null);
  const [academyData, setAcademyData] = useState<{ completed: number; total: number }>({ completed: 0, total: 22 });
  const [readiness, setReadiness] = useState<any>(null);
  const [jobCount, setJobCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    Promise.all([
      getStudentDashboardData(),
      getAcademyProgress(),
      getCareerReadinessData(),
      getMatchedJobsCount(),
    ]).then(([dashResult, academyResult, readinessResult, jobsResult]) => {
      if (dashResult) setData(dashResult);
      if (academyResult) setAcademyData(academyResult);
      if (readinessResult) setReadiness(readinessResult);
      setJobCount(jobsResult);
      setLoading(false);
    });
  }, []);

  const handleTransition = async () => {
    if (!confirm("This will switch your account from Student to Doctor. Your student data will be preserved. This can't be undone. Continue?")) return;
    setTransitioning(true);
    const result = await transitionToDoctorAction();
    if (result.success) {
      window.location.href = "/doctor/dashboard";
    } else {
      alert("Failed to transition account. Please try again.");
      setTransitioning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-5 h-5 text-[#D66829] animate-spin" />
      </div>
    );
  }

  const studentName = data?.profile?.name || "Student";
  const schoolInfo = data?.profile?.school
    ? `${data.profile.school} '${data.profile.gradYear?.toString().slice(-2) || "27"}`
    : null;

  const currentYear = new Date().getFullYear();
  const gradYear = data?.profile?.gradYear ? parseInt(data.profile.gradYear, 10) : null;
  const isGraduating = gradYear && gradYear <= currentYear;

  const daysUntilGrad = gradYear
    ? Math.max(0, Math.ceil((new Date(`${gradYear}-06-15`).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const totalScore = readiness?.totalScore || 0;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-[#1E2D3B] tracking-tight">
            {studentName}
          </h1>
          {schoolInfo && <p className="text-[#1E2D3B]/40 text-sm mt-1">{schoolInfo}</p>}
        </div>
        <Link
          href="/student/career-pipeline"
          className="hidden sm:flex items-center gap-2 text-xs text-[#D66829] font-medium hover:underline"
        >
          <Map className="w-3.5 h-3.5" /> Career Pipeline
        </Link>
      </div>

      {/* Stats — clean, minimal */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-100 rounded-2xl overflow-hidden">
        {[
          { label: "Readiness", value: `${totalScore}`, unit: "/100" },
          { label: "Open Jobs", value: `${jobCount}`, href: "/student/jobs" },
          { label: "Modules", value: `${academyData.completed}`, unit: `/${academyData.total}`, href: "/student/academy" },
          daysUntilGrad !== null && daysUntilGrad > 0
            ? { label: "Graduation", value: `${daysUntilGrad}`, unit: " days" }
            : { label: "Applications", value: `${readiness?.raw?.appsSubmitted || 0}` },
        ].map((stat, i) => {
          const inner = (
            <div key={i} className="bg-white p-5 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wider text-[#1E2D3B]/30 mb-1">{stat.label}</p>
              <p className="text-2xl font-light text-[#1E2D3B] tabular-nums">
                {stat.value}
                {stat.unit && <span className="text-sm text-[#1E2D3B]/25">{stat.unit}</span>}
              </p>
            </div>
          );
          return stat.href ? <Link key={i} href={stat.href} className="hover:bg-[#F5F3EF] transition-colors">{inner}</Link> : <div key={i}>{inner}</div>;
        })}
      </div>

      {/* First-time guidance — only for brand new students */}
      {totalScore < 20 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
          <h2 className="text-sm font-semibold text-[#1E2D3B] mb-1">Here&apos;s how this works</h2>
          <p className="text-xs text-[#1E2D3B]/40 mb-5">Your portal has everything you need to launch your career.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border-l-2 border-[#1E2D3B]/10 pl-4">
              <p className="text-xs font-medium text-[#1E2D3B] mb-0.5">1. Learn</p>
              <p className="text-[11px] text-[#1E2D3B]/40 leading-relaxed">Courses, techniques, and interview prep. All included.</p>
            </div>
            <div className="border-l-2 border-[#D66829]/30 pl-4">
              <p className="text-xs font-medium text-[#1E2D3B] mb-0.5">2. Connect</p>
              <p className="text-[11px] text-[#1E2D3B]/40 leading-relaxed">Matched jobs, mentors, and your student network.</p>
            </div>
            <div className="border-l-2 border-[#1E2D3B]/10 pl-4">
              <p className="text-xs font-medium text-[#1E2D3B] mb-0.5">3. Launch</p>
              <p className="text-[11px] text-[#1E2D3B]/40 leading-relaxed">Contract review and financial planning before day one.</p>
            </div>
          </div>
          <p className="text-[11px] text-[#1E2D3B]/30 mt-5">
            Your Career Readiness score tracks progress across everything. Follow the <Link href="/student/career-pipeline" className="text-[#D66829] hover:underline">Career Pipeline</Link> for a step-by-step guide.
          </p>
        </div>
      )}

      {/* Readiness + Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {readiness && (
          <CareerReadiness totalScore={totalScore} breakdown={readiness.breakdown} />
        )}
        {readiness && (
          <div className="space-y-6">
            <PipelinePreview milestones={readiness.milestones} modulesCompleted={readiness.raw.modulesCompleted} />
            <MilestoneTimeline milestones={readiness.milestones} />
          </div>
        )}
      </div>

      {/* What to do next */}
      <div>
        <h2 className="text-sm font-semibold text-[#1E2D3B] mb-4">What to do next</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {getSmartActions(data, readiness, jobCount).map((action, i) => (
            <Link
              key={i}
              href={action.href}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-[#D66829]/20 transition-all group"
            >
              <action.icon className="w-4 h-4 text-[#1E2D3B]/20 group-hover:text-[#D66829] transition-colors mb-3" />
              <p className="text-[13px] font-medium text-[#1E2D3B] mb-0.5">{action.title}</p>
              <p className="text-[11px] text-[#1E2D3B]/40 leading-relaxed">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-[#1E2D3B] mb-4">Quick actions</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { label: "Jobs", href: "/student/jobs", icon: Briefcase },
            { label: "Mentors", href: "/student/mentors", icon: Users },
            { label: "Academy", href: "/student/academy", icon: BookOpen },
            { label: "Techniques", href: "/student/techniques", icon: Compass },
            { label: "Seminars", href: "/student/seminars", icon: Calendar },
            { label: "Community", href: "/student/community", icon: GraduationCap },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="bg-white rounded-xl border border-gray-100 p-4 text-center hover:border-[#D66829]/20 hover:-translate-y-0.5 transition-all group"
            >
              <action.icon className="w-4 h-4 text-[#1E2D3B]/20 group-hover:text-[#D66829] transition-colors mx-auto mb-2" />
              <p className="text-[11px] font-medium text-[#1E2D3B]/60 group-hover:text-[#1E2D3B]">{action.label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Graduation transition */}
      {isGraduating && (
        <div className="bg-[#1E2D3B] rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#D66829] mb-2">Congratulations</p>
            <h3 className="text-xl font-heading font-bold text-white">Transition to Doctor</h3>
            <p className="text-white/40 text-sm mt-1">Switch to a Doctor account to access the provider dashboard.</p>
          </div>
          <button
            onClick={handleTransition}
            disabled={transitioning}
            className="px-6 py-3 bg-[#D66829] text-white font-medium text-sm rounded-xl hover:bg-[#D66829]/90 transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
          >
            {transitioning && <Loader2 className="w-4 h-4 animate-spin" />}
            Transition Account <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function getSmartActions(data: any, readiness: any, jobCount: number) {
  const actions: { title: string; desc: string; href: string; icon: any }[] = [];
  const milestones = readiness?.milestones;

  if (!milestones?.profileComplete) {
    actions.push({ title: "Complete your profile", desc: "Powers job matching and mentor discovery", href: "/student/profile", icon: Users });
  }
  if (!milestones?.firstCourseStarted) {
    actions.push({ title: "Start your first course", desc: "Begin with Nervous System Foundations", href: "/student/academy", icon: BookOpen });
  }
  if (jobCount > 0 && milestones?.firstCourseCompleted) {
    actions.push({ title: `${jobCount} jobs available`, desc: "Browse positions matched to your profile", href: "/student/jobs", icon: Briefcase });
  }
  if (milestones?.firstCourseCompleted && !milestones?.firstJobApp) {
    actions.push({ title: "Apply to your first job", desc: "You have the knowledge — put it to work", href: "/student/jobs", icon: Briefcase });
  }
  if (milestones?.firstJobApp && !milestones?.contractReviewed) {
    actions.push({ title: "Review a contract", desc: "Don't sign without running it through Contract Lab", href: "/student/contract-lab", icon: Compass });
  }
  if (milestones?.contractReviewed && !milestones?.financialPlanCreated) {
    actions.push({ title: "Create your financial plan", desc: "Know your numbers before day one", href: "/student/financial-planner", icon: Calendar });
  }
  if (actions.length < 3) {
    actions.push({ title: "Explore techniques", desc: "Find the method that fits your style", href: "/student/techniques", icon: Compass });
  }
  if (actions.length < 3) {
    actions.push({ title: "Find a mentor", desc: "Connect with doctors who want to help", href: "/student/mentors", icon: Users });
  }
  return actions.slice(0, 3);
}
