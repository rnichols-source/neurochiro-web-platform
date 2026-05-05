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
import { motion } from "framer-motion";
import {
  getStudentDashboardData,
  getAcademyProgress,
  getCareerReadinessData,
  getMatchedJobsCount,
  transitionToDoctorAction,
} from "./actions";
import { useRouter } from "next/navigation";
import CareerReadiness from "./career-readiness";
import PipelinePreview from "./pipeline-preview";
import MilestoneTimeline from "./milestone-timeline";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
};

export default function StudentDashboard() {
  const [data, setData] = useState<any>(null);
  const [academyData, setAcademyData] = useState<{ completed: number; total: number }>({ completed: 0, total: 22 });
  const [readiness, setReadiness] = useState<any>(null);
  const [jobCount, setJobCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const router = useRouter();

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
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-neuro-orange/10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-neuro-orange animate-spin" />
          </div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading your dashboard...</p>
        </div>
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

  // Days until graduation (assume June 15 of grad year)
  const daysUntilGrad = gradYear
    ? Math.max(0, Math.ceil((new Date(`${gradYear}-06-15`).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const totalScore = readiness?.totalScore || 0;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div {...fadeUp}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-neuro-orange text-xs font-black uppercase tracking-[0.2em] mb-1">Mission Control</p>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-neuro-navy tracking-tight">
              {studentName}
            </h1>
            {schoolInfo && <p className="text-gray-400 mt-1">{schoolInfo}</p>}
          </div>
          <Link
            href="/student/career-pipeline"
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#e97325]/10 border border-[#e97325]/20 rounded-full hover:bg-[#e97325]/20 transition-colors"
          >
            <Map className="w-4 h-4 text-[#e97325]" />
            <span className="text-sm font-black text-[#e97325]">Career Pipeline</span>
          </Link>
        </div>
      </motion.div>

      {/* First-time guidance */}
      {totalScore < 20 && (
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.03 }}>
          <div className="bg-white rounded-3xl border border-[#e97325]/15 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#e97325]/10 rounded-xl flex items-center justify-center">
                <Map className="w-5 h-5 text-[#e97325]" />
              </div>
              <div>
                <h2 className="font-heading font-black text-[#1a2744] text-lg">Here&apos;s How This Works</h2>
                <p className="text-gray-400 text-sm">Your portal has everything you need to launch your career</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
                <p className="font-bold text-[#1a2744] mb-1">1. Learn</p>
                <p className="text-gray-500 text-xs">Take courses in the <strong>Academy</strong>, explore <strong>Techniques</strong>, and prep for <strong>Interviews</strong>. All included with your membership.</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="font-bold text-[#1a2744] mb-1">2. Connect</p>
                <p className="text-gray-500 text-xs">Browse matched <strong>Jobs</strong>, find <strong>Mentors</strong> who want to help you, and see your <strong>Student Network</strong>.</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <p className="font-bold text-[#1a2744] mb-1">3. Launch</p>
                <p className="text-gray-500 text-xs">Review contracts in <strong>Contract Lab</strong> and plan your finances in <strong>Financial Planner</strong> before day one.</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Your <strong>Career Readiness Score</strong> below tracks your progress across everything. Follow the <Link href="/student/career-pipeline" className="text-[#e97325] font-bold hover:underline">Career Pipeline</Link> for a step-by-step guide.
            </p>
          </div>
        </motion.div>
      )}

      {/* Quick Stats Row */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-gradient-to-b from-orange-50 to-white rounded-2xl border border-orange-100 p-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Readiness</p>
            <p className="text-2xl font-black text-neuro-navy">{totalScore}<span className="text-sm text-gray-400">/100</span></p>
          </div>
          <Link href="/student/jobs" className="bg-gradient-to-b from-blue-50 to-white rounded-2xl border border-blue-100 p-4 hover:shadow-md transition-shadow">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Open Jobs</p>
            <p className="text-2xl font-black text-neuro-navy">{jobCount}</p>
          </Link>
          <Link href="/student/academy" className="bg-gradient-to-b from-violet-50 to-white rounded-2xl border border-violet-100 p-4 hover:shadow-md transition-shadow">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Courses</p>
            <p className="text-2xl font-black text-neuro-navy">{academyData.completed}<span className="text-sm text-gray-400">/{academyData.total} modules</span></p>
          </Link>
          {daysUntilGrad !== null && daysUntilGrad > 0 ? (
            <div className="bg-gradient-to-b from-emerald-50 to-white rounded-2xl border border-emerald-100 p-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Graduation</p>
              <p className="text-2xl font-black text-neuro-navy">{daysUntilGrad}<span className="text-sm text-gray-400"> days</span></p>
            </div>
          ) : (
            <div className="bg-gradient-to-b from-emerald-50 to-white rounded-2xl border border-emerald-100 p-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Applications</p>
              <p className="text-2xl font-black text-neuro-navy">{readiness?.raw?.appsSubmitted || 0}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Career Readiness Score + Pipeline Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}>
          {readiness && (
            <CareerReadiness
              totalScore={totalScore}
              breakdown={readiness.breakdown}
            />
          )}
        </motion.div>
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }}>
          {readiness && (
            <PipelinePreview
              milestones={readiness.milestones}
              modulesCompleted={readiness.raw.modulesCompleted}
            />
          )}
        </motion.div>
      </div>

      {/* Smart Next Steps */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }}>
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
          <h2 className="text-lg font-heading font-black text-[#1a2744] mb-4">What To Do Next</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {getSmartActions(data, readiness, jobCount).map((action, i) => (
              <Link
                key={i}
                href={action.href}
                className={`p-4 rounded-2xl border transition-all group hover:shadow-md hover:-translate-y-0.5 ${action.borderClass}`}
              >
                <action.icon className={`w-5 h-5 mb-2 ${action.iconClass}`} />
                <p className="text-sm font-bold text-[#1a2744] mb-0.5">{action.title}</p>
                <p className="text-xs text-gray-400">{action.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Milestones + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.25 }}>
          {readiness && <MilestoneTimeline milestones={readiness.milestones} />}
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }}>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
            <h2 className="text-lg font-heading font-black text-[#1a2744] mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Browse Jobs", desc: "Find positions", href: "/student/jobs", icon: Briefcase, bg: "bg-blue-50", border: "border-blue-100" },
                { label: "Find Mentors", desc: "Get guidance", href: "/student/mentors", icon: Users, bg: "bg-rose-50", border: "border-rose-100" },
                { label: "Academy", desc: "Continue learning", href: "/student/academy", icon: BookOpen, bg: "bg-violet-50", border: "border-violet-100" },
                { label: "Techniques", desc: "Explore methods", href: "/student/techniques", icon: Compass, bg: "bg-emerald-50", border: "border-emerald-100" },
                { label: "Seminars", desc: "Upcoming events", href: "/student/seminars", icon: Calendar, bg: "bg-amber-50", border: "border-amber-100" },
                { label: "Community", desc: "Student network", href: "/student/community", icon: GraduationCap, bg: "bg-cyan-50", border: "border-cyan-100" },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`${action.bg} rounded-2xl border ${action.border} p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group`}
                >
                  <action.icon className="w-5 h-5 text-neuro-navy/60 group-hover:text-neuro-orange transition-colors mb-2" />
                  <p className="font-bold text-[#1a2744] text-xs">{action.label}</p>
                  <p className="text-[10px] text-gray-400">{action.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Graduation transition banner */}
      {isGraduating && (
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.35 }}>
          <div className="bg-neuro-navy rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "var(--grid-pattern)" }} />
            <div className="relative">
              <p className="text-neuro-orange text-[10px] font-black uppercase tracking-[0.2em] mb-2">Congratulations</p>
              <h3 className="text-2xl font-heading font-black text-white tracking-tight">Transition to Doctor</h3>
              <p className="text-gray-400 mt-1">Switch to a Doctor account to access the full provider dashboard.</p>
            </div>
            <button
              onClick={handleTransition}
              disabled={transitioning}
              className="relative px-8 py-4 bg-neuro-orange text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-neuro-orange/30 hover:shadow-neuro-orange/50 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
            >
              {transitioning && <Loader2 className="w-4 h-4 animate-spin" />}
              Transition Account <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Generate personalized next steps based on user state
function getSmartActions(data: any, readiness: any, jobCount: number) {
  const actions: {
    title: string;
    desc: string;
    href: string;
    icon: any;
    borderClass: string;
    iconClass: string;
  }[] = [];

  const milestones = readiness?.milestones;

  if (!milestones?.profileComplete) {
    actions.push({
      title: "Complete your profile",
      desc: "Appear in job searches and get matched to opportunities",
      href: "/student/profile",
      icon: Users,
      borderClass: "border-blue-100 bg-blue-50/50",
      iconClass: "text-blue-500",
    });
  }

  if (!milestones?.firstCourseStarted) {
    actions.push({
      title: "Start your first course",
      desc: "Begin with Nervous System Foundations — it changes everything",
      href: "/student/academy",
      icon: BookOpen,
      borderClass: "border-violet-100 bg-violet-50/50",
      iconClass: "text-violet-500",
    });
  }

  if (jobCount > 0 && milestones?.firstCourseCompleted) {
    actions.push({
      title: `${jobCount} jobs available`,
      desc: "Browse positions and find your match",
      href: "/student/jobs",
      icon: Briefcase,
      borderClass: "border-orange-100 bg-orange-50/50",
      iconClass: "text-[#e97325]",
    });
  }

  if (milestones?.firstCourseCompleted && !milestones?.firstJobApp) {
    actions.push({
      title: "Apply to your first job",
      desc: "You've got the knowledge — now put it to work",
      href: "/student/jobs",
      icon: Briefcase,
      borderClass: "border-orange-100 bg-orange-50/50",
      iconClass: "text-[#e97325]",
    });
  }

  if (milestones?.firstJobApp && !milestones?.contractReviewed) {
    actions.push({
      title: "Review a contract",
      desc: "Don't sign anything without running it through Contract Lab",
      href: "/student/contract-lab",
      icon: Compass,
      borderClass: "border-emerald-100 bg-emerald-50/50",
      iconClass: "text-emerald-500",
    });
  }

  if (milestones?.contractReviewed && !milestones?.financialPlanCreated) {
    actions.push({
      title: "Create your financial plan",
      desc: "Know your numbers before day one",
      href: "/student/financial-planner",
      icon: Calendar,
      borderClass: "border-cyan-100 bg-cyan-50/50",
      iconClass: "text-cyan-500",
    });
  }

  // Default actions if we have fewer than 3
  if (actions.length < 3) {
    if (!actions.some((a) => a.href === "/student/techniques")) {
      actions.push({
        title: "Explore techniques",
        desc: "Find the chiropractic technique that fits your style",
        href: "/student/techniques",
        icon: Compass,
        borderClass: "border-emerald-100 bg-emerald-50/50",
        iconClass: "text-emerald-500",
      });
    }
  }

  if (actions.length < 3) {
    actions.push({
      title: "Find a mentor",
      desc: "Connect with doctors who want to help you succeed",
      href: "/student/mentors",
      icon: Users,
      borderClass: "border-rose-100 bg-rose-50/50",
      iconClass: "text-rose-500",
    });
  }

  return actions.slice(0, 3);
}
