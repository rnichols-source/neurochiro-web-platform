"use client";

import { Loader2, User, Briefcase, GraduationCap, BarChart3, Gift, Copy, CheckCircle2, ExternalLink, ChevronRight, ArrowRight, Sparkles, Eye, Users, Calendar, FileText } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getDoctorDashboardStats } from "./actions";
import { useRegion } from "@/context/RegionContext";
import { getOrCreateReferralCode, getReferralStats } from "@/app/actions/referral-program";
import { createClient } from "@/lib/supabase";
import WhatsNew from "@/components/common/WhatsNew";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
};

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

    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from('doctors').select('profile_views').eq('user_id', user.id).single();
      if (data?.profile_views) setViews(data.profile_views);
    });
  }, []);

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

  const profile = data?.profile || { name: "Doctor", clinicName: "My Practice" };
  const stats = data?.stats || [];
  const completeness = data?.marketPerformance?.completeness ?? 100;
  const missingItems: string[] = data?.marketPerformance?.missingItems || [];

  const statCards = [
    { label: "Profile Views", value: views !== null ? views.toString() : (stats[0]?.value || "0"), icon: Eye, gradient: "from-blue-50 to-white", border: "border-blue-100", iconColor: "text-blue-500" },
    { label: "Patient Leads", value: stats[1]?.value || "0", icon: Users, gradient: "from-emerald-50 to-white", border: "border-emerald-100", iconColor: "text-emerald-500" },
    { label: "Seminar Registrations", value: stats[2]?.value || "0", icon: Calendar, gradient: "from-violet-50 to-white", border: "border-violet-100", iconColor: "text-violet-500" },
    { label: "Job Applications", value: stats[3]?.value || "0", icon: FileText, gradient: "from-orange-50 to-white", border: "border-orange-100", iconColor: "text-neuro-orange" },
  ];

  return (
    <div className="space-y-8">
      <WhatsNew />

      {/* Header */}
      <motion.div {...fadeUp}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-neuro-orange text-xs font-black uppercase tracking-[0.2em] mb-1">Welcome back</p>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-neuro-navy tracking-tight">{profile.name}</h1>
            <p className="text-gray-400 text-sm mt-1">{profile.clinicName}</p>
          </div>
          {data?.profile?.slug && (
            <Link href={`/directory/${data.profile.slug}`} target="_blank" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-neuro-navy/5 border border-neuro-navy/10 rounded-full text-sm font-bold text-neuro-navy hover:border-neuro-orange/30 hover:bg-neuro-orange/5 transition-all">
              View My Profile <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </motion.div>

      {/* Onboarding */}
      {(completeness < 100 || statCards.reduce((sum, s) => sum + Number(s.value), 0) === 0) && data?.profile?.subscription_status === 'active' && (
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }}>
          <div className="bg-white rounded-3xl border border-neuro-orange/15 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-neuro-orange/10 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-neuro-orange" />
              </div>
              <div>
                <h2 className="font-heading font-black text-neuro-navy text-lg">Welcome to NeuroChiro</h2>
                <p className="text-gray-400 text-sm">Complete these steps to start getting patients</p>
              </div>
            </div>
            <div className="space-y-3 mt-6">
              {[
                { done: completeness >= 80, label: "Complete your profile", desc: "Add your bio, specialties, and clinic photo", href: "/doctor/profile" },
                { done: !!data?.profile?.bio, label: "Write your bio", desc: "Use the AI bio generator to craft your story", href: "/doctor/profile" },
                { done: statCards[0]?.value !== "0", label: "Share your profile", desc: "Send your NeuroChiro link to patients", href: "/doctor/analytics" },
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

      {/* Profile Completeness Alert */}
      {completeness < 100 && (
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }}>
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 shadow-sm">
            <p className="font-heading font-black text-amber-800 mb-3">
              Complete your profile to appear in search results
            </p>
            <div className="w-full h-2.5 bg-amber-200 rounded-full mb-4 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${completeness}%` }}
              />
            </div>
            <ul className="space-y-1.5">
              {missingItems.map((item) => (
                <li key={item}>
                  <Link
                    href="/doctor/profile"
                    className="text-sm text-amber-700 hover:text-amber-900 underline decoration-amber-300"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className={`bg-gradient-to-b ${stat.gradient} rounded-3xl border ${stat.border} p-6 shadow-sm`}
            >
              <div className="flex items-center gap-2 mb-3">
                <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  {stat.label}
                </p>
              </div>
              <p className="text-3xl font-black text-neuro-navy">{stat.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {statCards.reduce((sum, s) => sum + Number(s.value), 0) === 0 && (
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.12 }}>
          <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 shadow-sm">
            <p className="text-sm text-blue-700 font-bold">Your stats are warming up</p>
            <p className="text-xs text-blue-600 mt-1">As patients find you in the directory, you&apos;ll see profile views, leads, and more here. Make sure your profile is complete to appear in search results.</p>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Edit Profile", desc: "Update your listing", href: "/doctor/profile", icon: User, gradient: "from-blue-50 to-white", border: "border-blue-100" },
            { label: "Post a Job", desc: "Hire an associate", href: "/doctor/jobs", icon: Briefcase, gradient: "from-orange-50 to-white", border: "border-orange-100" },
            { label: "Browse Students", desc: "Find talent", href: "/doctor/students", icon: GraduationCap, gradient: "from-violet-50 to-white", border: "border-violet-100" },
            { label: "View Analytics", desc: "Track performance", href: "/doctor/analytics", icon: BarChart3, gradient: "from-emerald-50 to-white", border: "border-emerald-100" },
          ].map((action) => (
            <Link key={action.href} href={action.href} className={`bg-gradient-to-b ${action.gradient} rounded-3xl border ${action.border} p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group`}>
              <action.icon className="w-6 h-6 text-neuro-navy/60 group-hover:text-neuro-orange transition-colors mb-3" />
              <p className="font-heading font-black text-neuro-navy text-sm">{action.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{action.desc}</p>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Marketplace */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }}>
        <Link href="/marketplace" className="block bg-white rounded-3xl border border-gray-100 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-neuro-orange/10 to-neuro-orange/5 border border-neuro-orange/10 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-neuro-orange" />
              </div>
              <div>
                <p className="font-heading font-black text-neuro-navy">Marketplace</p>
                <p className="text-sm text-gray-400">Products and tools for your practice</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-neuro-orange group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>
      </motion.div>

      {/* Referral Program Card */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.25 }}>
        <ReferralCard />
      </motion.div>
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
    <div className="bg-neuro-navy rounded-3xl p-8 md:p-10 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "var(--grid-pattern)" }} />
      <div className="relative">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-neuro-orange/20 border border-neuro-orange/30 flex items-center justify-center">
            <Gift className="w-6 h-6 text-neuro-orange" />
          </div>
          <div>
            <h3 className="font-heading font-black text-lg">Invite a Doctor, You Both Get a Free Month</h3>
            <p className="text-gray-400 text-sm">When a colleague joins using your link, you both get one month free</p>
          </div>
        </div>

        {referralCode ? (
          <div className="space-y-3 mt-6">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white/10 rounded-xl px-4 py-3.5 text-sm font-mono text-white/80 truncate border border-white/5">
                {referralLink}
              </div>
              <button
                onClick={handleCopy}
                className="p-3.5 bg-neuro-orange rounded-xl hover:bg-neuro-orange/90 transition-colors flex-shrink-0 shadow-lg shadow-neuro-orange/30"
              >
                {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            {referralStats && referralStats.signups > 0 && (
              <p className="text-sm text-emerald-400 font-bold">
                {referralStats.signups} doctor{referralStats.signups !== 1 ? 's' : ''} joined through your link &middot; {referralStats.monthsFree} free month{referralStats.monthsFree !== 1 ? 's' : ''} earned
              </p>
            )}
          </div>
        ) : (
          <button
            onClick={generateCode}
            disabled={loadingCode}
            className="mt-6 px-8 py-4 bg-neuro-orange text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-neuro-orange/30 hover:shadow-neuro-orange/50 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
          >
            {loadingCode ? 'Generating...' : 'Get My Referral Link'}
          </button>
        )}
      </div>
    </div>
  );
}
