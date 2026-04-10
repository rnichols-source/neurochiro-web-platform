"use client";

import { Loader2, User, Briefcase, GraduationCap, BarChart3, Gift, Copy, CheckCircle2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getDoctorDashboardStats } from "./actions";
import { useRegion } from "@/context/RegionContext";
import { getOrCreateReferralCode, getReferralStats } from "@/app/actions/referral-program";
import { createClient } from "@/lib/supabase";

export default function DoctorDashboard() {
  const { region } = useRegion();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    getDoctorDashboardStats()
      .then((res) => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));

    // Fetch profile views directly from client as backup
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from('doctors').select('profile_views').eq('user_id', user.id).single();
      if (data?.profile_views) setViews(data.profile_views);
    });
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
    { label: "Profile Views", value: views !== null ? views.toString() : (stats[0]?.value || "0") },
    { label: "Patient Leads", value: stats[1]?.value || "0" },
    { label: "Seminar Registrations", value: stats[2]?.value || "0" },
    { label: "Job Applications", value: stats[3]?.value || "0" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-neuro-navy">{profile.name}</h1>
          <p className="text-gray-500 text-sm mt-1">{profile.clinicName}</p>
        </div>
        {data?.profile?.slug && (
          <Link href={`/directory/${data.profile.slug}`} target="_blank" className="text-sm font-bold text-neuro-orange hover:underline flex items-center gap-1">
            View My Profile <ExternalLink className="w-4 h-4" />
          </Link>
        )}
      </header>

      {/* Onboarding — First 3 Steps */}
      {(completeness < 100 || statCards.reduce((sum, s) => sum + Number(s.value), 0) === 0) && data?.profile?.subscription_status === 'active' && (
        <div className="bg-white rounded-2xl border border-neuro-orange/20 p-6">
          <h2 className="font-black text-neuro-navy mb-1">Welcome to NeuroChiro</h2>
          <p className="text-gray-500 text-sm mb-4">Complete these 3 steps to start getting patients:</p>
          <div className="space-y-3">
            {[
              { done: completeness >= 80, label: "Complete your profile", desc: "Add your bio, specialties, and clinic photo", href: "/doctor/profile" },
              { done: !!data?.profile?.bio, label: "Write your bio", desc: "Use the AI bio generator to craft your story", href: "/doctor/profile" },
              { done: statCards[0]?.value !== "0", label: "Share your profile", desc: "Send your NeuroChiro link to patients", href: "/doctor/analytics" },
            ].map((step, i) => (
              <Link key={i} href={step.href} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${step.done ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100 hover:border-neuro-orange/30'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black ${step.done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {step.done ? '✓' : i + 1}
                </div>
                <div>
                  <p className={`text-sm font-bold ${step.done ? 'text-green-700 line-through' : 'text-neuro-navy'}`}>{step.label}</p>
                  <p className="text-xs text-gray-400">{step.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

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

      {/* Payment Prompt — removed for migrated doctors. All current members are already paying. */}

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

      {/* Referral Program Card */}
      <ReferralCard />
    </div>
  );
}

function ReferralCard() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralStats, setReferralStats] = useState<{ signups: number; monthsFree: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);

  const generateCode = async () => {
    setLoadingCode(true);
    try {
      const result = await getOrCreateReferralCode();
      setReferralCode(result.code);
      const stats = await getReferralStats();
      if (stats) setReferralStats({ signups: stats.signups, monthsFree: stats.monthsFree });
    } catch {}
    setLoadingCode(false);
  };

  useEffect(() => {
    getReferralStats().then((stats) => {
      if (stats?.code) {
        setReferralCode(stats.code);
        setReferralStats({ signups: stats.signups, monthsFree: stats.monthsFree });
      }
    }).catch(() => {});
  }, []);

  const referralLink = referralCode
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://neurochiro.com'}/join?ref=${referralCode}`
    : '';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-neuro-navy to-neuro-navy-dark rounded-2xl p-6 text-white">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-neuro-orange/20 flex items-center justify-center">
          <Gift className="w-5 h-5 text-neuro-orange" />
        </div>
        <div>
          <h3 className="font-bold">Invite a Doctor, You Both Get a Free Month</h3>
          <p className="text-gray-400 text-xs">When a colleague joins using your link, you both get one month free on your membership</p>
        </div>
      </div>

      {referralCode ? (
        <div className="space-y-3 mt-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white/80 truncate">
              {referralLink}
            </div>
            <button
              onClick={handleCopy}
              className="p-3 bg-neuro-orange rounded-xl hover:bg-neuro-orange/90 transition-colors flex-shrink-0"
            >
              {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          {referralStats && referralStats.signups > 0 && (
            <p className="text-sm text-green-400">
              {referralStats.signups} doctor{referralStats.signups !== 1 ? 's' : ''} joined through your link &middot; {referralStats.monthsFree} free month{referralStats.monthsFree !== 1 ? 's' : ''} earned
            </p>
          )}
        </div>
      ) : (
        <button
          onClick={generateCode}
          disabled={loadingCode}
          className="mt-4 w-full py-3 bg-neuro-orange text-white rounded-xl font-bold text-sm hover:bg-neuro-orange/90 transition-colors disabled:opacity-50"
        >
          {loadingCode ? 'Generating...' : 'Get My Referral Link'}
        </button>
      )}
    </div>
  );
}
