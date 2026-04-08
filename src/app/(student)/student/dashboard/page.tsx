"use client";

import {
  Search,
  Calendar,
  BookOpen,
  UserCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getStudentDashboardData, getAcademyProgress, transitionToDoctorAction } from "./actions";
import { useRouter } from "next/navigation";
import { useRegion } from "@/context/RegionContext";

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
      <div className="min-h-dvh flex items-center justify-center bg-neuro-cream">
        <Loader2 className="w-10 h-10 text-neuro-orange animate-spin" />
      </div>
    );
  }

  const studentName = data?.profile?.name || "Student";
  const schoolInfo = data?.profile?.school
    ? `${data.profile.school} '${data.profile.gradYear?.toString().slice(-2) || "27"}`
    : null;

  const profileCompleteness = data?.stats?.readiness || 0;
  const applications = data?.stats?.applications || 0;

  const currentYear = new Date().getFullYear();
  const gradYear = data?.profile?.gradYear ? parseInt(data.profile.gradYear, 10) : null;
  const isGraduating = gradYear && gradYear <= currentYear;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-heading font-black text-neuro-navy">
          {studentName}
        </h1>
        {schoolInfo && <p className="text-neuro-gray mt-1">{schoolInfo}</p>}
      </header>

      {/* Graduation transition banner */}
      {isGraduating && (
        <div className="bg-neuro-navy p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-white">Transition to Doctor</h3>
            <p className="text-sm text-gray-300">
              Switch to a Doctor account to access the full provider dashboard.
            </p>
          </div>
          <button
            onClick={handleTransition}
            disabled={transitioning}
            className="px-6 py-3 bg-neuro-orange text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-neuro-orange-light transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
          >
            {transitioning && <Loader2 className="w-4 h-4 animate-spin" />}
            Transition Account
          </button>
        </div>
      )}

      {/* Payment Prompt */}
      {data?.profile?.subscription_status !== 'active' && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
          <h3 className="font-bold text-neuro-navy mb-1">Activate your membership</h3>
          <p className="text-gray-500 text-sm mb-4">{`Unlock full access to career tools, job applications, and the student network. Start your ${region.currency.symbol}${region.pricing.student.foundation.monthly}/month membership.`}</p>
          <Link href="/student/billing" className="inline-flex items-center gap-2 px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl text-sm">Activate Membership</Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Profile Completeness</p>
          <p className="text-2xl font-black text-neuro-navy">{profileCompleteness}%</p>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-neuro-orange rounded-full" style={{ width: `${profileCompleteness}%` }} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Academy Progress</p>
          <p className="text-2xl font-black text-neuro-navy">{academyData.completed} of {academyData.total} modules</p>
          <p className="text-xs text-gray-400 mt-1">{academyData.completed === 0 ? "Start learning" : `${Math.round((academyData.completed / academyData.total) * 100)}% complete`}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Job Applications</p>
          <p className="text-2xl font-black text-neuro-navy">{applications}</p>
        </div>
      </div>

      {/* Quick actions */}
      <section>
        <h2 className="text-lg font-bold text-neuro-navy mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Browse Jobs", href: "/student/jobs", icon: Search },
            { label: "Find Seminars", href: "/student/seminars", icon: Calendar },
            { label: "Academy", href: "/student/academy", icon: BookOpen },
            { label: "Edit Profile", href: "/student/profile", icon: UserCircle },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-neuro-orange/30 hover:shadow-sm transition-all group flex flex-col items-center text-center gap-3"
            >
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-neuro-orange/10 transition-colors">
                <action.icon className="w-5 h-5 text-neuro-gray group-hover:text-neuro-orange transition-colors" />
              </div>
              <span className="text-sm font-bold text-neuro-navy">{action.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
