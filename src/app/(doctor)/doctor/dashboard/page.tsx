"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getDoctorDashboardStats } from "./actions";

export default function DoctorDashboard() {
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
    </div>
  );
}
