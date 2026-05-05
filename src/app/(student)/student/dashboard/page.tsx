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
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.15em] text-[#D66829] font-semibold mb-1">Welcome back</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {studentName}
          </h1>
          {schoolInfo && <p className="text-white/30 text-sm mt-1 font-medium">{schoolInfo}</p>}
        </div>
        <Link
          href="/student/career-pipeline"
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/40 hover:text-[#D66829] hover:border-[#D66829]/20 transition-all"
        >
          <Map className="w-3.5 h-3.5" /> Career Pipeline
        </Link>
      </div>

      {/* Stats strip */}
      <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/[0.06]">
        {[
          { label: "Readiness", value: totalScore, unit: "/100" },
          { label: "Open Jobs", value: jobCount, href: "/student/jobs" },
          { label: "Modules", value: academyData.completed, unit: `/${academyData.total}`, href: "/student/academy" },
          daysUntilGrad !== null && daysUntilGrad > 0
            ? { label: "Graduation", value: daysUntilGrad, unit: " days" }
            : { label: "Applications", value: readiness?.raw?.appsSubmitted || 0 },
        ].map((stat, i) => {
          const inner = (
            <div className="px-5 py-6 text-center">
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/25 mb-2">{stat.label}</p>
              <p className="text-3xl font-bold text-white tabular-nums">
                {stat.value}
                {stat.unit && <span className="text-base text-white/20 font-normal">{stat.unit}</span>}
              </p>
            </div>
          );
          return stat.href ? (
            <Link key={i} href={stat.href} className="hover:bg-white/[0.03] transition-colors">{inner}</Link>
          ) : (
            <div key={i}>{inner}</div>
          );
        })}
      </div>

      {/* First-time guidance */}
      {totalScore < 20 && (
        <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-6 md:p-8">
          <p className="text-[13px] font-semibold text-white mb-5">Here&apos;s how this works</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="border-l-2 border-[#D66829] pl-4">
              <p className="text-[13px] font-semibold text-white mb-1">1. Learn</p>
              <p className="text-[12px] text-white/40 leading-relaxed">Courses, techniques, and interview prep. All included with your membership.</p>
            </div>
            <div className="border-l-2 border-white/[0.1] pl-4">
              <p className="text-[13px] font-semibold text-white mb-1">2. Connect</p>
              <p className="text-[12px] text-white/40 leading-relaxed">Matched jobs, mentors, and your student network.</p>
            </div>
            <div className="border-l-2 border-white/[0.1] pl-4">
              <p className="text-[13px] font-semibold text-white mb-1">3. Launch</p>
              <p className="text-[12px] text-white/40 leading-relaxed">Contract review and financial planning before day one.</p>
            </div>
          </div>
          <p className="text-[11px] text-white/20 mt-5">
            Your readiness score tracks progress across everything. Follow the <Link href="/student/career-pipeline" className="text-[#D66829] hover:underline">Career Pipeline</Link> for a step-by-step guide.
          </p>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: readiness */}
        <div className="lg:col-span-3">
          {readiness && <CareerReadiness totalScore={totalScore} breakdown={readiness.breakdown} />}
        </div>

        {/* Right: pipeline + milestones */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-6">
            {readiness && <PipelinePreview milestones={readiness.milestones} modulesCompleted={readiness.raw.modulesCompleted} />}
          </div>
          <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-6">
            {readiness && <MilestoneTimeline milestones={readiness.milestones} />}
          </div>
        </div>
      </div>

      {/* What to do next */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/25 font-semibold mb-4">What to do next</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {getSmartActions(data, readiness, jobCount).map((action, i) => (
            <Link
              key={i}
              href={action.href}
              className={`bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-6 hover:border-[#D66829]/30 transition-all group ${
                i === 0 ? "border-l-[3px] border-l-[#D66829]" : ""
              }`}
            >
              <action.icon className="w-5 h-5 text-white/15 group-hover:text-[#D66829] transition-colors mb-4" />
              <p className="text-[14px] font-semibold text-white mb-1">{action.title}</p>
              <p className="text-[12px] text-white/35 leading-relaxed">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/25 font-semibold mb-4">Quick actions</p>
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
              className="bg-[#162231] rounded-xl border border-white/[0.08] p-4 text-center hover:border-[#D66829]/30 hover:-translate-y-0.5 transition-all group shadow-md shadow-black/10"
            >
              <action.icon className="w-5 h-5 text-white/15 group-hover:text-[#D66829] transition-colors mx-auto mb-2" />
              <p className="text-[11px] font-medium text-white/35 group-hover:text-white/70">{action.label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Graduation */}
      {isGraduating && (
        <div className="bg-gradient-to-r from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#D66829] font-semibold mb-2">Congratulations</p>
            <h3 className="text-xl font-bold text-white">Transition to Doctor</h3>
            <p className="text-white/35 text-sm mt-1">Switch to a Doctor account to access the provider dashboard.</p>
          </div>
          <button
            onClick={handleTransition}
            disabled={transitioning}
            className="px-6 py-3 bg-[#D66829] text-white font-semibold text-sm rounded-lg hover:bg-[#e8834a] transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap shadow-lg shadow-[#D66829]/20"
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
    actions.push({ title: `${jobCount} jobs available`, desc: "Matched to your profile", href: "/student/jobs", icon: Briefcase });
  }
  if (milestones?.firstCourseCompleted && !milestones?.firstJobApp) {
    actions.push({ title: "Apply to your first job", desc: "You have the knowledge — put it to work", href: "/student/jobs", icon: Briefcase });
  }
  if (milestones?.firstJobApp && !milestones?.contractReviewed) {
    actions.push({ title: "Review a contract", desc: "Don't sign without Contract Lab", href: "/student/contract-lab", icon: Compass });
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
