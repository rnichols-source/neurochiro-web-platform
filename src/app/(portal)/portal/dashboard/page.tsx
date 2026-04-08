"use client";

import {
  Search,
  Heart,
  Activity,
  BookOpen,
  ClipboardCheck,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getPatientDashboardData } from "./actions";
import { useUserPreferences } from "@/context/UserPreferencesContext";

function DashboardContent() {
  const searchParams = useSearchParams();
  const isNewPatient = searchParams.get("welcome") === "true";
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { saved } = useUserPreferences();

  useEffect(() => {
    const fetchData = async () => {
      const result = await getPatientDashboardData();
      if (result) setData(result);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-neuro-cream">
        <Loader2 className="w-10 h-10 text-neuro-orange animate-spin" />
      </div>
    );
  }

  const patientName = data?.profile?.name || "there";
  const savedDoctorCount = saved.doctors.length;
  const logCount = data?.logCount || 0;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 pb-20 text-neuro-navy">
      {/* Welcome */}
      <header>
        <h1 className="text-3xl font-heading font-black text-neuro-navy">
          Welcome back, <span className="text-neuro-orange">{patientName}</span>
        </h1>
        {isNewPatient && (
          <p className="text-neuro-gray mt-1">
            Your account is active. Start by finding a doctor or logging how you feel.
          </p>
        )}
      </header>

      {/* Daily check-in CTA */}
      <Link
        href="/portal/track"
        className="block bg-neuro-orange p-6 rounded-2xl text-white hover:bg-neuro-orange-light transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black">Log today's check-in</h2>
            <p className="text-sm text-white/80">Track how you feel after your latest visit</p>
          </div>
        </div>
      </Link>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Saved Doctors</p>
          <p className="text-2xl font-black text-neuro-navy">{savedDoctorCount}</p>
          {savedDoctorCount === 0 && (
            <p className="text-xs text-gray-400 mt-1">Browse the directory to save doctors</p>
          )}
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Health Logs</p>
          <p className="text-2xl font-black text-neuro-navy">{logCount}</p>
          {logCount === 0 && (
            <p className="text-xs text-gray-400 mt-1">Start tracking to see your trends</p>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <section>
        <h2 className="text-lg font-bold text-neuro-navy mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Find a Doctor", href: "/directory", icon: Search },
            { label: "Saved Doctors", href: "/portal/saved", icon: Heart },
            { label: "Health Tracker", href: "/portal/track", icon: Activity },
            { label: "Learn", href: "/portal/learn", icon: BookOpen },
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

export default function PulseDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-neuro-cream">
          <Loader2 className="w-10 h-10 text-neuro-orange animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
