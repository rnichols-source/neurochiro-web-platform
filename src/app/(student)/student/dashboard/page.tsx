"use client";

import {
  Search,
  Calendar,
  BookOpen,
  UserCircle,
  Loader2,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  Briefcase,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getStudentDashboardData, getAcademyProgress, transitionToDoctorAction } from "./actions";
import { useRouter } from "next/navigation";
import { useRegion } from "@/context/RegionContext";
import WhatsNew from "@/components/common/WhatsNew";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
};

export default function StudentDashboard() {
  const [data, setData] = useState<any>(null);
  const [academyData, setAcademyData] = useState<{ completed: number; total: number }>({ completed: 0, total: 12 });
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const router = useRouter();
  const { region } = useRegion();

  useEffect(() => {
    Promise.all([
      getStudentDashboardData(),
      getAcademyProgress(),
    ]).then(([dashResult, academyResult]) => {
      if (dashResult) setData(dashResult);
      if (academyResult) setAcademyData(academyResult);
      setLoading(false);
    });
  }, []);

  const handleTransition = async () => {
    if (!confirm("This will switch your account from Student to Doctor. Your student data (courses, applications) will be preserved, but you'll access the Doctor dashboard going forward. This can't be undone. Continue?")) return;
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

  const profileCompleteness = data?.stats?.readiness || 0;
  const applications = data?.stats?.applications || 0;

  const missingItems: { label: string; href: string }[] = [];
  if (!data?.profile?.fullName) missingItems.push({ label: "Add your full name", href: "/student/profile" });
  if (!data?.profile?.school) missingItems.push({ label: "Add your school", href: "/student/profile" });
  if (!data?.profile?.gradYear) missingItems.push({ label: "Add graduation year", href: "/student/profile" });
  if (!data?.profile?.city) missingItems.push({ label: "Add your location", href: "/student/profile" });

  const currentYear = new Date().getFullYear();
  const gradYear = data?.profile?.gradYear ? parseInt(data.profile.gradYear, 10) : null;
  const isGraduating = gradYear && gradYear <= currentYear;

  const academyPercent = academyData.total > 0 ? Math.round((academyData.completed / academyData.total) * 100) : 0;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <WhatsNew />

      {/* Header */}
      <motion.div {...fadeUp}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-neuro-orange text-xs font-black uppercase tracking-[0.2em] mb-1">Welcome back</p>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-neuro-navy tracking-tight">
              {studentName}
            </h1>
            {schoolInfo && <p className="text-gray-400 mt-1">{schoolInfo}</p>}
          </div>
          {academyData.completed > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-violet-50 border border-violet-100 rounded-full">
              <GraduationCap className="w-4 h-4 text-violet-500" />
              <span className="text-sm font-black text-violet-600">
                {academyPercent}% complete
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Onboarding */}
      {profileCompleteness < 80 && (
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }}>
          <div className="bg-white rounded-3xl border border-neuro-orange/15 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-neuro-orange/10 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-neuro-orange" />
              </div>
              <div>
                <h2 className="font-heading font-black text-neuro-navy text-lg">Welcome to NeuroChiro</h2>
                <p className="text-gray-400 text-sm">Get the most out of your membership</p>
              </div>
            </div>
            <div className="space-y-3 mt-6">
              {[
                { done: profileCompleteness >= 50, label: "Complete your profile", desc: "Add your school, graduation year, and interests", href: "/student/profile" },
                { done: academyData.completed > 0, label: "Start the Academy", desc: "Begin your first course module", href: "/student/academy" },
                { done: applications > 0, label: "Browse the job board", desc: "See what positions are available near you", href: "/student/jobs" },
              ].map((step, i) => (
                <Link key={i} href={step.href} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all group ${step.done ? 'bg-emerald-50/50 border-emerald-200' : 'bg-gray-50/50 border-gray-100 hover:border-neuro-orange/20 hover:bg-neuro-orange/[0.02]'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black ${step.done ? 'bg-emerald-500 text-white' : 'bg-neuro-navy text-white'}`}>
                    {step.done ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${step.done ? 'text-emerald-700 line-through' : 'text-neuro-navy'}`}>{step.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
                  </div>
                  {!step.done && <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-neuro-orange group-hover:translate-x-0.5 transition-all shrink-0" />}
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Graduation transition banner */}
      {isGraduating && (
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }}>
          <div className="bg-neuro-navy rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "var(--grid-pattern)" }} />
            <div className="relative">
              <p className="text-neuro-orange text-[10px] font-black uppercase tracking-[0.2em] mb-2">Congratulations</p>
              <h3 className="text-2xl font-heading font-black text-white tracking-tight">Transition to Doctor</h3>
              <p className="text-gray-400 mt-1">
                Switch to a Doctor account to access the full provider dashboard.
              </p>
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

      {/* Payment Prompt */}
      {data?.profile?.subscription_status !== 'active' && (
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }}>
          <div className="bg-neuro-navy rounded-3xl p-8 md:p-10 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "var(--grid-pattern)" }} />
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex-1">
                <p className="text-neuro-orange text-[10px] font-black uppercase tracking-[0.2em] mb-3">Membership</p>
                <h3 className="text-white font-heading font-black text-2xl tracking-tight mb-2">Activate your membership</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-lg">
                  Unlock full access to career tools, job applications, and the student network.
                </p>
                <p className="text-gray-300 text-xs font-black mt-3 uppercase tracking-widest">
                  {region.currency.symbol}{region.pricing.student.foundation.monthly}/month
                </p>
              </div>
              <Link href="/student/billing" className="px-8 py-4 bg-neuro-orange text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-neuro-orange/30 hover:shadow-neuro-orange/50 hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap text-center">
                Activate Membership
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stat cards */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-b from-blue-50 to-white rounded-3xl border border-blue-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Profile Completeness</p>
            </div>
            <p className="text-3xl font-black text-neuro-navy">{profileCompleteness}%</p>
            <div className="mt-3 h-2 bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${profileCompleteness}%` }} />
            </div>
            {missingItems.length > 0 && (
              <ul className="mt-4 space-y-1.5">
                {missingItems.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-xs text-neuro-orange hover:underline font-bold">{item.label}</Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-gradient-to-b from-violet-50 to-white rounded-3xl border border-violet-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-4 h-4 text-violet-500" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Academy Progress</p>
            </div>
            <p className="text-3xl font-black text-neuro-navy">{academyData.completed}<span className="text-lg text-gray-400 font-bold"> / {academyData.total}</span></p>
            <p className="text-xs text-gray-400 mt-1">{academyData.completed === 0 ? "Start learning" : `${academyPercent}% complete`}</p>
          </div>
          <div className="bg-gradient-to-b from-orange-50 to-white rounded-3xl border border-orange-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-4 h-4 text-neuro-orange" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Job Applications</p>
            </div>
            <p className="text-3xl font-black text-neuro-navy">{applications}</p>
          </div>
        </div>
      </motion.div>

      {/* Quick actions */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Browse Jobs", desc: "Find positions", href: "/student/jobs", icon: Search, gradient: "from-blue-50 to-white", border: "border-blue-100" },
            { label: "Find Seminars", desc: "Upcoming events", href: "/student/seminars", icon: Calendar, gradient: "from-violet-50 to-white", border: "border-violet-100" },
            { label: "Academy", desc: "Continue learning", href: "/student/academy", icon: BookOpen, gradient: "from-emerald-50 to-white", border: "border-emerald-100" },
            { label: "Edit Profile", desc: "Update your info", href: "/student/profile", icon: UserCircle, gradient: "from-orange-50 to-white", border: "border-orange-100" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`bg-gradient-to-b ${action.gradient} rounded-3xl border ${action.border} p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group`}
            >
              <action.icon className="w-6 h-6 text-neuro-navy/60 group-hover:text-neuro-orange transition-colors mb-3" />
              <p className="font-heading font-black text-neuro-navy text-sm">{action.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{action.desc}</p>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
