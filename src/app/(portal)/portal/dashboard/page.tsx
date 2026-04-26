"use client";

import { useState, useEffect } from "react";
import {
  Zap,
  Flame,
  Search,
  Heart,
  BookOpen,
  Activity,
  ArrowRight,
  Loader2,
  Dumbbell,
  Calendar,
  TrendingUp,
  Apple,
  Lightbulb,
  ChevronRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getPatientDashboardData } from "./actions";
import { isPremiumMember, createPremiumCheckout } from "../premium-actions";
import WhatsNew from "@/components/common/WhatsNew";

// Daily tip — auto-rotates based on day of year
let todaysTip: any = null;
try {
  const { getTodaysTip } = require("../daily-tips-data");
  todaysTip = getTodaysTip();
} catch {}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
};

export default function PatientDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [premium, setPremium] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      getPatientDashboardData(),
      isPremiumMember().catch(() => false),
    ])
      .then(([d, p]) => {
        setData(d);
        setPremium(p);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-neuro-orange/10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-neuro-orange animate-spin" />
          </div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-500 font-bold">Something went wrong.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-neuro-navy text-white rounded-xl text-sm font-bold hover:bg-neuro-navy-light transition-colors"
        >
          Retry
        </button>
      </div>
    );

  return (
    <div className="space-y-8 pb-20">
      <WhatsNew />

      {/* Welcome Header */}
      <motion.div {...fadeUp}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-neuro-orange text-xs font-black uppercase tracking-[0.2em] mb-1">
              Welcome back
            </p>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-neuro-navy tracking-tight">
              {data?.name || "there"}
            </h1>
          </div>
          {data?.streak > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-100 rounded-full">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-black text-orange-600">
                {data.streak} day streak
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Premium Quick Actions */}
      {premium && (
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }}>
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: "Check In", href: "/portal/track", icon: Activity, gradient: "from-blue-50 to-blue-100/50", iconColor: "text-blue-500", borderColor: "border-blue-100" },
              { label: "Exercises", href: "/portal/exercises", icon: Dumbbell, gradient: "from-orange-50 to-orange-100/50", iconColor: "text-neuro-orange", borderColor: "border-orange-100" },
              { label: "Learn", href: "/portal/learn", icon: BookOpen, gradient: "from-emerald-50 to-emerald-100/50", iconColor: "text-emerald-500", borderColor: "border-emerald-100" },
              { label: "Journey", href: "/portal/journey", icon: Calendar, gradient: "from-violet-50 to-violet-100/50", iconColor: "text-violet-500", borderColor: "border-violet-100" },
              { label: "Nutrition", href: "/portal/supplements", icon: Apple, gradient: "from-rose-50 to-rose-100/50", iconColor: "text-rose-500", borderColor: "border-rose-100" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`bg-gradient-to-b ${item.gradient} rounded-2xl p-4 text-center border ${item.borderColor} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-95`}
              >
                <item.icon className={`w-7 h-7 ${item.iconColor} mx-auto mb-2`} />
                <p className="text-[11px] font-black text-neuro-navy uppercase tracking-tight">
                  {item.label}
                </p>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Onboarding for new patients */}
      {!data?.todayLogged && (!data?.streak || data.streak === 0) && (
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}>
          <div className="bg-white rounded-3xl border border-neuro-orange/15 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-neuro-orange/10 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-neuro-orange" />
              </div>
              <div>
                <h2 className="font-heading font-black text-neuro-navy text-lg">
                  Welcome to NeuroChiro
                </h2>
                <p className="text-gray-400 text-sm">
                  Three steps to get started
                </p>
              </div>
            </div>
            <div className="space-y-3 mt-6">
              {[
                { step: 1, href: "/portal/track", title: "Log your first check-in", desc: "Track your energy, pain, and sleep in 30 seconds" },
                { step: 2, href: "/directory", title: "Find a doctor near you", desc: "Search the global directory of verified specialists" },
                { step: 3, href: "/portal/saved", title: "Save your favorites", desc: "Bookmark doctors to compare and revisit later" },
              ].map((item) => (
                <Link
                  key={item.step}
                  href={item.href}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:border-neuro-orange/20 hover:bg-neuro-orange/[0.02] transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-neuro-navy flex items-center justify-center text-white text-sm font-black shrink-0">
                    {item.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-neuro-navy">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-neuro-orange group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Daily Check-in Card */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}>
        {data?.todayLogged ? (
          <div className="bg-white rounded-3xl border border-emerald-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-black text-emerald-600 uppercase tracking-tight">
                    Today&apos;s Check-in
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Completed</p>
                </div>
              </div>
              <Link
                href="/portal/track"
                className="text-xs font-black text-neuro-orange uppercase tracking-widest hover:text-neuro-orange-light transition-colors flex items-center gap-1"
              >
                Update <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {[
                { label: "Energy", value: data.todaysLog.energy_level, color: "text-blue-500" },
                { label: "Pain", value: data.todaysLog.pain_level, color: "text-rose-500" },
                { label: "Sleep", value: data.todaysLog.sleep_quality, color: "text-violet-500" },
              ].map((metric) => (
                <div key={metric.label} className="text-center">
                  <p className={`text-3xl font-black ${metric.color}`}>
                    {metric.value}
                  </p>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Link
            href="/portal/track"
            className="block bg-neuro-navy rounded-3xl p-10 text-center group hover:shadow-2xl hover:shadow-neuro-navy/20 transition-all duration-300 relative overflow-hidden"
          >
            {/* Subtle grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: "var(--grid-pattern)" }}
            />
            <div className="relative">
              <div className="w-16 h-16 bg-neuro-orange/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Zap className="w-8 h-8 text-neuro-orange" />
              </div>
              <h2 className="text-2xl font-heading font-black text-white mb-2 tracking-tight">
                How are you feeling today?
              </h2>
              <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
                Log your energy, pain, and sleep in 30 seconds. Build your streak.
              </p>
              <span className="inline-flex items-center gap-2 px-8 py-4 bg-neuro-orange text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-neuro-orange/30 group-hover:gap-3 group-hover:shadow-neuro-orange/40 transition-all">
                Start Check-in <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        )}
      </motion.div>

      {/* Streak & Weekly Trend */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }}>
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  data?.streak > 0
                    ? "bg-gradient-to-b from-orange-50 to-orange-100 border border-orange-100"
                    : "bg-gray-50 border border-gray-100"
                }`}
              >
                <Flame
                  className={`w-6 h-6 ${
                    data?.streak > 0 ? "text-orange-500" : "text-gray-300"
                  }`}
                />
              </div>
              <div>
                <p className="font-heading font-black text-neuro-navy text-lg">
                  {data?.streak > 0
                    ? `${data.streak} day streak`
                    : "No streak yet"}
                </p>
                <p className="text-sm text-gray-400">
                  {data?.streak > 0
                    ? "Keep it going — consistency is everything."
                    : "Complete your first check-in to start tracking."}
                </p>
              </div>
            </div>
          </div>

          {/* Mini trend — last 7 days */}
          {data?.last7Days && data.last7Days.length > 0 && (
            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-50">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mr-1 shrink-0">
                7 Days
              </p>
              <div className="flex items-center gap-2 flex-1">
                {data.last7Days.map((day: any, i: number) => {
                  const dayName = new Date(day.date + "T12:00:00")
                    .toLocaleDateString("en", { weekday: "short" })
                    .charAt(0);
                  return (
                    <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                          day.energy === null
                            ? "bg-gray-50 text-gray-300 border border-gray-100"
                            : day.energy >= 7
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : day.energy >= 4
                            ? "bg-amber-50 text-amber-600 border border-amber-100"
                            : "bg-rose-50 text-rose-600 border border-rose-100"
                        }`}
                        title={`${day.date}: ${
                          day.energy !== null ? `Energy ${day.energy}` : "No log"
                        }`}
                      >
                        {day.energy !== null ? day.energy : "·"}
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">
                        {dayName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Daily Health Tip */}
      {todaysTip && (
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }}>
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 bg-gradient-to-b from-neuro-orange/10 to-neuro-orange/5 rounded-2xl flex items-center justify-center flex-shrink-0 border border-neuro-orange/10">
                <span className="text-2xl">{todaysTip.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-neuro-orange" />
                  <span className="text-[10px] font-black text-neuro-orange uppercase tracking-[0.2em]">
                    Today&apos;s Tip
                  </span>
                  <span className="text-[10px] font-bold text-gray-300 ml-auto uppercase tracking-widest">
                    {todaysTip.category}
                  </span>
                </div>
                <h3 className="font-heading font-black text-neuro-navy mb-2">
                  {todaysTip.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  {todaysTip.body}
                </p>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                  <p className="text-sm text-emerald-700">
                    <strong className="font-black">Today&apos;s action:</strong>{" "}
                    {todaysTip.actionStep}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Premium Upgrade Card */}
      {!premium && (
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.25 }}>
          <div className="bg-neuro-navy rounded-3xl p-10 relative overflow-hidden">
            {/* Background texture */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: "var(--grid-pattern)" }}
            />
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex-1">
                <p className="text-neuro-orange text-[10px] font-black uppercase tracking-[0.2em] mb-3">
                  Premium
                </p>
                <h3 className="text-white font-heading font-black text-2xl tracking-tight mb-2">
                  Your Health, Between Visits
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-lg">
                  Track your progress, get daily exercises, and understand
                  what&apos;s happening in your body &mdash; all in one place.
                </p>
                <p className="text-gray-300 text-xs font-black mt-3 uppercase tracking-widest">
                  $9/month &middot; Cancel anytime
                </p>
              </div>
              <button
                onClick={async () => {
                  const result = await createPremiumCheckout();
                  if (result.url) {
                    window.location.href = result.url;
                  } else {
                    alert(result.error || "Something went wrong");
                  }
                }}
                className="px-8 py-4 bg-neuro-orange text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-neuro-orange/30 hover:shadow-neuro-orange/50 hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap"
              >
                Start Free Trial &mdash; 7 Days Free
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Find a Doctor", desc: "Search the global directory", href: "/directory", icon: Search, gradient: "from-blue-50 to-white", border: "border-blue-100" },
            { label: "Saved Doctors", desc: "Your bookmarked specialists", href: "/portal/saved", icon: Heart, gradient: "from-rose-50 to-white", border: "border-rose-100" },
            { label: "Learn", desc: "Articles and education", href: "/portal/learn", icon: BookOpen, gradient: "from-emerald-50 to-white", border: "border-emerald-100" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`bg-gradient-to-b ${item.gradient} rounded-3xl border ${item.border} p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group`}
            >
              <div className="flex items-center gap-4">
                <item.icon className="w-6 h-6 text-neuro-navy/60 group-hover:text-neuro-orange transition-colors" />
                <div>
                  <p className="font-heading font-black text-neuro-navy text-sm">
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
