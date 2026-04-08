"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, User, Search } from "lucide-react";
import Link from "next/link";

const roleConfig: Record<string, { message: string; action: string; actionHref: string; dashboard: string }> = {
  doctor: {
    message: "Let's get your practice listed in the global directory.",
    action: "Complete Your Profile",
    actionHref: "/doctor/profile",
    dashboard: "/doctor/dashboard",
  },
  student: {
    message: "Let's connect you with your first opportunity.",
    action: "Complete Your Profile",
    actionHref: "/student/profile",
    dashboard: "/student/dashboard",
  },
  patient: {
    message: "Let's find you a nervous system specialist.",
    action: "Find a Doctor",
    actionHref: "/directory",
    dashboard: "/portal/dashboard",
  },
};

function OnboardingContent() {
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "doctor";
  const name = searchParams.get("name") || "";
  const config = roleConfig[role] || roleConfig.doctor;

  return (
    <div className="min-h-dvh bg-neuro-cream flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-neuro-navy rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-6">
          N
        </div>

        <h1 className="text-3xl font-heading font-black text-neuro-navy mb-2">
          Welcome{name ? `, ${name}` : ''} 👋
        </h1>
        <p className="text-gray-500 text-lg mb-10">{config.message}</p>

        <div className="space-y-3">
          <Link
            href={config.actionHref}
            className="w-full py-4 bg-neuro-orange text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-neuro-orange/90 transition-colors"
          >
            {role === 'patient' ? <Search className="w-5 h-5" /> : <User className="w-5 h-5" />}
            {config.action}
          </Link>

          <Link
            href={config.dashboard}
            className="w-full py-4 bg-white text-neuro-navy font-bold rounded-xl border border-gray-200 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            Go to Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center"><div className="w-8 h-8 border-4 border-neuro-orange border-t-transparent rounded-full animate-spin" /></div>}>
      <OnboardingContent />
    </Suspense>
  );
}
