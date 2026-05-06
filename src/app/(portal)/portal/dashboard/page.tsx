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
import { getPatientDashboardData, getUpcomingSeminars } from "./actions";
import { isPremiumMember, createPremiumCheckout } from "../premium-actions";
import WhatsNew from "@/components/common/WhatsNew";

// Daily tip — auto-rotates based on day of year
let todaysTip: any = null;
try {
  const { getTodaysTip } = require("../daily-tips-data");
  todaysTip = getTodaysTip();
} catch {}

export default function PatientDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [premium, setPremium] = useState(false);
  const [error, setError] = useState(false);
  const [seminars, setSeminars] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      getPatientDashboardData(),
      isPremiumMember().catch(() => false),
      getUpcomingSeminars().catch(() => []),
    ])
      .then(([d, p, s]) => {
        setData(d);
        setPremium(p);
        setSeminars(s);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D66829]/10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-[#D66829] animate-spin" />
          </div>
          <p className="text-sm font-bold text-white/35 uppercase tracking-widest">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-400 font-bold">We couldn&apos;t load your dashboard. Please check your connection and try again.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-[#162231] text-white rounded-xl text-sm font-bold hover:bg-white/[0.1] transition-colors"
        >
          Try Again
        </button>
      </div>
    );

  return (
    <div className="space-y-8 pb-20">
      <WhatsNew />

      {/* Welcome Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#D66829] text-xs font-black uppercase tracking-[0.2em] mb-1">
              Welcome back
            </p>
            <h1 className="text-2xl font-bold text-white">
              {data?.name || "there"}
            </h1>
            <p className="text-xs text-white/35 mt-1">Here&apos;s a snapshot of how you&apos;re doing. Start with your daily check-in.</p>
          </div>
          {data?.streak > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#D66829]/10 border border-[#D66829]/20 rounded-full" title="Your streak counts how many days in a row you've checked in">
              <Flame className="w-4 h-4 text-[#D66829]" />
              <span className="text-sm font-black text-[#D66829]">
                {data.streak} day streak
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Premium Quick Actions */}
      {premium && (
        <div>
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: "Check In", href: "/portal/track", icon: Activity, iconColor: "text-blue-400" },
              { label: "Exercises", href: "/portal/exercises", icon: Dumbbell, iconColor: "text-[#D66829]" },
              { label: "Learn", href: "/portal/learn", icon: BookOpen, iconColor: "text-emerald-400" },
              { label: "Progress", href: "/portal/journey", icon: Calendar, iconColor: "text-violet-400" },
              { label: "Nutrition", href: "/portal/supplements", icon: Apple, iconColor: "text-rose-400" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="bg-[#162231] rounded-2xl p-4 text-center border border-white/[0.08] hover:border-[#D66829]/20 hover:shadow-lg hover:shadow-black/20 transition-all duration-200 active:scale-95"
              >
                <item.icon className={`w-7 h-7 ${item.iconColor} mx-auto mb-2`} />
                <p className="text-[11px] font-black text-white/60 uppercase tracking-tight">
                  {item.label}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Onboarding for new patients */}
      {!data?.todayLogged && (!data?.streak || data.streak === 0) && (
        <div>
          <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-[#D66829]/15 p-8 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#D66829]/10 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#D66829]" />
              </div>
              <div>
                <h2 className="font-bold text-white text-lg">
                  Welcome to NeuroChiro
                </h2>
                <p className="text-white/35 text-sm">
                  Three quick steps to set up your health portal
                </p>
              </div>
            </div>
            <div className="space-y-3 mt-6">
              {[
                { step: 1, href: "/portal/track", title: "Log your first check-in", desc: "Rate your energy, pain, and sleep today -- it only takes 30 seconds" },
                { step: 2, href: "/directory", title: "Find a doctor near you", desc: "Browse chiropractors in your area and read their profiles" },
                { step: 3, href: "/portal/saved", title: "Save your favorites", desc: "Bookmark doctors you like so you can find them easily later" },
              ].map((item) => (
                <Link
                  key={item.step}
                  href={item.href}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] hover:border-[#D66829]/20 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#D66829] flex items-center justify-center text-white text-sm font-black shrink-0">
                    {item.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">
                      {item.title}
                    </p>
                    <p className="text-xs text-white/35 mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-[#D66829] group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Daily Check-in Card */}
      <div>
        {data?.todayLogged ? (
          <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-emerald-500/20 p-8 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-emerald-400 uppercase tracking-tight">
                    Today&apos;s Check-in
                  </p>
                  <p className="text-xs text-white/35 mt-0.5">Completed</p>
                </div>
              </div>
              <Link
                href="/portal/track"
                className="text-xs font-black text-[#D66829] uppercase tracking-widest hover:text-[#e8834a] transition-colors flex items-center gap-1"
              >
                Update <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {[
                { label: "Energy", value: data.todaysLog.energy_level, color: "text-blue-400" },
                { label: "Pain", value: data.todaysLog.pain_level, color: "text-rose-400" },
                { label: "Sleep", value: data.todaysLog.sleep_quality, color: "text-violet-400" },
              ].map((metric) => (
                <div key={metric.label} className="text-center">
                  <p className={`text-3xl font-black ${metric.color}`}>
                    {metric.value}
                  </p>
                  <p className="text-xs font-bold text-white/35 uppercase tracking-widest mt-1">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Link
            href="/portal/track"
            className="block bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl p-10 text-center group hover:shadow-2xl hover:shadow-black/30 transition-all duration-300 relative overflow-hidden border border-white/[0.08]"
          >
            <div className="relative">
              <div className="w-16 h-16 bg-[#D66829]/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Zap className="w-8 h-8 text-[#D66829]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                How are you feeling today?
              </h2>
              <p className="text-white/40 text-sm mb-6 max-w-sm mx-auto">
                Log your energy, pain, and sleep in 30 seconds. Your doctor uses this to track your progress between visits.
              </p>
              <span className="inline-flex items-center gap-2 px-8 py-4 bg-[#D66829] text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-[#D66829]/20 group-hover:gap-3 group-hover:shadow-[#D66829]/40 transition-all">
                Start Check-in <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        )}
      </div>

      {/* Streak & Weekly Trend */}
      <div>
        <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-8 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  data?.streak > 0
                    ? "bg-[#D66829]/10 border border-[#D66829]/20"
                    : "bg-white/[0.04] border border-white/[0.08]"
                }`}
              >
                <Flame
                  className={`w-6 h-6 ${
                    data?.streak > 0 ? "text-[#D66829]" : "text-white/20"
                  }`}
                />
              </div>
              <div>
                <p className="font-bold text-white text-lg">
                  {data?.streak > 0
                    ? `${data.streak} day streak`
                    : "No streak yet"}
                </p>
                <p className="text-sm text-white/35">
                  {data?.streak > 0
                    ? "Your streak counts how many days in a row you\u2019ve checked in. Keep it going \u2014 consistency is everything."
                    : "Your streak counts how many days in a row you check in. Complete your first check-in to start tracking."}
                </p>
              </div>
            </div>
          </div>

          {/* Mini trend — last 7 days */}
          {data?.last7Days && data.last7Days.length > 0 && (
            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/[0.06]">
              <p className="text-xs font-black text-white/35 uppercase tracking-widest mr-1 shrink-0">
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
                            ? "bg-white/[0.04] text-white/20 border border-white/[0.08]"
                            : day.energy >= 7
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : day.energy >= 4
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                        title={`${day.date}: ${
                          day.energy !== null ? `Energy ${day.energy}` : "No log"
                        }`}
                      >
                        {day.energy !== null ? day.energy : "·"}
                      </div>
                      <span className="text-[10px] font-bold text-white/35">
                        {dayName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Daily Health Tip */}
      {todaysTip && (
        <div>
          <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-8 shadow-lg shadow-black/20">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 bg-gradient-to-b from-[#D66829]/10 to-[#D66829]/5 rounded-2xl flex items-center justify-center flex-shrink-0 border border-[#D66829]/10">
                <span className="text-2xl">{todaysTip.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-[#D66829]" />
                  <span className="text-[10px] font-black text-[#D66829] uppercase tracking-[0.2em]">
                    Today&apos;s Tip
                  </span>
                  <span className="text-[10px] font-bold text-white/20 ml-auto uppercase tracking-widest">
                    {todaysTip.category}
                  </span>
                </div>
                <h3 className="font-bold text-white mb-2">
                  {todaysTip.title}
                </h3>
                <p className="text-sm text-white/40 leading-relaxed mb-4">
                  {todaysTip.body}
                </p>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                  <p className="text-sm text-emerald-400">
                    <strong className="font-black">Today&apos;s action:</strong>{" "}
                    {todaysTip.actionStep}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Upgrade Card */}
      {!premium && (
        <div>
          <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-[#D66829]/20 p-10 relative overflow-hidden shadow-lg shadow-black/20">
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex-1">
                <p className="text-[#D66829] text-[10px] font-black uppercase tracking-[0.2em] mb-3">
                  Premium
                </p>
                <h3 className="text-white font-bold text-2xl tracking-tight mb-2">
                  Your Health, Between Visits
                </h3>
                <ul className="text-white/40 text-sm leading-relaxed max-w-lg space-y-1 mt-2 list-none">
                  <li>&bull; Full progress history &mdash; see how your health changes over weeks and months</li>
                  <li>&bull; All exercises &mdash; daily stretches and routines tailored to how you feel</li>
                  <li>&bull; Wellness score trends &mdash; one number that tracks your overall improvement</li>
                  <li>&bull; Milestone badges &mdash; celebrate your consistency and progress</li>
                </ul>
                <p className="text-white/60 text-xs font-black mt-3 uppercase tracking-widest">
                  $9/month &middot; 7-day free trial &middot; Cancel anytime
                </p>
              </div>
              <button
                onClick={async () => {
                  const result = await createPremiumCheckout();
                  if (result.url) {
                    window.location.href = result.url;
                  } else {
                    alert(result.error || "We couldn't start the checkout. Please try again or contact support.");
                  }
                }}
                className="px-8 py-4 bg-[#D66829] text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-[#D66829]/20 hover:bg-[#e8834a] hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap"
              >
                Start Free Trial &mdash; 7 Days Free
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Seminars */}
      {seminars.length > 0 && (
        <div>
          <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-6 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-lg">Upcoming Events</h3>
              <Link href="/seminars" className="text-xs font-bold text-[#D66829] hover:underline flex items-center gap-1">View All <ChevronRight className="w-3 h-3" /></Link>
            </div>
            <div className="space-y-3">
              {seminars.map((sem: any) => (
                <Link key={sem.id} href={`/seminars/${sem.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.04] transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#D66829]/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-[#D66829]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-[#D66829] transition-colors">{sem.title}</p>
                      <p className="text-xs text-white/35">{sem.dates ? new Date(sem.dates).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''} {sem.city ? `· ${sem.city}` : ''}</p>
                    </div>
                  </div>
                  {sem.price ? <span className="text-xs font-bold text-white">${sem.price}</span> : <span className="text-xs font-bold text-green-400">Free</span>}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Find a Doctor", desc: "Browse chiropractors near you", href: "/directory", icon: Search },
            { label: "Saved Doctors", desc: "Doctors you bookmarked", href: "/portal/saved", icon: Heart },
            { label: "Learn", desc: "Health articles written for you", href: "/portal/learn", icon: BookOpen },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-6 hover:border-[#D66829]/20 hover:shadow-lg hover:shadow-black/20 transition-all duration-200 group"
            >
              <div className="flex items-center gap-4">
                <item.icon className="w-6 h-6 text-white/40 group-hover:text-[#D66829] transition-colors" />
                <div>
                  <p className="font-semibold text-white text-sm">
                    {item.label}
                  </p>
                  <p className="text-xs text-white/35 mt-0.5">{item.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
