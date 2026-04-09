"use client";

import { Loader2, User, Briefcase, GraduationCap, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getDoctorDashboardStats } from "./actions";
import { useRegion } from "@/context/RegionContext";

export default function DoctorDashboard() {
  const { region } = useRegion();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoctorDashboardStats()
      .then((res) => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-neuro-orange animate-spin" />
      </div>
    );
  }

  const profile = data?.profile || { name: "Doctor", clinicName: "My Practice" };
  const stats = data?.stats || [];
  const completeness = data?.marketPerformance?.completeness ?? 100;
  const missingItems: string[] = data?.marketPerformance?.missingItems || [];

  const statCards = [
    { label: "Profile Views", value: stats[0]?.value || "0" },
    { label: "Patient Leads", value: stats[1]?.value || "0" },
    { label: "Seminar Registrations", value: stats[2]?.value || "0" },
    { label: "Job Applications", value: stats[3]?.value || "0" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-black text-neuro-navy">{profile.name}</h1>
        <p className="text-gray-500 text-sm mt-1">{profile.clinicName}</p>
      </header>

      {/* Profile Completeness Alert */}
      {completeness < 100 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <p className="font-bold text-yellow-800 text-sm mb-3">
            Complete your profile to appear in search results
          </p>
          <div className="w-full h-2 bg-yellow-200 rounded-full mb-4">
            <div
              className="h-full bg-yellow-500 rounded-full transition-all"
              style={{ width: `${completeness}%` }}
            />
          </div>
          <ul className="space-y-1">
            {missingItems.map((item) => (
              <li key={item}>
                <Link
                  href="/doctor/profile"
                  className="text-sm text-yellow-700 hover:text-yellow-900 underline"
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Payment Prompt */}
      {data?.profile?.subscription_status !== 'active' && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
          <h3 className="font-bold text-neuro-navy mb-1">Activate your membership</h3>
          <p className="text-gray-500 text-sm mb-4">{`Your profile is set up but not yet visible to patients. Start your ${region.currency.symbol}${region.pricing.doctor.starter.monthly}/month membership to go live in the directory.`}</p>
          <Link href="/doctor/billing" className="inline-flex items-center gap-2 px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl text-sm">Activate Membership</Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-gray-100 p-6"
          >
            <p className="text-xs uppercase text-gray-400 tracking-wide mb-2">
              {stat.label}
            </p>
            <p className="text-2xl font-black text-neuro-navy">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Edit Profile", href: "/doctor/profile", icon: User },
          { label: "Post a Job", href: "/doctor/jobs", icon: Briefcase },
          { label: "Browse Students", href: "/doctor/students", icon: GraduationCap },
          { label: "View Analytics", href: "/doctor/analytics", icon: BarChart3 },
        ].map((action) => (
          <Link key={action.href} href={action.href} className="bg-white rounded-2xl border border-gray-100 p-4 text-center hover:shadow-md hover:border-gray-200 transition-all">
            <action.icon className="w-5 h-5 text-neuro-orange mx-auto mb-2" />
            <p className="text-xs font-bold text-neuro-navy">{action.label}</p>
          </Link>
        ))}
      </div>

      {statCards.reduce((sum, s) => sum + Number(s.value), 0) === 0 && (
        <p className="text-sm text-gray-400">Your stats will update as patients find your profile in the directory.</p>
      )}
    </div>
  );
}
